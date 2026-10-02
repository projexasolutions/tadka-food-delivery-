'use client';

import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const statusOptions = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];

export default function AdminOperations() {
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('Loading operations…');
  const [busy, setBusy] = useState('');

  async function load() {
    const [dashboardResponse, ordersResponse] = await Promise.all([
      fetch(`${apiUrl}/v1/admin/dashboard`, { credentials: 'include', cache: 'no-store' }),
      fetch(`${apiUrl}/v1/admin/orders`, { credentials: 'include', cache: 'no-store' }),
    ]);
    const dashboard = await dashboardResponse.json().catch(() => null);
    const orderBody = await ordersResponse.json().catch(() => null);
    if (!dashboardResponse.ok) throw new Error(dashboard?.error?.message || 'Unable to load operations.');
    if (!ordersResponse.ok) throw new Error(orderBody?.error?.message || 'Unable to load orders.');
    setStats(dashboard.data);
    setOrders(orderBody.data);
    setMessage('');
  }

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);

  async function updateStatus(id, status) {
    setBusy(id); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/orders/${id}/status`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update order.');
      setOrders((current) => current.map((order) => order.id === id ? { ...order, status: body.data.status } : order));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(''); }
  }

  return (
    <main className="min-h-screen bg-tadka-bg px-4 py-8 text-tadka-ink sm:px-6">
      <div className="mx-auto mb-7 w-full max-w-[1240px]"><div><span className="text-[10px] font-black tracking-[0.14em] text-tadka-orange">ADMIN OPERATIONS</span><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Platform Control Center</h1><p>Monitor orders, payments and platform activity.</p></div></div>
      {message && <p className="mx-auto mb-4 w-full max-w-[1240px] rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{message}</p>}
      {stats && <section className="mx-auto grid w-full max-w-[1240px] gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm"><small>Users</small><strong>{stats.users}</strong></div>
        <div className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm"><small>Restaurants</small><strong>{stats.restaurants}</strong></div>
        <div className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm"><small>Orders</small><strong>{stats.orders}</strong></div>
        <div className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm"><small>Paid revenue</small><strong>₹{stats.paidRevenue.toLocaleString('en-IN')}</strong></div>
      </section>}
      <section className="mx-auto mt-5 w-full max-w-[1240px] rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm">
        <div className="flex items-start justify-between gap-4"><div><span className="text-[10px] font-black tracking-[0.14em] text-tadka-orange">RECENT</span><h2 className="mt-1 text-xl font-bold tracking-tight">Recent orders</h2></div><span className="text-sm text-tadka-muted">Latest 25</span></div>
        {orders.length ? <div className="table operations-table">
          <div className="table-row table-heading"><span>Order</span><span>Restaurant</span><span>Status</span><span>Payment</span><span>Total</span></div>
          {orders.map((order) => <div className="grid grid-cols-5 gap-3 border-b border-tadka-line p-3 text-sm last:border-0" key={order.id}>
            <span>#{order.id.slice(0, 8)}</span><span>{order.restaurantName}</span>
            <select value={order.status} disabled={busy === order.id} onChange={(event) => updateStatus(order.id, event.target.value)} aria-label={`Status for order ${order.id}`}>
              {statusOptions.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <span>{order.paymentStatus}</span><strong>₹{order.total.toLocaleString('en-IN')}</strong>
          </div>)}
        </div> : !message && <p>No orders found.</p>}
      </section>
    </main>
  );
}
