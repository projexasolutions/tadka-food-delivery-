'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const pretty = (status) => String(status || '').replaceAll('_', ' ');
const nextStatus = { pending: 'confirmed', confirmed: 'preparing', preparing: 'ready' };

async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body?.data;
}

export default function RestaurantDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const [restaurantData, orderData, menuData] = await Promise.all([api('/v1/restaurant'), api('/v1/restaurant/orders'), api('/v1/restaurant/menu')]);
      setRestaurant(restaurantData || null); setOrders(orderData || []); setItems(menuData?.items || []);
    } catch (error) { setMessage(error.message || 'Unable to load the restaurant dashboard.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function updateStatus(order) {
    const status = nextStatus[order.status];
    if (!status) return;
    try {
      const updated = await api(`/v1/restaurant/orders/${order.id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...updated } : item));
    } catch (error) { setMessage(error.message); }
  }

  async function toggleKitchen() {
    if (!restaurant) return;
    try {
      setRestaurant(await api('/v1/restaurant', { method: 'PATCH', body: JSON.stringify({ isOpen: !restaurant.isOpen }) }));
    } catch (error) { setMessage(error.message); }
  }

  const activeOrders = useMemo(() => orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)), [orders]);
  const pendingOrders = orders.filter((order) => order.status === 'pending');
  const preparingOrders = orders.filter((order) => order.status === 'preparing');
  const readyOrders = orders.filter((order) => order.status === 'ready');
  const deliveredOrders = orders.filter((order) => order.status === 'delivered');
  const revenue = deliveredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const averageOrder = deliveredOrders.length ? revenue / deliveredOrders.length : 0;

  if (loading) return <RestaurantShell title="RESTAURANT PARTNER" subtitle="Loading your command center…"><div className="grid gap-3 sm:grid-cols-2"><div /><div /><div /><div /></div></RestaurantShell>;
  if (!restaurant) return <RestaurantShell title="RESTAURANT PARTNER" subtitle="Restaurant access required"><div className="grid place-items-center rounded-2xl border border-dashed border-tadka-line bg-white p-10 text-center shadow-tadka-sm"><span className="text-[9px] font-black tracking-widest text-tadka-muted">RESTAURANT</span><h2>{message || 'No restaurant access'}</h2><p>Your account must be assigned to an approved restaurant by an administrator.</p><Link className="inline-flex rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark" href="/account">Back to account</Link></div></RestaurantShell>;

  return <RestaurantShell title="RESTAURANT PARTNER" subtitle={`Welcome back, ${restaurant.name}`}>
    {message && <div className="rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900"><span className="text-[10px] font-black tracking-widest text-tadka-muted">NOTICE</span>{message}<button type="button" onClick={() => setMessage('')} aria-label="Dismiss notice">×</button></div>}
    <section className="flex flex-col justify-between gap-5 rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm md:flex-row md:items-center"><div><span className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-tadka-orange"><i /> KITCHEN STATUS</span><p>Monitor your live order queue and keep menu availability in sync with the kitchen.</p></div><button type="button" className={`inline-flex min-w-[220px] items-center justify-center gap-2 rounded-full px-4 py-3 text-xs font-black ${restaurant.isOpen ? 'bg-tadka-green text-white' : 'bg-tadka-bg text-tadka-muted'}`} onClick={toggleKitchen}><i /> {restaurant.isOpen ? 'OPEN • ACCEPTING ORDERS' : 'CLOSED • PAUSED'}<span>{restaurant.isOpen ? 'Pause Kitchen' : 'Open Kitchen'}</span></button></section>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      <Metric title="Orders" value={orders.length} sub="Latest 50 orders" />
      <Metric title="Pending Action" value={String(pendingOrders.length).padStart(2, '0')} sub="Needs attention" urgent />
      <Metric title="In Kitchen" value={String(preparingOrders.length).padStart(2, '0')} sub="Preparing" />
      <Metric title="Ready" value={String(readyOrders.length).padStart(2, '0')} sub="Awaiting pickup" />
      <Metric title="Delivered Revenue" value={`₹${revenue.toFixed(0)}`} sub="Delivered orders" />
      <Metric title="Avg Delivered" value={`₹${averageOrder.toFixed(0)}`} sub="Per completed order" />
    </div>
    <section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm"><div className="flex items-start justify-between gap-4"><div><h2>Live Incoming Orders</h2><p>{activeOrders.length} active orders in the kitchen pipeline.</p></div><button type="button" className="rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink hover:bg-tadka-bg" onClick={() => void load()}>Refresh</button></div>
      <div className="mt-5 overflow-x-auto rounded-xl border border-tadka-line"><div className="grid min-w-[900px] grid-cols-6 gap-3 bg-tadka-bg p-3 text-[10px] font-black tracking-widest text-tadka-muted"><span>ORDER</span><span>TIME</span><span>TOTAL</span><span>PAYMENT</span><span>STATUS</span><span>ACTION</span></div>
        {orders.slice(0, 8).map((order) => <div className="grid min-w-[900px] grid-cols-6 items-center gap-3 border-t border-tadka-line p-3 text-sm" key={order.id}><b>#{order.id.slice(0, 8).toUpperCase()}</b><span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span><strong>₹{Number(order.total).toFixed(0)}</strong><span>{pretty(order.paymentMethod)} · {pretty(order.paymentStatus)}</span><span className="rounded-full bg-tadka-bg px-2.5 py-1 text-xs font-bold capitalize">{pretty(order.status)}</span>{nextStatus[order.status] ? <button type="button" className="rounded-lg bg-tadka-green px-3 py-2 text-xs font-bold text-white" onClick={() => void updateStatus(order)}>Mark {pretty(nextStatus[order.status])}</button> : <Link className="rounded-lg border border-tadka-line px-3 py-2 text-xs font-bold" href="/restaurant/orders">View</Link>}</div>)}
        {!orders.length && <div className="p-8 text-center text-tadka-muted"><span className="metric-label">ORDERS</span><b>No orders yet</b><p>New customer orders will appear here.</p></div>}
      </div>
      <div className="flex items-center justify-between border-t border-tadka-line p-3 text-xs text-tadka-muted"><span>Showing {Math.min(orders.length, 8)} of {orders.length}</span><Link href="/restaurant/orders">View All Live Orders →</Link></div>
    </section>
    <section className="grid gap-3 md:grid-cols-3"><Insight title="Menu catalog" text={`${items.filter((item) => item.isAvailable).length} available dishes`} href="/restaurant/menu" /><Insight title="Hidden dishes" text={`${items.filter((item) => !item.isAvailable).length} unavailable`} href="/restaurant/menu" /><Insight title="Analytics" text="Open revenue dashboard" href="/restaurant/analytics" /></section>
  </RestaurantShell>;
}

function Metric({ title, value, sub, urgent = false }) { return <div className={`min-w-0 rounded-2xl border border-tadka-line bg-white p-5 shadow-tadka-sm ${urgent ? 'border-orange-200' : ''}`}><small className="text-xs font-bold text-tadka-muted">{title}</small><strong className={`mt-4 block text-2xl font-black tracking-tight ${urgent ? "text-tadka-orange" : "text-tadka-ink"}`}>{value}</strong><span className="mt-2 block text-xs text-tadka-subtle">{sub}</span></div>; }
function Insight({ title, text, href }) { return <Link href={href} className="flex items-center justify-between rounded-xl border border-tadka-line bg-white p-4 hover:border-tadka-green"><span><b>{title}</b><small>{text}</small></span><span className="text-[10px] font-black tracking-widest text-tadka-muted">OPEN</span></Link>; }
