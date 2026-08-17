import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export async function POST(req:NextRequest){
 try{
  const token=req.headers.get("authorization")?.replace("Bearer ","");
  if(!token)return NextResponse.json({error:"Not authenticated"},{status:401});
  const userDb=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,{
   global:{headers:{Authorization:`Bearer ${token}`}},auth:{persistSession:false,autoRefreshToken:false}
  });
  const {data:u}=await userDb.auth.getUser(token);
  if(!u.user)return NextResponse.json({error:"Invalid session"},{status:401});
  const {assignmentId}=await req.json();
  const db=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!,process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const {data:a}=await db.from("assignments").select("id,user_id,company_id,status,due_date,courses(title),companies(name)").eq("id",assignmentId).single();
  if(!a)return NextResponse.json({error:"Assignment not found"},{status:404});
  const {data:m}=await db.from("memberships").select("role").eq("company_id",a.company_id).eq("user_id",u.user.id).maybeSingle();
  if(!m||m.role==="employee")return NextResponse.json({error:"Company admin required"},{status:403});
  if(a.status==="completed")return NextResponse.json({error:"Training already completed"},{status:400});
  const {data:p}=await db.from("profiles").select("email,full_name").eq("id",a.user_id).single();
  if(!p?.email)return NextResponse.json({error:"Employee email not found"},{status:400});
  const c:any=Array.isArray(a.courses)?a.courses[0]:a.courses;
  const co:any=Array.isArray(a.companies)?a.companies[0]:a.companies;
  const due=a.due_date?` Due date: ${new Date(a.due_date+"T00:00:00").toLocaleDateString("en-US")}.`:"";
  
const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  return NextResponse.json(
    { error: "Server is missing RESEND_API_KEY" },
    { status: 500 }
  );
}

const resend = new Resend(apiKey);

  const {error}=await resend.emails.send({
   from:process.env.RESEND_FROM_EMAIL!,
   to:p.email,
   subject:`Training reminder: ${c?.title||"Cybersecurity Training"}`,
   html:`<div style="font-family:Arial,sans-serif;max-width:600px;margin:auto"><h2>Cybersecurity Training Reminder</h2><p>Hello ${p.full_name||"there"},</p><p>${co?.name||"Your company"} has assigned you <strong>${c?.title||"cybersecurity training"}</strong>.${due}</p><p><a href="${process.env.NEXT_PUBLIC_APP_URL}/employee">Open My Training</a></p></div>`
  });
  if(error)return NextResponse.json({error:error.message},{status:500});
  await db.from("training_reminders").insert({assignment_id:a.id,reminder_type:"manual",sent_to:p.email,created_by:u.user.id});
  return NextResponse.json({ok:true});
 }catch(e:any){return NextResponse.json({error:e?.message||"Reminder failed"},{status:500});}
}