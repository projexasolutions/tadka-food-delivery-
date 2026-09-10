'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const FOOD = {
  biryani: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?auto=format&fit=crop&w=900&q=85',
  thali: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?auto=format&fit=crop&w=900&q=85',
  dosa: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?auto=format&fit=crop&w=900&q=85',
  samosa: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=85',
  paneer: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?auto=format&fit=crop&w=900&q=85',
  dessert: 'https://images.unsplash.com/photo-1601050690117-94f5f6fa8bd7?auto=format&fit=crop&w=900&q=85',
};

const CATEGORIES = [
  ['Food', 'all', FOOD.biryani],
  ['Biryani', 'biryani', FOOD.biryani],
  ['North Indian', 'north indian', FOOD.paneer],
  ['South Indian', 'south indian', FOOD.dosa],
  ['Street Food', 'chaat', FOOD.samosa],
  ['Tandoor', 'tandoor', FOOD.paneer],
  ['Desserts', 'sweet', FOOD.dessert],
];

const FILTERS = ['All', 'Pure Veg', '4.0+ Rating', 'Fast Delivery', 'Offers'];

export default function Home() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
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
    router.push(value === 'all' ? '/restaurants' : `/restaurants?cuisine=${encodeURIComponent(value)}`);
  }

  return (
    <main className="ref-home">
      <div className="ref-wrap">
        <section className="ref-hero">
          <div className="ref-hero-grid">
            <div>
              <div className="ref-greeting">GOOD FOOD • MADE FOR YOU</div>
              <h1>Discover your<br /><span>next favourite.</span></h1>
              <p>Browse local restaurants, discover Indian favourites and get your meal delivered without the hassle.</p>
              <form className="ref-search" onSubmit={searchFood} role="search">
                <span aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search food or restaurants" aria-label="Search food or restaurants" />
                <button type="submit">Search</button>
              </form>
            </div>
            <div className="ref-hero-card" aria-label="Featured food">
              <span className="ref-badge">🔥 Fresh from local kitchens</span>
              <div className="ref-hero-food" style={{ backgroundImage: `url(${FOOD.biryani})` }} />
            </div>
          </div>
        </section>

        <section className="ref-section">
          <div className="ref-head"><div><small>EXPLORE</small><h2>Categories</h2></div><Link href="/restaurants">See All →</Link></div>
          <div className="ref-cats">
            {CATEGORIES.map(([label, value, image]) => (
              <button key={value} className={`ref-cat ${activeCategory === value ? 'active' : ''}`} type="button" onClick={() => selectCategory(value)}>
                <span className="ref-cat-img" style={{ backgroundImage: `url(${image})` }} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="ref-section">
          <div className="ref-offer">
            <div><small>WELCOME TO TADKA</small><h2>Good food. Better first order.</h2><p>Explore live kitchens and discover your next favourite meal.</p></div>
            <Link href="/restaurants" className="btn">Order Now →</Link>
          </div>
        </section>

        <section className="ref-section">
          <div className="ref-head"><div><small>RECOMMENDED FOR YOU</small><h2>Popular Near You</h2></div><Link href="/restaurants">See All →</Link></div>
          <div className="ref-filters">
            {FILTERS.map((filter) => <button key={filter} type="button" className={activeFilter === filter ? 'active' : ''} onClick={() => setActiveFilter(filter)}>{filter}</button>)}
          </div>
          {loading ? <div className="ref-loading"><span /><span /><span /></div> : visibleRestaurants.length ? (
            <div className="ref-restaurants">
              {visibleRestaurants.map((restaurant, index) => (
                <Link className="ref-restaurant" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id}>
                  <div className="ref-restaurant-img" style={{ backgroundImage: `url(${restaurant.imageUrl || [FOOD.biryani, FOOD.paneer, FOOD.thali][index % 3]})` }}>
                    <span className="ref-live">●</span>
                  </div>
                  <div className="ref-restaurant-body">
                    <div className="ref-rating">★ {restaurant.rating || 'New'}</div>
                    <h3>{restaurant.name}</h3>
                    <p>{restaurant.cuisine || 'Indian cuisine'}</p>
                    <div className="ref-meta"><span>25–35 min</span><span>{Number(restaurant.deliveryFee || 0) ? `₹${restaurant.deliveryFee} delivery` : 'Free delivery'}</span></div>
                  </div>
                </Link>
              ))}
            </div>
          ) : <div className="ref-empty"><b>No live restaurants yet</b><span>Available restaurants will appear here automatically.</span><Link href="/restaurants">Browse all restaurants →</Link></div>}
        </section>

        <section className="ref-section ref-featured">
          <div className="ref-head"><div><small>FEATURED TODAY</small><h2>Something delicious</h2></div><Link href="/restaurants">Explore →</Link></div>
          <Link href="/restaurants" className="ref-feature-card">
            <div><small>INDIAN FAVOURITE</small><h2>Rich, comforting<br />Paneer Butter Masala</h2><p>Pair it with naan and make tonight easy.</p><b>Explore restaurants →</b></div>
            <div className="ref-feature-image" style={{ backgroundImage: `url(${FOOD.paneer})` }} />
          </Link>
        </section>

        <section className="ref-section ref-bottom-space">
          <div className="ref-head"><div><small>WHY TADKA</small><h2>Everything you need to order easy.</h2></div></div>
          <div className="ref-benefits"><article><b>01</b><strong>Live menus</strong><span>Browse restaurant catalogues that are actually connected to TADKA.</span></article><article><b>02</b><strong>Simple checkout</strong><span>Clear items, quantities, delivery and totals before placing an order.</span></article><article><b>03</b><strong>Real tracking</strong><span>Follow your order from kitchen confirmation to delivery.</span></article></div>
        </section>
      </div>
    </main>
  );
}
