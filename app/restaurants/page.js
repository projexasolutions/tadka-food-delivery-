'use client';

import Link from 'next/link';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const fallbackImage = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80';
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function RestaurantContent() {
  const params = useSearchParams();
  const [restaurants, setRestaurants] = useState([]); const [loading, setLoading] = useState(true); const [error, setError] = useState('');
  const requestedFilter = params.get('filter'); const [filter, setFilter] = useState(['rating', 'offers'].includes(requestedFilter) ? requestedFilter : 'all');
  const query = (params.get('q') || '').trim(); const cuisine = (params.get('cuisine') || '').trim();

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true); setError('');
      try {
        const search = new URLSearchParams(); if (query) search.set('q', query); if (cuisine) search.set('cuisine', cuisine); if (filter !== 'all') search.set('filter', filter);
        const response = await fetch(`${apiUrl}/v1/restaurants?${search.toString()}`, { signal: controller.signal, cache: 'no-store' });
        const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error?.message || 'Unable to load restaurants.'); setRestaurants(body.data || []);
      } catch (fetchError) { if (fetchError.name !== 'AbortError') setError(fetchError.message || 'Unable to load restaurants.'); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    }
    void load(); return () => controller.abort();
  }, [query, cuisine, filter]);

  return <main className="page">
    <div className="page-head"><div><span className="eyebrow">DISCOVER</span><h1>{query ? `Search results for “${query}”` : cuisine ? `${cuisine} kitchens` : 'Restaurants worth ordering from.'}</h1><p>Fresh kitchens, familiar comfort and new favourites — powered by your live Tadka catalogue.</p></div><Link className="btn primary" href="/cart"><span className="material-symbols-outlined">shopping_bag</span> Cart</Link></div>
    <div className="filter-inner" style={{padding:'10px 0 20px',width:'100%'}}>{[['all','All'],['rating','Rating 4.0+'],['offers','Free delivery']].map(([value,label])=><button type="button" className={`filter-chip ${filter===value?'active':''}`} key={value} onClick={()=>setFilter(value)}>{label}</button>)}</div>
    {error && <div className="notice">{error}</div>}
    {loading ? <div className="card">Loading kitchens…</div> : restaurants.length === 0 ? <div className="card empty-state"><span className="material-symbols-outlined" style={{fontSize:36}}>search_off</span><h3>No matching kitchens.</h3><p className="muted">Try another search or clear the filters.</p><Link className="primary" href="/restaurants">Show all restaurants</Link></div> : <div className="restaurantGrid">{restaurants.map((restaurant,i)=><Link className="restaurant" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id}><div className="restaurantImage" style={{backgroundImage:`url(${restaurant.imageUrl || fallbackImage})`}} /><div className="restaurantBody"><div className="row"><span className="eyebrow">{i<3?'Top rated':'Kitchen'}</span><span className="status success">Open</span></div><h3>{restaurant.name}</h3><p>{restaurant.cuisine || restaurant.description || 'Food & beverages'}</p><div className="meta"><span>★ {restaurant.rating || 'New'}</span><span>• Delivery time varies</span><span>• ₹{restaurant.deliveryFee || 0} delivery</span></div></div></Link>)}</div>}
  </main>;
}

export default function Restaurants() { return <Suspense fallback={<main className="page"><div className="card">Loading kitchens…</div></main>}><RestaurantContent /></Suspense>; }
