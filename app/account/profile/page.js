"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function ProfilePage(){
  const [form,setForm]=useState({full_name:"",phone:""});
  const [message,setMessage]=useState("");
  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
    const {data}=await supabase.from("profiles").select("full_name,phone").eq("id",user.id).single();
    if(data)setForm({full_name:data.full_name||"",phone:data.phone||""});
  })()},[]);
  async function save(e){
    e.preventDefault();
    const {data:{user}}=await supabase.auth.getUser(); if(!user)return;
    const {error}=await supabase.from("profiles").update(form).eq("id",user.id);
    setMessage(error?error.message:"Profile updated.");
  }
  return <main className="container"><section className="panel"><span className="eyebrow">PROFILE</span><h1>Profile settings</h1>
    <form onSubmit={save} className="form-grid"><input placeholder="Full name" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})}/><input placeholder="Phone" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/><button className="btn primary">Save changes</button></form>
    {message&&<p className="notice">{message}</p>}
  </section></main>;
}
