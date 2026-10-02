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
    <main className="min-h-screen bg-white">
      <div className="mx-auto w-full max-w-[1240px] px-5">
        <section className="border-b border-tadka-line">
          <div className="border-b border-tadka-line-grid">
            <div>
              <div className="text-[10px] font-bold tracking-[0.13em] text-tadka-muted">AUTHENTIC INDIAN FOOD • AT YOUR DOORSTEP</div>
              <h1 className="mt-4 text-4xl font-bold leading-[1.02] tracking-[-0.045em] text-tadka-ink sm:text-5xl lg:text-6xl">Good Food<br /><span className="text-tadka-orange">Brings Us Together.</span></h1>
              <p className="mt-4 max-w-[610px] text-[15px] leading-7 text-tadka-muted">From local kitchens to your home, enjoy freshly prepared Indian meals with TADKA.</p>
              <form className="mt-6 flex max-w-[650px] items-center gap-2 rounded-xl border border-tadka-line bg-white p-1.5 shadow-tadka-md" onSubmit={searchFood} role="search">
                <span className="mt-6 flex max-w-[650px] items-center gap-2 rounded-xl border border-tadka-line bg-white p-1.5 shadow-tadka-md-icon" aria-hidden="true">⌕</span>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for biryani, dosa, restaurants..." aria-label="Search food or restaurants" />
                <button className="rounded-lg bg-tadka-orange px-4 py-3 text-sm font-semibold text-white transition hover:bg-tadka-orange-dark" type="submit">Find food</button>
              </form>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-tadka-muted"><span>Fast delivery</span><span>Freshly prepared</span><span>Safe &amp; reliable</span></div>
            </div>
            <div className="border-b border-tadka-line-card" aria-label="Featured Indian food">
              <div className="border-b border-tadka-line-image-main" style={{ backgroundImage: `url(${FOOD.biryani})` }} />
              <div className="border-b border-tadka-line-mini" style={{ backgroundImage: `url(${FOOD.dosa})` }} />
              <div className="border-b border-tadka-line-tag"><strong>Today's pick</strong><span>Hyderabadi Biryani</span></div>
            </div>
          </div>
        </section>

        <section className="py-7">
          <div className="mb-4 flex items-end justify-between gap-4"><div><small>BROWSE BY CRAVING</small><h2>Choose your plate</h2></div><Link href="/restaurants">All cuisines →</Link></div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">{CATEGORIES.map(([label, value, image]) => (
            <button key={value} className={`flex flex-col items-center gap-2 rounded-tadka-md border border-transparent bg-white p-2 text-xs font-semibold text-tadka-ink transition ${activeCategory === value ? 'active' : ''}`} type="button" onClick={() => selectCategory(value)}>
              <span className="flex flex-col items-center gap-2 rounded-tadka-md border border-transparent bg-white p-2 text-xs font-semibold text-tadka-ink transition-img" style={{ backgroundImage: `url(${image})` }} /><span>{label}</span>
            </button>
          ))}</div>
        </section>

        <section className="py-7"><div className="flex items-center justify-between gap-6 rounded-tadka-xl border border-tadka-line bg-tadka-green-soft p-6">
          <div><small>FIRST ORDER SPECIAL</small><h2>Flat 50% off on your first order.</h2><p>Use code TADKA50 and discover your new favourite kitchen.</p></div>
          <Link href="/restaurants" className="btn">Order now →</Link>
        </div></section>

        <section className="py-7">
          <div className="mb-4 flex items-end justify-between gap-4"><div><small>POPULAR RESTAURANTS NEAR YOU</small><h2>Great food, close by.</h2></div><Link href="/restaurants">View all →</Link></div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{FILTERS.map((filter) => <button key={filter} type="button" className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${activeFilter === filter ? 'border-tadka-green bg-tadka-green text-white' : 'border-tadka-line bg-white text-tadka-ink'}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>
          {loading ? <div className="flex gap-2 py-10"><span /><span /><span /></div> : visibleRestaurants.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleRestaurants.map((restaurant, index) => (
              <Link className="overflow-hidden rounded-tadka-lg border border-tadka-line bg-white shadow-tadka-sm transition hover:-translate-y-0.5 hover:shadow-tadka-md" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id}>
                <div className="overflow-hidden rounded-tadka-lg border border-tadka-line bg-white shadow-tadka-sm transition hover:-translate-y-0.5 hover:shadow-tadka-md-img" style={{ backgroundImage: `url(${restaurant.imageUrl || [FOOD.biryani, FOOD.thali, FOOD.dosa, FOOD.samosa, FOOD.paneer, FOOD.noodles][index % 6]})` }}><span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-tadka-success shadow-sm">OPEN</span></div>
                <div className="overflow-hidden rounded-tadka-lg border border-tadka-line bg-white shadow-tadka-sm transition hover:-translate-y-0.5 hover:shadow-tadka-md-body"><div className="text-xs font-bold text-tadka-green">★ {restaurant.rating || 'New'}</div><h3>{restaurant.name}</h3><p>{restaurant.cuisine || 'Indian cuisine'}</p><div className="mt-3 flex gap-3 text-xs text-tadka-muted"><span>25–35 min</span><span>{Number(restaurant.deliveryFee || 0) ? `₹${restaurant.deliveryFee} delivery` : 'Free delivery'}</span></div></div>
              </Link>
            ))}</div>
          ) : <div className="flex flex-col items-center gap-2 rounded-tadka-lg border border-dashed border-tadka-line p-10 text-center"><b>No live restaurants yet</b><span>Available restaurants will appear here automatically.</span><Link href="/restaurants">Browse all restaurants →</Link></div>}
        </section>

        <section className="py-7 pb-12">
          <div className="mb-4 flex items-end justify-between gap-4"><div><small>FEATURED TODAY</small><h2>Desi flavours, delivered fresh.</h2></div><Link href="/restaurants">Explore →</Link></div>
          <Link href="/restaurants" className="grid overflow-hidden rounded-tadka-xl border border-tadka-line bg-tadka-green text-white md:grid-cols-2"><div className="p-7"><small>TADKA FAVOURITE</small><h2>Paneer, naan,<br />and a little extra.</h2><p>Comforting Indian flavours from kitchens around you.</p><b>Find this near you →</b></div><div className="min-h-64 bg-cover bg-center md:order-2" style={{ backgroundImage: `url(${FOOD.paneer})` }} /></Link>
        </section>

        <section className="py-7 pb-20"><div className="mb-4 flex items-end justify-between gap-4"><div><small>WHY TADKA</small><h2>Good food. Simple ordering.</h2></div></div>
          <div className="grid gap-3 md:grid-cols-3"><article className="rounded-tadka-md border border-tadka-line bg-white p-5"><b className="text-xs text-tadka-orange">01</b><strong className="mt-2 block font-semibold text-tadka-ink">Fresh kitchens</strong><span className="mt-2 block text-sm leading-6 text-tadka-muted">Discover live menus from local restaurants connected to TADKA.</span></article><article className="rounded-tadka-md border border-tadka-line bg-white p-5"><b className="text-xs text-tadka-orange">02</b><strong className="mt-2 block font-semibold text-tadka-ink">Clear pricing</strong><span className="mt-2 block text-sm leading-6 text-tadka-muted">See items, quantities, delivery and totals before you order.</span></article><article className="rounded-tadka-md border border-tadka-line bg-white p-5"><b className="text-xs text-tadka-orange">03</b><strong className="mt-2 block font-semibold text-tadka-ink">Live journey</strong><span className="mt-2 block text-sm leading-6 text-tadka-muted">Track your order from kitchen confirmation through delivery.</span></article></div>
        </section>
      </div>
    </main>
  );
}
