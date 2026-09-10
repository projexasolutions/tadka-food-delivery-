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

  return <main className="ref-page"><section className="ref-wrap ref-section"><div className="ref-head"><div><div className="ref-greeting">DISCOVER TADKA</div><h1>{query ? `Results for “${query}”` : cuisine ? `${cuisine} kitchens` : 'Find your next favourite.'}</h1></div><Link href="/cart">Cart →</Link></div><div className="ref-cats"><button className={`ref-cat ${filter==='all'?'active':''}`} onClick={()=>setFilter('all')}>All</button><button className={`ref-cat ${filter==='rating'?'active':''}`} onClick={()=>setFilter('rating')}>4.0+ Rated</button><button className={`ref-cat ${filter==='offers'?'active':''}`} onClick={()=>setFilter('offers')}>Offers</button></div>{error&&<div className="notice">{error}</div>}{loading?<div className="card">Loading kitchens…</div>:restaurants.length===0?<div className="card empty-state"><h3>No matching kitchens.</h3><p className="muted">Try another search or clear the filters.</p><Link className="ref-primary" href="/restaurants">Show all restaurants</Link></div>:<div className="ref-restaurants">{restaurants.map((restaurant,i)=><Link className="ref-restaurant" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id}><div className="ref-restaurant-img" style={{backgroundImage:`url(${restaurant.imageUrl||fallbackImage})`}}/><div className="ref-restaurant-body"><div className="ref-greeting">{i<3?'POPULAR KITCHEN':'TADKA KITCHEN'}</div><h3>{restaurant.name}</h3><p>{restaurant.cuisine||restaurant.description||'Indian food & beverages'}</p><div className="ref-meta"><span className="ref-rating">★ {restaurant.rating||'New'}</span><span>25–35 min</span><span>₹{restaurant.deliveryFee||0} delivery</span></div></div></Link>)}</div>}</section></main>;
}

export default function Restaurants(){return <Suspense fallback={<main className="ref-page"><section className="ref-wrap ref-section"><div className="card">Loading kitchens…</div></section></main>}><RestaurantContent/></Suspense>}
