'use client';

import Link from 'next/link';
import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const fallbackImage = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85';

function Icon({ name, size = 18 }) {
  const p = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'bag') return <svg {...p}><path d="M6 8h12l1 12H5L6 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/></svg>;
  if (name === 'clock') return <svg {...p}><circle cx="12" cy="12" r="8"/><path d="M12 8v5l3 2"/></svg>;
  if (name === 'truck') return <svg {...p}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.5"/><circle cx="18" cy="18" r="1.5"/></svg>;
  if (name === 'leaf') return <svg {...p}><path d="M20 4C11 4 5 8 5 15c0 3 2 5 5 5 6 0 10-6 10-16Z"/><path d="M5 19c3-5 7-8 12-10"/></svg>;
  if (name === 'trash') return <svg {...p}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>;
  return null;
}

function MenuContent() {
  const params = useSearchParams();
  const restaurantId = params.get('restaurant');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingId, setAddingId] = useState(null);
  const [cart, setCart] = useState(null);
  const [cartLoading, setCartLoading] = useState(true);
  const [updatingCartId, setUpdatingCartId] = useState(null);

  const loadCart = useCallback(async () => {
    try {
      setCartLoading(true);
      const response = await fetch(`${apiUrl}/v1/cart`, { credentials: 'include', cache: 'no-store' });
      if (response.status === 401) { setCart(null); return; }
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to load cart.');
      setCart(body?.data || null);
    } catch { setCart(null); } finally { setCartLoading(false); }
  }, []);

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return undefined; }
    const controller = new AbortController();
    async function load() {
      setLoading(true); setMessage('');
      try {
        const response = await fetch(`${apiUrl}/v1/restaurants/${restaurantId}/menu`, { signal: controller.signal, cache: 'no-store' });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load this menu.');
        setRestaurant(body?.data?.restaurant || null);
        setItems(body?.data?.items || []);
        setCategories(body?.data?.categories || []);
      } catch (error) {
        if (error.name !== 'AbortError') setMessage(error.message || 'Unable to load this menu.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    void loadCart();
    return () => controller.abort();
  }, [restaurantId, loadCart]);

  useEffect(() => {
    const refresh = () => void loadCart();
    window.addEventListener('tadka:cart-updated', refresh);
    return () => window.removeEventListener('tadka:cart-updated', refresh);
  }, [loadCart]);

  async function addToCart(itemId) {
    setAddingId(itemId); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/cart/items`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: itemId, quantity: 1 }),
      });
      const body = await response.json().catch(() => null);
      if (response.status === 401) { setMessage('Please sign in to add dishes to your bag.'); return; }
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to add this dish.');
      setCart(body?.data || null);
      window.dispatchEvent(new Event('tadka:cart-updated'));
    } catch (error) {
      setMessage(error.message || 'Unable to add this dish.');
    } finally {
      setAddingId(null);
    }
  }

  async function updateCartItem(itemId, quantity) {
    setUpdatingCartId(itemId);
    try {
      const response = await fetch(`${apiUrl}/v1/cart/items/${itemId}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quantity }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update your bag.');
      setCart(body?.data || null);
      window.dispatchEvent(new Event('tadka:cart-updated'));
    } catch (error) {
      setMessage(error.message || 'Unable to update your bag.');
    } finally {
      setUpdatingCartId(null);
    }
  }

  function findCartItem(menuItemId) {
    return cart?.items?.find((entry) => entry.menuItemId === menuItemId || entry.menuItem?.id === menuItemId || entry.menu_item_id === menuItemId) || null;
  }

  const visible = useMemo(
    () => activeCategory === 'all' ? items : items.filter((item) => item.categoryId === activeCategory),
    [activeCategory, items]
  );
  const cartCount = cart?.items?.reduce((sum, item) => sum + Number(item.quantity || 0), 0) || 0;
  const heroImage = restaurant?.imageUrl || items.find((item) => item.imageUrl)?.imageUrl || fallbackImage;

  return <main className="tadka-menu-page">
    <section className="restaurant-hero">
      <div className="restaurant-hero-inner">
        <div className="hero-content">
          <div className="restaurant-breadcrumb">{restaurant?.cuisine || 'Indian'} <span>•</span> Freshly prepared <span>•</span> Order online</div>
          <h1>{restaurant?.name || 'Restaurant menu'}</h1>
          <p>{restaurant?.description || 'Fresh Indian favourites prepared to order.'}</p>
          <div className="hero-meta">
            <span className="rating-dot">★ {restaurant?.rating || 'New'}</span>
            <span><Icon name="clock" size={16}/>25–35 min</span>
            <span><Icon name="truck" size={16}/>₹{restaurant?.deliveryFee || 0} delivery</span>
          </div>
          <div className="trust-pills"><span><Icon name="leaf" size={15}/>Quality ingredients</span><span><Icon name="leaf" size={15}/>Freshly prepared</span></div>
        </div>
        <div className="hero-photo"><img src={heroImage} alt="Restaurant food"/></div>
      </div>
    </section>

    <section className="menu-layout">
      <div className="menu-main" id="menu">
        <div className="category-row" role="tablist" aria-label="Menu categories">
          <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>Recommended</button>
          {categories.map((category) => <button key={category.id} className={activeCategory === category.id ? 'active' : ''} onClick={() => setActiveCategory(category.id)}>{category.name}</button>)}
        </div>
        <div className="section-heading">
          <div><h2>{activeCategory === 'all' ? 'Recommended for you' : categories.find((c) => c.id === activeCategory)?.name || 'Menu'}</h2><p>Popular dishes from this kitchen</p></div>
          <span>{visible.length} dishes</span>
        </div>
        {message && <div className="menu-notice">{message}</div>}
        {loading ? <div className="loading-card">Loading menu...</div> : visible.length === 0 ? <div className="empty-card"><h3>No dishes here yet.</h3><p>Try another category.</p></div> : <div className="menu-list">
          {visible.map((item, index) => {
            const cartItem = findCartItem(item.id);
            const quantity = Number(cartItem?.quantity || 0);
            return <article className="menu-item-card" key={item.id}>
              <div className="menu-item-copy">
                {index < 2 && <span className="pick-label">CHEF'S PICK</span>}
                <h3>{item.name}</h3>
                <p>{item.description || 'Freshly prepared and delivered with care.'}</p>
                <strong>₹{Number(item.price).toFixed(0)}</strong>
              </div>
              <div className="menu-item-action">
                <img src={item.imageUrl || fallbackImage} alt=""/>
                {quantity > 0 && cartItem ? <div className="menu-quantity-control" aria-label={`Quantity for ${item.name}`}>
                  <button disabled={updatingCartId === cartItem.id} onClick={() => updateCartItem(cartItem.id, Math.max(0, quantity - 1))}>−</button>
                  <span>{quantity}</span>
                  <button disabled={updatingCartId === cartItem.id} onClick={() => updateCartItem(cartItem.id, Math.min(50, quantity + 1))}>+</button>
                </div> : <button className="add-button" disabled={addingId === item.id} onClick={() => addToCart(item.id)}>{addingId === item.id ? 'Adding...' : '+ Add'}</button>}
              </div>
            </article>;
          })}
        </div>}
      </div>

      <aside className="cart-panel">
        <div className="cart-panel-header"><span>YOUR ORDER</span><span>{cartCount ? `${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Your bag'}</span></div>
        {cartLoading ? <div className="cart-empty"><p>Loading your bag...</p></div> : cart?.items?.length ? <>
          <div className="cart-items">{cart.items.map((item) => <div className="cart-item" key={item.id}>
            <img src={item.imageUrl || fallbackImage} alt=""/>
            <div className="cart-item-info"><strong>{item.name}</strong><b>₹{Number(item.price * item.quantity).toFixed(0)}</b></div>
            <div className="quantity-control"><button disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, Math.max(0, item.quantity - 1))}>−</button><span>{item.quantity}</span><button disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, Math.min(50, item.quantity + 1))}>+</button></div>
            <button className="remove-button" aria-label={`Remove ${item.name}`} disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, 0)}><Icon name="trash" size={16}/></button>
          </div>)}</div>
          <div className="cart-summary"><div><span>Item total</span><b>₹{Number(cart.subtotal || 0).toFixed(0)}</b></div><div><span>Delivery fee</span><b>₹{Number(cart.deliveryFee || 0).toFixed(0)}</b></div><div className="cart-total"><span>Total</span><b>₹{Number(cart.total || 0).toFixed(0)}</b></div></div>
          <Link href="/cart" className="checkout-button">Proceed to Checkout <span>→</span></Link>
          <div className="cart-promise"><span><Icon name="leaf" size={22}/></span><div><strong>Good food. A happier you.</strong><p>Freshly prepared. Carefully delivered.</p></div></div>
        </> : <div className="cart-empty"><div className="empty-bag"><Icon name="bag" size={24}/></div><h3>Your bag is empty</h3><p>Add your favourites from this kitchen. Your bag stays connected to checkout.</p><a href="#menu" className="browse-link">Explore menu</a></div>}
        <div className="cart-help"><div><strong>Need anything else?</strong><p>Add more items from the menu.</p></div><a href="#menu">Explore Menu</a></div>
      </aside>
    </section>

    <style jsx global>{`
      .tadka-menu-page{--green:#075c4d;--green-2:#0d6b5b;--orange:#ff6422;--ink:#17231f;--muted:#6d7974;--line:#e6e6e1;min-height:100vh;background:#fff;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;padding-bottom:55px}
      .restaurant-hero{background:#f5ecdf;border-bottom:1px solid #ebe1d3;padding:22px 24px 24px}.restaurant-hero-inner{max-width:1280px;height:300px;margin:auto;background:#faf5ed;border:1px solid #eee1d0;border-radius:24px;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) 430px;box-shadow:0 10px 28px rgba(30,45,39,.045)}.hero-content{padding:34px 44px;display:flex;flex-direction:column;justify-content:center}.restaurant-breadcrumb{font-size:13px;color:#6d7974;display:flex;gap:9px;margin-bottom:12px}.restaurant-breadcrumb span{color:#b8afa5}.hero-content h1{font-size:40px;line-height:1.05;letter-spacing:-1.4px;margin:0 0 11px}.hero-content>p{font-size:16px;color:#697671;margin:0 0 18px}.hero-meta{display:flex;gap:18px;align-items:center;flex-wrap:wrap;color:#465852;font-size:14px}.hero-meta span{display:flex;gap:6px;align-items:center}.rating-dot{color:#0a6253;font-weight:800}.trust-pills{display:flex;gap:8px;flex-wrap:wrap;margin-top:17px}.trust-pills span{display:flex;gap:6px;align-items:center;background:#fff;border:1px solid #dce7e1;border-radius:999px;padding:7px 11px;font-size:12px;color:#256656;font-weight:700}.hero-photo{height:300px}.hero-photo img{width:100%;height:100%;object-fit:cover;display:block}
      .menu-layout{max-width:1280px;margin:24px auto 0;display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:24px;align-items:start}.category-row{display:flex;gap:9px;overflow:auto;padding:2px 2px 12px;scrollbar-width:none}.category-row::-webkit-scrollbar{display:none}.category-row button{white-space:nowrap;border:1px solid #e4e4df;background:#fff;color:#263a35;border-radius:12px;padding:10px 18px;font-size:14px;cursor:pointer}.category-row button.active{background:var(--green);border-color:var(--green);color:#fff;box-shadow:0 6px 14px rgba(7,92,77,.15)}.section-heading{display:flex;justify-content:space-between;align-items:end;margin:8px 0 14px}.section-heading h2{font-size:24px;letter-spacing:-.6px;margin:0 0 4px}.section-heading p{margin:0;color:#7a8581;font-size:13px}.section-heading>span{color:#8b928f;font-size:13px}.menu-notice{margin-bottom:14px;background:#fff7f2;border:1px solid #f1d7c7;color:#8a5136;border-radius:12px;padding:11px 14px;font-size:13px}.menu-list{display:flex;flex-direction:column;gap:10px}.menu-item-card{background:#fff;border:1px solid #e5e5e0;border-radius:16px;min-height:116px;padding:11px 14px 11px 18px;display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:16px;align-items:center;box-shadow:0 3px 12px rgba(25,42,36,.03);transition:.18s}.menu-item-card:hover{border-color:#d4ddd8;box-shadow:0 7px 20px rgba(25,42,36,.06)}.pick-label{font-size:9px;letter-spacing:1.4px;font-weight:900;color:#0b6354;display:block;margin-bottom:5px}.menu-item-copy h3{font-size:18px;line-height:1.2;margin:0 0 4px}.menu-item-copy p{font-size:13px;color:#74807b;margin:0 0 8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.menu-item-copy strong{font-size:16px;color:var(--orange)}.menu-item-action{display:flex;align-items:center;justify-content:flex-end;gap:14px}.menu-item-action img{width:148px;height:92px;object-fit:cover;border-radius:13px;display:block}.add-button,.menu-quantity-control{height:48px;min-width:102px;border-radius:12px;font-weight:800;font-size:14px}.add-button{border:1px solid #ffb08e;background:#fff;color:var(--orange);cursor:pointer;padding:0 17px;text-transform:none}.add-button:hover{background:#fff7f2;border-color:#ff8d62}.add-button:disabled{opacity:.6;cursor:wait}.menu-quantity-control{display:flex;align-items:center;justify-content:space-between;border:1px solid #dfe7e2;background:#fff;overflow:hidden}.menu-quantity-control button{width:36px;height:100%;border:0;background:#f4f8f5;color:var(--green);font-size:22px;line-height:1;cursor:pointer}.menu-quantity-control button:last-child{background:#fff5ef;color:var(--orange)}.menu-quantity-control button:hover{filter:brightness(.97)}.menu-quantity-control button:disabled{opacity:.5;cursor:wait}.menu-quantity-control span{min-width:28px;text-align:center;font-size:15px;font-weight:800;color:#263a35}.loading-card,.empty-card{border:1px solid #e7e6e1;border-radius:16px;padding:30px;text-align:center;color:#74807b}.loading-card{background:#fafbf9}.empty-card h3{margin:0 0 5px;color:var(--ink)}.empty-card p{margin:0}.cart-panel{position:sticky;top:104px;max-height:calc(100vh - 122px);overflow:auto;background:#fff;border:1px solid #e4e7e3;border-radius:18px;box-shadow:0 8px 24px rgba(25,42,36,.045);scrollbar-width:thin}.cart-panel-header{height:52px;padding:0 17px;display:flex;align-items:center;justify-content:space-between;background:#f1f7f3;border-bottom:1px solid #e1ebe5;color:#0b6354}.cart-panel-header span:first-child{font-size:12px;font-weight:900;letter-spacing:1.4px}.cart-panel-header span:last-child{font-size:12px;color:#6f7b76}.cart-items{padding:6px 16px}.cart-item{display:grid;grid-template-columns:52px minmax(0,1fr) auto 18px;gap:10px;align-items:center;padding:12px 0;border-bottom:1px solid #eceeea}.cart-item>img{width:52px;height:52px;object-fit:cover;border-radius:10px}.cart-item-info{min-width:0;display:flex;flex-direction:column;gap:4px}.cart-item-info strong{font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cart-item-info b{font-size:12px;color:var(--orange)}.quantity-control{display:flex;align-items:center;height:34px;border:1px solid #dfe7e2;border-radius:9px;overflow:hidden}.quantity-control button{width:28px;height:100%;border:0;background:#fff;color:var(--green);font-size:18px;cursor:pointer}.quantity-control button:first-child{background:#f5faf7}.quantity-control span{min-width:25px;text-align:center;font-size:12px;font-weight:800}.quantity-control button:disabled{opacity:.5}.remove-button{width:18px;height:28px;padding:0;border:0;background:transparent;color:#df5630;display:grid;place-items:center;cursor:pointer}.remove-button:disabled{opacity:.5}.cart-summary{padding:10px 17px}.cart-summary>div{display:flex;justify-content:space-between;padding:7px 0;color:#66736d;font-size:13px}.cart-summary b{color:#263a35}.cart-summary .cart-total{margin-top:4px;padding-top:12px;border-top:1px solid #e7e9e5;font-size:18px;color:var(--ink)}.cart-summary .cart-total b{font-size:18px;color:var(--ink)}.checkout-button{display:flex;align-items:center;justify-content:center;margin:4px 17px 12px;height:48px;border-radius:12px;background:var(--green);color:#fff;text-decoration:none;font-size:14px;font-weight:800}.checkout-button:hover{background:var(--green-2)}.checkout-button span{margin-left:8px;font-size:18px}.cart-promise{display:flex;gap:10px;margin:0 17px 12px;padding:12px;background:#f0f7ea;border-radius:13px}.cart-promise>span{color:var(--green);display:grid;place-items:center}.cart-promise strong{font-size:12px}.cart-promise p{margin:3px 0 0;font-size:11px;color:#718078}.cart-empty{padding:32px 22px;text-align:center;color:#74807b}.empty-bag{width:48px;height:48px;margin:0 auto 12px;border-radius:50%;display:grid;place-items:center;background:#fff3ec;color:var(--orange)}.cart-empty h3{margin:0 0 6px;color:var(--ink);font-size:16px}.cart-empty p{font-size:12px;line-height:1.5;margin:0 auto 12px;max-width:240px}.browse-link{color:var(--green);font-size:12px;font-weight:800;text-decoration:none}.cart-help{border-top:1px solid #e8ebe7;padding:13px 17px;display:flex;justify-content:space-between;align-items:center;gap:10px}.cart-help strong{font-size:12px}.cart-help p{margin:3px 0 0;color:#78847e;font-size:11px}.cart-help a{flex:none;border:1px solid #ffad89;border-radius:10px;padding:8px 10px;color:var(--orange);text-decoration:none;font-size:11px;font-weight:800}
      @media(max-width:1100px){.restaurant-hero-inner{grid-template-columns:minmax(0,1fr) 380px}.menu-layout{width:calc(100% - 40px);grid-template-columns:minmax(0,1fr) 320px}.menu-item-card{grid-template-columns:minmax(0,1fr) 225px}.menu-item-action img{width:125px}}
      @media(max-width:800px){.restaurant-hero{padding:14px}.restaurant-hero-inner{height:auto;grid-template-columns:1fr}.hero-content{padding:28px 24px}.hero-photo{height:230px}.menu-layout{width:calc(100% - 28px);margin-top:18px;grid-template-columns:1fr}.cart-panel{position:static;max-height:none;order:-1}.menu-item-card{grid-template-columns:minmax(0,1fr) 180px}.menu-item-action img{width:105px;height:80px}.menu-quantity-control{min-width:74px;height:42px}.menu-quantity-control button{width:27px}}
      @media(max-width:560px){.menu-item-card{grid-template-columns:1fr;gap:10px}.menu-item-action{justify-content:space-between}.menu-item-action img{width:calc(100% - 92px);height:96px}.add-button,.menu-quantity-control{min-width:82px}.hero-content h1{font-size:32px}}
    `}</style>
  </main>;
}

export default function MenuPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading menu...</div>}><MenuContent /></Suspense>;
}
