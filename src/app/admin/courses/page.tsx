"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CourseAdminPage() {
  const supabase = createClient();
  const [authorized,setAuthorized]=useState<boolean|null>(null);
  const [courses,setCourses]=useState<any[]>([]);
  const [selectedId,setSelectedId]=useState("");
  const [title,setTitle]=useState("");
  const [description,setDescription]=useState("");
  const [duration,setDuration]=useState(5);
  const [passingScore,setPassingScore]=useState(80);
  const [isActive,setIsActive]=useState(true);
  const [videoKey,setVideoKey]=useState("");
  const [videoUrl,setVideoUrl]=useState("");
  const [quiz,setQuiz]=useState<any[]>([{question:"",choices:["","",""],answer:0}]);
  const [message,setMessage]=useState("");
  const [uploading,setUploading]=useState(false);
  const [uploadPercent,setUploadPercent]=useState(0);

  async function loadCourses(){
    const {data,error}=await supabase.from("courses")
      .select("id,title,description,duration_minutes,passing_score,is_active,video_key,video_url,quiz")
      .order("title");
    if(error){setMessage(error.message);return;}
    setCourses(data??[]);
  }

  useEffect(()=>{
    (async()=>{
      const {data:u}=await supabase.auth.getUser();
      if(!u.user){setAuthorized(false);return;}
      const {data:a}=await supabase.from("platform_admins").select("user_id").eq("user_id",u.user.id).maybeSingle();
      setAuthorized(!!a);
      if(a) await loadCourses();
    })();
  },[]);

  function newCourse(){
    setSelectedId("");setTitle("");setDescription("");setDuration(5);setPassingScore(80);
    setIsActive(true);setVideoKey("");setVideoUrl("");
    setQuiz([{question:"",choices:["","",""],answer:0}]);setMessage("");
  }

  function chooseCourse(c:any){
    setSelectedId(c.id);setTitle(c.title);setDescription(c.description??"");
    setDuration(c.duration_minutes??5);setPassingScore(c.passing_score??80);
    setIsActive(c.is_active);setVideoKey(c.video_key??"");setVideoUrl(c.video_url??"");
    setQuiz(c.quiz?.length?c.quiz:[{question:"",choices:["","",""],answer:0}]);setMessage("");
  }

  async function uploadVideo(e:ChangeEvent<HTMLInputElement>){
    const file=e.target.files?.[0]; if(!file)return;
    setUploading(true);setUploadPercent(0);setMessage("");
    const {data:sess}=await supabase.auth.getSession();
    const r=await fetch("/api/r2/upload-url",{method:"POST",headers:{
      "Content-Type":"application/json",Authorization:`Bearer ${sess.session?.access_token}`
    },body:JSON.stringify({fileName:file.name,contentType:file.type||"video/mp4",size:file.size})});
    const x=await r.json();
    if(!r.ok){setMessage(x.error||"Could not prepare upload.");setUploading(false);return;}

    const xhr=new XMLHttpRequest();
    xhr.open("PUT",x.uploadUrl);
    xhr.setRequestHeader("Content-Type",file.type||"video/mp4");
    xhr.upload.onprogress=(ev)=>{if(ev.lengthComputable)setUploadPercent(Math.round(ev.loaded/ev.total*100));};
    xhr.onload=()=>{
      if(xhr.status>=200&&xhr.status<300){
        setVideoKey(x.key);setVideoUrl("");
        setMessage("Video uploaded. Click Save Changes/Create Course to attach it.");
      } else setMessage(`R2 upload failed (${xhr.status}). Check CORS.`);
      setUploading(false);
    };
    xhr.onerror=()=>{setMessage("R2 upload failed. Check CORS.");setUploading(false);};
    xhr.send(file);
  }

  function updateQ(i:number,field:string,value:any){
    setQuiz(q=>q.map((z,j)=>j===i?{...z,[field]:value}:z));
  }
  function updateChoice(i:number,j:number,value:string){
    setQuiz(q=>q.map((z,k)=>k===i?{...z,choices:z.choices.map((c:string,n:number)=>n===j?value:c)}:z));
  }

  async function save(){
    const cleanQuiz=quiz.filter(q=>q.question.trim()).map(q=>({
      question:q.question.trim(),choices:q.choices.map((c:string)=>c.trim()),answer:Number(q.answer)
    }));
    const payload={
      title:title.trim(),description:description.trim()||null,duration_minutes:Number(duration),
      passing_score:Number(passingScore),is_active:isActive,
      video_key:videoKey||null,video_url:videoKey?null:(videoUrl.trim()||null),
      quiz:cleanQuiz,quiz_question_count:cleanQuiz.length,updated_at:new Date().toISOString()
    };
    const result=selectedId
      ? await supabase.from("courses").update(payload).eq("id",selectedId)
      : await supabase.from("courses").insert(payload).select("id").single();
    if(result.error){setMessage(result.error.message);return;}
    setMessage(selectedId?"Course updated.":"Course created.");
    if(!selectedId&&result.data?.id)setSelectedId(result.data.id);
    await loadCourses();
  }

  if(authorized===null)return <main className="p-10">Checking access...</main>;
  if(!authorized)return <main className="p-10">Platform admin required.</main>;

  return <main className="mx-auto max-w-7xl px-6 py-10">
    <div className="text-sm text-cyan-300">Platform Administration</div>
    <h1 className="mt-1 text-4xl font-bold">Master Course Library</h1>

    <div className="mt-8 grid gap-6 lg:grid-cols-[.7fr_1.5fr]">
      <aside className="rounded-2xl border border-white/10 bg-slate-900 p-5">
        <button onClick={newCourse} className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-semibold text-slate-950">+ New Course</button>
        <div className="mt-5 space-y-2">{courses.map(c=>
          <button key={c.id} onClick={()=>chooseCourse(c)}
            className={`w-full rounded-lg border p-4 text-left ${selectedId===c.id?"border-cyan-400":"border-white/10 bg-slate-950"}`}>
            <div className="font-medium">{c.title}</div>
            <div className="mt-1 text-xs text-slate-500">{c.video_key?"R2 video":c.video_url?"External video":"No video"}</div>
          </button>)}</div>
      </aside>

      <section className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-6">
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Course title" className="w-full rounded-lg bg-slate-950 px-4 py-3"/>
        <textarea value={description} onChange={e=>setDescription(e.target.value)} placeholder="Description" rows={4} className="w-full rounded-lg bg-slate-950 px-4 py-3"/>
        <div className="grid gap-4 md:grid-cols-2">
          <input type="number" min={1} value={duration} onChange={e=>setDuration(Number(e.target.value))} className="rounded-lg bg-slate-950 px-4 py-3"/>
          <input type="number" min={0} max={100} value={passingScore} onChange={e=>setPassingScore(Number(e.target.value))} className="rounded-lg bg-slate-950 px-4 py-3"/>
        </div>

        <div className="rounded-xl border border-white/10 bg-slate-950 p-5">
          <div className="font-medium">Upload Training Video to Cloudflare R2</div>
          <input type="file" accept="video/*" onChange={uploadVideo} disabled={uploading} className="mt-3 block w-full text-sm"/>
          {uploading&&<div className="mt-3 text-sm text-slate-400">Uploading {uploadPercent}%</div>}
          {videoKey&&<div className="mt-3 break-all text-xs text-emerald-300">{videoKey}</div>}
          <input value={videoUrl} onChange={e=>{setVideoUrl(e.target.value);if(e.target.value)setVideoKey("");}}
            placeholder="Or external video URL" className="mt-4 w-full rounded-lg bg-slate-900 px-4 py-3"/>
        </div>

        <label className="flex gap-3"><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)}/>Course is active</label>

        <div>
          <div className="flex justify-between"><h2 className="text-xl font-semibold">Quiz Questions</h2>
            <button onClick={()=>setQuiz([...quiz,{question:"",choices:["","",""],answer:0}])} className="text-sm text-cyan-300">+ Add Question</button></div>
          <div className="mt-4 space-y-4">{quiz.map((q,i)=><div key={i} className="rounded-lg bg-slate-950 p-4">
            <input value={q.question} onChange={e=>updateQ(i,"question",e.target.value)} placeholder={`Question ${i+1}`} className="w-full rounded-lg bg-slate-900 px-3 py-2"/>
            <div className="mt-3 space-y-2">{q.choices.map((c:string,j:number)=><label key={j} className="flex gap-3">
              <input type="radio" name={`correct-${i}`} checked={Number(q.answer)===j} onChange={()=>updateQ(i,"answer",j)}/>
              <input value={c} onChange={e=>updateChoice(i,j,e.target.value)} placeholder={`Choice ${j+1}`} className="flex-1 rounded-lg bg-slate-900 px-3 py-2"/>
            </label>)}</div>
          </div>)}</div>
        </div>

        <button onClick={save} disabled={!title.trim()||uploading} className="rounded-lg bg-cyan-400 px-5 py-3 font-semibold text-slate-950 disabled:opacity-40">
          {selectedId?"Save Changes":"Create Course"}
        </button>
        {message&&<div className="text-sm text-slate-300">{message}</div>}
      </section>
    </div>
  </main>;
}
