'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FOOD = {
  biryani: 'https://images.unsplash.com/photo-1633945274405-b6c8069047b0?auto=format&fit=crop&w=1000&q=88',
  thali: 'https://images.unsplash.com/photo-1626776876729-bab436f14a5a?auto=format&fit=crop&w=1000&q=88',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=1000&q=88',
  samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1000&q=88',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=1000&q=88',
  dessert: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=1000&q=88',
  noodles: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?auto=format&fit=crop&w=1000&q=88',
  salad: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&w=1000&q=88',
};

const CATEGORIES = [
  ['Biryani', 'biryani', FOOD.biryani], ['North Indian', 'north indian', FOOD.paneer],
  ['South Indian', 'south indian', FOOD.dosa], ['Street Food', 'chaat', FOOD.samosa],
  ['Chinese', 'chinese', FOOD.noodles], ['Desserts', 'sweet', FOOD.dessert],
  ['Thalis', 'thali', FOOD.thali], ['Healthy', 'healthy', FOOD.salad],
];
const FILTERS = ['All', 'Pure Veg', '4.0+ Rating', 'Fast Delivery', 'Offers'];

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('biryani');
  const [activeFilter, setActiveFilter] = useState('All');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/v1/restaurants`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load restaurants.')))
      .then((body) => setRestaurants(body?.data || []))
      .catch((error) => { if (error.name !== 'AbortError') setRestaurants([]); })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const visibleRestaurants = useMemo(() => {
    let list = [...restaurants];
    if (activeFilter === 'Pure Veg') list = list.filter((item) => /veg|vegetarian/i.test(item.cuisine || ''));
    if (activeFilter === '4.0+ Rating') list = list.filter((item) => Number(item.rating || 0) >= 4);
    if (activeFilter === 'Offers') list = list.filter((item) => Number(item.deliveryFee || 0) === 0);
    return list.slice(0, 6);
  }, [restaurants, activeFilter]);

  function searchFood(event) {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : '/restaurants');
  }
  function selectCategory(value) {
    setActiveCategory(value);
    router.push(`/restaurants?cuisine=${encodeURIComponent(value)}`);
  }

  return (
    <main className="ref-home">
      <div className="ref-wrap">
        <section className="ref-hero">
          <div className="ref-hero-grid">
            <div>
              <div className="ref-greeting">AUTHENTIC INDIAN FOOD • AT YOUR DOORSTEP</div>
              <h1>Good Food<br /><span>Brings Us Together.</span></h1>
              <p>From local kitchens to your home, enjoy freshly prepared Indian meals with TADKA.</p>
              <form className="ref-search" onSubmit={searchFood} role="search">
                <span className="ref-search-icon" aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for biryani, dosa, restaurants..." aria-label="Search food or restaurants" />
                <button type="submit">Find food</button>
              </form>
              <div className="ref-quick"><span>Fast delivery</span><span>Freshly prepared</span><span>Safe &amp; reliable</span></div>
            </div>
            <div className="ref-hero-card" aria-label="Featured Indian food">
              <div className="ref-hero-image-main" style={{ backgroundImage: `url(${FOOD.biryani})` }} />
              <div className="ref-hero-mini" style={{ backgroundImage: `url(${FOOD.dosa})` }} />
              <div className="ref-hero-tag"><strong>Today's pick</strong><span>Hyderabadi Biryani</span></div>
            </div>
          </div>
        </section>

        <section className="ref-section">
          <div className="ref-head"><div><small>BROWSE BY CRAVING</small><h2>Choose your plate</h2></div><Link href="/restaurants">All cuisines →</Link></div>
          <div className="ref-cats">{CATEGORIES.map(([label, value, image]) => (
            <button key={value} className={`ref-cat ${activeCategory === value ? 'active' : ''}`} type="button" onClick={() => selectCategory(value)}>
              <span className="ref-cat-img" style={{ backgroundImage: `url(${image})` }} /><span>{label}</span>
            </button>
          ))}</div>
        </section>

        <section className="ref-section"><div className="ref-offer">
          <div><small>FIRST ORDER SPECIAL</small><h2>Flat 50% off on your first order.</h2><p>Use code TADKA50 and discover your new favourite kitchen.</p></div>
          <Link href="/restaurants" className="btn">Order now →</Link>
        </div></section>

        <section className="ref-section">
          <div className="ref-head"><div><small>POPULAR RESTAURANTS NEAR YOU</small><h2>Great food, close by.</h2></div><Link href="/restaurants">View all →</Link></div>
          <div className="ref-filters">{FILTERS.map((filter) => <button key={filter} type="button" className={activeFilter === filter ? 'active' : ''} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>
          {loading ? <div className="ref-loading"><span /><span /><span /></div> : visibleRestaurants.length ? (
            <div className="ref-restaurants">{visibleRestaurants.map((restaurant, index) => (
              <Link className="ref-restaurant" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id}>
                <div className="ref-restaurant-img" style={{ backgroundImage: `url(${restaurant.imageUrl || [FOOD.biryani, FOOD.thali, FOOD.dosa, FOOD.samosa, FOOD.paneer, FOOD.noodles][index % 6]})` }}><span className="ref-live">OPEN</span></div>
                <div className="ref-restaurant-body"><div className="ref-rating">★ {restaurant.rating || 'New'}</div><h3>{restaurant.name}</h3><p>{restaurant.cuisine || 'Indian cuisine'}</p><div className="ref-meta"><span>25–35 min</span><span>{Number(restaurant.deliveryFee || 0) ? `₹${restaurant.deliveryFee} delivery` : 'Free delivery'}</span></div></div>
              </Link>
            ))}</div>
          ) : <div className="ref-empty"><b>No live restaurants yet</b><span>Available restaurants will appear here automatically.</span><Link href="/restaurants">Browse all restaurants →</Link></div>}
        </section>

        <section className="ref-section ref-featured">
          <div className="ref-head"><div><small>FEATURED TODAY</small><h2>Desi flavours, delivered fresh.</h2></div><Link href="/restaurants">Explore →</Link></div>
          <Link href="/restaurants" className="ref-feature-card"><div><small>TADKA FAVOURITE</small><h2>Paneer, naan,<br />and a little extra.</h2><p>Comforting Indian flavours from kitchens around you.</p><b>Find this near you →</b></div><div className="ref-feature-image" style={{ backgroundImage: `url(${FOOD.paneer})` }} /></Link>
        </section>

        <section className="ref-section ref-bottom-space"><div className="ref-head"><div><small>WHY TADKA</small><h2>Good food. Simple ordering.</h2></div></div>
          <div className="ref-benefits"><article><b>01</b><strong>Fresh kitchens</strong><span>Discover live menus from local restaurants connected to TADKA.</span></article><article><b>02</b><strong>Clear pricing</strong><span>See items, quantities, delivery and totals before you order.</span></article><article><b>03</b><strong>Live journey</strong><span>Track your order from kitchen confirmation through delivery.</span></article></div>
        </section>
      </div>
    </main>
  );
}
