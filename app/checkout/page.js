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

  if (placed) return <main className="flex min-h-screen flex-col items-center justify-center bg-tadka-bg px-6 py-24 text-center text-tadka-ink"><div className="mb-5 grid h-16 w-16 place-items-center rounded-full bg-tadka-green-soft text-2xl font-bold text-tadka-green">✓</div><span className="text-[11px] font-black tracking-[0.14em] text-tadka-orange">ORDER CONFIRMED</span><h1>Food is on its way.</h1><p className="muted">Order ID: {placed.id}</p><Link className="primary checkout-link" href={`/orders/${placed.id}`}>Track your order <span>→</span></Link></main>;
  if (loading) return <main className="min-h-screen bg-tadka-bg px-4 py-10 text-tadka-ink sm:px-6 lg:px-8"><div className="mx-auto max-w-[1240px] rounded-xl border border-tadka-line bg-white p-7 text-tadka-muted">Loading checkout...</div></main>;
  if (message && !cart?.items?.length) return <main className="flex min-h-screen flex-col items-center justify-center bg-tadka-bg px-6 py-24 text-center text-tadka-ink"><div className="max-w-lg rounded-tadka-lg border border-tadka-line bg-white p-8 shadow-tadka-sm"><span className="text-[11px] font-black tracking-[0.14em] text-tadka-orange">CHECKOUT</span><h2>{message}</h2><Link className="primary checkout-link" href={message.includes('login') ? '/auth' : '/restaurants'}>{message.includes('login') ? 'Login' : 'Explore restaurants'}</Link></div></main>;

  const subtotal = Number(cart?.subtotal ?? 0);
  const deliveryFee = Number(cart?.deliveryFee ?? 0);
  const total = Number(cart?.total ?? subtotal + deliveryFee);

  return <main className="min-h-screen bg-tadka-bg px-4 py-10 text-tadka-ink sm:px-6 lg:px-8">
    <div className="mx-auto mb-7 w-full max-w-[1240px]"><span className="text-[11px] font-black tracking-[0.14em] text-tadka-orange">SECURE CHECKOUT</span><h1 className="mt-2 text-4xl font-bold tracking-tight sm:text-5xl">Checkout</h1><p className="mt-2 text-sm text-tadka-muted sm:text-base">One final step before the kitchen gets cooking.</p></div>
    {message && <div className="mx-auto mb-4 w-full max-w-[1240px] rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{message}</div>}

    <div className="mx-auto grid w-full max-w-[1240px] gap-5 lg:grid-cols-[minmax(0,1fr)_400px]">
      <div className="flex flex-col gap-5">
        <form className="rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm sm:p-7" onSubmit={placeOrder}>
          <div className="flex items-center gap-2 text-[11px] font-black tracking-wider text-tadka-green"><span>01</span> DELIVERY</div>
          <h2>Where should we deliver?</h2>
          <p className="mb-5 text-sm text-tadka-muted">Enter your delivery details so we know where to bring your order.</p>

          <div className="mt-4">
            <label htmlFor="delivery-address">Delivery address</label>
            <input className="mt-2 h-12 w-full rounded-xl border border-tadka-line bg-white px-4 text-sm outline-none transition focus:border-tadka-green focus:ring-2 focus:ring-tadka-green/10" id="delivery-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat, street, area" required minLength={10} maxLength={500} />
          </div>
          <div className="mt-4">
            <label htmlFor="phone">Phone number</label>
            <input className="mt-2 h-12 w-full rounded-xl border border-tadka-line bg-white px-4 text-sm outline-none transition focus:border-tadka-green focus:ring-2 focus:ring-tadka-green/10" id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
          </div>

          <div className="step-divider"><div className="flex items-center gap-2 text-[11px] font-black tracking-wider text-tadka-green"><span>02</span> PAYMENT</div></div>
          <h2>Choose payment</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${payment === "cod" ? "border-tadka-green bg-tadka-green-soft" : "border-tadka-line bg-white hover:bg-tadka-bg"}`}>
              <input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
              <span><strong>Cash on Delivery</strong><small>Pay when your order arrives</small></span>
            </label>
            <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition ${payment === "online" ? "border-tadka-green bg-tadka-green-soft" : "border-tadka-line bg-white hover:bg-tadka-bg"}`}>
              <input type="radio" name="payment" value="online" checked={payment === 'online'} onChange={() => setPayment('online')} />
              <span><strong>Online Payment</strong><small>Secure payment via Razorpay</small></span>
            </label>
          </div>

          <button className="mt-6 h-14 w-full rounded-xl bg-tadka-orange text-sm font-bold text-white shadow-tadka-sm transition hover:bg-tadka-orange-dark disabled:opacity-60" type="submit" disabled={submitting}>{submitting ? 'Processing...' : payment === 'online' ? 'Continue to payment' : 'Place order'} <span>→</span></button>
        </form>

        <section className="checkout-card location-card">
          <div className="flex items-center gap-2 text-[11px] font-black tracking-wider text-tadka-green"><span>03</span> LOCATION</div>
          <h2>Confirm your delivery area</h2>
          <p className="mb-5 text-sm text-tadka-muted">Enter your full address above to preview the delivery location.</p>
          {address.trim().length >= 10 ? <RealMap address={address} /> : <div className="flex h-[300px] items-center justify-center gap-3 rounded-xl border border-dashed border-tadka-line bg-tadka-bg text-tadka-muted"><span className="map-crosshair">+</span><div><strong>Your delivery map</strong><p>Enter a full address to preview the location.</p></div></div>}
        </section>
      </div>

      <aside className="rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm lg:sticky lg:top-24">
        <div className="flex items-center justify-between"><span className="text-[11px] font-black tracking-[0.14em] text-tadka-orange">ORDER SUMMARY</span><span className="summary-count">{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}</span></div>
        <h2>Your dishes</h2>
        <div className="my-4 flex flex-col">
          {cart.items.map((item) => <div className="flex items-center justify-between gap-4 border-b border-tadka-line py-3" key={item.id}><div><strong>{item.name}</strong><span>{item.quantity} × ₹{Number(item.price).toFixed(0)}</span></div><b>₹{Number(item.price * item.quantity).toFixed(0)}</b></div>)}
        </div>
        <div className="border-t border-tadka-line pt-3"><div><span>Subtotal</span><b>₹{subtotal.toFixed(0)}</b></div><div><span>Delivery</span><b>₹{deliveryFee.toFixed(0)}</b></div><div><span>Taxes & charges</span><b className="included">Included</b></div></div>
        <div className="flex items-center justify-between border-t border-tadka-line py-4 text-base"><span>Total</span><strong>₹{total.toFixed(0)}</strong></div>
        <div className="mt-2 flex gap-3 rounded-xl bg-tadka-green-soft p-3"><span>✓</span><div><strong>Secure checkout</strong><p>Your order details are protected.</p></div></div>
        <Link href="/cart" className="mt-5 block text-center text-xs font-bold text-tadka-green hover:text-tadka-orange">← Back to cart</Link>
      </aside>
    </div>

    
  </main>;
}
