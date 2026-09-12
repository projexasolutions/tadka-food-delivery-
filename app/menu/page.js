'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const fallbackImage = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=85';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function Icon({ name, size = 18 }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true };
  if (name === 'search') return <svg {...common}><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>;
  if (name === 'pin') return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></svg>;
  if (name === 'bag') return <svg {...common}><path d="M6 8h12l1 12H5L6 8Z" /><path d="M9 8V6a3 3 0 0 1 6 0v2" /></svg>;
  if (name === 'trash') return <svg {...common}><path d="M4 7h16" /><path d="M10 11v6M14 11v6" /><path d="M6 7l1 13h10l1-13M9 7V4h6v3" /></svg>;
  if (name === 'clock') return <svg {...common}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2" /></svg>;
  if (name === 'truck') return <svg {...common}><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="1.5" /><circle cx="18" cy="18" r="1.5" /></svg>;
  if (name === 'leaf') return <svg {...common}><path d="M20 4C11 4 5 8 5 15c0 2 1 4 3 5 1-5 4-8 9-10-3 3-5 6-6 10 5-1 9-5 9-16Z" /></svg>;
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

  async function loadCart() {
    try {
      setCartLoading(true);
      const response = await fetch(`${apiUrl}/v1/cart`, { credentials: 'include', cache: 'no-store' });
      if (response.status === 401) { setCart(null); return; }
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to load cart.');
      setCart(body.data);
    } catch (error) {
      setCart(null);
      if (error?.message) setMessage(error.message);
    } finally {
      setCartLoading(false);
    }
  }

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return undefined; }
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setMessage('');
      try {
        const response = await fetch(`${apiUrl}/v1/restaurants/${restaurantId}/menu`, { signal: controller.signal, cache: 'no-store' });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load this menu.');
        setRestaurant(body.data.restaurant);
        setItems(body.data.items || []);
        setCategories(body.data.categories || []);
      } catch (error) {
        if (error.name !== 'AbortError') setMessage(error.message || 'Unable to load this menu.');
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    void loadCart();
    return () => controller.abort();
  }, [restaurantId]);

  async function addToCart(itemId) {
    setAddingId(itemId);
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/cart/items`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menuItemId: itemId, quantity: 1 }),
      });
      const body = await response.json().catch(() => null);
      if (response.status === 401) { setMessage('Please sign in to add dishes to your bag.'); return; }
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to add this dish.');
      setCart(body.data);
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
      setCart(body.data);
      window.dispatchEvent(new Event('tadka:cart-updated'));
    } catch (error) {
      setMessage(error.message || 'Unable to update your bag.');
    } finally {
      setUpdatingCartId(null);
    }
  }

  const visible = useMemo(() => activeCategory === 'all' ? items : items.filter((item) => item.categoryId === activeCategory), [activeCategory, items]);
  const cartCount = cart?.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const heroImage = restaurant?.imageUrl || items[0]?.imageUrl || fallbackImage;

  return (
    <main className="tadka-menu-page">
      <header className="tadka-menu-header">
        <div className="tadka-menu-header-inner">
          <Link href="/" className="tadka-brand" aria-label="Tadka home">
            <span className="tadka-brand-mark">T</span>
            <span><strong>TADKA</strong><small>FOOD DELIVERED HAPPINESS</small></span>
          </Link>
          <button className="delivery-location" type="button"><span className="delivery-pin"><Icon name="pin" size={17} /></span><span><small>DELIVER TO</small><b>Home - 411057</b></span><span className="chevron">⌄</span></button>
          <div className="menu-search"><Icon name="search" size={19} /><input aria-label="Search" placeholder="Search for dishes, restaurants or cuisines..." /></div>
          <nav className="menu-nav"><Link href="/">Home</Link><Link href="/restaurants">Explore</Link><Link href="/offers">Offers</Link><Link href="/restaurants">Categories</Link><Link href="/account">Account</Link></nav>
          <Link href="/cart" className="bag-button"><Icon name="bag" size={19} />Bag{cartCount ? ` (${cartCount})` : ''}</Link>
        </div>
      </header>

      <section className="restaurant-hero">
        <div className="restaurant-hero-inner">
          <div className="hero-content">
            <div className="restaurant-breadcrumb">{restaurant?.cuisine || 'Indian'} <span>•</span> Freshly prepared <span>•</span> Order online</div>
            <h1>{restaurant?.name || 'Restaurant menu'}</h1>
            <p>{restaurant?.description || 'Fresh Indian favourites prepared to order.'}</p>
            <div className="hero-meta">
              <span className="rating-dot">{restaurant?.rating || 'New'}</span>
              <span><Icon name="clock" size={16} />25–35 min</span>
              <span><Icon name="truck" size={16} />₹{restaurant?.deliveryFee || 0} delivery</span>
            </div>
            <div className="trust-pills"><span><Icon name="leaf" size={15} />Quality ingredients</span><span><Icon name="leaf" size={15} />Freshly prepared</span></div>
          </div>
          <div className="hero-photo" style={{ backgroundImage: `url(${heroImage})` }} aria-label="Restaurant food" />
        </div>
      </section>

      <section className="menu-layout">
        <div className="menu-main">
          <div className="category-row" role="tablist" aria-label="Menu categories">
            <button className={activeCategory === 'all' ? 'active' : ''} onClick={() => setActiveCategory('all')}>Recommended</button>
            {categories.map((category) => <button key={category.id} className={activeCategory === category.id ? 'active' : ''} onClick={() => setActiveCategory(category.id)}>{category.name}</button>)}
          </div>

          <div className="section-heading"><div><h2>Recommended for you</h2><p>Popular dishes from this kitchen</p></div><span>{visible.length} dishes</span></div>

          {message && <div className="menu-notice">{message}</div>}
          {loading ? <div className="loading-card">Loading menu...</div> : visible.length === 0 ? <div className="empty-card"><h3>No dishes here yet.</h3><p>Try another category.</p></div> : (
            <div className="menu-list">
              {visible.map((item, index) => (
                <article className="menu-item-card" key={item.id}>
                  <div className="menu-item-copy">
                    {index < 2 && <span className="pick-label">CHEF'S PICK</span>}
                    <h3>{item.name}</h3>
                    <p>{item.description || 'Freshly prepared and delivered with care.'}</p>
                    <strong className="item-price">₹{Number(item.price).toFixed(0)}</strong>
                  </div>
                  <div className="menu-item-action"><img src={item.imageUrl || fallbackImage} alt="" /><button className="add-button" disabled={addingId === item.id} onClick={() => addToCart(item.id)}>{addingId === item.id ? 'ADDING...' : '+ ADD'}</button></div>
                </article>
              ))}
            </div>
          )}
        </div>

        <aside className="cart-panel">
          <div className="cart-panel-header"><span>YOUR ORDER</span><span>{cartCount ? `${cartCount} items` : 'Your bag'}</span></div>
          {cartLoading ? <div className="cart-empty"><p>Loading your bag...</p></div> : cart?.items?.length ? (
            <>
              <div className="cart-items">
                {cart.items.map((item) => (
                  <div className="cart-item" key={item.id}>
                    <img src={item.imageUrl || fallbackImage} alt="" />
                    <div className="cart-item-info"><strong>{item.name}</strong><b>₹{Number(item.price * item.quantity).toFixed(0)}</b></div>
                    <div className="quantity-control"><button disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, Math.max(0, item.quantity - 1))}>−</button><span>{item.quantity}</span><button disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, Math.min(50, item.quantity + 1))}>+</button></div>
                    <button className="remove-button" aria-label={`Remove ${item.name}`} disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, 0)}><Icon name="trash" size={17} /></button>
                  </div>
                ))}
              </div>
              <div className="cart-summary"><div><span>Item total</span><b>₹{Number(cart.subtotal).toFixed(0)}</b></div><div><span>Delivery fee</span><b>₹{Number(cart.deliveryFee).toFixed(0)}</b></div><div className="cart-total"><span>Total</span><b>₹{Number(cart.total).toFixed(0)}</b></div></div>
              <Link href="/cart" className="checkout-button">Proceed to Checkout <span>→</span></Link>
              <div className="cart-promise"><span><Icon name="leaf" size={22} /></span><div><strong>Good food. A happier you.</strong><p>Freshly prepared. Carefully delivered.</p></div></div>
            </>
          ) : (
            <div className="cart-empty"><div className="empty-bag"><Icon name="bag" size={24} /></div><h3>Your bag is empty</h3><p>Add your favourites from this kitchen. Your bag stays connected to checkout.</p><Link href="#menu" className="browse-link">Explore menu</Link></div>
          )}
          <div className="cart-help"><div><strong>Need anything else?</strong><p>Add more items from the menu.</p></div><a href="#menu" onClick={(event) => { event.preventDefault(); document.querySelector('.menu-list')?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }}>Explore Menu</a></div>
        </aside>
      </section>

      <style jsx global>{`
        .tadka-menu-page{--green:#075c4d;--green-dark:#06483d;--orange:#ff6422;--ink:#17231f;--muted:#68736f;--line:#e8e8e3;min-height:100vh;background:#fff;color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
        .tadka-menu-header{position:sticky;top:0;z-index:30;background:rgba(255,255,255,.96);backdrop-filter:blur(12px);border-bottom:1px solid #eee}
        .tadka-menu-header-inner{max-width:1280px;margin:auto;height:82px;padding:0 28px;display:flex;align-items:center;gap:22px}
        .tadka-brand{display:flex;align-items:center;gap:9px;text-decoration:none;color:#2b302e;min-width:190px}.tadka-brand-mark{width:35px;height:35px;border-radius:50% 45% 50% 45%;background:var(--orange);display:grid;place-items:center;color:#fff;font-size:21px;font-weight:900;transform:rotate(-12deg)}.tadka-brand strong{display:block;font-size:23px;line-height:20px;letter-spacing:-1px}.tadka-brand small{display:block;color:var(--orange);font-size:6px;font-weight:800;letter-spacing:.8px;margin-top:4px}
        .delivery-location{border:1px solid #e6e5df;background:#fff;border-radius:15px;padding:9px 12px;display:flex;align-items:center;gap:9px;min-width:195px;text-align:left;color:var(--ink);cursor:pointer}.delivery-location small{display:block;font-size:8px;color:#8b8e89;font-weight:800;letter-spacing:.7px}.delivery-location b{display:block;font-size:12px;margin-top:2px}.delivery-pin{color:var(--orange);display:grid;place-items:center}.chevron{margin-left:auto;color:var(--green);font-size:18px}
        .menu-search{height:48px;border:1px solid #e5e4df;background:#fafaf8;border-radius:25px;display:flex;align-items:center;gap:10px;padding:0 17px;flex:1;min-width:180px;color:var(--green)}.menu-search input{border:0;outline:0;background:transparent;width:100%;font-size:13px;color:var(--ink)}.menu-search input::placeholder{color:#858b87}
        .menu-nav{display:flex;align-items:center;gap:25px;white-space:nowrap}.menu-nav a{color:#18201d;text-decoration:none;font-size:13px;font-weight:700}.menu-nav a:hover{color:var(--green)}
        .bag-button{display:flex;align-items:center;gap:8px;background:var(--orange);color:#fff;text-decoration:none;border-radius:15px;padding:13px 18px;font-size:14px;font-weight:800;box-shadow:0 8px 22px rgba(255,100,34,.18);white-space:nowrap}
        .restaurant-hero{padding:14px 0 20px;background:#f6eee3}.restaurant-hero-inner{max-width:1280px;margin:auto;height:245px;display:grid;grid-template-columns:1.05fr .95fr;border-radius:20px;overflow:hidden;background:#f8f1e8}.hero-content{padding:31px 42px;display:flex;flex-direction:column;justify-content:center}.restaurant-breadcrumb{font-size:12px;color:#66706b;margin-bottom:10px}.restaurant-breadcrumb span{margin:0 7px;color:#9b9d98}.hero-content h1{font-size:39px;line-height:1.08;letter-spacing:-1.5px;margin:0 0 10px}.hero-content>p{font-size:16px;color:#69726e;margin:0 0 18px}.hero-meta{display:flex;align-items:center;gap:17px;color:#46534e;font-size:13px}.hero-meta>span{display:flex;align-items:center;gap:6px}.rating-dot{font-weight:800;color:var(--green)}.trust-pills{display:flex;gap:8px;margin-top:18px}.trust-pills span{display:flex;align-items:center;gap:6px;border:1px solid #dbe5df;background:rgba(255,255,255,.7);padding:7px 10px;border-radius:18px;color:var(--green);font-size:10px;font-weight:700}.hero-photo{background-size:cover;background-position:center;position:relative}.hero-photo:after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,rgba(246,238,227,.7),rgba(246,238,227,0) 35%)}
        .menu-layout{max-width:1280px;margin:0 auto;padding:25px 0 60px;display:grid;grid-template-columns:minmax(0,1fr) 350px;gap:28px}.menu-main{min-width:0}.category-row{display:flex;gap:10px;overflow:auto;padding:2px 0 18px;scrollbar-width:none}.category-row::-webkit-scrollbar{display:none}.category-row button{flex:0 0 auto;border:1px solid #e5e5df;background:#fff;color:#202a26;border-radius:16px;padding:11px 21px;font-size:13px;cursor:pointer;transition:.2s}.category-row button.active{background:var(--green);border-color:var(--green);color:#fff;font-weight:750;box-shadow:0 7px 18px rgba(7,92,77,.14)}
        .section-heading{display:flex;align-items:end;justify-content:space-between;margin:8px 0 16px}.section-heading h2{margin:0;font-size:23px;letter-spacing:-.5px}.section-heading p{margin:4px 0 0;color:#77807c;font-size:13px}.section-heading>span{color:#8b918d;font-size:12px}
        .menu-list{display:flex;flex-direction:column;gap:10px}.menu-item-card{min-height:128px;border:1px solid var(--line);border-radius:17px;padding:14px 16px 14px 18px;display:flex;align-items:center;justify-content:space-between;gap:20px;background:#fff;transition:.18s;box-shadow:0 2px 8px rgba(24,35,31,.025)}.menu-item-card:hover{border-color:#d7ddd8;box-shadow:0 7px 22px rgba(24,35,31,.06);transform:translateY(-1px)}.menu-item-copy{min-width:0}.pick-label{display:block;font-size:9px;letter-spacing:1.5px;color:var(--green);font-weight:850;margin-bottom:5px}.menu-item-copy h3{font-size:17px;margin:0 0 5px}.menu-item-copy p{margin:0 0 9px;color:#707975;font-size:12px;max-width:560px}.item-price{font-size:17px;color:var(--orange)}.menu-item-action{display:flex;align-items:center;gap:16px;flex:0 0 auto}.menu-item-action img{width:174px;height:96px;object-fit:cover;border-radius:13px}.add-button{border:1px solid #ffcbb7;background:#fff;border-radius:12px;padding:10px 17px;color:var(--orange);font-size:12px;font-weight:850;cursor:pointer;white-space:nowrap}.add-button:hover{background:#fff7f2}.add-button:disabled{opacity:.55;cursor:wait}
        .menu-notice{margin:0 0 15px;border:1px solid #f2d3c5;background:#fff7f2;color:#8a4327;border-radius:12px;padding:11px 14px;font-size:12px}.loading-card,.empty-card{border:1px solid var(--line);border-radius:16px;padding:35px;background:#fff;color:#6d7672}.empty-card h3{margin:0 0 5px;color:var(--ink)}.empty-card p{margin:0}
        .cart-panel{border:1px solid #e5e6e1;border-radius:20px;background:#fff;align-self:start;position:sticky;top:104px;overflow:hidden;box-shadow:0 8px 30px rgba(25,40,34,.05)}.cart-panel-header{height:57px;background:#f1f7f3;padding:0 20px;display:flex;align-items:center;justify-content:space-between;color:var(--green);font-size:12px;font-weight:850;letter-spacing:1.4px}.cart-panel-header span:last-child{font-size:11px;letter-spacing:0;color:#6d7772;font-weight:600}.cart-items{padding:8px 19px 2px}.cart-item{display:grid;grid-template-columns:52px minmax(0,1fr) auto auto;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #f0f0ec}.cart-item img{width:52px;height:52px;border-radius:11px;object-fit:cover}.cart-item-info{min-width:0}.cart-item-info strong{display:block;font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cart-item-info b{display:block;color:var(--orange);font-size:12px;margin-top:5px}.quantity-control{display:flex;align-items:center;border:1px solid #e2e6e2;border-radius:10px;height:34px;overflow:hidden}.quantity-control button{border:0;background:#fafcfb;color:var(--green);font-size:18px;width:29px;height:100%;cursor:pointer}.quantity-control span{min-width:23px;text-align:center;font-size:12px;font-weight:700}.remove-button{border:0;background:none;color:#e33c32;padding:5px;cursor:pointer}.remove-button:disabled{opacity:.4}.cart-summary{padding:13px 19px 7px}.cart-summary>div{display:flex;justify-content:space-between;padding:5px 0;font-size:13px;color:#5e6863}.cart-summary b{color:#2b332f}.cart-total{border-top:1px solid #e6e8e4;margin-top:7px;padding-top:13px!important;font-size:17px!important;font-weight:850;color:var(--ink)!important}.cart-total b{font-size:19px;color:var(--ink)}.checkout-button{display:flex;justify-content:space-between;align-items:center;margin:7px 19px 13px;padding:15px 17px;background:var(--green);border-radius:13px;color:#fff;text-decoration:none;font-size:13px;font-weight:800}.checkout-button:hover{background:var(--green-dark)}.cart-promise{margin:0 19px 18px;padding:12px;background:#f1f7eb;border-radius:13px;display:flex;gap:10px;align-items:center}.cart-promise>span{width:38px;height:38px;border-radius:50%;background:#dcebd7;color:var(--green);display:grid;place-items:center}.cart-promise strong{font-size:12px}.cart-promise p{margin:3px 0 0;color:#758079;font-size:10px}.cart-empty{padding:36px 24px;text-align:center}.empty-bag{width:48px;height:48px;margin:0 auto 12px;border-radius:50%;background:#fff1e9;color:var(--orange);display:grid;place-items:center}.cart-empty h3{font-size:16px;margin:0 0 7px}.cart-empty p{font-size:12px;color:#77807b;line-height:1.5;margin:0 auto 14px;max-width:250px}.browse-link{display:inline-block;color:var(--green);font-size:12px;font-weight:800;text-decoration:none}.cart-help{margin:0 12px 12px;padding:14px;border:1px solid #e9ebe7;border-radius:15px;display:flex;align-items:center;justify-content:space-between;gap:10px}.cart-help strong{font-size:12px}.cart-help p{margin:3px 0 0;color:#7c8580;font-size:10px}.cart-help a{border:1px solid #ffc7b0;color:var(--orange);border-radius:10px;padding:9px 11px;text-decoration:none;font-size:10px;font-weight:800;white-space:nowrap}
        @media(max-width:1100px){.tadka-menu-header-inner{gap:12px;padding:0 18px}.tadka-brand{min-width:auto}.delivery-location{min-width:170px}.menu-nav{gap:14px}.menu-layout{padding-left:18px;padding-right:18px;grid-template-columns:minmax(0,1fr) 320px}.restaurant-hero-inner{margin:0 18px}.menu-item-action img{width:145px}}
        @media(max-width:850px){.menu-nav{display:none}.tadka-menu-header-inner{height:72px}.menu-layout{grid-template-columns:1fr}.cart-panel{position:relative;top:auto}.restaurant-hero-inner{height:auto;grid-template-columns:1fr}.hero-photo{height:180px;order:-1}.hero-content{padding:25px}.hero-content h1{font-size:31px}.menu-item-card{align-items:flex-start}.menu-item-action{flex-direction:column-reverse;gap:8px}.menu-item-action img{width:125px;height:90px}.bag-button{padding:11px 13px}.delivery-location{display:none}}
        @media(max-width:560px){.tadka-menu-header-inner{padding:0 12px}.tadka-brand strong{font-size:19px}.tadka-brand-mark{width:30px;height:30px}.menu-search{height:42px}.menu-layout{padding:15px 12px 40px}.restaurant-hero{padding:8px 0 12px}.restaurant-hero-inner{margin:0 12px;border-radius:16px}.hero-content{padding:21px}.hero-content h1{font-size:27px}.hero-meta{gap:10px;font-size:11px;flex-wrap:wrap}.trust-pills{display:none}.menu-item-card{padding:12px;gap:8px}.menu-item-action img{width:105px;height:78px}.add-button{padding:8px 12px}.section-heading h2{font-size:20px}.cart-item{grid-template-columns:48px minmax(0,1fr) auto}.cart-item .remove-button{display:none}.quantity-control{grid-column:2 / span 2;justify-self:start;margin-top:-4px}.cart-item-info b{margin-bottom:3px}}
      `}</style>
    </main>
  );
}

export default function Menu() {
  return <Suspense fallback={<main className="tadka-menu-page"><div className="loading-card" style={{ margin: 40 }}>Loading menu...</div></main>}><MenuContent /></Suspense>;
}
