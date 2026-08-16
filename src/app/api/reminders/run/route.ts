import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
export const dynamic="force-dynamic";
const day=(d:Date)=>d.toISOString().slice(0,10);
export async function GET(req:NextRequest){
 try{
  if(req.headers.get("authorization")!==`Bearer ${process.env.CRON_SECRET}`)
   return NextResponse.json({error:"Unauthorized"},{status:401});
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const now=new Date(), plus3=new Date(now); plus3.setUTCDate(now.getUTCDate()+3);
  const today=day(now), soon=day(plus3);
  const {data:list,error}=await db.from("assignments")
   .select("id,user_id,status,due_date,courses(title),companies(name)")
   .neq("status","completed").not("due_date","is",null).lte("due_date",soon);
  if(error)throw error;
  const resend=new Resend(process.env.RESEND_API_KEY); let sent=0,skipped=0;
  for(const a of list||[]){
   let type:"due_soon"|"due_today"|"overdue"|null=null;
   if(a.due_date===soon)type="due_soon"; else if(a.due_date===today)type="due_today"; else if(a.due_date<today)type="overdue";
   if(!type){skipped++;continue;}
   const {data:old}=await db.from("training_reminders").select("id").eq("assignment_id",a.id).eq("reminder_type",type).maybeSingle();
   if(old){skipped++;continue;}
   const {data:p}=await db.from("profiles").select("email,full_name").eq("id",a.user_id).single();
   if(!p?.email){skipped++;continue;}
   const c:any=Array.isArray(a.courses)?a.courses[0]:a.courses;
   const co:any=Array.isArray(a.companies)?a.companies[0]:a.companies;
   const label=type==="overdue"?"Training Overdue":type==="due_today"?"Training Due Today":"Training Due in 3 Days";
   const {error:mail}=await resend.emails.send({
    from:process.env.RESEND_FROM_EMAIL!,to:p.email,subject:`${label}: ${c?.title||"Cybersecurity Training"}`,
    html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>${label}</h2><p>Hello ${p.full_name||"there"},</p><p>${co?.name||"Your company"} assigned you <strong>${c?.title||"cybersecurity training"}</strong>.</p><p><strong>Due:</strong> ${new Date(a.due_date+"T00:00:00").toLocaleDateString("en-US")}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/employee">Complete Training</a></p></div>`
   });
   if(mail){skipped++;continue;}
   await db.from("training_reminders").insert({assignment_id:a.id,reminder_type:type,sent_to:p.email}); sent++;
  }
  return NextResponse.json({ok:true,sent,skipped});
 }catch(e:any){return NextResponse.json({error:e?.message||"Run failed"},{status:500});}
}