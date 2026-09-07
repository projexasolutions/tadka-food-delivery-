'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

const FOOD_IMAGES = [
  'https://lh3.googleusercontent.com/aida-public/AB6AXuBngYjPaRuOIOXT9NHPutx2xcNAamjHZqrr_tFGYFgFqM1gu0wfRZIgKQVRhlNy3UZqZGJioLT0LoSL3VtvKjTThMe9E0GNuRsRQGJBPbqbhOwyVschj_r1HemZu-z1PZ4-6kT9VVtGDqiTg6XpV0ERMO2CCEY6AF4TMm_8v2OtjpvO2vpK-ryzCuqXUHzDEiBH8Fmla07fBS4y44vRqktE_KIqFqHTDkudhnprcPh9_mm0ooXKV5TO',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuB3LqcswcWk0_9nnl3XZ8n62ypNXVK9R84hWXIlBRktv8O0oSwfmU-O-R5QtgNKXP4mNSSmiMPYk3L4h3M8zDbpptAKQcVD-8w-H-UVsDWhNqwljv6lFAsOKSQhnz6Y-OJj645WkQ8NMBcDmXQNku47PeDQg_798jras-N9GP9kiPKFN-eEnEz0SXXnUx0G2BfczgMYThd2DbYCU0MoKz4WHm2XbVcvhDMHP7Kx1UdvD83dclGzylmhp',
  'https://lh3.googleusercontent.com/aida-public/AB6AXuDGsCNOY6UVTwdV0SSu61F0RVtoyPG3kafTVcX6q1naEMpE23azB25dr7XmwwMTldvt1QGviwk5kwAY5DdiSwmxorSpRXS2pUcJJLekB6ApL_VzSXhLDStv82P1132AAUyx_VaCE2Njqh9f6bP6y1R1Jy40BO7vm6VsdP0cWPdY3bS985pDdJjr4taccABAvpvES7rZ3-h8CpelsrnmFweqqAztkmIPFlZ1Kg2d8yZZk3dqij8sXLkA',
];

