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
    <main className="container">
      <div className="page-head"><div><span className="eyebrow">ADMIN OPERATIONS</span><h1>Platform Control Center</h1><p>Monitor orders, payments and platform activity.</p></div></div>
      {message && <p className="notice">{message}</p>}
      {stats && <section className="stats-grid">
        <div className="stat"><small>Users</small><strong>{stats.users}</strong></div>
        <div className="stat"><small>Restaurants</small><strong>{stats.restaurants}</strong></div>
        <div className="stat"><small>Orders</small><strong>{stats.orders}</strong></div>
        <div className="stat"><small>Paid revenue</small><strong>₹{stats.paidRevenue.toLocaleString('en-IN')}</strong></div>
      </section>}
      <section className="panel">
        <div className="panel-head"><div><span className="eyebrow">RECENT</span><h2>Recent orders</h2></div><span className="muted">Latest 25</span></div>
        {orders.length ? <div className="table operations-table">
          <div className="table-row table-heading"><span>Order</span><span>Restaurant</span><span>Status</span><span>Payment</span><span>Total</span></div>
          {orders.map((order) => <div className="table-row" key={order.id}>
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
