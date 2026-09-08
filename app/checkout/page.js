'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import RealMap from '@/components/RealMap';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

function loadRazorpay() {
  if (window.Razorpay) return Promise.resolve(true);
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

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
    fetch(`${apiUrl}/v1/cart`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (response.status === 401) throw new Error('Please login before checkout.');
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load your cart.');
        setCart(body.data);
        if (!body.data.items?.length) setMessage('Your cart is empty.');
      })
      .catch((error) => setMessage(error.message || 'Unable to load your cart.'))
      .finally(() => setLoading(false));
  }, []);

  async function createOrder() {
    const response = await fetch(`${apiUrl}/v1/orders`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deliveryAddress: address.trim(), phone: phone.trim(), paymentMethod: payment }),
    });
    const body = await response.json().catch(() => null);
    if (response.status === 401) throw new Error('Your session has expired. Please login again.');
    if (!response.ok) throw new Error(body?.error?.message || 'Unable to create your order.');
    return body.data;
  }

  async function payOnline(order) {
    if (!razorpayKey) throw new Error('Online payment is not configured yet.');
    const ready = await loadRazorpay();
    if (!ready) throw new Error('Unable to load the payment gateway. Please try again.');
    const response = await fetch(`${apiUrl}/v1/payments/razorpay/order`, {
      method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ orderId: order.id }),
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) throw new Error(body?.error?.message || 'Unable to start online payment.');
    await new Promise((resolve, reject) => {
      const instance = new window.Razorpay({
        key: razorpayKey, amount: body.data.amount, currency: body.data.currency, name: 'TADKA',
        description: `Order #${order.id.slice(0, 8).toUpperCase()}`, order_id: body.data.razorpayOrderId,
        prefill: { contact: phone.trim() },
        handler: async (paymentResult) => {
          try {
            const verifyResponse = await fetch(`${apiUrl}/v1/payments/razorpay/verify`, {
              method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ orderId: order.id, razorpayOrderId: paymentResult.razorpay_order_id, razorpayPaymentId: paymentResult.razorpay_payment_id, razorpaySignature: paymentResult.razorpay_signature }),
            });
            const verifyBody = await verifyResponse.json().catch(() => null);
            if (!verifyResponse.ok) throw new Error(verifyBody?.error?.message || 'Payment verification failed.');
            resolve();
          } catch (error) { reject(error); }
        },
        modal: { ondismiss: () => reject(new Error('Payment was cancelled. Your order remains unpaid.')) },
      });
      instance.on('payment.failed', () => reject(new Error('Payment failed. You can retry from checkout.')));
      instance.open();
    });
  }

  async function placeOrder(event) {
    event.preventDefault();
    if (submitting || !cart?.items?.length) return;
    setSubmitting(true); setMessage('');
    try {
      const order = await createOrder();
      if (payment === 'online') await payOnline(order);
      setPlaced(order);
      window.dispatchEvent(new Event('tadka:cart-updated'));
    } catch (error) { setMessage(error.message || 'Unable to place your order.'); }
    finally { setSubmitting(false); }
  }

  if (placed) return <main className="page narrow center"><div className="success">✓</div><span className="eyebrow">ORDER CONFIRMED</span><h1>Food is on its way.</h1><p className="muted">Order ID: {placed.id}</p><Link className="primary" href={`/orders/${placed.id}`}>Track your order</Link></main>;
  if (loading) return <main className="page"><div className="card">Loading checkout…</div></main>;
  if (message && !cart?.items?.length) return <main className="page narrow center"><div className="card empty-state"><h2>{message}</h2><Link className="primary" href={message.includes('login') ? '/auth' : '/restaurants'}>{message.includes('login') ? 'Login' : 'Explore restaurants'}</Link></div></main>;

  const subtotal = Number(cart?.subtotal ?? 0);
  const deliveryFee = Number(cart?.deliveryFee ?? 0);
  const total = Number(cart?.total ?? subtotal + deliveryFee);
  return <main className="page">
    <div className="page-head"><div><span className="eyebrow">SECURE CHECKOUT</span><h1>Checkout</h1><p>One final step before the kitchen gets cooking.</p></div></div>
    {message && <div className="notice">{message}</div>}
    <div className="checkout-grid">
      <div>
        <form className="card" onSubmit={placeOrder}>
          <span className="eyebrow">01 · Delivery</span><h2 className="section-title">Where should we deliver?</h2>
          <label>Delivery address<input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat, street, area" required minLength={10} maxLength={500} /></label>
          <label>Phone<input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." required /></label>
          <span className="eyebrow checkout-step">02 · Payment</span><h2 className="section-title">Choose payment</h2>
          <select value={payment} onChange={(e) => setPayment(e.target.value)}><option value="cod">Cash on Delivery</option><option value="online">Online Payment</option></select>
          <p className="muted fine-print">Online payments are securely processed by Razorpay.</p>
          <button className="primary full" type="submit" disabled={submitting}>{submitting ? 'Processing…' : payment === 'online' ? 'Continue to payment' : 'Place order'} <span className="material-symbols-outlined">arrow_forward</span></button>
        </form>
        <div className="card checkout-map-card"><span className="eyebrow">03 · LOCATION</span><h2 className="section-title">Confirm your delivery area</h2><p className="muted">Enter your full address above to preview the real map location.</p>{address.trim().length >= 10 ? <RealMap address={address} /> : <div className="map-placeholder">📍 Your delivery map will appear here</div>}</div>
      </div>
      <aside className="card"><span className="eyebrow">ORDER SUMMARY</span><h2 className="section-title summary-title">Your dishes</h2>
        {cart.items.map((item) => <div className="summaryRow" key={item.id}><span>{item.quantity} × {item.name}</span><b>₹{Number(item.price * item.quantity).toFixed(0)}</b></div>)}
        <div className="summaryRow"><span>Delivery</span><b>₹{deliveryFee}</b></div><div className="summaryRow total"><span>Total</span><b>₹{total.toFixed(0)}</b></div>
      </aside>
    </div>
  </main>;
}
