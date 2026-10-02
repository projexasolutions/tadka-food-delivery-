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
    return (
    <main className="min-h-screen bg-tadka-bg text-tadka-ink">
      <section className="mx-auto w-full max-w-[1400px] px-4 py-7 sm:px-6 lg:px-8">
        <div className="border-b border-tadka-line pb-6">
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

          <div className="mt-4 flex flex-wrap items-center gap-2" role="tablist" aria-label="Restaurant filters">
            {[['all', 'All'], ['rating', '4.0+ rated'], ['offers', 'Offers']].map(([value, label]) => (
              <button
                type="button"
                key={value}
                onClick={() => setFilter(value)}
                className={filter === value
                  ? 'rounded-full bg-tadka-green px-4 py-2 text-xs font-semibold text-white'
                  : 'rounded-full border border-tadka-line bg-white px-4 py-2 text-xs font-semibold text-tadka-ink hover:border-tadka-green/40 hover:bg-tadka-green-soft'}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

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

        <div className="mb-5 mt-6">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-tadka-orange">TOP PICKS</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Restaurants near you</h2>
          <p className="mt-1 text-sm text-tadka-muted">Compare ratings, delivery times and prices.</p>
        </div>

        {error && (
          <div className="mb-5 flex items-center gap-2 rounded-lg border border-orange-100 bg-orange-50 px-3 py-2.5 text-xs text-orange-900">
            <span className="material-symbols-outlined text-[17px] text-tadka-orange">info</span>
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((item) => (
              <div key={item} className="overflow-hidden rounded-xl border border-tadka-line bg-white">
                <div className="h-48 animate-pulse bg-tadka-line/50" />
                <div className="space-y-3 p-4">
                  <div className="h-4 w-3/5 animate-pulse rounded bg-tadka-line/60" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-tadka-line/50" />
                  <div className="h-3 w-2/5 animate-pulse rounded bg-tadka-line/50" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleRestaurants.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {visibleRestaurants.map((restaurant, index) => {
              const fallback = fallbackRestaurants[index % fallbackRestaurants.length];
              const image = restaurant.imageUrl || fallback.imageUrl;

              return (
                <Link
                  key={restaurant.id || restaurant.name + '-' + index}
                  href={'/menu?restaurant=' + restaurant.id}
                  className="group overflow-hidden rounded-xl border border-tadka-line bg-white transition hover:-translate-y-0.5 hover:border-tadka-line-strong hover:shadow-tadka-md"
                >
                  <div className="relative h-48 overflow-hidden bg-tadka-bg">
                    <img
                      src={image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/35 to-transparent" />
                    {(restaurant.badge || index < 2) && (
                      <span className="absolute left-3 top-3 rounded-md bg-white px-2 py-1 text-[10px] font-bold text-tadka-orange shadow-sm">
                        {restaurant.badge || 'POPULAR'}
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={'Save ' + restaurant.name}
                      onClick={(event) => event.preventDefault()}
                      className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-white/95 text-tadka-green shadow-sm"
                    >
                      <span className="material-symbols-outlined text-[19px]">favorite_border</span>
                    </button>
                  </div>

                  <div className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2 className="truncate text-base font-bold text-tadka-ink">{restaurant.name}</h2>
                        <p className="mt-1 truncate text-xs text-tadka-muted">
                          {restaurant.cuisine || restaurant.description || 'Indian food & beverages'}
                        </p>
                      </div>
                      <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold text-tadka-green">
                        <span className="material-symbols-outlined text-[15px]">star</span>
                        {restaurant.rating || 'New'}
                      </span>
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-tadka-line pt-3 text-xs text-tadka-muted">
                      <span className="inline-flex items-center gap-1">
                        <span className="material-symbols-outlined text-[15px]">schedule</span>
                        {restaurant.time || '25–35 min'}
                      </span>
                      <span>{restaurant.price || '₹' + (restaurant.deliveryFee || 0) + ' delivery'}</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-tadka-line bg-white px-6 py-16 text-center">
            <span className="material-symbols-outlined text-4xl text-tadka-subtle">search_off</span>
            <h2 className="mt-3 text-lg font-bold">No matching restaurants</h2>
            <p className="mt-1 text-sm text-tadka-muted">Try another cuisine or clear the filters.</p>
            <Link href="/restaurants" className="mt-4 inline-flex rounded-lg bg-tadka-orange px-4 py-2.5 text-xs font-bold text-white">
              Show all restaurants
            </Link>
          </div>
        )}

        <div className="mt-10 flex flex-wrap gap-x-8 gap-y-3 border-t border-tadka-line pt-5 text-xs text-tadka-muted">
          <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-tadka-green">delivery_dining</span>Fast delivery</span>
          <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-tadka-green">verified_user</span>Trusted kitchens</span>
          <span className="inline-flex items-center gap-2"><span className="material-symbols-outlined text-[16px] text-tadka-green">lock</span>Secure payments</span>
        </div>
      </section>
    </main>
  );
}
}

export default function RestaurantsPage() {
  return <Suspense fallback={<main className="min-h-screen bg-white px-4 py-7 text-tadka-ink sm:px-6"><div className="mx-auto w-full max-w-[1240px]"><div className="grid gap-4 sm:grid-cols-2"><div className="h-72 animate-pulse rounded-tadka-lg border border-tadka-line bg-tadka-bg" /><div className="h-72 animate-pulse rounded-tadka-lg border border-tadka-line bg-tadka-bg" /></div></div></main>}><RestaurantContent /></Suspense>;
}
