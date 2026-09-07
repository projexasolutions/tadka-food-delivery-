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
    <div className="orders-page-toolbar"><div><b>{orders.filter((o) => !['delivered', 'cancelled'].includes(o.status)).length} active orders</b><span> • Restaurant kitchen queue</span></div><button className="partner-btn secondary" onClick={load}><span className="material-symbols-outlined">refresh</span> Refresh</button></div>
    <div className="order-tabs">{statuses.map((status) => <button key={status} className={filter === status ? 'active' : ''} onClick={() => setFilter(status)}>{status === 'all' ? 'All' : pretty(status)} <b>{status === 'all' ? orders.length : orders.filter((o) => o.status === status).length}</b></button>)}</div>
    {msg && <div className="partner-alert">{msg}<button onClick={() => setMsg('')}>×</button></div>}
    {loading ? <div className="partner-panel">Loading orders…</div> : <div className="kitchen-grid">{rows.map((order) => <article className="kitchen-card" key={order.id}>
      <div className="kitchen-card-top"><span className="order-id">#{order.id.slice(0, 8).toUpperCase()}</span><span className={`status ${order.status}`}>{pretty(order.status)}</span></div>
      <small>{new Date(order.createdAt).toLocaleString()}</small>
      <div className="kitchen-items"><div><span>Order total</span><b>₹{Number(order.total).toFixed(0)}</b></div><div><span>Payment</span><b>{pretty(order.paymentMethod)} · {pretty(order.paymentStatus)}</b></div><div><span>Delivery</span><b>{order.deliveryAddress}</b></div></div>
      <div className="kitchen-total">{nextStatus[order.status] ? <button className="status-action" onClick={() => advance(order)}>Mark {pretty(nextStatus[order.status])}</button> : <span className="done-mark"><span className="material-symbols-outlined">{order.status === 'cancelled' ? 'cancel' : 'check_circle'}</span>{order.status === 'ready' ? 'Awaiting pickup' : order.status === 'cancelled' ? 'Cancelled' : 'Complete'}</span>}{['pending', 'confirmed', 'preparing'].includes(order.status) && <button className="status-action" onClick={() => cancel(order)}>Cancel</button>}</div>
    </article>)}{!rows.length && <div className="partner-panel partner-empty compact"><span className="material-symbols-outlined">inbox</span><b>No orders in this queue</b><p>Try another status filter.</p></div>}</div>}
  </RestaurantShell>;
}
