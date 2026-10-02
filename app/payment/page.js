'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PaymentPage() {
  const router = useRouter();
  const [orderId, setOrderId] = useState(null);
  const [status, setStatus] = useState('processing');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get('order');
    setOrderId(id);
    if (!id) { setStatus('missing'); return; }
    fetch(`${apiUrl}/v1/orders/${id}`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => { const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error?.message || 'Order unavailable.'); setOrder(body.data); setStatus('ready'); })
      .catch(() => setStatus('invalid'));
  }, []);

  if (status === 'processing') return <main className="mx-auto w-full max-w-3xl px-4 py-12"><h1>Secure payment</h1><p>Loading your order…</p></main>;
  if (status === 'missing' || status === 'invalid') return <main className="mx-auto w-full max-w-3xl px-4 py-12"><h1>Payment unavailable</h1><p>This order could not be loaded.</p><button className="rounded-xl bg-tadka-orange px-4 py-3 text-sm font-bold text-white" onClick={() => router.push('/orders')}>View orders</button></main>;
  return <main className="mx-auto w-full max-w-3xl px-4 py-12"><section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm"><span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">PAYMENT</span><h1>{order.paymentStatus === 'paid' ? 'Payment complete' : 'Continue payment from checkout'}</h1><p>Order #{orderId.slice(0, 8)}</p><p>Amount: <strong>₹{Number(order.total).toFixed(0)}</strong> · Payment: <strong>{order.paymentStatus}</strong></p>{order.paymentStatus === 'paid' ? <button className="rounded-xl bg-tadka-orange px-4 py-3 text-sm font-bold text-white" onClick={() => router.push(`/orders?order=${orderId}`)}>View order</button> : <><p className="my-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-sm text-tadka-danger">Your secure Razorpay payment is started from checkout. Return there to complete payment.</p><button className="rounded-xl bg-tadka-orange px-4 py-3 text-sm font-bold text-white" onClick={() => router.push('/checkout')}>Open checkout</button></>}</section></main>;
}
