'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body?.data;
}

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function load() {
    setLoading(true);
    try { setDeliveries(await api('/v1/rider/deliveries') || []); setMessage(''); }
    catch (error) { setMessage(error.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, []);

  async function advance(delivery) {
    const next = delivery.status === 'assigned' ? 'accepted' : delivery.status === 'accepted' ? 'picked_up' : 'delivered';
    try {
      await api(`/v1/rider/deliveries/${delivery.id}/status`, { method: 'PATCH', body: JSON.stringify({ status: next }) });
      await load();
    } catch (error) { setMessage(error.message); }
  }

  return <main className="container delivery-page">
    <div className="page-head"><div><span className="eyebrow">DELIVERY</span><h1>Rider deliveries</h1><p>Manage your assigned TADKA deliveries.</p></div><button className="secondary" onClick={load}>Refresh</button></div>
    {message && <div className="partner-alert">{message}<button onClick={() => setMessage('')}>×</button></div>}
    {loading ? <section className="panel"><p>Loading deliveries…</p></section> : !deliveries.length ? <section className="panel"><h3>No deliveries assigned</h3><p className="muted">New delivery assignments will appear here.</p><Link className="secondary" href="/account">Back to account</Link></section> : <section className="panel">
      <div className="order-list">{deliveries.map((delivery) => <article className="order-card" key={delivery.id}>
        <div><span className="eyebrow">{delivery.status.replace('_', ' ').toUpperCase()}</span><h3>Order #{delivery.orderId.slice(0, 8)}</h3><p>{delivery.restaurantName}</p><p className="muted">{delivery.address}</p><p className="muted">Customer: {delivery.phone}</p></div>
        <div className="order-card-side"><strong>₹{delivery.total}</strong>{delivery.status !== 'delivered' && <button className="primary" onClick={() => advance(delivery)}>{delivery.status === 'assigned' ? 'Accept' : delivery.status === 'accepted' ? 'Picked Up' : 'Mark Delivered'}</button>}</div>
      </article>)}</div>
    </section>}
  </main>;
}
