'use client';

import Link from 'next/link';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const fallbackRestaurants = [
  { id: 'demo-pizza', name: 'Oven Story Pizza', cuisine: 'Pizza · Italian', rating: '4.3', reviews: '1.2K', deliveryFee: 0, time: '30–40 min', price: '₹300 for two', imageUrl: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=1000&q=85', badge: '₹ OFFERS' },
  { id: 'demo-biryani', name: 'Behrouz Biryani', cuisine: 'Biryani · Mughlai', rating: '4.4', reviews: '2.1K', deliveryFee: 0, time: '35–45 min', price: '₹400 for two', imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d29c?auto=format&fit=crop&w=1000&q=85', badge: '20% OFF' },
  { id: 'demo-burger', name: "McDonald's", cuisine: 'Burgers · Fast Food', rating: '4.1', reviews: '3.5K', deliveryFee: 0, time: '25–35 min', price: '₹250 for two', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=1000&q=85', badge: '₹ OFFERS' },
  { id: 'demo-dosa', name: 'Dosa Plaza', cuisine: 'South Indian', rating: '4.6', reviews: '2.1K', deliveryFee: 20, time: '20–30 min', price: '₹180 for two', imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=1000&q=85', badge: 'FREE DELIVERY' },
  { id: 'demo-curry', name: 'Tadka Kitchen', cuisine: 'North Indian · Chinese', rating: '4.5', reviews: '120+', deliveryFee: 0, time: '25–35 min', price: '₹200 for two', imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=85', badge: 'FREE DELIVERY' },
  { id: 'demo-bites', name: 'Urban Bites', cuisine: 'Continental · Italian', rating: '4.3', reviews: '90+', deliveryFee: 30, time: '20–30 min', price: '₹400 for two', imageUrl: 'https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?auto=format&fit=crop&w=1000&q=85', badge: '₹ OFFERS' },
];

const categories = [
  ['🍕', 'Pizza'], ['🍔', 'Burgers'], ['🍛', 'Biryani'], ['🍜', 'Chinese'], ['🍮', 'Desserts'],
  ['🌯', 'Rolls'], ['🍲', 'North Indian'], ['🥞', 'South Indian'], ['🥤', 'Beverages'], ['🥗', 'Healthy'], ['•••', 'More'],
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
    <main className="tadka-discovery">
      <section className="tadka-discovery-wrap">
        <div className="discovery-hero">
          <div className="hero-copy">
            <span className="eyebrow">DISCOVER TADKA</span>
            <h1>{heading}</h1>
            <p>Delicious food. Great restaurants. Delivered to your doorstep.</p>
            <div className="hero-filters" role="tablist" aria-label="Restaurant filters">
              {[
                ['all', 'All'], ['rating', '★ 4.0+ Rated'], ['offers', '✦ Offers'],
              ].map(([value, label]) => (
                <button key={value} className={`hero-filter ${filter === value ? 'active' : ''}`} onClick={() => setFilter(value)}>{label}</button>
              ))}
            </div>
          </div>
          <div className="hero-food" aria-hidden="true">
            <div className="hero-food-image" />
            <span className="hero-sticker">Good food<br /><strong>Good Mood</strong> ♥</span>
          </div>
        </div>

        <div className="category-strip" aria-label="Popular cuisines">
          <button className={`category-card ${activeCategory === 'All' ? 'active' : ''}`} onClick={() => setActiveCategory('All')}>
            <span className="category-icon all-icon">✦</span><span>All</span>
          </button>
          {categories.map(([icon, name]) => (
            <button key={name} className={`category-card ${activeCategory === name ? 'active' : ''}`} onClick={() => setActiveCategory(name)}>
              <span className="category-icon">{icon}</span><span>{name}</span>
            </button>
          ))}
        </div>

        <div className="section-heading">
          <div>
            <span className="section-kicker">TOP PICKS FOR YOU</span>
            <h2>Restaurants near you</h2>
            <p>Explore top restaurants, cuisines and exclusive offers</p>
          </div>
          <label className="sort-control">Sort by <select defaultValue="relevance"><option value="relevance">Relevance</option><option value="rating">Rating</option><option value="time">Delivery time</option></select></label>
        </div>

        {error && <div className="soft-notice"><span>●</span>{error}</div>}

        {loading ? (
          <div className="restaurant-grid loading-grid">{[1, 2, 3, 4].map((item) => <div className="restaurant-card skeleton" key={item} />)}</div>
        ) : (
          <div className="restaurant-layout">
            <div className="restaurant-grid">
              {visibleRestaurants.map((restaurant, index) => (
                <Link className="restaurant-card" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id || `${restaurant.name}-${index}`}>
                  <div className="restaurant-photo" style={{ backgroundImage: `url(${restaurant.imageUrl || fallbackRestaurants[index % fallbackRestaurants.length].imageUrl})` }}>
                    <span className="offer-badge">{restaurant.badge || (index % 2 === 0 ? '₹ OFFERS' : 'FREE DELIVERY')}</span>
                    <span className="heart-button">♡</span>
                  </div>
                  <div className="restaurant-card-body">
                    <div className="restaurant-title-row">
                      <h3>{restaurant.name}</h3>
                      <span className="delivery-time">{restaurant.time || '25–35 min'}</span>
                    </div>
                    <p className="restaurant-cuisine">{restaurant.cuisine || restaurant.description || 'Indian food & beverages'}</p>
                    <div className="restaurant-meta">
                      <span className="rating-pill">★ {restaurant.rating || 'New'} <small>({restaurant.reviews || '—'})</small></span>
                      <span>{restaurant.price || `₹${restaurant.deliveryFee || 0} delivery`}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <aside className="offer-panel">
              <span className="offer-mini">TODAY'S SPECIAL</span>
              <h3>Tasty offers<br /><em>for every mood!</em></h3>
              <p>Grab the best deals from your favourite restaurants.</p>
              <Link href="/restaurants?filter=offers" className="offer-button">View Offers <span>→</span></Link>
              <div className="offer-art">🥗</div>
            </aside>
          </div>
        )}

        {!loading && visibleRestaurants.length === 0 && (
          <div className="empty-card"><h3>No matching kitchens.</h3><p>Try another cuisine or clear the filters.</p><Link href="/restaurants">Show all restaurants</Link></div>
        )}

        <div className="trust-strip">
          <div><span>🛵</span><div><strong>Lightning Fast Delivery</strong><small>Fresh food, on time</small></div></div>
          <div><span>🛡️</span><div><strong>Safe & Secure Payments</strong><small>100% secure transactions</small></div></div>
          <div><span>✦</span><div><strong>Best Restaurants</strong><small>Curated just for you</small></div></div>
          <div><span>♥</span><div><strong>Your Favourite Food</strong><small>Always within reach</small></div></div>
        </div>
      </section>

      <style jsx global>{`
        .tadka-discovery{min-height:calc(100vh - 82px);background:linear-gradient(180deg,#fff 0%,#fffcf7 100%);color:#132d2a;padding:34px 0 58px;font-family:inherit}
        .tadka-discovery-wrap{width:min(1500px,calc(100% - 64px));margin:0 auto}
        .discovery-hero{min-height:310px;border-radius:28px;overflow:hidden;position:relative;background:#173f36;display:grid;grid-template-columns:1fr 1.35fr;box-shadow:0 20px 50px rgba(30,66,58,.13)}
        .hero-copy{padding:46px 42px;position:relative;z-index:2;display:flex;flex-direction:column;justify-content:center}
        .eyebrow,.section-kicker{font-size:12px;font-weight:900;letter-spacing:2px;color:#9fe0b7}
        .hero-copy h1{font-size:clamp(38px,4.3vw,68px);line-height:.98;letter-spacing:-2.8px;color:#fff;margin:14px 0 14px;max-width:600px}
        .hero-copy p{font-size:17px;color:rgba(255,255,255,.78);margin:0 0 26px}
        .hero-filters{display:flex;gap:12px;flex-wrap:wrap}
        .hero-filter{border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.94);color:#153a33;border-radius:999px;padding:11px 24px;font-weight:800;font-size:14px;cursor:pointer;transition:.2s ease}
        .hero-filter:hover{transform:translateY(-2px)}
        .hero-filter.active{background:#b9edc8;border-color:#b9edc8}
        .hero-food{position:relative;min-height:310px}
        .hero-food-image{position:absolute;inset:0;background-image:linear-gradient(90deg,#173f36 0%,rgba(23,63,54,.12) 30%,rgba(23,63,54,0) 55%),url('https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1500&q=90');background-size:cover;background-position:center}
        .hero-sticker{position:absolute;right:5%;bottom:30px;background:#fffdf8;color:#183b34;padding:15px 18px;border-radius:18px;transform:rotate(-4deg);font-family:cursive;font-size:16px;box-shadow:0 10px 25px rgba(0,0,0,.18)}
        .hero-sticker strong{font-size:22px;color:#ef5522}
        .category-strip{display:flex;gap:14px;overflow-x:auto;padding:22px 0 30px;scrollbar-width:none}
        .category-strip::-webkit-scrollbar{display:none}
        .category-card{flex:0 0 108px;height:108px;border:1px solid #eee8df;background:#fffdfa;border-radius:22px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:#20312e;font-weight:800;cursor:pointer;box-shadow:0 8px 20px rgba(56,44,30,.045);transition:.2s ease}
        .category-card:hover,.category-card.active{border-color:#b7ddc8;background:#eef8f1;transform:translateY(-3px)}
        .category-icon{width:58px;height:58px;display:grid;place-items:center;font-size:33px;border-radius:50%;background:#fff4e7}
        .all-icon{font-size:22px;background:#dff3e7;color:#176052}
        .section-heading{display:flex;justify-content:space-between;align-items:flex-end;gap:24px;margin:2px 0 20px}
        .section-heading h2{font-size:31px;letter-spacing:-1.1px;margin:5px 0 4px;color:#102a27}
        .section-heading p{margin:0;color:#74807d;font-size:15px}
        .section-kicker{color:#f05a24;font-size:10px;letter-spacing:1.7px}
        .sort-control{border:1px solid #e7e0d7;border-radius:14px;padding:11px 13px;background:#fff;font-size:13px;color:#68716f;white-space:nowrap}
        .sort-control select{border:0;background:transparent;font-weight:800;color:#173b35;margin-left:5px;outline:0;font-size:13px}
        .soft-notice{display:flex;align-items:center;gap:9px;background:#fff5eb;border:1px solid #f6d9c2;color:#99542f;border-radius:14px;padding:11px 15px;margin:0 0 16px;font-size:13px}
        .soft-notice span{color:#f05a24;font-size:9px}
        .restaurant-layout{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:20px;align-items:start}
        .restaurant-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}
        .restaurant-card{display:block;background:#fff;border:1px solid #eee6dc;border-radius:20px;overflow:hidden;text-decoration:none;color:inherit;box-shadow:0 10px 28px rgba(50,43,31,.055);transition:transform .22s ease,box-shadow .22s ease}
        .restaurant-card:hover{transform:translateY(-5px);box-shadow:0 18px 38px rgba(50,43,31,.11)}
        .restaurant-photo{height:180px;background-size:cover;background-position:center;position:relative}
        .offer-badge{position:absolute;left:12px;bottom:12px;background:#1d876f;color:#fff;padding:6px 10px;border-radius:8px;font-size:10px;font-weight:900;letter-spacing:.3px}
        .heart-button{position:absolute;right:12px;top:12px;width:36px;height:36px;border-radius:50%;display:grid;place-items:center;background:rgba(0,0,0,.35);backdrop-filter:blur(4px);color:#fff;font-size:23px}
        .restaurant-card-body{padding:15px 16px 16px}
        .restaurant-title-row{display:flex;justify-content:space-between;align-items:center;gap:10px}
        .restaurant-title-row h3{font-size:18px;letter-spacing:-.35px;margin:0;color:#142a28}
        .delivery-time{font-size:11px;font-weight:800;color:#576762;background:#f7f5f1;padding:6px 8px;border-radius:8px;white-space:nowrap}
        .restaurant-cuisine{font-size:13px;color:#7a8581;margin:6px 0 12px}
        .restaurant-meta{display:flex;justify-content:space-between;gap:10px;align-items:center;font-size:12px;color:#697570}
        .rating-pill{background:#edf8f0;color:#157150;border-radius:7px;padding:5px 7px;font-weight:900}
        .rating-pill small{font-weight:700;color:#6a7772}
        .offer-panel{min-height:360px;border-radius:22px;background:linear-gradient(145deg,#fff0df,#ffe1c4);border:1px solid #f2d4b8;padding:25px;position:relative;overflow:hidden}
        .offer-mini{font-size:10px;font-weight:900;letter-spacing:1.4px;color:#e55224}
        .offer-panel h3{font-size:29px;line-height:1.03;letter-spacing:-1.1px;color:#7d2e20;margin:14px 0}
        .offer-panel h3 em{font-style:normal;color:#ec5a25}
        .offer-panel p{color:#674b3d;line-height:1.5;font-size:14px;max-width:200px}
        .offer-button{display:inline-flex;gap:13px;align-items:center;margin-top:10px;padding:12px 17px;border-radius:999px;background:#f05a24;color:#fff;text-decoration:none;font-size:13px;font-weight:900;box-shadow:0 10px 20px rgba(240,90,36,.22)}
        .offer-button span{font-size:18px}
        .offer-art{position:absolute;right:-20px;bottom:-28px;font-size:100px;transform:rotate(-12deg);filter:drop-shadow(0 15px 12px rgba(90,49,20,.16))}
        .trust-strip{display:grid;grid-template-columns:repeat(4,1fr);margin-top:22px;border:1px solid #eee6dc;border-radius:20px;background:#fff;padding:20px 10px;box-shadow:0 8px 25px rgba(50,43,31,.04)}
        .trust-strip>div{display:flex;align-items:center;justify-content:center;gap:12px;padding:0 16px;border-right:1px solid #ece8e1}
        .trust-strip>div:last-child{border-right:0}
        .trust-strip>div>span{font-size:28px}
        .trust-strip strong,.trust-strip small{display:block}.trust-strip strong{font-size:13px;color:#253936}.trust-strip small{font-size:11px;color:#88918e;margin-top:3px}
        .empty-card{margin-top:18px;padding:30px;border:1px solid #eee4d9;border-radius:20px;background:#fff;text-align:center}.empty-card h3{margin:0 0 8px}.empty-card p{color:#7b8582}.empty-card a{display:inline-block;background:#16594d;color:#fff;padding:11px 18px;border-radius:10px;text-decoration:none;font-weight:800}
        .loading-grid{min-height:360px}.skeleton{height:330px;background:linear-gradient(100deg,#f7f4ef 30%,#fff 45%,#f7f4ef 60%);background-size:200% 100%;animation:shimmer 1.3s infinite}.skeleton:after{content:'';display:block;height:180px;background:#eee9e1}@keyframes shimmer{to{background-position:-200% 0}}
        @media(max-width:1100px){.restaurant-layout{grid-template-columns:1fr}.offer-panel{display:none}.restaurant-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
        @media(max-width:760px){.tadka-discovery{padding-top:18px}.tadka-discovery-wrap{width:min(100% - 28px,1500px)}.discovery-hero{grid-template-columns:1fr;min-height:440px}.hero-copy{padding:34px 25px}.hero-copy h1{font-size:43px}.hero-food{position:absolute;inset:45% 0 0}.hero-food-image{background-image:linear-gradient(180deg,#173f36 0%,rgba(23,63,54,.05) 45%),url('https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=1200&q=85')}.hero-sticker{right:18px;bottom:16px}.category-card{flex-basis:94px;height:98px}.category-icon{width:50px;height:50px;font-size:28px}.section-heading{align-items:flex-start;flex-direction:column}.restaurant-grid{grid-template-columns:1fr}.restaurant-photo{height:190px}.trust-strip{grid-template-columns:1fr 1fr;gap:18px}.trust-strip>div{border-right:0;justify-content:flex-start}.trust-strip>div:nth-child(odd){border-right:1px solid #ece8e1}}
        @media(max-width:470px){.trust-strip{grid-template-columns:1fr}.trust-strip>div{border-right:0!important}.hero-filters{gap:8px}.hero-filter{padding:10px 15px}.sort-control{width:100%;display:flex;justify-content:space-between}}
      `}</style>
    </main>
  );
}

export default function Restaurants() {
  return <Suspense fallback={<main className="tadka-discovery"><section className="tadka-discovery-wrap"><div className="restaurant-card skeleton" /></section></main>}><RestaurantContent /></Suspense>;
}
