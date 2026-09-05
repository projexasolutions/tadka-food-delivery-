"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user) {
        const { data } = await supabase.from("profiles").select("full_name,role").eq("id", user.id).single();
        setProfile(data);
      }
    })();
  }, []);

  async function logout() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (!user) {
    return <main className="container"><section className="panel"><h1>Your account</h1><p>Please sign in to continue.</p><Link className="btn primary" href="/auth">Sign in</Link></section></main>;
  }

  return (
    <main className="container">
      <div className="page-head">
        <div><span className="eyebrow">ACCOUNT</span><h1>Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}.</h1><p>{user.email}</p></div>
      </div>
      <section className="cards">
        <div className="card"><strong>Role</strong><span className="badge">{profile?.role || "customer"}</span></div>
        <Link className="card" href="/orders"><strong>Your orders</strong><span>Track recent orders →</span></Link>
        {profile?.role === "restaurant_staff" && <Link className="card" href="/restaurant"><strong>Restaurant dashboard</strong><span>Manage orders →</span></Link>}
        {profile?.role === "admin" && <Link className="card" href="/admin"><strong>Admin dashboard</strong><span>Manage platform →</span></Link>}
      </section>
      <button className="btn danger" onClick={logout}>Sign out</button>
      {message && <p className="notice">{message}</p>}
    </main>
  );
}
