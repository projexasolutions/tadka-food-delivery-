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
    <main className="min-h-screen bg-white px-4 py-7 text-tadka-ink sm:px-6">
      <section className="mx-auto w-full max-w-[1240px]">
        <div className="grid min-h-[300px] overflow-hidden rounded-tadka-xl bg-tadka-green lg:grid-cols-[1fr_1.18fr]">
          <div className="relative z-10 flex flex-col justify-center p-7 sm:p-10">
            <span className="text-[11px] font-black tracking-[0.18em] text-green-200">DISCOVER TADKA</span>
            <h1 className="my-3 max-w-[610px] text-4xl font-bold leading-none tracking-tight text-white sm:text-5xl lg:text-6xl">{heading}</h1>
            <p className="mb-6 max-w-[560px] text-base leading-6 text-white/75">Delicious food from trusted local kitchens, delivered to your doorstep.</p>
            <div className="flex flex-wrap gap-2.5" role="tablist" aria-label="Restaurant filters">
              {[['all', 'All', 'apps'], ['rating', '4.0+ Rated', 'star'], ['offers', 'Offers', 'local_offer']].map(([value, label, icon]) => (
                <button type="button" key={value} className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition ${filter === value ? "border-green-200 bg-green-200 text-tadka-green" : "border-white/25 bg-white text-tadka-green"}`} onClick={() => setFilter(value)}>
                  <span className="material-symbols-outlined">{icon}</span>{label}
                </button>
              ))}
            </div>
          </div>
          <div className="relative min-h-[300px]" aria-hidden="true">
            <div className="hero-food-image" />
          </div>
        </div>

        <div className="flex gap-3 overflow-x-auto py-5 pb-7" aria-label="Popular cuisines">
          <button type="button" className={`flex h-[104px] w-[104px] shrink-0 flex-col items-center justify-center gap-2 rounded-tadka-lg border text-sm font-bold transition ${activeCategory === "All" ? "border-tadka-green bg-tadka-green-soft text-tadka-green" : "border-tadka-line bg-white text-tadka-ink"}`} onClick={() => setActiveCategory('All')}>
            <span className="grid h-14 w-14 place-items-center rounded-full bg-orange-50 text-tadka-orange"><span className="material-symbols-outlined">apps</span></span><span>All</span>
          </button>
          {categories.map(([icon, name]) => (
            <button type="button" key={name} className={`flex h-[104px] w-[104px] shrink-0 flex-col items-center justify-center gap-2 rounded-tadka-lg border text-sm font-bold transition ${activeCategory === name ? "border-tadka-green bg-tadka-green-soft text-tadka-green" : "border-tadka-line bg-white text-tadka-ink"}`} onClick={() => setActiveCategory(name)}>
              <span className="grid h-14 w-14 place-items-center rounded-full bg-orange-50 text-tadka-orange"><span className="material-symbols-outlined">{icon}</span></span><span>{name}</span>
            </button>
          ))}
        </div>

        <div className="mb-5 flex items-end justify-between gap-6">
          <div>
            <span className="text-[10px] font-black tracking-[0.12em] text-tadka-orange">TOP PICKS FOR YOU</span>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-tadka-ink">Restaurants near you</h2>
            <p className="text-sm text-tadka-muted">Explore top restaurants, cuisines and exclusive offers</p>
          </div>
          <label className="whitespace-nowrap rounded-xl border border-tadka-line bg-white px-3 py-2 text-xs text-tadka-muted">Sort by <select defaultValue="relevance"><option value="relevance">Relevance</option><option value="rating">Rating</option><option value="time">Delivery time</option></select></label>
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

      <style jsx global>{`
        .tadka-discovery{min-height:calc(100vh - 82px);background:#fff;color:#132d2a;padding:28px 0 58px;font-family:inherit}
        .tadka-discovery-wrap{width:min(1500px,calc(100% - 64px));margin:0 auto}
        .discovery-hero{min-height:300px;border-radius:26px;overflow:hidden;position:relative;background:#17463c;display:grid;grid-template-columns:1fr 1.18fr;box-shadow:0 14px 36px rgba(25,62,53,.12)}
        .hero-copy{padding:42px 46px;display:flex;flex-direction:column;justify-content:center;position:relative;z-index:2}
        .eyebrow{font-size:11px;font-weight:900;letter-spacing:2px;color:#a8dfb8}
        .hero-copy h1{font-size:clamp(38px,4vw,62px);line-height:1;letter-spacing:-2.4px;color:#fff;margin:13px 0 13px;max-width:610px}
        .hero-copy p{font-size:16px;line-height:1.5;color:rgba(255,255,255,.76);margin:0 0 24px;max-width:560px}
        .hero-filters{display:flex;gap:10px;flex-wrap:wrap}
        .hero-filter{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(255,255,255,.25);background:#fff;color:#173c35;border-radius:999px;padding:10px 17px;font-weight:800;font-size:13px;cursor:pointer;transition:.2s ease}
        .hero-filter .material-symbols-outlined{font-size:17px}
        .hero-filter:hover{transform:translateY(-1px)}
        .hero-filter.active{background:#bceac9;border-color:#bceac9}
        .hero-food{position:relative;min-height:300px}
        .hero-food-image{position:absolute;inset:0;background-image:linear-gradient(90deg,#17463c 0%,rgba(23,70,60,.22) 20%,rgba(23,70,60,0) 48%),url('https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1400&q=88');background-size:cover;background-position:center}
        .category-strip{display:flex;gap:12px;overflow-x:auto;padding:20px 0 28px;scrollbar-width:none}
        .category-strip::-webkit-scrollbar{display:none}
        .category-card{flex:0 0 104px;height:104px;border:1px solid #ebe6de;background:#fff;border-radius:18px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#20312e;font-weight:800;cursor:pointer;box-shadow:0 5px 16px rgba(56,44,30,.035);transition:.2s ease}
        .category-card:hover,.category-card.active{border-color:#b9dcca;background:#f2f9f4;transform:translateY(-2px)}
        .category-icon{width:54px;height:54px;display:grid;place-items:center;border-radius:50%;background:#fff5e9;color:#e85b29}
        .category-icon .material-symbols-outlined{font-size:28px}
        .section-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin:0 0 18px}
        .section-heading h2{font-size:30px;letter-spacing:-1px;margin:5px 0 4px;color:#102a27}
        .section-heading p{margin:0;color:#74807d;font-size:14px}
        .section-kicker{color:#f05a24;font-size:10px;font-weight:900;letter-spacing:1.7px}
        .sort-control{border:1px solid #e7e0d7;border-radius:12px;padding:10px 12px;background:#fff;font-size:12px;color:#68716f;white-space:nowrap}
        .sort-control select{border:0;background:transparent;font-weight:800;color:#173b35;margin-left:4px;outline:0;font-size:12px}
        .soft-notice{display:flex;align-items:center;gap:8px;background:#fff8f1;border:1px solid #f2dcc9;color:#89583c;border-radius:12px;padding:10px 14px;margin:0 0 15px;font-size:12px}
        .soft-notice .material-symbols-outlined{font-size:17px;color:#ef5b29}
        .restaurant-layout{display:grid;grid-template-columns:minmax(0,1fr) 260px;gap:18px;align-items:start}
        .restaurant-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
        .restaurant-card{display:block;background:#fff;border:1px solid #e9e4dc;border-radius:18px;overflow:hidden;color:inherit;text-decoration:none;box-shadow:0 6px 20px rgba(43,37,29,.045);transition:transform .2s ease,box-shadow .2s ease}
        .restaurant-card:hover{transform:translateY(-3px);box-shadow:0 12px 28px rgba(43,37,29,.09)}
        .restaurant-photo{height:205px;background-size:cover;background-position:center;position:relative}
        .offer-badge{position:absolute;left:12px;top:12px;background:#fff;border-radius:8px;padding:7px 9px;color:#d84e21;font-size:9px;font-weight:900;letter-spacing:.8px;box-shadow:0 4px 12px rgba(0,0,0,.08)}
        .heart-button{position:absolute;right:12px;top:12px;width:34px;height:34px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#1a3b35;box-shadow:0 4px 12px rgba(0,0,0,.08)}
        .heart-button .material-symbols-outlined{font-size:19px}
        .restaurant-card-body{padding:15px 16px 16px}
        .restaurant-title-row{display:flex;align-items:center;justify-content:space-between;gap:12px}
        .restaurant-title-row h3{font-size:19px;letter-spacing:-.4px;margin:0;color:#142b28}
        .delivery-time{display:inline-flex;align-items:center;gap:3px;color:#687773;font-size:11px;white-space:nowrap}
        .delivery-time .material-symbols-outlined{font-size:14px}
        .restaurant-cuisine{margin:7px 0 12px;color:#6f7b78;font-size:13px}
        .restaurant-meta{display:flex;justify-content:space-between;align-items:center;color:#64716e;font-size:12px}
        .rating-pill{display:inline-flex;align-items:center;gap:3px;color:#176052;font-weight:900}
        .rating-pill .material-symbols-outlined{font-size:15px}
        .rating-pill small{font-weight:500;color:#8a9491}
        .offer-panel{background:#f3f8f4;border:1px solid #dcece2;border-radius:18px;padding:23px;min-height:100%;position:sticky;top:100px}
        .offer-mini{font-size:10px;font-weight:900;letter-spacing:1.6px;color:#176052}
        .offer-panel h3{font-size:26px;line-height:1.08;letter-spacing:-.8px;color:#143b34;margin:12px 0}
        .offer-panel h3 em{font-style:normal;color:#ef5a27}
        .offer-panel p{font-size:13px;line-height:1.55;color:#71807a;margin:0 0 22px}
        .offer-button{display:flex;align-items:center;justify-content:space-between;background:#155b4d;color:#fff;text-decoration:none;border-radius:10px;padding:12px 14px;font-size:12px;font-weight:900}
        .offer-button .material-symbols-outlined{font-size:17px}
        .empty-card{padding:45px 20px;text-align:center;border:1px dashed #ddd5ca;border-radius:16px;margin-top:18px;color:#64716e}
        .empty-card>.material-symbols-outlined{font-size:34px;color:#9aaca5}
        .empty-card h3{margin:8px 0 5px;color:#18332e}
        .empty-card p{margin:0 0 12px;font-size:13px}
        .empty-card a{color:#e85425;font-weight:800;text-decoration:none;font-size:13px}
        .trust-strip{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e9e5df;border:1px solid #e9e5df;border-radius:16px;overflow:hidden;margin-top:32px}
        .trust-strip>div{background:#fff;padding:16px;display:flex;align-items:center;gap:10px}
        .trust-icon{width:38px;height:38px;border-radius:50%;background:#eef7f1;color:#176052;display:grid;place-items:center;flex:0 0 auto}
        .trust-icon .material-symbols-outlined{font-size:20px}
        .trust-strip strong{display:block;font-size:12px;color:#19332e}
        .trust-strip small{display:block;color:#7b8582;font-size:10px;margin-top:2px}
        .skeleton{height:330px;background:linear-gradient(90deg,#f4f1ed 25%,#faf9f7 50%,#f4f1ed 75%);background-size:200% 100%;animation:tadka-shimmer 1.3s infinite}
        @keyframes tadka-shimmer{to{background-position:-200% 0}}
        @media(max-width:1050px){.tadka-discovery-wrap{width:min(100% - 32px,900px)}.restaurant-layout{grid-template-columns:1fr}.offer-panel{position:static}.restaurant-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.trust-strip{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:700px){.tadka-discovery{padding-top:16px}.tadka-discovery-wrap{width:calc(100% - 24px)}.discovery-hero{grid-template-columns:1fr;min-height:0}.hero-copy{padding:32px 25px}.hero-copy h1{font-size:42px}.hero-food{min-height:190px}.hero-food-image{background-position:center}.category-card{flex-basis:92px;height:96px}.restaurant-grid{grid-template-columns:1fr}.restaurant-photo{height:190px}.section-heading{align-items:flex-start;flex-direction:column}.sort-control{align-self:stretch}.trust-strip{grid-template-columns:1fr}.trust-strip>div{padding:13px 15px}}
      `}</style>
    </main>
  );
}

export default function RestaurantsPage() {
  return <Suspense fallback={<main className="min-h-screen bg-white px-4 py-7 text-tadka-ink sm:px-6"><div className="mx-auto w-full max-w-[1240px]"><div className="grid gap-4 sm:grid-cols-2"><div className="h-72 animate-pulse rounded-tadka-lg border border-tadka-line bg-tadka-bg" /><div className="h-72 animate-pulse rounded-tadka-lg border border-tadka-line bg-tadka-bg" /></div></div></main>}><RestaurantContent /></Suspense>;
}
