'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const fallbackRestaurants = [
  { id: 'demo-pizza', name: 'Oven Story Pizza', cuisine: 'Pizza · Italian', rating: '4.3', reviews: '1.2K', deliveryFee: 0, time: '30–40 min', price: '₹300 for two', imageUrl: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1000&q=85', badge: 'SPECIAL OFFER' },
  { id: 'demo-biryani', name: 'Behrouz Biryani', cuisine: 'Biryani · Mughlai', rating: '4.4', reviews: '2.1K', deliveryFee: 0, time: '35–45 min', price: '₹400 for two', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d29c?auto=format&fit=crop&w=1000&q=85', badge: '20% OFF' },
  { id: 'demo-burger', name: "McDonald's", cuisine: 'Burgers · Fast Food', rating: '4.1', reviews: '3.5K', deliveryFee: 0, time: '25–35 min', price: '₹250 for two', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85', badge: 'SPECIAL OFFER' },
  { id: 'demo-dosa', name: 'Dosa Plaza', cuisine: 'South Indian', rating: '4.6', reviews: '2.1K', deliveryFee: 20, time: '20–30 min', price: '₹180 for two', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1000&q=85', badge: 'FREE DELIVERY' },
  { id: 'demo-curry', name: 'Tadka Kitchen', cuisine: 'North Indian · Chinese', rating: '4.5', reviews: '120+', deliveryFee: 0, time: '25–35 min', price: '₹200 for two', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=85', badge: 'FREE DELIVERY' },
  { id: 'demo-bites', name: 'Urban Bites', cuisine: 'Continental · Italian', rating: '4.3', reviews: '90+', deliveryFee: 30, time: '20–30 min', price: '₹400 for two', imageUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85', badge: 'SPECIAL OFFER' },
];

const categories = [
  ['local_pizza', 'Pizza'], ['lunch_dining', 'Burgers'], ['rice_bowl', 'Biryani'], ['ramen_dining', 'Chinese'],
  ['cake', 'Desserts'], ['wrap_text', 'Rolls'], ['restaurant', 'North Indian'], ['set_meal', 'South Indian'],
  ['local_bar', 'Beverages'], ['spa', 'Healthy'], ['more_horiz', 'More'],
];

function RestaurantContent() {
  const params = useSearchParams();
  const query = (params.get('q') || '').trim();
  const cuisine = (params.get('cuisine') || '').trim();
  const requestedFilter = params.get('filter');
  const [filter, setFilter] = useState(['rating', 'offers'].includes(requestedFilter) ? requestedFilter : 'all');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  useEffect(() => {
    const controller = new AbortController();
    async function load() {
      setLoading(true);
      setError('');
      try {
        const search = new URLSearchParams();
        if (query) search.set('q', query);
        if (cuisine) search.set('cuisine', cuisine);
        if (filter !== 'all') search.set('filter', filter);
        const response = await fetch(`${apiUrl}/v1/restaurants?${search.toString()}`, { signal: controller.signal, cache: 'no-store' });
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load restaurants.');
        setRestaurants(Array.isArray(body?.data) ? body.data : []);
      } catch (fetchError) {
        if (fetchError.name !== 'AbortError') {
          setError('Live restaurant data is unavailable right now. Showing the Tadka preview menu.');
          setRestaurants([]);
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }
    void load();
    return () => controller.abort();
  }, [query, cuisine, filter]);

  const visibleRestaurants = useMemo(() => {
    const source = restaurants.length ? restaurants : fallbackRestaurants;
    const term = (query || activeCategory).toLowerCase();
    return source.filter((restaurant) => {
      const text = `${restaurant.name || ''} ${restaurant.cuisine || ''} ${restaurant.description || ''}`.toLowerCase();
      const matchesSearch = !query && activeCategory === 'All' ? true : text.includes(term);
      const matchesRating = filter !== 'rating' || Number.parseFloat(restaurant.rating) >= 4;
      return matchesSearch && matchesRating;
    });
  }, [restaurants, query, activeCategory, filter]);

  const heading = query ? `Results for “${query}”` : cuisine ? `${cuisine} kitchens` : 'Find your next favourite.';

  return (
    <main className="min-h-screen bg-tadka-bg text-tadka-ink"><section className="mx-auto w-full max-w-[1400px] px-4 py-7 sm:px-6 lg:px-8">
      <section className="mx-auto w-full max-w-[1240px]">
        <div className="flex flex-col gap-5 border-b border-tadka-line pb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-1 text-xs font-semibold text-tadka-muted">{query ? 'SEARCH RESULTS' : 'DISCOVER FOOD'}</p>
              <h1 className="text-3xl font-bold tracking-tight text-tadka-ink sm:text-4xl">{heading}</h1>
              <p className="mt-2 text-sm text-tadka-muted">Fresh food from local kitchens, delivered to your door.</p>
            </div>
            <label className="flex h-10 w-fit items-center gap-2 rounded-lg border border-tadka-line bg-white px-3 text-xs text-tadka-muted">
              Sort
              <select className="bg-transparent font-semibold text-tadka-ink outline-none" defaultValue="relevance">
                <option value="relevance">Relevance</option>
                <option value="rating">Rating</option>
                <option value="time">Delivery time</option>
              </select>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Restaurant filters">
            {[['all', 'All'], ['rating', '4.0+ rated'], ['offers', 'Offers']].map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setFilter(value)}
                className={filter === value
                          <div className="flex gap-2 overflow-x-auto border-b border-tadka-line py-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <button
            type="button"
            onClick={() => setActiveCategory('All')}
            className={activeCategory === 'All'
              ? 'shrink-0 rounded-full bg-tadka-orange px-4 py-2 text-xs font-semibold text-white'
              : 'shrink-0 rounded-full border border-tadka-line bg-white px-4 py-2 text-xs font-semibold text-tadka-muted hover:text-tadka-ink'}
          >
            All cuisines
          </button>
          {categories.map(([icon, name]) => (
            <button
              type="button"
              key={name}
              onClick={() => setActiveCategory(name)}
              className={activeCategory === name
                ? 'inline-flex shrink-0 items-center gap-1.5 rounded-full bg-tadka-orange px-4 py-2 text-xs font-semibold text-white'
                : 'inline-flex shrink-0 items-center gap-1.5 rounded-full border border-tadka-line bg-white px-4 py-2 text-xs font-semibold text-tadka-muted hover:text-tadka-ink'}
            >
              <span className="material-symbols-outlined text-[16px]">{icon}</span>
              {name}
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-tadka-orange">TOP PICKS</span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-tadka-ink">Restaurants near you</h2>
            <p className="mt-1 text-sm text-tadka-muted">Compare ratings, delivery times and prices.</p>
          </div>
        </div>

        {error && <div className="mb-4 flex items-center gap-2 rounded-xl border border-orange-100 bg-orange-50 px-3 py-2.5 text-xs text-orange-900"><span className="material-symbols-outlined">info</span>{error}</div>}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">{[1, 2, 3, 4].map((item) => <div className="h-72 animate-pulse rounded-tadka-lg border border-tadka-line bg-tadka-bg" key={item} />)}</div>
        ) : (
          <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleRestaurants.map((restaurant, index) => (
                <Link className="block overflow-hidden rounded-tadka-lg border border-tadka-line bg-white text-tadka-ink shadow-tadka-sm transition hover:-translate-y-0.5 hover:shadow-tadka-md" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id || `${restaurant.name}-${index}`}>
                  <div className="relative h-52 bg-cover bg-center" style={{ backgroundImage: `url(${restaurant.imageUrl || fallbackRestaurants[index % fallbackRestaurants.length].imageUrl})` }}>
                    <span className="absolute left-3 top-3 rounded-lg bg-white px-2 py-1.5 text-[9px] font-black tracking-wider text-tadka-orange shadow-sm">{restaurant.badge || (index % 2 === 0 ? 'SPECIAL OFFER' : 'FREE DELIVERY')}</span>
                    <span className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white text-tadka-green shadow-sm" aria-label={`Save ${restaurant.name}`}><span className="material-symbols-outlined">favorite_border</span></span>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-bold tracking-tight">{restaurant.name}</h3>
                      <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-tadka-muted"><span className="material-symbols-outlined">schedule</span>{restaurant.time || '25–35 min'}</span>
                    </div>
                    <p className="my-2.5 text-xs text-tadka-muted">{restaurant.cuisine || restaurant.description || 'Indian food & beverages'}</p>
                    <div className="flex items-center justify-between text-xs text-tadka-muted">
                      <span className="inline-flex items-center gap-1 text-tadka-green"><span className="material-symbols-outlined">star</span>{restaurant.rating || 'New'} <small>({restaurant.reviews || '—'})</small></span>
                      <span>{restaurant.price || `₹${restaurant.deliveryFee || 0} delivery`}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <aside className="rounded-tadka-lg border border-tadka-line bg-tadka-green-soft p-6 lg:sticky lg:top-24">
              <span className="text-[10px] font-black tracking-wider text-tadka-green">TODAY'S OFFERS</span>
              <h3>Good food,<br /><em>better value.</em></h3>
              <p>Discover offers and free-delivery deals from selected kitchens.</p>
              <Link href="/restaurants?filter=offers" className="offer-button">View offers <span className="material-symbols-outlined">arrow_forward</span></Link>
            </aside>
          </div>
        )}

        {!loading && visibleRestaurants.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-tadka-lg border border-dashed border-tadka-line p-10 text-center"><span className="material-symbols-outlined">search_off</span><h3>No matching kitchens.</h3><p>Try another cuisine or clear the filters.</p><Link href="/restaurants">Show all restaurants</Link></div>
        )}

        <div className="mt-8 grid gap-3 border-t border-tadka-line py-6 sm:grid-cols-2 lg:grid-cols-4">
          <div><span className="grid h-9 w-9 place-items-center rounded-full bg-tadka-green-soft text-tadka-green"><span className="material-symbols-outlined">delivery_dining</span></span><div><strong>Fast delivery</strong><small>Fresh food, on time</small></div></div>
          <div><span className="grid h-9 w-9 place-items-center rounded-full bg-tadka-green-soft text-tadka-green"><span className="material-symbols-outlined">lock</span></span><div><strong>Secure payments</strong><small>Protected transactions</small></div></div>
          <div><span className="grid h-9 w-9 place-items-center rounded-full bg-tadka-green-soft text-tadka-green"><span className="material-symbols-outlined">restaurant</span></span><div><strong>Trusted kitchens</strong><small>Curated for you</small></div></div>
          <div><span className="grid h-9 w-9 place-items-center rounded-full bg-tadka-green-soft text-tadka-green"><span className="material-symbols-outlined">favorite</span></span><div><strong>Made for you</strong><small>Your favourites, nearby</small></div></div>
        </div>
      </section>
    </main>


    </main>
  );
}

export default function RestaurantsPage() {
  return <Suspense fallback={<main className="min-h-screen bg-white px-4 py-7 text-tadka-ink sm:px-6"><div className="mx-auto w-full max-w-[1240px]"><div className="grid gap-4 sm:grid-cols-2"><div className="h-72 animate-pulse rounded-tadka-lg border border-tadka-line bg-tadka-bg" /><div className="h-72 animate-pulse rounded-tadka-lg border border-tadka-line bg-tadka-bg" /></div></div></main>}><RestaurantContent /></Suspense>;
}
