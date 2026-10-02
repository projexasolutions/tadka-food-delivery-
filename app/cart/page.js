'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function CartIcon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'bag') return <svg {...p}><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
  if (name === 'trash') return <svg {...p}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>;
  return null;
}

export default function Cart() {
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [message, setMessage] = useState('');
  const [authenticated, setAuthenticated] = useState(true);

  const load = useCallback(async () => {
    setLoading(true); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/cart`, { credentials: 'include', cache: 'no-store' });
      const body = await response.json().catch(() => null);
      if (response.status === 401) { setAuthenticated(false); setCart(null); return; }
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to load your cart.');
      setAuthenticated(true); setCart(body?.data || null);
    } catch (error) { setMessage(error.message || 'Unable to load your cart.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function changeQuantity(item, delta) {
    const quantity = Math.max(0, Math.min(50, Number(item.quantity) + delta));
    setBusyId(item.id); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/cart/items/${item.id}`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ quantity }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update your cart.');
      setCart(body?.data || null);
      window.dispatchEvent(new Event('tadka:cart-updated'));
    } catch (error) { setMessage(error.message || 'Unable to update your cart.'); }
    finally { setBusyId(null); }
  }

  const count = cart?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;

  return <main className="min-h-screen bg-tadka-bg px-4 py-8 text-tadka-ink sm:px-6">
    <section className="cart-shell">
      <div className="mx-auto mb-7 flex w-full max-w-[1240px] items-end justify-between gap-5">
        <div>
          <div className="cart-eyebrow">YOUR ORDER</div>
          <h1>Your cart</h1>
          <p>Review your favourites before checkout.</p>
        </div>
        <Link href="/restaurants" className="continue-link">Add more food <span>→</span></Link>
      </div>

      {!authenticated ? <div className="mx-auto max-w-xl rounded-tadka-lg border border-tadka-line bg-white p-12 text-center shadow-tadka-sm"><h2>Login to see your cart.</h2><Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tadka-green px-5 text-sm font-bold text-white transition hover:bg-tadka-orange" href="/auth">Login</Link></div>
        : loading ? <div className="mx-auto max-w-xl rounded-tadka-lg border border-tadka-line bg-white p-12 text-center shadow-tadka-sm"><p>Loading your cart...</p></div>
        : message && !cart?.items?.length ? <div className="mx-auto max-w-xl rounded-tadka-lg border border-tadka-line bg-white p-12 text-center shadow-tadka-sm"><h2>We couldn't load your cart.</h2><p>{message}</p><button className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tadka-green px-5 text-sm font-bold text-white transition hover:bg-tadka-orange" onClick={load}>Try again</button></div>
        : !cart?.items?.length ? <div className="mx-auto max-w-xl rounded-tadka-lg border border-tadka-line bg-white p-12 text-center shadow-tadka-sm"><div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-orange-50 text-tadka-orange"><CartIcon name="bag" size={25}/></div><h2>Your cart is empty.</h2><p>Find a kitchen and add something delicious.</p><Link className="inline-flex min-h-11 items-center justify-center rounded-xl bg-tadka-green px-5 text-sm font-bold text-white transition hover:bg-tadka-orange" href="/restaurants">Explore restaurants</Link></div>
        : <div className="mx-auto grid w-full max-w-[1240px] gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <section className="cart-items-column">
            <div className="items-header"><strong>{count} {count === 1 ? 'item' : 'items'}</strong><span>Tadka Kitchen</span></div>
            <div className="cart-item-list">
              {cart.items.map((item) => <article className="grid grid-cols-[110px_minmax(0,1fr)_auto] gap-4 rounded-tadka-lg border border-tadka-line bg-white p-4 shadow-tadka-sm" key={item.id}>
                <div className="h-[105px] w-[110px] rounded-xl bg-cover bg-center">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name}/> : <div className="image-fallback">T</div>}
                </div>
                <div className="min-w-0">
                  <div className="item-restaurant">TADKA KITCHEN</div>
                  <h2>{item.name}</h2>
                  <p>₹{Number(item.price).toFixed(0)} each</p>
                  <strong className="item-line-total">₹{Number(item.price * item.quantity).toFixed(0)}</strong>
                </div>
                <div className="flex flex-col items-end justify-between gap-3">
                  <div className="inline-flex items-center rounded-lg border border-tadka-line" aria-label={`Quantity for ${item.name}`}>
                    <button aria-label={`Decrease ${item.name}`} disabled={busyId === item.id} onClick={() => changeQuantity(item, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button aria-label={`Increase ${item.name}`} disabled={busyId === item.id} onClick={() => changeQuantity(item, 1)}>+</button>
                  </div>
                  <button className="remove-button" aria-label={`Remove ${item.name}`} disabled={busyId === item.id} onClick={() => changeQuantity(item, -Number(item.quantity))}><CartIcon name="trash" size={16}/><span>Remove</span></button>
                </div>
              </article>)}
            </div>
            {message && <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{message}</div>}
          </section>

          <aside className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm lg:sticky lg:top-24">
            <div className="flex items-center justify-between"><div className="cart-eyebrow">ORDER SUMMARY</div><span>{count} {count === 1 ? 'item' : 'items'}</span></div>
            <h2>Order total</h2>
            <div className="border-t border-tadka-line pt-3">
              <div><span>Subtotal</span><strong>₹{Number(cart.subtotal || 0).toFixed(0)}</strong></div>
              <div><span>Delivery</span><strong>₹{Number(cart.deliveryFee || 0).toFixed(0)}</strong></div>
              <div><span>Taxes &amp; charges</span><strong className="included">Included</strong></div>
            </div>
            <div className="flex items-center justify-between border-t border-tadka-line py-4 text-base"><span>Total</span><strong>₹{Number(cart.total || 0).toFixed(0)}</strong></div>
            <Link className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-tadka-green text-sm font-bold text-white shadow-tadka-sm transition hover:bg-tadka-orange" href="/checkout">Continue to checkout <span>→</span></Link>
            <div className="mt-4 flex gap-3 rounded-xl bg-tadka-green-soft p-3"><div className="note-line"></div><div><strong>Fresh food, delivered with care.</strong><p>Your cart stays connected to checkout.</p></div></div>
          </aside>
        </div>}
    </section>

    
  </main>;
}
