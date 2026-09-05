'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const fallbackImage = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80';

export default function Menu() {
  const params = useSearchParams();
  const restaurantId = params.get('restaurant');
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [restaurant, setRestaurant] = useState(null);
  const [activeCategory, setActiveCategory] = useState('all');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    if (!restaurantId) return;
    async function load() {
      const [{ data: r, error: restaurantError }, { data: m, error: menuError }, { data: c }] = await Promise.all([
        supabase.from('restaurants').select('id,name,cuisine,description,rating,delivery_fee,image_url').eq('id', restaurantId).single(),
        supabase.from('menu_items').select('id,name,description,price,image_url,category_id').eq('restaurant_id', restaurantId).eq('is_available', true).order('created_at'),
        supabase.from('categories').select('id,name').or(`restaurant_id.eq.${restaurantId},restaurant_id.is.null`).order('name')
      ]);
      if (restaurantError) setMessage(restaurantError.message);
      if (menuError) setMessage(menuError.message);
      setRestaurant(r); setItems(m || []); setCategories(c || []);
    }
    load();
  }, [restaurantId]);

  const visibleItems = useMemo(() => activeCategory === 'all' ? items : items.filter(item => item.category_id === activeCategory), [items, activeCategory]);

  async function addToCart(item) {
    setBusy(item.id); setMessage('');
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setMessage('Please login first to add items to your cart.'); setBusy(null); return; }
    let { data: cart, error: cartError } = await supabase.from('carts').select('id,restaurant_id').eq('user_id', auth.user.id).maybeSingle();
    if (cartError) { setMessage(cartError.message); setBusy(null); return; }
    if (!cart) {
      const result = await supabase.from('carts').insert({ user_id: auth.user.id, restaurant_id: restaurantId }).select('id,restaurant_id').single();
      if (result.error) { setMessage(result.error.message); setBusy(null); return; }
      cart = result.data;
    } else if (cart.restaurant_id && cart.restaurant_id !== restaurantId) {
      const cleared = await supabase.from('cart_items').delete().eq('cart_id', cart.id);
      if (cleared.error) { setMessage(cleared.error.message); setBusy(null); return; }
      const updated = await supabase.from('carts').update({ restaurant_id: restaurantId, updated_at: new Date().toISOString() }).eq('id', cart.id);
      if (updated.error) { setMessage(updated.error.message); setBusy(null); return; }
    }
    const { data: existing, error: existingError } = await supabase.from('cart_items').select('id,quantity').eq('cart_id', cart.id).eq('menu_item_id', item.id).maybeSingle();
    if (existingError) { setMessage(existingError.message); setBusy(null); return; }
    const result = existing
      ? await supabase.from('cart_items').update({ quantity: existing.quantity + 1 }).eq('id', existing.id)
      : await supabase.from('cart_items').insert({ cart_id: cart.id, menu_item_id: item.id, quantity: 1 });
    if (result.error) setMessage(result.error.message); else { setMessage(`${item.name} added to cart.`); window.dispatchEvent(new Event('tadka:cart-updated')); }
    setBusy(null);
  }

  return <main>
    <section className="restaurant-hero"><div className="restaurant-hero-inner"><div className="eyebrow">{restaurant?.cuisine || 'Restaurant menu'}</div><h1>{restaurant?.name || 'Menu'}</h1><p className="muted" style={{maxWidth:700}}>{restaurant?.description || 'Explore the kitchen menu and add your favourites to your Tadka cart.'}</p><div className="meta"><span>★ {restaurant?.rating || 'New'}</span><span>• 25–35 min</span><span>• ₹{restaurant?.delivery_fee || 0} delivery</span></div>{message && <div className="notice">{message}</div>}</div></section>
    <section className="page"><div className="menu-shell"><div>
      <div className="chip-row" style={{paddingTop:0}}>
        <button type="button" className={`food-chip ${activeCategory==='all'?'active':''}`} onClick={()=>setActiveCategory('all')}>Recommended</button>
        {categories.map(c=><button type="button" className={`food-chip ${activeCategory===c.id?'active':''}`} key={c.id} onClick={()=>setActiveCategory(c.id)}>{c.name}</button>)}
      </div>
      {!restaurantId ? <div className="card">Select a restaurant first.</div> : visibleItems.length===0 ? <div className="card empty-state"><h3>No dishes in this category.</h3><p className="muted">Try another category.</p></div> : <div>{visibleItems.map(item=><article className="food-row" key={item.id}><div className="food-row-copy"><span className="eyebrow">Chef selection</span><h3>{item.name}</h3><p>{item.description || 'Freshly prepared and delivered with care.'}</p><div className="dish-foot"><span className="price">₹{Number(item.price).toFixed(0)}</span><button type="button" className="add-mini" disabled={busy===item.id} onClick={()=>addToCart(item)}>{busy===item.id?'ADDING…':'+ ADD'}</button></div></div><div className="food-row-image" style={{backgroundImage:`url(${item.image_url || fallbackImage})`}} /></article>)}</div>}
    </div><aside className="menu-sidebar"><div className="card"><span className="eyebrow">Your order</span><h3 style={{margin:'7px 0'}}>Ready when you are.</h3><p className="muted">Add dishes from this kitchen and continue to checkout.</p><Link className="primary full" href="/cart">View cart <span className="material-symbols-outlined">arrow_forward</span></Link></div></aside></div></section>
  </main>;
}
