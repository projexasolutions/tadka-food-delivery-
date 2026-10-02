'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options, credentials: 'include', cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body?.data;
}

const statusMeta = {
  assigned: { label: 'Assigned', icon: 'assignment' },
  accepted: { label: 'Accepted', icon: 'check_circle' },
  picked_up: { label: 'Picked up', icon: 'inventory_2' },
  delivered: { label: 'Delivered', icon: 'task_alt' },
};

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [filter, setFilter] = useState('assigned');

  async function load() {
    setLoading(true);
    try { setDeliveries(await api('/v1/rider/deliveries') || []); setMessage(''); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function advance(delivery) {
    const next = delivery.status === 'assigned' ? 'accepted' : delivery.status === 'accepted' ? 'picked_up' : 'delivered';
    setBusyId(delivery.id);
    try {
      await api(`/v1/rider/deliveries/${delivery.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      await load();
    } catch (error) { setMessage(error.message); }
    finally { setBusyId(null); }
  }

  const stats = useMemo(() => ({
    assigned: deliveries.filter((x) => x.status === 'assigned').length,
    active: deliveries.filter((x) => ['accepted', 'picked_up'].includes(x.status)).length,
    completed: deliveries.filter((x) => x.status === 'delivered').length,
    value: deliveries.reduce((sum, x) => sum + Number(x.total || 0), 0),
  }), [deliveries]);

  const visible = filter === 'assigned'
    ? deliveries.filter((x) => x.status === 'assigned')
    : filter === 'active'
      ? deliveries.filter((x) => ['accepted', 'picked_up'].includes(x.status))
      : deliveries.filter((x) => x.status === 'delivered');

  return (
    <main className="min-h-screen bg-tadka-bg text-tadka-ink">
      <aside className="hidden w-64 shrink-0 border-r border-tadka-line bg-white p-4 lg:block">
        <div className="flex items-center gap-3 border-b border-tadka-line pb-5">
          <img src="/tadka-logo.svg" alt="Tadka" />
          <span><b>RIDER CONSOLE</b><small>DELIVERY PARTNER</small></span>
        </div>
        <nav>
          <Link className="active" href="/delivery"><span className="material-symbols-outlined">inventory_2</span>Deliveries</Link>
          <Link href="/delivery/summary"><span className="material-symbols-outlined">payments</span>Order Summary</Link>
          <Link href="/delivery/account"><span className="material-symbols-outlined">person</span>My Profile</Link>
          <Link href="/delivery/support"><span className="material-symbols-outlined">support_agent</span>Help & Support</Link>
        </nav>
        <div className="rider-safety-card">
          <div className="rider-safety-art" />
          <span className="rider-safety-label">RIDER TIP</span>
          <b>Ride smart.<br />Deliver fresh.</b>
          <span>Check your route before leaving.</span>
        </div>
      </aside>

      <section className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6">
        <div className="flex flex-col justify-between gap-5 rounded-2xl bg-tadka-green p-6 text-white shadow-tadka-md md:flex-row md:items-center">
          <div className="rider-hero-copy">
            <span className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-tadka-orange"><i /> TODAY'S DELIVERY HUB</span>
            <h1>Ready for your next ride? 👋</h1>
            <p>Your delivery queue, earnings and active orders — everything you need in one place.</p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-tadka-green" onClick={load} disabled={loading}><span className="material-symbols-outlined">refresh</span>{loading ? 'Checking…' : 'Check for orders'}</button>
              <span className="text-xs font-bold"><i /> Online & ready</span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl bg-white/10 p-3">
            <span className="material-symbols-outlined">calendar_month</span>
            <div><small>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</small><b>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</b></div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-tadka-line bg-white p-4 shadow-tadka-sm"><span className="rider-stat-icon"><span className="material-symbols-outlined">inventory_2</span></span><div><b>{stats.assigned}</b><strong>Assigned</strong><small>New deliveries</small></div></div>
          <div className="rounded-xl border border-tadka-line bg-white p-4 shadow-tadka-sm"><span className="rider-stat-icon"><span className="material-symbols-outlined">two_wheeler</span></span><div><b>{stats.active}</b><strong>Active</strong><small>Currently on delivery</small></div></div>
          <div className="rounded-xl border border-tadka-line bg-white p-4 shadow-tadka-sm"><span className="rider-stat-icon"><span className="material-symbols-outlined">task_alt</span></span><div><b>{stats.completed}</b><strong>Completed</strong><small>Today's deliveries</small></div></div>
          <div className="rounded-xl border border-tadka-line bg-white p-4 shadow-tadka-sm"><span className="rider-stat-icon"><span className="material-symbols-outlined">payments</span></span><div><b>₹{stats.value.toLocaleString('en-IN')}</b><strong>Order Value</strong><small>Across loaded deliveries</small></div></div>
        </div>

        {message && <div className="my-4 flex items-center gap-3 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900"><span className="material-symbols-outlined">error</span><span>{message}</span><button onClick={() => setMessage('')}>×</button></div>}

        <div className="my-4 grid gap-3 md:grid-cols-2">
          <div><span className="material-symbols-outlined">route</span><section><small>TODAY'S ROUTE</small><b>Keep your deliveries moving</b></section></div>
          <div><span className="material-symbols-outlined">bolt</span><section><small>QUICK ACTION</small><b>Refresh for new orders</b></section><button onClick={load} disabled={loading}>Refresh</button></div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
          <section className="rounded-2xl border border-tadka-line bg-white p-5 shadow-tadka-sm">
            <div className="flex items-center justify-between gap-4">
              <div><span className="eyebrow">TODAY'S QUEUE</span><h2>Deliveries <em>{deliveries.length}</em></h2></div>
              <button className="rounded-xl border border-tadka-line px-3 py-2 text-sm font-bold hover:bg-tadka-bg" onClick={load} disabled={loading}><span className="material-symbols-outlined">refresh</span> Refresh</button>
            </div>
            <div className="mt-4 flex gap-2 overflow-x-auto pb-1">
              {[
                ['assigned', `Assigned (${stats.assigned})`],
                ['active', `Active (${stats.active})`],
                ['completed', `Completed (${stats.completed})`],
              ].map(([key, label]) => <button key={key} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold ${filter === key ? "border-tadka-green bg-tadka-green text-white" : "border-tadka-line bg-white text-tadka-muted"}`} onClick={() => setFilter(key)}>{label}</button>)}
            </div>

            {loading ? <div className="rider-empty compact"><span className="rider-spinner" /><b>Checking for new deliveries…</b></div> :
              visible.length === 0 ? (
                <div className="rider-empty">
                  <img className="rider-empty-image" src="/rider-empty.svg" alt="" />
                  <span className="rider-empty-badge">ALL CLEAR</span>
                  <h3>No {filter} deliveries</h3>
                  <p>New delivery assignments will appear here automatically. Refresh to check for new orders.</p>
                  <button className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark disabled:opacity-50" onClick={load}><span className="material-symbols-outlined">refresh</span> Check again</button>
                </div>
              ) : (
                <div className="rider-order-list">
                  {visible.map((delivery) => {
                    const meta = statusMeta[delivery.status] || statusMeta.assigned;
                    const nextLabel = delivery.status === 'assigned' ? 'Accept delivery' : delivery.status === 'accepted' ? 'Mark picked up' : 'Mark delivered';
                    return <article className="rider-order" key={delivery.id}>
                      <div className={`rider-order-icon ${delivery.status}`}><span className="material-symbols-outlined">{meta.icon}</span></div>
                      <div className="rider-order-info">
                        <div className="rider-order-title"><span className="rider-order-id">ORDER #{delivery.orderId.slice(0, 8).toUpperCase()}</span><span className={`rider-status ${delivery.status}`}><i />{meta.label}</span></div>
                        <h3>{delivery.restaurantName}</h3>
                        <p><span className="material-symbols-outlined">location_on</span>{delivery.address}</p>
                        <p><span className="material-symbols-outlined">call</span>{delivery.phone}</p>
                      </div>
                      <div className="rider-order-side"><strong>₹{delivery.total}</strong>{delivery.status !== 'delivered' ? <button className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark disabled:opacity-50" onClick={() => advance(delivery)} disabled={busyId === delivery.id}><span className="material-symbols-outlined">{busyId === delivery.id ? 'progress_activity' : 'arrow_forward'}</span>{busyId === delivery.id ? 'Updating…' : nextLabel}</button> : <span className="rider-complete"><span className="material-symbols-outlined">check</span>Completed</span>}</div>
                    </article>;
                  })}
                </div>
              )}
          </section>

          <aside className="rounded-2xl border border-tadka-line bg-white p-5 shadow-tadka-sm">
            <div className="flex items-center justify-between"><div><span className="eyebrow">DELIVERY FLOW</span><h3>Quick guide</h3></div><span className="rider-live"><i /> Live</span></div>
            <div className="mt-5 space-y-4">
              <div><span>1</span><section><b>Accept</b><small>Confirm the assigned order</small></section></div>
              <div><span>2</span><section><b>Pick up</b><small>Collect the order from restaurant</small></section></div>
              <div><span>3</span><section><b>Deliver</b><small>Complete the handoff to customer</small></section></div>
            </div>
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-tadka-green-soft p-3"><span className="material-symbols-outlined">support_agent</span><div><b>Need help?</b><small>Contact TADKA support</small></div><Link href="/delivery/support">Open</Link></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
