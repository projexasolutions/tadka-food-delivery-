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
    <main className="min-h-[calc(100dvh-64px)] overflow-x-hidden bg-[#fbf7f0] text-tadka-ink">
      <section className="mx-auto grid min-h-[calc(100dvh-64px)] max-w-[1440px] lg:grid-cols-[minmax(0,1.08fr)_minmax(430px,.92fr)]">
        <aside className="relative flex min-h-[390px] items-center overflow-hidden bg-[#f9eadb] px-6 py-10 sm:px-10 lg:min-h-0 lg:px-[6vw] lg:py-12" aria-label="Tadka food delivery">
          <div className="relative flex min-h-[390px] items-center overflow-hidden bg-[#f9eadb] px-6 py-10 sm:px-10 lg:min-h-0 lg:px-[6vw] lg:py-12">
            <span className="text-xs font-black uppercase tracking-[.14em] text-tadka-orange">{isSignup ? "Join Tadka" : "Welcome to Tadka"}</span>
            <h1>Good Food<br /><span>Brings Us</span><br />Together.</h1>
            <p className="relative flex min-h-[390px] items-center overflow-hidden bg-[#f9eadb] px-6 py-10 sm:px-10 lg:min-h-0 lg:px-[6vw] lg:py-12">
              Discover local kitchens, freshly prepared favourites and an easier way to get your next meal delivered.
            </p>
            <div className="my-6 grid gap-2.5">
              <div className="flex items-center gap-3"><span className="flex items-center h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-white/70">🚚</span><div><strong>Fast delivery</strong><small>Your food, on time</small></div></div>
              <div className="flex items-center gap-3"><span className="flex items-center h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-white/70">🌿</span><div><strong>Fresh & safe</strong><small>Quality you can trust</small></div></div>
              <div className="flex items-center gap-3"><span className="flex items-center h-9 w-9 shrink-0 grid place-items-center rounded-xl bg-white/70">♥</span><div><strong>Everyday favourites</strong><small>Something for every craving</small></div></div>
            </div>
            <div className="mt-5 flex items-center gap-3">
              <div className="flex" aria-hidden="true">
                <img className="-ml-2 h-9 w-9 rounded-full border-[3px] border-[#f9eadb] object-cover first:ml-0" src="https://randomuser.me/api/portraits/men/32.jpg" alt="" />
                <img className="-ml-2 h-9 w-9 rounded-full border-[3px] border-[#f9eadb] object-cover first:ml-0" src="https://randomuser.me/api/portraits/women/44.jpg" alt="" />
                <img className="-ml-2 h-9 w-9 rounded-full border-[3px] border-[#f9eadb] object-cover first:ml-0" src="https://randomuser.me/api/portraits/men/75.jpg" alt="" />
                <img className="-ml-2 h-9 w-9 rounded-full border-[3px] border-[#f9eadb] object-cover first:ml-0" src="https://randomuser.me/api/portraits/women/68.jpg" alt="" />
              </div>
              <div><strong>Made for food lovers</strong><span>Real meals. Local kitchens. Tadka.</span></div>
            </div>
          </div>
        </aside>

        <div className="flex min-w-0 items-center justify-center bg-[#fffdf9] px-4 py-6 sm:px-6 lg:px-10">
          <div className="w-full max-w-[520px] rounded-3xl border border-tadka-line bg-white p-6 shadow-tadka-lg sm:p-8">
            <div className="w-full max-w-[520px] rounded-3xl border border-tadka-line bg-white p-6 shadow-tadka-lg sm:p-8">
              <div>
                <span className="text-xs font-black uppercase tracking-[.14em] text-tadka-orange">{isSignup ? "Create account" : "Welcome back"}</span>
                <h2>{isSignup ? "Join Tadka Today" : "Login to your account"}</h2>
                <p className="w-full max-w-[520px] rounded-3xl border border-tadka-line bg-white p-6 shadow-tadka-lg mt-2">{isSignup ? "Be part of a food-loving community." : "Continue your food journey with Tadka."}</p>
              </div>
              <div className="grid h-12 w-12 flex-none place-items-center rounded-2xl bg-orange-50 text-xl text-tadka-orange">🍴</div>
            </div>

            <form className="grid gap-3" onSubmit={submit}>
              {isSignup && <div className="grid gap-1.5"><label htmlFor="fullName">Full name</label><input id="fullName" className="h-[52px] w-full rounded-xl border border-tadka-line bg-white px-4 text-sm text-tadka-ink outline-none focus:border-tadka-orange focus:ring-4 focus:ring-orange-100" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" autoComplete="name" required /></div>}
              <div className="grid gap-1.5"><label htmlFor="email">Email</label><input id="email" className="h-[52px] w-full rounded-xl border border-tadka-line bg-white px-4 text-sm text-tadka-ink outline-none focus:border-tadka-orange focus:ring-4 focus:ring-orange-100" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" required /></div>
              <div className="grid gap-1.5"><label htmlFor="password">Password</label><div className="relative"><input id="password" className="h-[52px] w-full rounded-xl border border-tadka-line bg-white px-4 text-sm text-tadka-ink outline-none focus:border-tadka-orange focus:ring-4 focus:ring-orange-100 pr-12" type={showPassword ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter your password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={8} required /><button type="button" className="absolute right-2.5 top-1/2 -translate-y-1/2 border-0 bg-transparent p-2 text-tadka-muted" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? "◉" : "◌"}</button></div></div>
              {isSignup && <div className="-mt-0.5 text-[11px] text-tadka-muted">Use at least 8 characters for a secure account.</div>}
              {!isSignup && <div className="flex items-center justify-between gap-3 text-xs"><span>Secure Tadka account</span><Link href="/auth/reset">Forgot password?</Link></div>}
              <button className="h-[52px] rounded-xl border-0 bg-tadka-orange text-sm font-black text-white shadow-md hover:bg-tadka-orange-dark disabled:cursor-not-allowed disabled:opacity-60" disabled={loading}>{loading ? "Please wait…" : isSignup ? "Create account →" : "Login →"}</button>
            </form>

            {message && <p className={`mt-3 rounded-xl border border-green-200 bg-tadka-green-soft p-3 text-xs text-tadka-success ${message.startsWith("Unable") || message.includes("reach") ? "border-orange-200 bg-orange-50 text-tadka-danger" : ""}`}>{message}</p>}

            <div className="mb-2 mt-5 text-center text-xs text-tadka-muted">{isSignup ? "Already a member?" : "New to Tadka?"}</div>
            <div className="flex items-center justify-center gap-3 text-xs"><button className="border-0 bg-transparent p-0 font-bold text-tadka-orange" type="button" onClick={toggleMode}>{isSignup ? "Login to your account →" : "Create a free account →"}</button></div>
            <p className="mt-3 text-center text-[10px] leading-relaxed text-tadka-subtle">By continuing, you agree to Tadka&apos;s Terms, Privacy Policy and ordering guidelines.</p>
            <div className="mt-3 text-center text-xs text-tadka-subtle"><Link href="/">← Back to Tadka</Link></div>
          </div>
        </div>
      </section>
    </main>
  );
}
