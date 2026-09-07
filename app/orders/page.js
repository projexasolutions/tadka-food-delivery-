'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const statusCopy = { pending: 'Order received', confirmed: 'Kitchen confirmed', preparing: 'Being prepared', ready: 'Ready for pickup', picked_up: 'Picked up', on_the_way: 'On the way', delivered: 'Delivered', cancelled: 'Cancelled' };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    try {
      const response = await fetch(`${apiUrl}/v1/orders`, { credentials: 'include', cache: 'no-store' });
      const body = await response.json();
      if (response.status === 401) { setMessage('Login to view your orders.'); return; }
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to load orders.');
      setOrders(body.data || []);
      setMessage('');
    } catch (error) { setMessage(error.message || 'Unable to load orders.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); const timer = setInterval(load, 15000); return () => clearInterval(timer); }, []);

  if (loading) return <main className="page"><div className="card">Loading your orders…</div></main>;
  if (message && !orders.length) return <main className="page narrow center"><div className="card empty-state"><h2>{message}</h2><Link className="primary" href="/auth">Login</Link></div></main>;

  return <main className="page">
    <div className="page-head"><div><span className="eyebrow">ORDER HISTORY</span><h1>Your orders.</h1><p>Track every order from kitchen confirmation to doorstep.</p></div><Link className="primary" href="/restaurants">Order food</Link></div>
    {!orders.length && <section className="card empty-state"><h2>No orders yet</h2><p>Completed checkouts will appear here.</p><Link className="primary" href="/restaurants">Explore restaurants</Link></section>}
    <div className="cards">
      {orders.map((order) => <article className="card" key={order.id}>
        <div className="order-head"><div><span className="eyebrow">#{order.id.slice(0, 8).toUpperCase()}</span><h2 style={{ margin: '5px 0' }}>{order.restaurantName}</h2><p className="muted" style={{ fontSize: 12 }}>{new Date(order.createdAt).toLocaleString()}</p></div><div style={{ textAlign: 'right' }}><span className="status">{statusCopy[order.status] || order.status}</span><strong style={{ display: 'block', fontSize: 20, marginTop: 7 }}>₹{order.total}</strong></div></div>
        <div className="items">{order.items.map((item) => <div key={item.id}><span>{item.quantity} × {item.name}</span><b>₹{item.lineTotal}</b></div>)}</div>
        <div className="summaryRow"><span>Payment</span><b>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : `Online · ${order.paymentStatus}`}</b></div>
        <div className="actions"><Link className="btn secondary" href={`/orders/${order.id}`}>View order</Link></div>
      </article>)}
    </div>
  </main>;
}
