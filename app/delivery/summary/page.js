'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function getDeliveries() {
  const response = await fetch(apiUrl + '/v1/rider/deliveries', { credentials: 'include', cache: 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Unable to load order summary.');
  return body?.data || [];
}

export default function RiderSummaryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function load() {
    setLoading(true);
    try { setDeliveries(await getDeliveries()); setError(''); }
    catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  const stats = useMemo(() => {
    const completed = deliveries.filter(x => x.status === 'delivered');
    const active = deliveries.filter(x => ['accepted','picked_up'].includes(x.status));
    return {
      total: deliveries.length,
      completed: completed.length,
      active: active.length,
      assigned: deliveries.filter(x => x.status === 'assigned').length,
      value: completed.reduce((sum,x) => sum + Number(x.total || 0), 0),
    };
  }, [deliveries]);

  return (
    <main className="min-h-screen bg-tadka-bg px-4 py-8 text-tadka-ink sm:px-6">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><span className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-tadka-orange"><i /> RIDER PERFORMANCE</span><h1>Order summary</h1><p>Review your assigned deliveries and completed order value.</p></div>
          <Link href="/delivery" className="inline-flex items-center gap-2 rounded-xl border border-tadka-line bg-white px-3 py-2 text-sm font-bold"><span className="material-symbols-outlined">arrow_back</span>Back to deliveries</Link>
        </div>

        <div className="mb-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <article><span className="material-symbols-outlined">inventory_2</span><b>{stats.total}</b><small>Total orders</small></article>
          <article><span className="material-symbols-outlined">assignment</span><b>{stats.assigned}</b><small>Awaiting acceptance</small></article>
          <article><span className="material-symbols-outlined">two_wheeler</span><b>{stats.active}</b><small>Active deliveries</small></article>
          <article><span className="material-symbols-outlined">task_alt</span><b>{stats.completed}</b><small>Completed</small></article>
          <article><span className="material-symbols-outlined">payments</span><b>₹{stats.value.toLocaleString('en-IN')}</b><small>Completed order value</small></article>
        </div>

        <section className="rider-settings-card rider-summary-table">
          <div className="flex items-center justify-between gap-4 border-b border-tadka-line pb-4"><div><span className="eyebrow">DELIVERY HISTORY</span><h2>Order activity</h2></div><button className="rounded-xl border border-tadka-line px-3 py-2 text-sm font-bold hover:bg-tadka-bg" onClick={load} disabled={loading}><span className="material-symbols-outlined">refresh</span>Refresh</button></div>
          {error && <div className="flex items-center gap-2 rounded-xl bg-orange-50 p-3 text-sm text-tadka-danger"><span className="material-symbols-outlined">error</span>{error}</div>}
          {loading ? <div className="p-10 text-center text-tadka-muted"><span className="rider-spinner" /><b>Loading order activity…</b></div> :
            deliveries.length === 0 ? <div className="p-10 text-center text-tadka-muted"><span className="rider-empty-art"><span className="material-symbols-outlined">receipt_long</span></span><h3>No order activity yet</h3><p>Your assigned deliveries will appear here.</p><Link href="/delivery" className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark">Back to dashboard</Link></div> :
            <div className="divide-y divide-tadka-line">{deliveries.map(order => (
              <div className="grid gap-3 p-4 sm:grid-cols-[40px_1fr_auto_auto] sm:items-center" key={order.id}>
                <div className="rider-summary-order-icon"><span className="material-symbols-outlined">{order.status === 'delivered' ? 'task_alt' : 'receipt_long'}</span></div>
                <div><b>#{order.orderId.slice(0,8).toUpperCase()}</b><small>{order.restaurantName}</small><span>{order.address}</span></div>
                <span className={'rider-status ' + order.status}><i />{order.status.replace('_',' ')}</span>
                <strong>₹{order.total}</strong>
              </div>
            ))}</div>
          }
        </section>
      </div>
    </main>
  );
}
