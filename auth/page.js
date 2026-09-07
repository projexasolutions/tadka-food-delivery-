"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "../../lib/supabase";

export default function AuthPage() {
  const supabase = createClient();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function signInWithGoogle() {
    setGoogleLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) {
      setMessage(error.message);
      setGoogleLoading(false);
    }
  }

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name } }
      });
      setMessage(error ? error.message : "Account created. Check your email if confirmation is enabled.");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setMessage(error ? error.message : "Login successful. You can continue ordering.");
    }
    setLoading(false);
  }

  return (
    <main className="page narrow">
      <header className="nav"><Link className="brand" href="/">🍛 Tadka</Link><Link href="/cart">Cart →</Link></header>
      <div className="card authCard">
        <span className="eyebrow">{mode === "login" ? "Welcome back" : "Create account"}</span>
        <h1>{mode === "login" ? "Login" : "Sign up"}</h1>

        {mode === "login" && (
          <>
            <button type="button" className="full" onClick={signInWithGoogle} disabled={googleLoading || loading}>
              {googleLoading ? "Connecting to Google…" : "Continue with Google"}
            </button>
            <div className="authDivider"><span>or</span></div>
          </>
        )}

        <form onSubmit={submit}>
          {mode === "signup" && <label>Full name<input value={name} onChange={e=>setName(e.target.value)} required /></label>}
          <label>Email<input type="email" value={email} onChange={e=>setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={e=>setPassword(e.target.value)} minLength={6} required /></label>
          <button className="primary full" disabled={loading || googleLoading}>{loading ? "Please wait…" : mode === "login" ? "Login" : "Create account"}</button>
        </form>
        {message && <p className="notice">{message}</p>}
        <Link className="mutedLink" href="/auth/reset">Forgot password?</Link>
        <button className="linkButton" onClick={() => {setMode(mode==="login"?"signup":"login");setMessage("");}}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
        </button>
      </div>
    </main>
  );
}
