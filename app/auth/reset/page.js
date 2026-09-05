"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";

export default function ResetPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  async function submit(e) {
    e.preventDefault(); setLoading(true); setMessage("");
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/auth/update-password` });
    setMessage(error ? error.message : "Password reset email sent. Check your inbox."); setLoading(false);
  }
  return <main className="page narrow"><div className="card authCard">
    <span className="eyebrow">ACCOUNT RECOVERY</span><h1>Reset password</h1>
    <form onSubmit={submit}><label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label><button className="primary full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</button></form>
    {message && <p className="notice">{message}</p>}<Link href="/auth">← Back to login</Link>
  </div></main>;
}
