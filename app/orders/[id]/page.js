'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import RealMap from '@/components/RealMap';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const steps = [
  ['pending', 'Order placed', 'Your order has been received.'],
  ['confirmed', 'Kitchen confirmed', 'The restaurant accepted your order.'],
  ['preparing', 'Preparing', 'Your food is being freshly prepared.'],
  ['ready', 'Ready for pickup', 'The order is packed and waiting for pickup.'],
  ['picked_up', 'Out for delivery', 'Your delivery partner is on the way.'],
  ['delivered', 'Delivered', 'Enjoy your meal!'],
];

export default function OrderDetailsPage() {
  const params = useParams();
  const id = params?.id;
  const [order, setOrder] = useState(null);
  const [message, setMessage] = useState('Loading your order…');

  useEffect(() => {
    if (!id) return;
    let active = true;
    async function load() {
      try {
        const response = await fetch(`${apiUrl}/v1/orders/${id}`, { credentials: 'include', cache: 'no-store' });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load this order.');
        if (active) { setOrder(body.data); setMessage(''); }
      } catch (error) {
        if (active) setMessage(error.message || 'Unable to load this order.');
      }
    }
    void load();
    const timer = setInterval(load, 15000);
    return () => { active = false; clearInterval(timer); };
  }, [id]);

  const activeIndex = useMemo(() => {
    if (!order) return -1;
    return Math.max(0, steps.findIndex(([status]) => status === order.status));
  }, [order]);

  if (!order) return <main className="page narrow center"><div className="card"><span className="eyebrow">ORDER TRACKING</span><h1>{message}</h1><Link className="secondary" href="/orders">Back to orders</Link></div></main>;

  return (
    <main className="page order-detail-page">
      <div className="page-head">
        <div><span className="eyebrow">LIVE ORDER TRACKING</span><h1>Your order is on the way.</h1><p>#{order.id.slice(0, 8).toUpperCase()} · {order.restaurantName}</p></div>
        <Link className="secondary" href="/orders">← All orders</Link>
      </div>

      <section className="order-detail-grid">
        <div className="card order-track-card">
          <div className="order-track-top"><div><span className="eyebrow">{order.restaurantName}</span><h2>Good food. Happier people.</h2></div><span className="status success">{steps[activeIndex]?.[1] || order.status}</span></div>
          <div className="order-timeline">
            {steps.map(([status, title, copy], index) => (
              <div className={`order-step ${index <= activeIndex ? 'done' : ''} ${index === activeIndex ? 'current' : ''}`} key={status}>
                <span className="order-step-dot">{index < activeIndex ? '✓' : index + 1}</span>
                <div><b>{title}</b><p>{copy}</p></div>
              </div>
            ))}
          </div>
          <div className="order-map-wrap">
            <RealMap address={order.deliveryAddress} />
          </div>
        </div>

        <aside className="order-detail-side">
          <div className="card">
            <span className="eyebrow">DELIVERY TO</span><h2>Drop-off location</h2><p className="muted">{order.deliveryAddress}</p><a className="secondary full" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`} target="_blank" rel="noreferrer">Open map ↗</a>
          </div>
          <div className="card">
            <span className="eyebrow">ORDER SUMMARY</span><h2>Your dishes</h2>
            <div className="items">{order.items.map((item) => <div key={item.id}><span>{item.quantity} × {item.name}</span><b>₹{item.lineTotal}</b></div>)}</div>
            <div className="summaryRow"><span>Payment</span><b>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : `Online · ${order.paymentStatus}`}</b></div>
            <div className="summaryRow"><span>Delivery</span><b>₹{order.deliveryFee}</b></div>
            <div className="summaryRow total"><span>Total</span><b>₹{order.total}</b></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
