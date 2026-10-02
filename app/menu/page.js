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

  return <main className="min-h-screen bg-tadka-bg px-4 py-7 text-tadka-ink sm:px-6">
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
        {message && <div className="mb-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{message}</div>}
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
                </div> : <button className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white transition hover:bg-tadka-orange-dark disabled:opacity-50" disabled={addingId === item.id} onClick={() => addToCart(item.id)}>{addingId === item.id ? 'Adding...' : '+ Add'}</button>}
              </div>
            </article>;
          })}
        </div>}
      </div>

      <aside className="rounded-tadka-lg border border-tadka-line bg-white p-5 shadow-tadka-sm lg:sticky lg:top-24 lg:self-start">
        <div className="cart-panel-header"><span>YOUR ORDER</span><span>{cartCount ? `${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Your bag'}</span></div>
        {cartLoading ? <div className="cart-empty"><p>Loading your bag...</p></div> : cart?.items?.length ? <>
          <div className="my-4 flex max-h-[360px] flex-col gap-3 overflow-auto">{cart.items.map((item) => <div className="flex items-center gap-3 border-b border-tadka-line pb-3" key={item.id}>
            <img src={item.imageUrl || fallbackImage} alt=""/>
            <div className="cart-item-info"><strong>{item.name}</strong><b>₹{Number(item.price * item.quantity).toFixed(0)}</b></div>
            <div className="quantity-control"><button disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, Math.max(0, item.quantity - 1))}>−</button><span>{item.quantity}</span><button disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, Math.min(50, item.quantity + 1))}>+</button></div>
            <button className="remove-button" aria-label={`Remove ${item.name}`} disabled={updatingCartId === item.id} onClick={() => updateCartItem(item.id, 0)}><Icon name="trash" size={16}/></button>
          </div>)}</div>
          <div className="border-t border-tadka-line pt-4"><div><span>Item total</span><b>₹{Number(cart.subtotal || 0).toFixed(0)}</b></div><div><span>Delivery fee</span><b>₹{Number(cart.deliveryFee || 0).toFixed(0)}</b></div><div className="cart-total"><span>Total</span><b>₹{Number(cart.total || 0).toFixed(0)}</b></div></div>
          <Link href="/cart" className="checkout-button">Proceed to Checkout <span>→</span></Link>
          <div className="cart-promise"><span><Icon name="leaf" size={22}/></span><div><strong>Good food. A happier you.</strong><p>Freshly prepared. Carefully delivered.</p></div></div>
        </> : <div className="cart-empty"><div className="empty-bag"><Icon name="bag" size={24}/></div><h3>Your bag is empty</h3><p>Add your favourites from this kitchen. Your bag stays connected to checkout.</p><a href="#menu" className="browse-link">Explore menu</a></div>}
        <div className="cart-help"><div><strong>Need anything else?</strong><p>Add more items from the menu.</p></div><a href="#menu">Explore Menu</a></div>
      </aside>
    </section>

    
  </main>;
}

export default function MenuPage() {
  return <Suspense fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading menu...</div>}><MenuContent /></Suspense>;
}
