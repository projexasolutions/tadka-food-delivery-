'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function PaymentPage() {
  const params = useSearchParams();
  const router = useRouter();
  const orderId = params.get('order');
  const [status, setStatus] = useState('processing');
  const [order, setOrder] = useState(null);

  useEffect(() => {
    if (!orderId) { setStatus('missing'); return; }
    fetch(`${apiUrl}/v1/orders/${orderId}`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Order unavailable.');
        setOrder(body.data);
        setStatus('ready');
      })
      .catch(() => setStatus('invalid'));
  }, [orderId]);

  if (status === 'processing') return <main className="container"><h1>Secure payment</h1><p>Loading your order…</p></main>;
  if (status === 'missing' || status === 'invalid') return <main className="container"><h1>Payment unavailable</h1><p>This order could not be loaded.</p><button className="btn primary" onClick={() => router.push('/orders')}>View orders</button></main>;

  return <main className="container"><section className="panel"><span className="eyebrow">PAYMENT</span><h1>{order.paymentStatus === 'paid' ? 'Payment complete' : 'Continue payment from checkout'}</h1><p>Order #{orderId.slice(0, 8)}</p><p>Amount: <strong>₹{Number(order.total).toFixed(0)}</strong> · Payment: <strong>{order.paymentStatus}</strong></p>{order.paymentStatus === 'paid' ? <button className="btn primary" onClick={() => router.push(`/orders?order=${orderId}`)}>View order</button> : <><p className="notice">Your secure Razorpay payment is started from checkout. Return there to complete payment.</p><button className="btn primary" onClick={() => router.push('/checkout')}>Open checkout</button></>}</section></main>;
}
