'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Cart() {
  const [items, setItems] = useState([]);
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [authenticated, setAuthenticated] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/cart`, { credentials: 'include', cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (response.status === 401) { setAuthenticated(false); setItems([]); setCartId(null); setLoading(false); return; }
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to load your cart.');
      setAuthenticated(true); setCartId(body.data.id); setItems(body.data.items || []);
    } catch (error) { setMessage(error.message || 'Unable to load your cart.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeQuantity(item, delta) {
    setBusyId(item.id); setMessage('');
    try {
      const quantity = item.quantity + delta;
      const response = await fetch(`${apiUrl}/v1/cart/items/${item.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity: Math.max(0, quantity) }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update your cart.');
      setItems(body.data.items || []); setCartId(body.data.id); window.dispatchEvent(new Event('tadka:cart-updated'));
    } catch (error) { setMessage(error.message || 'Unable to update your cart.'); }
    finally { setBusyId(null); }
  }

  const subtotal = items.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const delivery = items.length ? 39 : 0;
  const total = subtotal + delivery;

  return (
    <main className="page">
      <div className="page-head"><div><span className="eyebrow">YOUR ORDER</span><h1>Cart</h1><p>Review your dishes before you send them to the kitchen.</p></div><Link className="secondary" href="/restaurants">Add more food</Link></div>
      {!authenticated ? <div className="card empty-state"><span className="material-symbols-outlined empty-icon">shopping_bag</span><h3>Login to see your cart.</h3><Link className="primary" href="/auth">Login</Link></div> : loading ? <div className="card">Loading your cart…</div> : message && !items.length ? <div className="card empty-state"><h3>We couldn’t load your cart.</h3><p>{message}</p><button className="primary" type="button" onClick={load}>Try again</button></div> : <div className="checkout-grid">
        <section className="card cart-list">{!items.length ? <div className="empty-state"><h3>Your cart is empty.</h3><p>Find a kitchen and add something delicious.</p><Link className="primary" href="/restaurants">Explore restaurants</Link></div> : items.map((item) => <div className="cartRow" key={item.id}><div><b>{item.name}</b><p>₹{Number(item.price).toFixed(0)} each</p></div><div className="qty"><button type="button" disabled={busyId === item.id} onClick={() => changeQuantity(item, -1)}>−</button><b>{item.quantity}</b><button type="button" disabled={busyId === item.id} onClick={() => changeQuantity(item, 1)}>+</button></div></div>)}{message && items.length > 0 && <div className="notice">{message}</div>}</section>
        {items.length > 0 && <aside className="card order-summary"><span className="eyebrow">ORDER SUMMARY</span><h2>Your total</h2><div className="summaryRow"><span>Subtotal</span><b>₹{subtotal.toFixed(0)}</b></div><div className="summaryRow"><span>Delivery</span><b>₹{delivery}</b></div><div className="summaryRow"><span>Taxes & charges</span><b>Included</b></div><div className="summaryRow total"><span>Total</span><b>₹{total.toFixed(0)}</b></div><Link className="primary full" href="/checkout">Continue to checkout <span className="material-symbols-outlined">arrow_forward</span></Link></aside>}
      </div>}
      {cartId && <div className="muted developer-detail">Cart ID: {cartId}</div>}
    </main>
  );
}