const CATEGORIES = [
  ['rice_bowl', 'Biryani', 'biryani'], ['soup_kitchen', 'North Indian', 'north indian'],
  ['dinner_dining', 'South Indian', 'south indian'], ['fastfood', 'Chaat & Street', 'chaat'],
  ['outdoor_grill', 'Tandoor & Kebabs', 'tandoor'], ['eco', 'Healthy Bowls', 'healthy'],
  ['cake', 'Artisanal Sweets', 'sweet'],
];
const COLLECTIONS = [
  ['Chef’s Table Signatures', 'Elevated kitchens and slow-cooked classics', 'Top rated'],
  ['Late Night Cravings', 'Comfort food, snacks and bowls', 'Fast Delivery'],
  ['Healthy & High Protein', 'Macro-conscious meals without compromise', 'Healthy'],
];
const SPOTLIGHT_DISHES = ['Old Delhi Butter Chicken', 'Ghee Benne Masala Dosa', 'Smoked Galouti Medallions', 'Kesar Pistachio Malpua'];
const FILTERS = ['Pure Veg', '★ Rating 4.0+', 'Fast Delivery (<30m)', 'Gourmet Guild', 'Offers & Freebies', 'Sort By: Recommended'];
const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function Home() {
  const router = useRouter(); const spotlightRef = useRef(null);
  const [search, setSearch] = useState(''); const [activeCategory, setActiveCategory] = useState('biryani');
  const [activeFilter, setActiveFilter] = useState(''); const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/v1/restaurants`, { signal: controller.signal, cache: 'no-store' })
      .then((response) => response.ok ? response.json() : Promise.reject(new Error('Unable to load restaurants.')))
      .then((body) => setRestaurants((body.data || []).slice(0, 6)))
      .catch((error) => { if (error.name !== 'AbortError') setRestaurants([]); });
    return () => controller.abort();
  }, []);

  function findFood(event) { event.preventDefault(); const value = search.trim(); router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : '/restaurants'); }
  function selectFilter(label) {
    setActiveFilter(label);
    if (label === 'Pure Veg') return router.push('/restaurants?filter=veg');
    if (label.includes('Rating')) return router.push('/restaurants?filter=rating');
    if (label.includes('Offers')) return router.push('/restaurants?filter=offers');
    router.push('/restaurants');
  }

  return <main className="home">
    <section className="home-hero"><div className="home-hero-inner"><div className="hero-copy">
      <span className="hero-kicker"><i /> Curated kitchens. Everyday cravings.</span>
      <h1>Crafted flavors,<br /><span>delivered in 30 mins.</span></h1>
      <p>Discover dishes worth leaving the kitchen for — delivered fresh to your door.</p>
      <form className="hero-search" onSubmit={findFood} role="search"><span className="material-symbols-outlined search-icon" aria-hidden="true">search</span><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search dishes, restaurants, cuisines..." aria-label="Search dishes" /><button className="primary" type="submit">Find Food <span className="material-symbols-outlined" aria-hidden="true">arrow_forward</span></button></form>
      <div className="meta hero-meta"><span>✓ Food-first experience</span><span>✓ Curated kitchens</span><span>✓ Clear pricing</span></div>
    </div><div className="hero-visual"><div className="hero-food" style={{ backgroundImage: `url(${FOOD_IMAGES[0]})` }} aria-hidden="true" /><div className="hero-note"><b>Chef's pick tonight</b>Royal Tadka Platter · 24 mins</div></div></div></section>

    <section className="section section-tight"><div className="section-head"><span className="eyebrow">What are you craving today?</span><Link href="/restaurants">Explore all →</Link></div><div className="chip-row">{CATEGORIES.map(([icon, label, value]) => <button type="button" className={`food-chip ${activeCategory === value ? 'active' : ''}`} key={label} onClick={() => { setActiveCategory(value); router.push(`/restaurants?cuisine=${encodeURIComponent(value)}`); }}><span className="material-symbols-outlined" aria-hidden="true">{icon}</span>{label}</button>)}</div></section>
    <div className="filter-bar"><div className="filter-inner">{FILTERS.map((filter) => <button type="button" key={filter} className={`filter-chip ${activeFilter === filter ? 'active' : ''}`} onClick={() => selectFilter(filter)}>{filter}</button>)}</div></div>

    <section className="section"><div className="section-head"><div><span className="eyebrow">Hand-plated stories</span><h2>Curated Collections</h2></div><Link href="/restaurants">View all series →</Link></div><div className="collection-grid">{COLLECTIONS.map(([title, text, filter], index) => <button type="button" className="collection collection-button" key={title} style={{ backgroundImage: `url(${FOOD_IMAGES[index]})` }} onClick={() => router.push(`/restaurants?collection=${encodeURIComponent(filter)}`)}><div className="collection-content"><span className="eyebrow collection-kicker">Curated series</span><h3>{title}</h3><p>{text}</p></div></button>)}</div></section>

    <section className="section spotlight-section"><div className="section-head"><div><span className="eyebrow">Instant plating</span><h2>Must-Try Dish Spotlight</h2></div><div className="meta"><button type="button" className="filter-chip" onClick={() => spotlightRef.current?.scrollBy({ left: -330, behavior: 'smooth' })} aria-label="Previous dishes">‹</button><button type="button" className="filter-chip" onClick={() => spotlightRef.current?.scrollBy({ left: 330, behavior: 'smooth' })} aria-label="Next dishes">›</button></div></div><div className="dish-strip" ref={spotlightRef}>{SPOTLIGHT_DISHES.map((name, index) => <article className="dish-card" key={name}><div className="dish-image" style={{ backgroundImage: `url(${FOOD_IMAGES[index % FOOD_IMAGES.length]})` }} /><div className="dish-body"><span className="eyebrow">Chef pick</span><h3>{name}</h3><p>Freshly prepared by a Tadka kitchen and available through the live menu.</p><div className="dish-foot"><span className="price">Explore</span><Link className="add-mini" href="/restaurants">FIND KITCHEN</Link></div></div></article>)}</div></section>

    <section className="section"><div className="section-head"><div><span className="eyebrow">Live catalogue</span><h2>Top Curated Kitchens</h2></div><span className="muted section-note">Showing active kitchens</span></div>{restaurants.length ? <div className="restaurantGrid">{restaurants.map((restaurant) => <Link className="restaurant" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id}><div className="restaurantImage" style={{ backgroundImage: `url(${restaurant.imageUrl || FOOD_IMAGES[0]})` }} /><div className="restaurantBody"><div className="eyebrow">Open kitchen</div><h3>{restaurant.name}</h3><p>{restaurant.cuisine || 'Food & beverages'}</p><div className="meta"><span>★ {restaurant.rating || 'New'}</span><span>• 25–35 min</span><span>• ₹{restaurant.deliveryFee || 0} delivery</span></div></div></Link>)}</div> : <div className="card empty-state"><h3>No kitchens are live yet.</h3><p className="muted">Once restaurants are available, they will appear here automatically.</p><Link className="primary" href="/restaurants">Browse restaurants</Link></div>}</section>

    <section className="section pledge-section"><div className="card pledge-card"><div><span className="eyebrow">Our culinary pledge</span><h2 className="pledge-title">The Tadka Safe–Plating &amp; Transit Standard</h2><p className="muted">Every dish is handled with food-first packaging, careful preparation and accountable delivery standards.</p></div><div className="grid pledge-points"><div className="card pledge-point"><b>Food-first</b><small className="muted">Careful preparation</small></div><div className="card pledge-point"><b>Tamper-proof</b><small className="muted">Sealed packaging</small></div><div className="card pledge-point"><b>Live status</b><small className="muted">Track your order</small></div></div></div></section>
    <footer className="site-footer"><div className="footer-inner"><div><div className="site-brand"><span className="brand-mark">T</span>Tadka</div><p className="muted footer-copy">Elevated regional gastronomy with frictionless delivery, thoughtful packaging and dependable operations.</p></div><div><h4>Culinary curation</h4><Link href="/restaurants">Chef's Tasting Menus</Link><Link href="/restaurants">Artisanal Kitchens</Link><Link href="/restaurants">Slow-Cooked Specials</Link></div><div><h4>Partner with us</h4><Link href="/restaurant/onboard">Kitchen Onboarding</Link><Link href="/restaurant">Kitchen Standards</Link><Link href="/admin">Operations</Link></div><div><h4>Explore Tadka</h4><p className="muted footer-note">A fast, focused ordering experience across devices.</p><Link className="secondary" href="/restaurants">Start ordering</Link></div></div><div className="footer-bottom"><div className="footer-bottom-inner">© 2026 Tadka Technologies · Crafted for food lovers.</div></div></footer>
  </main>;
}
