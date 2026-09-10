"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

function dashboardForRole(role) {
  if (role === "restaurant_staff") return "/restaurant";
  if (role === "rider") return "/delivery";
  if (role === "admin") return "/admin";
  return "/";
}

export default function AuthPage() {
  const router = useRouter();
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const endpoint = mode === "signup" ? "/v1/auth/signup" : "/v1/auth/login";
      const body = mode === "signup" ? { fullName: name, email, password } : { email, password };

      const response = await fetch(`${API_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        setMessage(payload?.error?.message || "Unable to complete the request.");
        return;
      }

      const user = payload?.data?.user;
      setMessage(mode === "signup" ? "Account created. Redirecting…" : "Login successful. Redirecting…");
      router.replace(dashboardForRole(user?.role));
    } catch {
      setMessage("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === "login" ? "signup" : "login");
    setMessage("");
  }

  return (
    <main className="page narrow">
      <header className="nav"><Link className="brand" href="/">🌶️ Tadka</Link><Link href="/cart">Cart →</Link></header>
      <div className="card authCard">
        <span className="eyebrow">{mode === "login" ? "Welcome back" : "Create account"}</span>
        <h1>{mode === "login" ? "Login" : "Sign up"}</h1>
        <form onSubmit={submit}>
          {mode === "signup" && <label>Full name<input value={name} onChange={e => setName(e.target.value)} required /></label>}
          <label>Email<input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></label>
          <label>Password<input type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required /></label>
          <button className="primary full" disabled={loading}>{loading ? "Please wait…" : mode === "login" ? "Login" : "Create account"}</button>
        </form>
        {message && <p className="notice">{message}</p>}
        <Link className="mutedLink" href="/auth/reset">Forgot password?</Link>
        <button className="linkButton" type="button" onClick={toggleMode}>
          {mode === "login" ? "New here? Create an account" : "Already have an account? Login"}
        </button>
      </div>
    </main>
  );
}
