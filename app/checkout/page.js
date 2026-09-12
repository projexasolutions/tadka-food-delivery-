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

  if (placed) return <main className="checkout-page checkout-success-page"><div className="success-mark">✓</div><span className="eyebrow">ORDER CONFIRMED</span><h1>Food is on its way.</h1><p className="muted">Order ID: {placed.id}</p><Link className="primary checkout-link" href={`/orders/${placed.id}`}>Track your order <span>→</span></Link></main>;
  if (loading) return <main className="checkout-page"><div className="checkout-loading">Loading checkout...</div></main>;
  if (message && !cart?.items?.length) return <main className="checkout-page checkout-centered"><div className="checkout-error"><span className="eyebrow">CHECKOUT</span><h2>{message}</h2><Link className="primary checkout-link" href={message.includes('login') ? '/auth' : '/restaurants'}>{message.includes('login') ? 'Login' : 'Explore restaurants'}</Link></div></main>;

  const subtotal = Number(cart?.subtotal ?? 0);
  const deliveryFee = Number(cart?.deliveryFee ?? 0);
  const total = Number(cart?.total ?? subtotal + deliveryFee);

  return <main className="checkout-page">
    <div className="checkout-head"><span className="eyebrow">SECURE CHECKOUT</span><h1>Checkout</h1><p>One final step before the kitchen gets cooking.</p></div>
    {message && <div className="checkout-notice">{message}</div>}

    <div className="checkout-grid">
      <div className="checkout-main-column">
        <form className="checkout-card" onSubmit={placeOrder}>
          <div className="step-label"><span>01</span> DELIVERY</div>
          <h2>Where should we deliver?</h2>
          <p className="step-description">Enter your delivery details so we know where to bring your order.</p>

          <div className="field-group">
            <label htmlFor="delivery-address">Delivery address</label>
            <input id="delivery-address" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Flat, street, area" required minLength={10} maxLength={500} />
          </div>
          <div className="field-group">
            <label htmlFor="phone">Phone number</label>
            <input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" required />
          </div>

          <div className="step-divider"><div className="step-label"><span>02</span> PAYMENT</div></div>
          <h2>Choose payment</h2>
          <div className="payment-options">
            <label className={`payment-option ${payment === 'cod' ? 'selected' : ''}`}>
              <input type="radio" name="payment" value="cod" checked={payment === 'cod'} onChange={() => setPayment('cod')} />
              <span><strong>Cash on Delivery</strong><small>Pay when your order arrives</small></span>
            </label>
            <label className={`payment-option ${payment === 'online' ? 'selected' : ''}`}>
              <input type="radio" name="payment" value="online" checked={payment === 'online'} onChange={() => setPayment('online')} />
              <span><strong>Online Payment</strong><small>Secure payment via Razorpay</small></span>
            </label>
          </div>

          <button className="checkout-primary" type="submit" disabled={submitting}>{submitting ? 'Processing...' : payment === 'online' ? 'Continue to payment' : 'Place order'} <span>→</span></button>
        </form>

        <section className="checkout-card location-card">
          <div className="step-label"><span>03</span> LOCATION</div>
          <h2>Confirm your delivery area</h2>
          <p className="step-description">Enter your full address above to preview the delivery location.</p>
          {address.trim().length >= 10 ? <RealMap address={address} /> : <div className="map-placeholder"><span className="map-crosshair">+</span><div><strong>Your delivery map</strong><p>Enter a full address to preview the location.</p></div></div>}
        </section>
      </div>

      <aside className="checkout-summary">
        <div className="summary-top"><span className="eyebrow">ORDER SUMMARY</span><span className="summary-count">{cart.items.length} {cart.items.length === 1 ? 'item' : 'items'}</span></div>
        <h2>Your dishes</h2>
        <div className="summary-items">
          {cart.items.map((item) => <div className="summary-item" key={item.id}><div><strong>{item.name}</strong><span>{item.quantity} × ₹{Number(item.price).toFixed(0)}</span></div><b>₹{Number(item.price * item.quantity).toFixed(0)}</b></div>)}
        </div>
        <div className="summary-lines"><div><span>Subtotal</span><b>₹{subtotal.toFixed(0)}</b></div><div><span>Delivery</span><b>₹{deliveryFee.toFixed(0)}</b></div><div><span>Taxes & charges</span><b className="included">Included</b></div></div>
        <div className="summary-total"><span>Total</span><strong>₹{total.toFixed(0)}</strong></div>
        <div className="secure-note"><span>✓</span><div><strong>Secure checkout</strong><p>Your order details are protected.</p></div></div>
        <Link href="/cart" className="back-cart">← Back to cart</Link>
      </aside>
    </div>

    <style jsx global>{`
      .checkout-page{--green:#075c4d;--green-dark:#06483d;--orange:#f45b24;--ink:#25312d;--muted:#71807a;--line:#e8e5de;min-height:100vh;background:#faf9f6;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding:54px 24px 80px}.checkout-page *{box-sizing:border-box}.checkout-head{max-width:1280px;margin:0 auto 30px}.eyebrow{display:block;color:var(--orange);font-size:11px;font-weight:900;letter-spacing:1.5px;text-transform:uppercase}.checkout-head h1{font-size:48px;line-height:1;letter-spacing:-2px;margin:9px 0 12px;color:#3b302a}.checkout-head p{margin:0;color:#7b756f;font-size:16px}.checkout-notice{max-width:1280px;margin:0 auto 18px;padding:12px 15px;border:1px solid #efd6c8;background:#fff7f2;border-radius:12px;color:#8a5136;font-size:13px}.checkout-grid{max-width:1280px;margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:24px;align-items:start}.checkout-main-column{display:flex;flex-direction:column;gap:20px}.checkout-card,.checkout-summary{background:#fff;border:1px solid var(--line);border-radius:20px;box-shadow:0 7px 24px rgba(35,48,42,.045)}.checkout-card{padding:30px}.step-label{display:flex;align-items:center;gap:8px;color:var(--green);font-size:11px;font-weight:900;letter-spacing:1.3px}.step-label>span{display:inline-flex;width:25px;height:25px;align-items:center;justify-content:center;border-radius:50%;background:#eaf3ef;color:var(--green);font-size:11px;letter-spacing:0}.checkout-card h2{font-size:24px;letter-spacing:-.7px;margin:13px 0 7px;color:#2d332f}.step-description{font-size:14px;color:var(--muted);margin:0 0 23px}.field-group{margin-top:17px}.field-group label{display:block;font-size:12px;font-weight:800;color:#36433e;margin-bottom:8px}.field-group input{width:100%;height:50px;border:1px solid #dedbd4;border-radius:12px;padding:0 15px;background:#fff;font:inherit;color:#29342f;outline:none;transition:.16s}.field-group input:focus{border-color:#79a89c;box-shadow:0 0 0 3px rgba(7,92,77,.08)}.field-group input::placeholder{color:#a1a19c}.step-divider{border-top:1px solid #eeece7;margin:29px 0 25px;padding-top:25px}.payment-options{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:17px}.payment-option{display:flex;align-items:flex-start;gap:11px;border:1px solid #e2dfd8;border-radius:14px;padding:15px;cursor:pointer;transition:.16s}.payment-option.selected{border-color:#7ca99e;background:#f3f8f5;box-shadow:inset 0 0 0 1px #7ca99e}.payment-option input{accent-color:var(--green);margin-top:3px}.payment-option span{display:flex;flex-direction:column;gap:4px}.payment-option strong{font-size:13px}.payment-option small{font-size:11px;color:#7b8580}.checkout-primary{width:100%;height:54px;border:0;border-radius:13px;background:var(--orange);color:#fff;font:800 14px inherit;margin-top:25px;cursor:pointer;box-shadow:0 8px 18px rgba(244,91,36,.18);transition:.16s}.checkout-primary:hover:not(:disabled){transform:translateY(-1px);filter:brightness(.98)}.checkout-primary:disabled{opacity:.65;cursor:not-allowed}.checkout-primary span{margin-left:8px;font-size:18px}.location-card{padding-bottom:24px}.map-placeholder{height:300px;border:1px dashed #ddd4c9;border-radius:16px;background:#f8f2ea;display:flex;align-items:center;justify-content:center;gap:12px;color:#7b746d}.map-crosshair{width:34px;height:34px;border:1px solid #e2cbbb;border-radius:50%;display:grid;place-items:center;color:var(--orange);font-weight:800;background:#fff}.map-placeholder strong{display:block;color:#504a45;font-size:13px}.map-placeholder p{font-size:11px;margin:3px 0 0;color:#8a847e}.checkout-summary{padding:27px 25px;position:sticky;top:90px}.summary-top{display:flex;align-items:center;justify-content:space-between}.summary-count{font-size:11px;color:#7b8580}.checkout-summary h2{font-size:26px;letter-spacing:-.8px;margin:11px 0 22px;color:#332d28}.summary-items{display:flex;flex-direction:column}.summary-item{display:flex;justify-content:space-between;gap:15px;padding:14px 0;border-bottom:1px solid #efede8}.summary-item div{display:flex;flex-direction:column;gap:4px;min-width:0}.summary-item strong{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.summary-item span{font-size:11px;color:#8a8983}.summary-item>b{font-size:13px;white-space:nowrap}.summary-lines{padding:12px 0 4px}.summary-lines>div,.summary-total{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px}.summary-lines span{color:#777b76}.summary-lines b{font-size:13px}.summary-lines .included{color:var(--green)}.summary-total{border-top:1px solid #dedbd4;margin-top:6px;padding:18px 0 16px;font-size:17px}.summary-total strong{font-size:22px;color:#332d28}.secure-note{display:flex;gap:10px;background:#f1f6ec;border-radius:13px;padding:13px;margin-top:8px}.secure-note>span{width:24px;height:24px;border-radius:50%;background:#dcebd5;color:#38724d;display:grid;place-items:center;font-size:12px;font-weight:900}.secure-note strong{font-size:12px}.secure-note p{font-size:10px;color:#758078;margin:3px 0 0}.back-cart{display:block;text-align:center;color:var(--green);font-size:12px;font-weight:800;text-decoration:none;margin-top:19px}.checkout-success-page,.checkout-centered{display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding-top:130px}.success-mark{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:#e7f2eb;color:var(--green);font-size:28px;font-weight:800;margin-bottom:20px}.checkout-success-page h1{font-size:44px;letter-spacing:-1.5px;margin:10px 0}.checkout-link{display:inline-flex;align-items:center;gap:8px;margin-top:18px;text-decoration:none}.checkout-error{max-width:500px;background:#fff;border:1px solid var(--line);border-radius:20px;padding:35px}.checkout-error h2{margin:12px 0 20px}.checkout-loading{max-width:1280px;margin:60px auto;background:#fff;border:1px solid var(--line);border-radius:16px;padding:30px;color:var(--muted)}
      @media(max-width:900px){.checkout-grid{grid-template-columns:1fr}.checkout-summary{position:static}.payment-options{grid-template-columns:1fr}.checkout-head h1{font-size:40px}}
      @media(max-width:600px){.checkout-page{padding:30px 15px 55px}.checkout-head{margin-bottom:22px}.checkout-head h1{font-size:36px}.checkout-card,.checkout-summary{padding:21px;border-radius:16px}.map-placeholder{height:230px}.summary-item strong{max-width:190px}}
    `}</style>
  </main>;
}
