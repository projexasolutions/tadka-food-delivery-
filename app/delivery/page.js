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
    <main className="rider-dashboard">
      <aside className="rider-sidebar">
        <div className="rider-side-brand">
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
          <div className="rider-safety-icon"><span className="material-symbols-outlined">two_wheeler</span></div>
          <b>Stay Safe,<br />Deliver Fresh! 🍲</b>
          <span>Good food brings happiness.</span>
        </div>
      </aside>

      <section className="rider-main">
        <div className="rider-topline">
          <div>
            <span className="rider-kicker"><i /> RIDER CONSOLE</span>
            <h1>Good Morning, Rider! 👋</h1>
            <p>Here are your deliveries for today.</p>
          </div>
          <div className="rider-date">
            <span className="material-symbols-outlined">calendar_month</span>
            <div><small>{new Date().toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</small><b>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</b></div>
          </div>
        </div>

        <div className="rider-stat-grid">
          <div className="rider-stat-card orange"><span className="rider-stat-icon"><span className="material-symbols-outlined">inventory_2</span></span><div><b>{stats.assigned}</b><strong>Assigned</strong><small>New deliveries</small></div></div>
          <div className="rider-stat-card yellow"><span className="rider-stat-icon"><span className="material-symbols-outlined">two_wheeler</span></span><div><b>{stats.active}</b><strong>Active</strong><small>Currently on delivery</small></div></div>
          <div className="rider-stat-card green"><span className="rider-stat-icon"><span className="material-symbols-outlined">task_alt</span></span><div><b>{stats.completed}</b><strong>Completed</strong><small>Today's deliveries</small></div></div>
          <div className="rider-stat-card value"><span className="rider-stat-icon"><span className="material-symbols-outlined">payments</span></span><div><b>₹{stats.value.toLocaleString('en-IN')}</b><strong>Order Value</strong><small>Across loaded deliveries</small></div></div>
        </div>

        {message && <div className="rider-alert"><span className="material-symbols-outlined">error</span><span>{message}</span><button onClick={() => setMessage('')}>×</button></div>}

        <div className="rider-workspace">
          <section className="rider-queue">
            <div className="rider-queue-head">
              <div><span className="eyebrow">TODAY'S QUEUE</span><h2>Deliveries <em>{deliveries.length}</em></h2></div>
              <button className="rider-refresh" onClick={load} disabled={loading}><span className="material-symbols-outlined">refresh</span> Refresh</button>
            </div>
            <div className="rider-tabs">
              {[
                ['assigned', `Assigned (${stats.assigned})`],
                ['active', `Active (${stats.active})`],
                ['completed', `Completed (${stats.completed})`],
              ].map(([key, label]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}</button>)}
            </div>

            {loading ? <div className="rider-empty compact"><span className="rider-spinner" /><b>Checking for new deliveries…</b></div> :
              visible.length === 0 ? (
                <div className="rider-empty">
                  <div className="rider-empty-art"><span className="material-symbols-outlined">two_wheeler</span></div>
                  <span className="rider-empty-badge">ALL CLEAR</span>
                  <h3>No {filter} deliveries</h3>
                  <p>New delivery assignments will appear here automatically. Refresh to check for new orders.</p>
                  <button className="rider-primary" onClick={load}><span className="material-symbols-outlined">refresh</span> Check again</button>
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
                      <div className="rider-order-side"><strong>₹{delivery.total}</strong>{delivery.status !== 'delivered' ? <button className="rider-primary" onClick={() => advance(delivery)} disabled={busyId === delivery.id}><span className="material-symbols-outlined">{busyId === delivery.id ? 'progress_activity' : 'arrow_forward'}</span>{busyId === delivery.id ? 'Updating…' : nextLabel}</button> : <span className="rider-complete"><span className="material-symbols-outlined">check</span>Completed</span>}</div>
                    </article>;
                  })}
                </div>
              )}
          </section>

          <aside className="rider-detail">
            <div className="rider-detail-head"><div><span className="eyebrow">DELIVERY FLOW</span><h3>Quick guide</h3></div><span className="rider-live"><i /> Live</span></div>
            <div className="rider-flow">
              <div><span>1</span><section><b>Accept</b><small>Confirm the assigned order</small></section></div>
              <div><span>2</span><section><b>Pick up</b><small>Collect the order from restaurant</small></section></div>
              <div><span>3</span><section><b>Deliver</b><small>Complete the handoff to customer</small></section></div>
            </div>
            <div className="rider-help"><span className="material-symbols-outlined">support_agent</span><div><b>Need help?</b><small>Contact TADKA support</small></div><Link href="/delivery/support">Open</Link></div>
          </aside>
        </div>
      </section>
    </main>
  );
}
