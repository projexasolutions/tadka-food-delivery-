"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

export default function AdminCategories(){
  const [items,setItems]=useState([]); const [name,setName]=useState(""); const [message,setMessage]=useState("");
  async function load(){
    const {data:{user}}=await supabase.auth.getUser();if(!user)return;
    const {data:p}=await supabase.from("profiles").select("role").eq("id",user.id).single();if(p?.role!=="admin")return;
    const {data}=await supabase.from("categories").select("*").order("name");setItems(data||[]);
  }
  useEffect(()=>{load()},[]);
  async function add(e){e.preventDefault();const {error}=await supabase.from("categories").insert({name});setMessage(error?error.message:"Category added.");if(!error){setName("");load()}}
  async function remove(id){const {error}=await supabase.from("categories").delete().eq("id",id);setMessage(error?error.message:"Category deleted.");if(!error)load()}
  return <main className="container"><div className="page-head"><div><span className="eyebrow">ADMIN</span><h1>Categories</h1><p>Keep the food catalog organized.</p></div></div>
    <section className="panel"><form onSubmit={add} className="form-grid"><input required placeholder="Category name" value={name} onChange={e=>setName(e.target.value)}/><button className="btn primary">Add category</button></form></section>
    <section className="cards">{items.map(i=><article className="card" key={i.id}><strong>{i.name}</strong><button className="btn danger" onClick={()=>remove(i.id)}>Delete</button></article>)}</section>
    {message&&<p className="notice">{message}</p>}
  </main>;
}
