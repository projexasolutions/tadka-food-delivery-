'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const FOOD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBngYjPaRuOIOXT9NHPutx2xcNAamjHZqrr_tFGYFgFqM1gu0wfRZIgKQVRhlNy3UZqZGJioLT0LoSL3VtvKjTThMe9E0GNuRsRQGJBPbqbhOwyVschj_r1HemZu-z1PZ4-6kT9VVtGDqiTg6XpV0ERMO2CCEY6AF4TMm_8v2OtjpvO2vpK-ryzCuqXUHzDEiBH8Fmla07fBS4y44vRqktE_KIqFqHTDkudhnprcPh9_mm0ooXKV5TO',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB3LqcswcWk0_9nnl3XZ8n62ypNXVK9R84hWXIlBRktv8O0oSwfmU-O-R5QtgNKXP4mNSSmiMPYk3L4h3M8zDbpptAKQcVD-8w-H-UVsDWhNqwljv6lFAsOKSQhnz6Y-OJj645WkQ8NMBcDmXQNku47PeDQg_798jras-N9GP9kiPKFN-eEnEz0SXXnUx0G2BfczgMYThd2DbYCU0MoKz4WHm2XbVcvhDMHP7Kx1UdvD83dclGzylmhp',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDGsCNOY6UVTwdV0SSu61F0RVtoyPG3kafTVcX6q1naEMpE23azB25dr7XmwwMTldvt1QGviwk5kwAY5DdiSwmxorSpRXS2pUcJJLekB6ApL_VzSXhLDStv82P1132AAUyx_VaCE2Njqh9f6bP6y1R1Jy40BO7vm6VsdP0cWPdY3bS985pDdJjr4taccABAvpvES7rZ3-h8CpelsrnmFweqqAztkmIPFlZ1Kg2d8yZZk3dqij8sXLkA',
];
const CATEGORIES = [
  ['🍛', 'Biryani', 'biryani'], ['🥘', 'North Indian', 'north indian'], ['🥞', 'South Indian', 'south indian'],
  ['🌶️', 'Street Food', 'chaat'], ['🔥', 'Tandoor', 'tandoor'], ['🥗', 'Healthy', 'healthy'], ['🍮', 'Desserts', 'sweet'],
];
const COLLECTIONS = [
  ['Dinner Sorted', 'Comforting Indian classics for tonight', 'Top rated', FOOD_IMAGES[0]],
  ['Quick Bites', 'Fast delivery for hungry moments', 'Fast Delivery', FOOD_IMAGES[1]],
  ['Better Choices', 'Fresh, lighter meals that still taste good', 'Healthy', FOOD_IMAGES[2]],
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
    return list.slice(0, 8);
  }, [restaurants, activeFilter]);

  function findFood(event) {
    event.preventDefault();
    const value = search.trim();
    router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : '/restaurants');
  }

  return (
    <main className="tadka-home">
      <section className="home-v4-hero">
        <div className="home-v4-hero-inner">
          <div className="home-v4-copy">
            <span className="home-v4-kicker">TADKA • GOOD FOOD, RIGHT NOW</span>
            <h1>What are you<br /><em>craving?</em></h1>
            <p>Discover great Indian food from kitchens around you. Freshly prepared, clearly priced, delivered without the fuss.</p>
            <form className="home-v4-search" onSubmit={findFood} role="search">
              <span aria-hidden="true">⌕</span>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for biryani, pizza, restaurants..." aria-label="Search food" />
              <button type="submit">Search</button>
            </form>
            <div className="home-v4-trust"><span>✓ Live menus</span><span>✓ Clear pricing</span><span>✓ Real order tracking</span></div>
          </div>
          <div className="home-v4-visual">
            <div className="home-v4-image" style={{ backgroundImage: `url(${FOOD_IMAGES[0]})` }} />
            <div className="home-v4-floating"><span>🔥</span><div><b>Made fresh</b><small>from local kitchens</small></div></div>
          </div>
        </div>
      </section>

      <section className="home-v4-section home-v4-categories">
        <div className="home-v4-heading"><div><small>EXPLORE</small><h2>What do you feel like?</h2></div><Link href="/restaurants">See all →</Link></div>
        <div className="home-v4-category-row">
          {CATEGORIES.map(([icon, label, value]) => (
            <button key={value} type="button" className={`home-v4-category ${activeCategory === value ? 'active' : ''}`} onClick={() => { setActiveCategory(value); router.push(`/restaurants?cuisine=${encodeURIComponent(value)}`); }}>
              <span>{icon}</span><b>{label}</b>
            </button>
          ))}
        </div>
      </section>

      <section className="home-v4-promo">
        <div className="home-v4-promo-copy"><span>TONIGHT'S EASY WIN</span><h2>Find something<br />you'll love.</h2><p>Browse live kitchens, compare menus and place an order in a few taps.</p><Link href="/restaurants" className="home-v4-promo-button">Explore restaurants →</Link></div>
        <div className="home-v4-promo-food" style={{ backgroundImage: `url(${FOOD_IMAGES[1]})` }} />
      </section>

      <section className="home-v4-section">
        <div className="home-v4-heading"><div><small>NEARBY & LIVE</small><h2>Top kitchens for you</h2></div><Link href="/restaurants">View all →</Link></div>
        <div className="home-v4-filters">{FILTERS.map((filter) => <button key={filter} type="button" className={activeFilter === filter ? 'active' : ''} onClick={() => { setActiveFilter(filter); if (filter === 'Fast Delivery') router.push('/restaurants?filter=fast'); }}>{filter}</button>)}</div>
        {loading ? <div className="home-v4-loading"><span /> <span /> <span /></div> : visibleRestaurants.length ? (
          <div className="home-v4-restaurants">
            {visibleRestaurants.map((restaurant, index) => (
              <Link className="home-v4-restaurant" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id}>
                <div className="home-v4-restaurant-image" style={{ backgroundImage: `url(${restaurant.imageUrl || FOOD_IMAGES[index % FOOD_IMAGES.length]})` }}><span>● LIVE</span></div>
                <div className="home-v4-restaurant-body"><div className="home-v4-rating">★ {restaurant.rating || 'New'}</div><h3>{restaurant.name}</h3><p>{restaurant.cuisine || 'Indian & more'} · 25–35 min</p><small>{Number(restaurant.deliveryFee || 0) ? `₹${restaurant.deliveryFee} delivery` : 'Free delivery'}</small></div>
              </Link>
            ))}
          </div>
        ) : <div className="home-v4-empty"><h3>No live kitchens yet</h3><p>Once a restaurant is open and available, it will appear here automatically.</p><Link href="/restaurants">Browse restaurants</Link></div>}
      </section>

      <section className="home-v4-section">
        <div className="home-v4-heading"><div><small>CURATED FOR YOU</small><h2>Pick a mood</h2></div></div>
        <div className="home-v4-collections">
          {COLLECTIONS.map(([title, text, filter, image]) => <Link href={`/restaurants?collection=${encodeURIComponent(filter)}`} className="home-v4-collection" key={title} style={{ backgroundImage: `url(${image})` }}><div><small>{filter}</small><h3>{title}</h3><p>{text}</p><b>Explore →</b></div></Link>)}
        </div>
      </section>

      <section className="home-v4-section home-v4-why"><div><small>WHY TADKA</small><h2>Ordering should feel easy.</h2></div><div className="home-v4-benefits"><article><span>01</span><h3>Real menus</h3><p>What you see comes from the restaurant's live catalogue.</p></article><article><span>02</span><h3>Honest checkout</h3><p>Totals are calculated server-side before your order is placed.</p></article><article><span>03</span><h3>Track the journey</h3><p>Follow your order from kitchen to doorstep with live status updates.</p></article></div></section>
    </main>
  );
}
