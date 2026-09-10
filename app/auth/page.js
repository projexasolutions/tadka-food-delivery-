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
  const [showPassword, setShowPassword] = useState(false);
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
      setMessage(mode === "signup" ? "Account created. Taking you to Tadka…" : "Login successful. Taking you to Tadka…");
      window.setTimeout(() => router.replace(dashboardForRole(user?.role)), 250);
    } catch {
      setMessage("Unable to reach the server. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(mode === "login" ? "signup" : "login");
    setMessage("");
    setShowPassword(false);
  }

  const isSignup = mode === "signup";

  return (
    <main className="tadka-auth-page">
      <section className="tadka-auth-shell">
        <aside className="tadka-auth-hero" aria-label="Tadka food delivery">
          <div className="tadka-auth-hero-content">
            <span className="tadka-auth-kicker">{isSignup ? "Join Tadka" : "Welcome to Tadka"}</span>
            <h1>Good Food<br /><span>Brings Us</span><br />Together.</h1>
            <p className="tadka-auth-hero-copy">
              Discover local kitchens, freshly prepared favourites and an easier way to get your next meal delivered.
            </p>
            <div className="tadka-auth-benefits">
              <div className="tadka-auth-benefit"><span className="tadka-auth-benefit-icon">🚚</span><div><strong>Fast delivery</strong><small>Your food, on time</small></div></div>
              <div className="tadka-auth-benefit"><span className="tadka-auth-benefit-icon">🌿</span><div><strong>Fresh & safe</strong><small>Quality you can trust</small></div></div>
              <div className="tadka-auth-benefit"><span className="tadka-auth-benefit-icon">♥</span><div><strong>Everyday favourites</strong><small>Something for every craving</small></div></div>
            </div>
            <div className="tadka-auth-community">
              <div className="tadka-auth-avatars" aria-hidden="true">
                <img className="tadka-auth-avatar" src="https://randomuser.me/api/portraits/men/32.jpg" alt="" />
                <img className="tadka-auth-avatar" src="https://randomuser.me/api/portraits/women/44.jpg" alt="" />
                <img className="tadka-auth-avatar" src="https://randomuser.me/api/portraits/men/75.jpg" alt="" />
                <img className="tadka-auth-avatar" src="https://randomuser.me/api/portraits/women/68.jpg" alt="" />
              </div>
              <div><strong>Made for food lovers</strong><span>Real meals. Local kitchens. Tadka.</span></div>
            </div>
          </div>
        </aside>

        <div className="tadka-auth-card-wrap">
          <div className="tadka-auth-card">
            <div className="tadka-auth-card-head">
              <div>
                <span className="tadka-auth-kicker">{isSignup ? "Create account" : "Welcome back"}</span>
                <h2>{isSignup ? "Join Tadka Today" : "Login to your account"}</h2>
                <p className="tadka-auth-card-sub">{isSignup ? "Be part of a food-loving community." : "Continue your food journey with Tadka."}</p>
              </div>
              <div className="tadka-auth-mark">🍴</div>
            </div>

            <form className="tadka-auth-form" onSubmit={submit}>
              {isSignup && <div className="tadka-auth-field"><label htmlFor="fullName">Full name</label><input id="fullName" className="tadka-auth-input" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" autoComplete="name" required /></div>}
              <div className="tadka-auth-field"><label htmlFor="email">Email</label><input id="email" className="tadka-auth-input" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
              <div className="tadka-auth-field"><label htmlFor="password">Password</label><div className="tadka-auth-input-wrap"><input id="password" className="tadka-auth-input has-toggle" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required /><button type="button" className="tadka-auth-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "◉" : "◌"}</button></div></div>
              {isSignup && <div className="tadka-auth-password-hint">Use at least 8 characters for a secure account.</div>}
              {!isSignup && <div className="tadka-auth-row"><span>Secure Tadka account</span><Link href="/auth/reset">Forgot password?</Link></div>}
              <button className="tadka-auth-submit" disabled={loading}>{loading ? "Please wait…" : isSignup ? "Create account →" : "Login →"}</button>
            </form>

            {message && <p className={`tadka-auth-notice ${message.startsWith("Unable") || message.includes("reach") ? "tadka-auth-error" : ""}`}>{message}</p>}

            <div className="tadka-auth-divider">{isSignup ? "Already a member?" : "New to Tadka?"}</div>
            <div className="tadka-auth-row" style={{justifyContent:"center"}}><button className="tadka-auth-switch" type="button" onClick={toggleMode}>{isSignup ? "Login to your account →" : "Create a free account →"}</button></div>
            <p className="tadka-auth-legal">By continuing, you agree to Tadka&apos;s Terms, Privacy Policy and ordering guidelines.</p>
            <div className="tadka-auth-footer"><Link href="/">← Back to Tadka</Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
