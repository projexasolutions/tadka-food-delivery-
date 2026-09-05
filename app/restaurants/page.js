'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const fallbackImage = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80';

export default function Restaurants() {
  const params = useSearchParams();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState(params.get('filter') || 'all');
  const query = (params.get('q') || '').trim().toLowerCase();
  const cuisine = (params.get('cuisine') || '').trim().toLowerCase();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true); setError('');
      const { data, error: fetchError } = await supabase.from('restaurants')
        .select('id,name,description,cuisine,rating,delivery_fee,image_url,is_open')
        .eq('is_open', true).order('rating', { ascending: false });
      if (!mounted) return;
      if (fetchError) setError(fetchError.message); else setRestaurants(data || []);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  const visible = useMemo(() => restaurants.filter(r => {
    const text = `${r.name || ''} ${r.cuisine || ''} ${r.description || ''}`.toLowerCase();
    if (query && !text.includes(query)) return false;
    if (cuisine && !text.includes(cuisine)) return false;
    if (filter === 'rating' && Number(r.rating || 0) < 4) return false;
    if (filter === 'veg' && !text.includes('veg')) return false;
    if (filter === 'fast' && Number(r.delivery_fee || 999) > 39) return false;
    if (filter === 'offers' && Number(r.delivery_fee || 0) !== 0) return false;
    return true;
  }), [restaurants, query, cuisine, filter]);

  function choose(next) { setFilter(next); }

  return <main className="page">
    <div className="page-head"><div><span className="eyebrow">DISCOVER</span><h1>{query ? `Search results for “${query}”` : cuisine ? `${params.get('cuisine')} kitchens` : 'Restaurants worth ordering from.'}</h1><p>Fresh kitchens, familiar comfort and new favourites — powered by your live Tadka catalogue.</p></div><Link className="btn primary" href="/cart"><span className="material-symbols-outlined">shopping_bag</span> Cart</Link></div>
    <div className="filter-inner" style={{padding:'10px 0 20px',width:'100%'}}>{[['all','All'],['veg','Pure Veg'],['rating','Rating 4.0+'],['fast','Fast Delivery'],['offers','Offers']].map(([value,label])=><button type="button" className={`filter-chip ${filter===value?'active':''}`} key={value} onClick={()=>choose(value)}>{label}</button>)}</div>
    {error && <div className="notice">{error}</div>}
    {loading ? <div className="card">Loading kitchens…</div> : visible.length === 0 ? <div className="card empty-state"><span className="material-symbols-outlined" style={{fontSize:36,color:'var(--primary)'}}>search_off</span><h3>No matching kitchens.</h3><p className="muted">Try another search or clear the filters.</p><Link className="primary" href="/restaurants">Show all restaurants</Link></div> : <div className="restaurantGrid">{visible.map((r,i)=><Link className="restaurant" href={`/menu?restaurant=${r.id}`} key={r.id}><div className="restaurantImage" style={{backgroundImage:`url(${r.image_url || fallbackImage})`}} /><div className="restaurantBody"><div className="row"><span className="eyebrow">{i<3?'Top rated':'Kitchen'}</span><span className="status success">Open</span></div><h3>{r.name}</h3><p>{r.cuisine || r.description || 'Food & beverages'}</p><div className="meta"><span>★ {r.rating || 'New'}</span><span>• 25–35 min</span><span>• ₹{r.delivery_fee || 0} delivery</span></div></div></Link>)}</div>}
  </main>;
}
