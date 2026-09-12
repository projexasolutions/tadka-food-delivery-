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

  return <main className="tadka-cart-page">
    <section className="cart-shell">
      <div className="cart-page-head">
        <div>
          <div className="cart-eyebrow">YOUR ORDER</div>
          <h1>Your cart</h1>
          <p>Review your favourites before checkout.</p>
        </div>
        <Link href="/restaurants" className="continue-link">Add more food <span>→</span></Link>
      </div>

      {!authenticated ? <div className="cart-state"><h2>Login to see your cart.</h2><Link className="primary-button" href="/auth">Login</Link></div>
        : loading ? <div className="cart-state"><p>Loading your cart...</p></div>
        : message && !cart?.items?.length ? <div className="cart-state"><h2>We couldn't load your cart.</h2><p>{message}</p><button className="primary-button" onClick={load}>Try again</button></div>
        : !cart?.items?.length ? <div className="cart-state"><div className="state-icon"><CartIcon name="bag" size={25}/></div><h2>Your cart is empty.</h2><p>Find a kitchen and add something delicious.</p><Link className="primary-button" href="/restaurants">Explore restaurants</Link></div>
        : <div className="cart-grid">
          <section className="cart-items-column">
            <div className="items-header"><strong>{count} {count === 1 ? 'item' : 'items'}</strong><span>Tadka Kitchen</span></div>
            <div className="cart-item-list">
              {cart.items.map((item) => <article className="cart-item-card" key={item.id}>
                <div className="cart-food-image">
                  {item.imageUrl ? <img src={item.imageUrl} alt={item.name}/> : <div className="image-fallback">T</div>}
                </div>
                <div className="cart-item-details">
                  <div className="item-restaurant">TADKA KITCHEN</div>
                  <h2>{item.name}</h2>
                  <p>₹{Number(item.price).toFixed(0)} each</p>
                  <strong className="item-line-total">₹{Number(item.price * item.quantity).toFixed(0)}</strong>
                </div>
                <div className="cart-item-controls">
                  <div className="quantity-control" aria-label={`Quantity for ${item.name}`}>
                    <button aria-label={`Decrease ${item.name}`} disabled={busyId === item.id} onClick={() => changeQuantity(item, -1)}>−</button>
                    <span>{item.quantity}</span>
                    <button aria-label={`Increase ${item.name}`} disabled={busyId === item.id} onClick={() => changeQuantity(item, 1)}>+</button>
                  </div>
                  <button className="remove-button" aria-label={`Remove ${item.name}`} disabled={busyId === item.id} onClick={() => changeQuantity(item, -Number(item.quantity))}><CartIcon name="trash" size={16}/><span>Remove</span></button>
                </div>
              </article>)}
            </div>
            {message && <div className="cart-notice">{message}</div>}
          </section>

          <aside className="order-summary">
            <div className="summary-top"><div className="cart-eyebrow">ORDER SUMMARY</div><span>{count} {count === 1 ? 'item' : 'items'}</span></div>
            <h2>Order total</h2>
            <div className="summary-lines">
              <div><span>Subtotal</span><strong>₹{Number(cart.subtotal || 0).toFixed(0)}</strong></div>
              <div><span>Delivery</span><strong>₹{Number(cart.deliveryFee || 0).toFixed(0)}</strong></div>
              <div><span>Taxes &amp; charges</span><strong className="included">Included</strong></div>
            </div>
            <div className="summary-total"><span>Total</span><strong>₹{Number(cart.total || 0).toFixed(0)}</strong></div>
            <Link className="checkout-button" href="/checkout">Continue to checkout <span>→</span></Link>
            <div className="summary-note"><div className="note-line"></div><div><strong>Fresh food, delivered with care.</strong><p>Your cart stays connected to checkout.</p></div></div>
          </aside>
        </div>}
    </section>

    <style jsx global>{`
      .tadka-cart-page{min-height:calc(100vh - 80px);background:#fbfaf7;color:#17231f;padding:34px 24px 70px;font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif}
      .cart-shell{max-width:1280px;margin:0 auto}.cart-page-head{display:flex;justify-content:space-between;align-items:flex-end;gap:30px;margin:0 0 28px}.cart-eyebrow{font-size:11px;letter-spacing:2px;font-weight:900;color:#075c4d}.cart-page-head h1{font-size:42px;line-height:1.05;letter-spacing:-1.5px;margin:9px 0 10px}.cart-page-head p{margin:0;color:#6d7874;font-size:15px}.continue-link{color:#e85c22;text-decoration:none;font-weight:800;font-size:14px;padding-bottom:6px}.continue-link span{margin-left:4px}.cart-grid{display:grid;grid-template-columns:minmax(0,1fr) 365px;gap:28px;align-items:start}.cart-items-column{min-width:0}.items-header{display:flex;justify-content:space-between;align-items:center;padding:0 4px 12px;color:#68736f;font-size:13px}.items-header strong{color:#17231f;font-size:14px}.items-header span{font-weight:700}.cart-item-list{display:flex;flex-direction:column;gap:12px}.cart-item-card{display:grid;grid-template-columns:112px minmax(0,1fr) auto;align-items:center;gap:20px;background:#fff;border:1px solid #e5e4df;border-radius:18px;padding:14px 17px 14px 14px;box-shadow:0 5px 18px rgba(23,35,31,.035);transition:.18s}.cart-item-card:hover{border-color:#d3ddd8;box-shadow:0 9px 25px rgba(23,35,31,.06)}.cart-food-image{width:112px;height:100px;border-radius:13px;overflow:hidden;background:#f0eee8}.cart-food-image img{width:100%;height:100%;object-fit:cover;display:block}.image-fallback{height:100%;display:grid;place-items:center;font-size:34px;font-weight:900;color:#075c4d;background:#eef4f0}.cart-item-details{min-width:0}.item-restaurant{font-size:10px;letter-spacing:1.7px;font-weight:900;color:#075c4d;margin-bottom:6px}.cart-item-details h2{font-size:19px;letter-spacing:-.3px;margin:0 0 5px;line-height:1.2}.cart-item-details p{font-size:13px;color:#78827e;margin:0}.item-line-total{display:block;color:#e85c22;font-size:16px;margin-top:12px}.cart-item-controls{display:flex;flex-direction:column;align-items:flex-end;gap:12px}.quantity-control{display:inline-flex;align-items:center;border:1px solid #dfe4e1;background:#fff;border-radius:12px;height:42px;overflow:hidden}.quantity-control button{width:40px;height:40px;border:0;background:#fff;color:#075c4d;font-size:20px;line-height:1;cursor:pointer}.quantity-control button:hover:not(:disabled){background:#f2f7f4}.quantity-control span{min-width:34px;text-align:center;font-weight:800;font-size:14px}.quantity-control button:disabled{opacity:.45;cursor:wait}.remove-button{border:0;background:transparent;color:#a16a57;display:flex;align-items:center;gap:5px;font-size:12px;font-weight:700;cursor:pointer;padding:2px}.remove-button:hover:not(:disabled){color:#d94f25}.remove-button:disabled{opacity:.45;cursor:wait}.order-summary{position:sticky;top:95px;background:#fff;border:1px solid #e2e4df;border-radius:20px;padding:24px;box-shadow:0 10px 30px rgba(23,35,31,.055)}.summary-top{display:flex;justify-content:space-between;align-items:center}.summary-top>span{font-size:12px;color:#7b8581}.order-summary h2{font-size:25px;letter-spacing:-.5px;margin:15px 0 23px}.summary-lines{border-bottom:1px solid #e5e6e2}.summary-lines>div,.summary-total{display:flex;justify-content:space-between;align-items:center;padding:0 0 17px;color:#6f7975;font-size:14px}.summary-lines>div+div{padding-top:4px}.summary-lines strong{color:#283731;font-size:14px}.summary-lines .included{color:#6f7975}.summary-total{padding:20px 0 18px;font-size:17px;color:#263630}.summary-total strong{font-size:22px;color:#17231f}.checkout-button{display:flex;align-items:center;justify-content:center;gap:8px;background:#075c4d;color:#fff;text-decoration:none;border-radius:13px;min-height:52px;font-size:14px;font-weight:900;box-shadow:0 7px 16px rgba(7,92,77,.16)}.checkout-button:hover{background:#064f43}.summary-note{display:flex;gap:11px;align-items:flex-start;background:#f1f6ed;border-radius:14px;padding:14px;margin-top:16px}.note-line{width:3px;min-height:34px;border-radius:3px;background:#7d9d72}.summary-note strong{font-size:12px}.summary-note p{font-size:11px;color:#718078;margin:4px 0 0;line-height:1.45}.cart-notice{margin-top:12px;padding:11px 14px;border:1px solid #efd7c9;background:#fff7f2;border-radius:11px;color:#8b5238;font-size:13px}.cart-state{max-width:620px;margin:45px auto;background:#fff;border:1px solid #e5e4df;border-radius:20px;padding:55px 30px;text-align:center;box-shadow:0 7px 22px rgba(23,35,31,.04)}.cart-state h2{font-size:24px;margin:12px 0 8px}.cart-state p{color:#747e7a;font-size:14px;margin:0 0 22px}.state-icon{width:54px;height:54px;border-radius:50%;display:grid;place-items:center;margin:0 auto;background:#fff0e8;color:#e85c22}.primary-button{display:inline-flex;align-items:center;justify-content:center;min-height:45px;padding:0 20px;border:0;border-radius:11px;background:#075c4d;color:#fff;text-decoration:none;font-size:13px;font-weight:800;cursor:pointer}
      @media(max-width:900px){.cart-grid{grid-template-columns:1fr}.order-summary{position:static}.cart-item-card{grid-template-columns:90px minmax(0,1fr);gap:15px}.cart-food-image{width:90px;height:88px}.cart-item-controls{grid-column:2;flex-direction:row;align-items:center;justify-content:space-between}.cart-page-head{align-items:flex-start}.cart-page-head h1{font-size:35px}}
      @media(max-width:560px){.tadka-cart-page{padding:22px 14px 50px}.cart-page-head{display:block;margin-bottom:20px}.continue-link{display:inline-block;margin-top:16px}.cart-item-card{grid-template-columns:74px minmax(0,1fr);padding:11px;gap:12px}.cart-food-image{width:74px;height:78px}.cart-item-details h2{font-size:16px}.item-line-total{margin-top:8px}.cart-item-controls{grid-column:1/-1;border-top:1px solid #eee;padding-top:10px}.order-summary{padding:20px}.cart-page-head h1{font-size:32px}}
    `}</style>
  </main>;
}
