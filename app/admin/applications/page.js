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

  if (loading) return <main className="container"><section className="panel"><p>Checking admin access…</p></section></main>;
  if (!authorized) return <main className="container"><section className="panel"><h1>Admin access required</h1><Link className="btn primary" href="/auth">Sign in</Link></section></main>;

  return <main className="container"><section className="panel"><span className="eyebrow">ADMIN</span><h1>Restaurant Applications</h1><p>Application management is not part of the current PostgreSQL schema. The old Supabase workflow has been intentionally removed rather than kept as a broken compatibility layer.</p><Link className="btn primary" href="/admin">Back to admin</Link></section></main>;
}
