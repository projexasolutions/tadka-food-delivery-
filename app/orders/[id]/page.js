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

  if (!order) return <main className="mx-auto w-full max-w-3xl px-4 py-12 text-center"><div className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm"><span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">ORDER TRACKING</span><h1>{message}</h1><Link className="inline-flex items-center justify-center rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink hover:bg-tadka-bg" href="/orders">Back to orders</Link></div></main>;

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-9 pb-20">
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div><span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">LIVE ORDER TRACKING</span><h1>Your order is on the way.</h1><p>#{order.id.slice(0, 8).toUpperCase()} · {order.restaurantName}</p></div>
        <Link className="inline-flex items-center justify-center rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink hover:bg-tadka-bg" href="/orders">← All orders</Link>
      </div>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">{order.restaurantName}</span><h2>Good food. Happier people.</h2></div><span className="inline-flex rounded-full bg-tadka-green-soft px-3 py-1.5 text-xs font-bold text-tadka-success">{steps[activeIndex]?.[1] || order.status}</span></div>
          <div className="my-6 grid gap-4">
            {steps.map(([status, title, copy], index) => (
              <div className="flex items-start gap-3 rounded-xl border border-tadka-line bg-tadka-bg p-3" key={status}>
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-tadka-green text-xs font-bold text-white">{index < activeIndex ? '✓' : index + 1}</span>
                <div><b className="text-sm">{title}</b><p className="mt-1 text-sm text-tadka-muted">{copy}</p></div>
              </div>
            ))}
          </div>
          <div className="overflow-hidden rounded-2xl border border-tadka-line">
            <RealMap address={order.deliveryAddress} />
          </div>
        </div>

        <aside className="grid content-start gap-4">
          <div className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">
            <span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">DELIVERY TO</span><h2>Drop-off location</h2><p className="text-sm text-tadka-muted">{order.deliveryAddress}</p><a className="mt-4 inline-flex w-full justify-center rounded-xl border border-tadka-line bg-white px-4 py-3 text-sm font-bold" href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(order.deliveryAddress)}`} target="_blank" rel="noreferrer">Open map ↗</a>
          </div>
          <div className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">
            <span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">ORDER SUMMARY</span><h2>Your dishes</h2>
            <div className="my-4 grid gap-2 text-sm">{order.items.map((item) => <div key={item.id}><span>{item.quantity} × {item.name}</span><b>₹{item.lineTotal}</b></div>)}</div>
            <div className="flex justify-between gap-3 border-t border-tadka-line py-2 text-sm"><span>Payment</span><b>{order.paymentMethod === 'cod' ? 'Cash on Delivery' : `Online · ${order.paymentStatus}`}</b></div>
            <div className="flex justify-between gap-3 border-t border-tadka-line py-2 text-sm"><span>Delivery</span><b>₹{order.deliveryFee}</b></div>
            <div className="flex justify-between gap-3 border-t border-tadka-line pt-4 text-lg font-bold"><span>Total</span><b>₹{order.total}</b></div>
          </div>
        </aside>
      </section>
    </main>
  );
}
