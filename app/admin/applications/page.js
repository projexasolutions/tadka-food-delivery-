'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminApplicationsPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${apiUrl}/v1/auth/me`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = await response.json();
        return body.data ?? null;
      })
      .then((user) => setAuthorized(user?.role === 'admin'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <main className="mx-auto w-full max-w-6xl px-4 py-10"><section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm"><p>Checking admin access…</p></section></main>;
  if (!authorized) return <main className="mx-auto w-full max-w-6xl px-4 py-10"><section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm"><h1>Admin access required</h1><Link className="rounded-xl bg-tadka-orange px-4 py-3 text-sm font-bold text-white" href="/auth">Sign in</Link></section></main>;

  return <main className="mx-auto w-full max-w-6xl px-4 py-10"><section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm"><span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">ADMIN</span><h1>Restaurant Applications</h1><p>Application management is not part of the current PostgreSQL schema. The old Supabase workflow has been intentionally removed rather than kept as a broken compatibility layer.</p><Link className="rounded-xl bg-tadka-orange px-4 py-3 text-sm font-bold text-white" href="/admin">Back to admin</Link></section></main>;
}
