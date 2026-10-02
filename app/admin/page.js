'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('Loading…');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/v1/admin/dashboard`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load admin dashboard.');
        return body.data;
      })
      .then((data) => { setStats(data); setMessage(''); })
      .catch((error) => { if (error.name !== 'AbortError') setMessage(error.message); });

    return () => controller.abort();
  }, []);

  return (
    <main className="min-h-screen bg-tadka-bg px-4 py-8 text-tadka-ink sm:px-6">
      <div className="mx-auto mb-7 flex w-full max-w-[1240px] items-end justify-between gap-5">
        <div>
          <span className="text-[10px] font-black tracking-[0.14em] text-tadka-orange">PLATFORM ADMIN</span>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Operations overview</h1>
          <p className="mt-2 text-sm text-tadka-muted">A clear view of what is happening across Tadka.</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-xs text-tadka-muted sm:block">Live platform data</span>
          <Link href="/" className="rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-green hover:bg-tadka-bg">Customer view</Link>
        </div>
      </div>

      {message && <div className="mx-auto mb-4 w-full max-w-[1240px] rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{message}</div>}

      {stats && (
        <>
          <section className="mx-auto grid w-full max-w-[1240px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm"><span>USERS</span><b>{stats.users}</b><small>Registered accounts</small></div>
            <div className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm"><span>RESTAURANTS</span><b>{stats.restaurants}</b><small>Partner locations</small></div>
            <div className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm"><span>ORDERS</span><b>{stats.orders}</b><small>Total orders</small></div>
            <div className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm"><span>PAID REVENUE</span><b>₹{stats.paidRevenue.toLocaleString('en-IN')}</b><small>Captured payments</small></div>
          </section>

          <section className="mx-auto mt-5 grid w-full max-w-[1240px] gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
            <div className="rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm">
              <div className="flex items-start justify-between gap-4">
                <div><span className="text-[10px] font-black tracking-[0.14em] text-tadka-orange">CONTROL CENTER</span><h2>Platform operations</h2></div>
                <span className="rounded-full bg-tadka-green-soft px-3 py-1 text-xs font-bold text-tadka-green">Healthy</span>
              </div>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <Link href="/admin/users"><b>Users</b><small>Accounts and roles</small></Link>
                <Link href="/admin/restaurants"><b>Restaurants</b><small>Partners and availability</small></Link>
                <Link href="/admin/operations"><b>Operations</b><small>Orders and payments</small></Link>
                <Link href="/admin/categories"><b>Categories</b><small>Restaurant catalog structure</small></Link>
              </div>
            </div>
            <div className="rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm">
              <span className="text-[10px] font-black tracking-[0.14em] text-tadka-orange">QUICK VIEW</span>
              <h2>Platform health</h2>
              <p className="muted">Admin actions are authenticated by the server session and authorized by the database role.</p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
