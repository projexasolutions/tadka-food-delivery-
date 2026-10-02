"use client";

import { useState } from "react";
import Link from "next/link";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(event) {
    event.preventDefault();
    setMessage("Password recovery is being migrated to the Tadka API. Please contact support while this feature is unavailable.");
  }

  return <main className="min-h-screen bg-tadka-bg px-4 py-12"><div className="mx-auto max-w-xl rounded-2xl border border-tadka-line bg-white p-8 shadow-tadka-md">
    <span className="block text-[10px] font-black tracking-[.15em] text-tadka-orange">ACCOUNT RECOVERY</span><h1 className="mt-2 text-3xl font-black tracking-tight">Reset password</h1>
    <p className="mb-5 text-sm text-tadka-muted">Password recovery is temporarily unavailable while authentication is being migrated.</p>
    <form className="grid gap-4" onSubmit={submit}><label className="grid gap-2 text-xs font-bold">Email<input className="h-12 rounded-xl border border-tadka-line px-4 outline-none focus:border-tadka-orange focus:ring-4 focus:ring-orange-100" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><button className="rounded-xl bg-tadka-orange px-4 py-3 text-sm font-black text-white" type="submit">Request recovery</button></form>
    {message && <p className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-tadka-danger">{message}</p>}<Link className="mt-5 inline-block text-sm font-bold text-tadka-green hover:text-tadka-orange" href="/auth">← Back to login</Link>
  </div></main>;
}
