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

  return <main className="page narrow"><div className="card authCard">
    <span className="eyebrow">ACCOUNT RECOVERY</span><h1>Reset password</h1>
    <p className="muted">Password recovery is temporarily unavailable while authentication is being migrated.</p>
    <form onSubmit={submit}><label>Email<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><button className="primary full" type="submit">Request recovery</button></form>
    {message && <p className="notice">{message}</p>}<Link href="/auth">← Back to login</Link>
  </div></main>;
}
