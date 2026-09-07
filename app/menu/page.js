'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const fallbackImage = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

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

  useEffect(() => {
    if (!restaurantId) { setLoading(false); return undefined; }
    const controller = new AbortController();
    async function load() {
      setLoading(true); setMessage('');
      try {
        const response = await fetch(`${apiUrl}/v1/restaurants/${restaurantId}/menu`, { signal: controller.signal, cache: 'no-store' });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load this menu.');
        setRestaurant(body.data.restaurant); setItems(body.data.items || []); setCategories(body.data.categories || []);
      } catch (error) { if (error.name !== 'AbortError') setMessage(error.message || 'Unable to load this menu.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load();
    return () => controller.abort();
  }, [restaurantId]);

  async function addToCart(itemId) {
    setAddingId(itemId); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/cart/items`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ menuItemId: itemId, quantity: 1 }) });
      const body = await response.json().catch(() => null);
      if (response.status === 401) { setMessage('Login to add dishes to your cart.'); return; }
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to add this dish.');
      window.dispatchEvent(new Event('tadka:cart-updated')); setMessage('Added to your cart.');
    } catch (error) { setMessage(error.message || 'Unable to add this dish.'); }
    finally { setAddingId(null); }
  }

  const visibleItems = activeCategory === 'all' ? items : items.filter((item) => item.categoryId === activeCategory);
  let menuContent;
  if (!restaurantId) menuContent = <div className="card">Select a restaurant first.</div>;
  else if (loading) menuContent = <div className="card">Loading menu…</div>;
  else if (message && !items.length) menuContent = <div className="card empty-state"><h3>We couldn’t load this menu.</h3><p className="muted">{message}</p><Link className="primary" href="/restaurants">Back to restaurants</Link></div>;
  else menuContent = <><div className="chip-row" style={{ paddingTop: 0 }}><button type="button" className={`food-chip ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>Recommended</button>{categories.map((category) => <button type="button" className={`food-chip ${activeCategory === category.id ? 'active' : ''}`} key={category.id} onClick={() => setActiveCategory(category.id)}>{category.name}</button>)}</div>{visibleItems.length === 0 ? <div className="card empty-state"><h3>No dishes in this category.</h3><p className="muted">Try another category.</p></div> : <div>{visibleItems.map((item) => <article className="food-row" key={item.id}><div className="food-row-copy"><span className="eyebrow">Chef selection</span><h3>{item.name}</h3><p>{item.description || 'Freshly prepared and delivered with care.'}</p><div className="dish-foot"><span className="price">₹{Number(item.price).toFixed(0)}</span><button type="button" className="add-mini" disabled={addingId === item.id} onClick={() => addToCart(item.id)}>{addingId === item.id ? 'ADDING…' : '+ ADD'}</button></div></div><div className="food-row-image" style={{ backgroundImage: `url(${item.imageUrl || fallbackImage})` }} /></article>)}</div>}</>;

  return <main>
    <section className="restaurant-hero"><div className="restaurant-hero-inner"><div className="eyebrow">{restaurant?.cuisine || 'Restaurant menu'}</div><h1>{restaurant?.name || 'Menu'}</h1><p className="muted" style={{ maxWidth: 700 }}>{restaurant?.description || 'Explore the kitchen menu and add your favourites to your Tadka cart.'}</p><div className="meta"><span>★ {restaurant?.rating || 'New'}</span><span>• Delivery time varies</span><span>• ₹{restaurant?.deliveryFee || 0} delivery</span></div>{message && <div className="notice">{message}</div>}</div></section>
    <section className="page"><div className="menu-shell"><div>{menuContent}</div><aside className="menu-sidebar"><div className="card"><span className="eyebrow">Your order</span><h3 style={{ margin: '7px 0' }}>Ready when you are.</h3><p className="muted">Add dishes from this kitchen and continue to checkout.</p><Link className="primary full" href="/cart">View cart <span className="material-symbols-outlined">arrow_forward</span></Link></div></aside></div></section>
  </main>;
}

export default function Menu() { return <Suspense fallback={<main><section className="page"><div className="card">Loading menu…</div></section></main>}><MenuContent /></Suspense>; }
