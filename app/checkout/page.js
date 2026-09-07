'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Checkout() {
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [payment, setPayment] = useState('cod');
  const [cart, setCart] = useState(null);
  const [message, setMessage] = useState('');
  const [placed, setPlaced] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await fetch(`${apiUrl}/v1/cart`, { credentials: 'include', cache: 'no-store' });
        const body = await response.json();
        if (response.status === 401) { setMessage('Please login before checkout.'); return; }
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load your cart.');
        setCart(body.data);
        if (!body.data.items?.length) setMessage('Your cart is empty.');
      } catch (error) { setMessage(error.message || 'Unable to load your cart.'); }
      finally { setLoading(false); }
    }
    load();
  }, []);

  async function placeOrder(event) {
    event.preventDefault();
    if (submitting || !cart?.items?.length) return;
    setSubmitting(true);
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/orders`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deliveryAddress: address.trim(), phone: phone.trim(), paymentMethod: payment }),
      });
      const body = await response.json();
      if (response.status === 401) { setMessage('Your session has expired. Please login again.'); return; }
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to place your order.');
      setPlaced(body.data);
    } catch (error) { setMessage(error.message || 'Unable to place your order.'); }
    finally { setSubmitting(false); }
  }

  if (placed) return <main className="page narrow center"><div className="success">✓</div><span className="eyebrow">ORDER CONFIRMED</span><h1>Food is on its way.</h1><p className="muted">Order ID: {placed.id}</p><Link className="primary" href={`/orders?order=${placed.id}`}>Track your order</Link></main>;
  if (loading) return <main className="page"><div className="card">Loading checkout…</div></main>;
  if (message && !cart?.items?.length) return <main className="page narrow center"><div className="card empty-state"><h2>{message}</h2><Link className="primary" href={message.includes('login') ? '/auth' : '/restaurants'}>{message.includes('login') ? 'Login' : 'Explore restaurants'}</Link></div></main>;

  const subtotal = Number(cart?.subtotal ?? 0);
  const deliveryFee = Number(cart?.deliveryFee ?? 0);
  const total = Number(cart?.total ?? subtotal + deliveryFee);
  return <main className="page">
    <div className="page-head"><div><span className="eyebrow">SECURE CHECKOUT</span><h1>Checkout</h1><p>One final step before the kitchen gets cooking.</p></div></div>
    {message && <div className="notice">{message}</div>}
    <div className="checkout-grid">
      <form className="card" onSubmit={placeOrder}>
        <span className="eyebrow">01 · Delivery</span><h2 className="section-title">Where should we deliver?</h2>
        <label>Delivery address<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat, street, area" required minLength={10} maxLength={500} /></label>
        <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." required /></label>
        <span className="eyebrow checkout-step">02 · Payment</span><h2 className="section-title">Choose payment</h2>
        <select value={payment} onChange={(e) => setPayment(e.target.value)}><option value="cod">Cash on Delivery</option><option value="online">Online Payment</option></select>
        <p className="muted fine-print">Online payment will be completed in the payment step.</p>
        <button className="primary full" type="submit" disabled={submitting}>{submitting ? 'Placing order…' : 'Place order'} <span className="material-symbols-outlined">arrow_forward</span></button>
      </form>
      <aside className="card"><span className="eyebrow">ORDER SUMMARY</span><h2 className="section-title summary-title">Your dishes</h2>
        {cart.items.map((item) => <div className="summaryRow" key={item.id}><span>{item.quantity} × {item.name}</span><b>₹{Number(item.price * item.quantity).toFixed(0)}</b></div>)}
        <div className="summaryRow"><span>Delivery</span><b>₹{deliveryFee}</b></div><div className="summaryRow total"><span>Total</span><b>₹{total.toFixed(0)}</b></div>
      </aside>
    </div>
  </main>;
}
