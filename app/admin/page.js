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
    <main className="admin-shell">
      <div className="admin-top">
        <div>
          <span className="eyebrow">PLATFORM ADMIN</span>
          <h1>Operations overview</h1>
          <p className="muted">A clear view of what is happening across Tadka.</p>
        </div>
        <div className="admin-top-actions">
          <span className="admin-date">Live platform data</span>
          <Link href="/" className="btn secondary">Customer view</Link>
        </div>
      </div>

      {message && <div className="admin-alert">{message}</div>}

      {stats && (
        <>
          <section className="admin-kpis">
            <div className="admin-kpi"><span>USERS</span><b>{stats.users}</b><small>Registered accounts</small></div>
            <div className="admin-kpi"><span>RESTAURANTS</span><b>{stats.restaurants}</b><small>Partner locations</small></div>
            <div className="admin-kpi"><span>ORDERS</span><b>{stats.orders}</b><small>Total orders</small></div>
            <div className="admin-kpi"><span>PAID REVENUE</span><b>₹{stats.paidRevenue.toLocaleString('en-IN')}</b><small>Captured payments</small></div>
          </section>

          <section className="admin-grid">
            <div className="admin-card admin-main-card">
              <div className="admin-card-head">
                <div><span className="eyebrow">CONTROL CENTER</span><h2>Platform operations</h2></div>
                <span className="admin-status">Healthy</span>
              </div>
              <div className="admin-links">
                <Link href="/admin/users"><b>Users</b><small>Accounts and roles</small></Link>
                <Link href="/admin/restaurants"><b>Restaurants</b><small>Partners and availability</small></Link>
                <Link href="/admin/operations"><b>Operations</b><small>Orders and payments</small></Link>
                <Link href="/admin/categories"><b>Categories</b><small>Restaurant catalog structure</small></Link>
              </div>
            </div>
            <div className="admin-card admin-side-card">
              <span className="eyebrow">QUICK VIEW</span>
              <h2>Platform health</h2>
              <p className="muted">Admin actions are authenticated by the server session and authorized by the database role.</p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
