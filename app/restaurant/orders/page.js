'use client';

import { useEffect, useMemo, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const statuses = ['all', 'pending', 'confirmed', 'preparing', 'ready', 'cancelled', 'delivered'];
const nextStatus = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready' };
const pretty = (status) => String(status || '').replaceAll('_', ' ');

async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body?.data;
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try { setOrders((await api('/v1/restaurant/orders')) || []); setMsg(''); }
    catch (error) { setMsg(error.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function advance(order) {
    const status = nextStatus[order.status];
    if (!status) return;
    try {
      const updated = await api(`/v1/restaurant/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...updated } : item));
    } catch (error) { setMsg(error.message); }
  }

  async function cancel(order) {
    if (!window.confirm(`Cancel order #${order.id.slice(0, 8).toUpperCase()}?`)) return;
    try {
      const updated = await api(`/v1/restaurant/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'cancelled' }) });
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...updated } : item));
    } catch (error) { setMsg(error.message); }
  }

  const rows = useMemo(() => filter === 'all' ? orders : orders.filter((order) => order.status === filter), [orders, filter]);

  return <RestaurantShell title="LIVE ORDER OPERATIONS" subtitle="Live Orders & Kitchen Queue">
    <div className="flex items-center justify-between gap-4 rounded-xl border border-tadka-line bg-white p-4"><div><b>{orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length} active orders</b><span> • Restaurant kitchen queue</span></div><button className="partner-btn secondary" onClick={load}><span className="material-symbols-outlined">refresh</span> Refresh</button></div>
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1">{statuses.map((status) => <button key={status} className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold capitalize ${filter === status ? "border-tadka-green bg-tadka-green text-white" : "border-tadka-line bg-white text-tadka-muted hover:bg-tadka-bg"}`} onClick={() => setFilter(status)}>{status === 'all' ? 'All' : pretty(status)} <b>{status === 'all' ? orders.length : orders.filter((o) => o.status === status).length}</b></button>)}</div>
    {msg && <div className="my-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{msg}<button onClick={() => setMsg('')}>×</button></div>}
    {loading ? <div className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">Loading orders…</div> : <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">{rows.map((order) => <article className="rounded-2xl border border-tadka-line bg-white p-5 shadow-tadka-sm" key={order.id}>
      <div className="flex items-center justify-between gap-3"><span className="text-sm font-black tracking-wide text-tadka-ink">#{order.id.slice(0, 8).toUpperCase()}</span><span className="rounded-full bg-tadka-bg px-2.5 py-1 text-xs font-bold capitalize text-tadka-muted">{pretty(order.status)}</span></div>
      <small className="mt-1 block text-xs text-tadka-subtle">{new Date(order.createdAt).toLocaleString()}</small>
      <div className="mt-5 space-y-3"><div><span>Order total</span><b>₹{Number(order.total).toFixed(0)}</b></div><div><span>Payment</span><b>{pretty(order.paymentMethod)} · {pretty(order.paymentStatus)}</b></div><div><span>Delivery</span><b>{order.deliveryAddress}</b></div></div>
      <div className="mt-5 flex items-center justify-between gap-2 border-t border-tadka-line pt-4">{nextStatus[order.status] ? <button className="rounded-xl bg-tadka-green px-3 py-2 text-xs font-bold text-white hover:bg-tadka-orange" onClick={() => advance(order)}>Mark {pretty(nextStatus[order.status])}</button> : <span className="done-mark"><span className="material-symbols-outlined">{order.status === 'cancelled' ? 'cancel' : 'check_circle'}</span>{order.status === 'ready' ? 'Awaiting pickup' : order.status === 'cancelled' ? 'Cancelled' : 'Complete'}</span>}{['pending', 'confirmed', 'preparing'].includes(order.status) && <button className="rounded-xl bg-tadka-green px-3 py-2 text-xs font-bold text-white hover:bg-tadka-orange" onClick={() => cancel(order)}>Cancel</button>}</div>
    </article>)}{!rows.length && <div className="partner-panel partner-empty compact"><span className="material-symbols-outlined">inbox</span><b>No orders in this queue</b><p>Try another status filter.</p></div>}</div>}
  </RestaurantShell>;
}
