'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/v1/auth/me`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = await response.json();
        return body.data ?? null;
      })
      .then((data) => { if (active) setUser(data); })
      .catch(() => { if (active) setMessage('Unable to load your account.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function logout() {
    setMessage('');
    const response = await fetch(`${apiUrl}/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    if (!response.ok) return setMessage('Unable to sign out. Please try again.');
    window.location.href = '/';
  }

  if (loading) return <main className="container"><section className="panel"><p>Loading your account…</p></section></main>;
  if (!user) return <main className="container"><section className="panel"><h1>Your account</h1><p>Please sign in to continue.</p><Link className="btn primary" href="/auth">Sign in</Link></section></main>;

  return (
    <main className="container">
      <div className="page-head"><div><span className="eyebrow">ACCOUNT</span><h1>Welcome{user.fullName ? `, ${user.fullName}` : ''}.</h1><p>{user.email}</p></div></div>
      <section className="cards">
        <div className="card"><strong>Role</strong><span className="badge">{user.role}</span></div>
        <Link className="card" href="/account/profile"><strong>Profile</strong><span>Manage your profile →</span></Link>
        <Link className="card" href="/orders"><strong>Your orders</strong><span>Track recent orders →</span></Link>
        {user.role === 'restaurant_staff' && <Link className="card" href="/restaurant"><strong>Restaurant dashboard</strong><span>Manage restaurant →</span></Link>}
        {user.role === 'admin' && <Link className="card" href="/admin"><strong>Admin dashboard</strong><span>Manage platform →</span></Link>}
      </section>
      <button className="btn danger" onClick={logout}>Sign out</button>
      {message && <p className="notice">{message}</p>}
    </main>
  );
}
