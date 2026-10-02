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
      <div className="mx-auto w-full max-w-[1520px] px-6 lg:px-8">
        <section className="border-b border-tadka-line py-8 sm:py-10">
          <div className="grid items-center gap-8 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <div className="text-[10px] font-bold tracking-[0.13em] text-tadka-muted">AUTHENTIC INDIAN FOOD • AT YOUR DOORSTEP</div>
              <h1 className="mt-4 text-5xl font-bold leading-[0.98] tracking-[-0.05em] text-tadka-ink sm:text-6xl lg:text-[76px]">Good Food<br /><span className="text-tadka-orange">Brings Us Together.</span></h1>
              <p className="mt-5 max-w-[680px] text-base leading-7 text-tadka-muted">From local kitchens to your home, enjoy freshly prepared Indian meals with TADKA.</p>
              <form className="mt-7 flex h-16 max-w-[720px] items-center gap-2 rounded-xl border border-tadka-line bg-white p-1.5 shadow-tadka-md" onSubmit={searchFood} role="search">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-tadka-bg text-lg text-tadka-muted" aria-hidden="true">⌕</span>
                <input className="min-w-0 flex-1 bg-transparent px-1 text-base text-tadka-ink outline-none placeholder:text-tadka-subtle" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search for biryani, dosa, restaurants..." aria-label="Search food or restaurants" />
                <button className="rounded-lg bg-tadka-orange px-5 py-3.5 text-base font-semibold text-white transition hover:bg-tadka-orange-dark" type="submit">Find food</button>
              </form>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-tadka-muted"><span>Fast delivery</span><span>Freshly prepared</span><span>Safe &amp; reliable</span></div>
            </div>
            <div className="relative min-h-[380px] overflow-hidden rounded-tadka-xl border border-tadka-line bg-tadka-bg" aria-label="Featured Indian food">
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${FOOD.biryani})` }} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-5 text-white"><span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-white/75">Today's pick</span><strong className="mt-1 block text-3xl font-bold">Hyderabadi Biryani</strong></div>
            </div>
          </div>
        </section>

        <section className="py-10">
          <div className="mb-4 flex items-end justify-between gap-4"><div><small className="text-[10px] font-bold tracking-[0.12em] text-tadka-orange">BROWSE BY CRAVING</small><h2 className="mt-1 text-3xl font-bold tracking-tight text-tadka-ink sm:text-4xl">Choose your plate</h2></div><Link href="/restaurants">All cuisines →</Link></div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">{CATEGORIES.map(([label, value, image]) => (
            <button key={value} className={`flex flex-col items-center gap-2 rounded-tadka-md border border-transparent bg-white p-2 text-xs font-semibold text-tadka-ink transition ${activeCategory === value ? 'active' : ''}`} type="button" onClick={() => selectCategory(value)}>
              <span className="h-20 w-20 rounded-full border border-tadka-line bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${image})` }} /><span>{label}</span>
            </button>
          ))}</div>
        </section>

        <section className="py-5"><div className="flex items-center justify-between gap-6 rounded-tadka-xl border border-tadka-line bg-tadka-green-soft p-6">
          <div><small>FIRST ORDER SPECIAL</small><h2>Flat 50% off on your first order.</h2><p>Use code TADKA50 and discover your new favourite kitchen.</p></div>
          <Link href="/restaurants" className="btn">Order now →</Link>
        </div></section>

        <section className="py-10">
          <div className="mb-5 flex items-end justify-between gap-4"><div><small>POPULAR RESTAURANTS NEAR YOU</small><h2 className="text-3xl font-bold tracking-tight text-tadka-ink sm:text-4xl">Great food, close by.</h2></div><Link href="/restaurants">View all →</Link></div>
          <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{FILTERS.map((filter) => <button key={filter} type="button" className={`whitespace-nowrap rounded-full border px-3 py-2 text-xs font-semibold ${activeFilter === filter ? 'border-tadka-green bg-tadka-green text-white' : 'border-tadka-line bg-white text-tadka-ink'}`} onClick={() => setActiveFilter(filter)}>{filter}</button>)}</div>
          {loading ? <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{[1,2,3].map((item)=><div className="h-72 animate-pulse rounded-tadka-lg border border-tadka-line bg-tadka-bg" key={item}/>)}</div> : visibleRestaurants.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">{visibleRestaurants.map((restaurant, index) => (
              <Link className="overflow-hidden rounded-tadka-lg border border-tadka-line bg-white shadow-tadka-sm transition hover:-translate-y-0.5 hover:shadow-tadka-md" href={`/menu?restaurant=${restaurant.id}`} key={restaurant.id}>
                <div className="relative h-56 overflow-hidden bg-cover bg-center" style={{ backgroundImage: `url(${restaurant.imageUrl || [FOOD.biryani, FOOD.thali, FOOD.dosa, FOOD.samosa, FOOD.paneer, FOOD.noodles][index % 6]})` }}><span className="absolute left-3 top-3 rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-tadka-success shadow-sm">OPEN</span></div>
                <div className="p-4"><div className="text-xs font-bold text-tadka-green">★ {restaurant.rating || 'New'}</div><h3 className="mt-1 text-xl font-bold">{restaurant.name}</h3><p className="mt-1 text-sm text-tadka-muted">{restaurant.cuisine || 'Indian cuisine'}</p><div className="mt-3 flex gap-3 text-xs text-tadka-muted"><span>25–35 min</span><span>{Number(restaurant.deliveryFee || 0) ? `₹${restaurant.deliveryFee} delivery` : 'Free delivery'}</span></div></div>
              </Link>
            ))}</div>
          ) : <div className="flex flex-col items-center gap-2 rounded-tadka-lg border border-dashed border-tadka-line p-10 text-center"><b>No live restaurants yet</b><span>Available restaurants will appear here automatically.</span><Link href="/restaurants">Browse all restaurants →</Link></div>}
        </section>

        <section className="py-10 pb-16">
          <div className="mb-4 flex items-end justify-between gap-4"><div><small>FEATURED TODAY</small><h2 className="text-3xl font-bold tracking-tight text-tadka-ink sm:text-4xl">Desi flavours, delivered fresh.</h2></div><Link href="/restaurants">Explore →</Link></div>
          <Link href="/restaurants" className="grid overflow-hidden rounded-tadka-xl border border-tadka-line bg-tadka-green text-white md:grid-cols-2"><div className="p-9"><small>TADKA FAVOURITE</small><h2 className="mt-2 text-3xl font-bold">Paneer, naan,<br />and a little extra.</h2><p className="mt-3 text-base leading-7 text-white/80">Comforting Indian flavours from kitchens around you.</p><b>Find this near you →</b></div><div className="min-h-72 bg-cover bg-center md:order-2" style={{ backgroundImage: `url(${FOOD.paneer})` }} /></Link>
        </section>

        <section className="py-10 pb-20"><div className="mb-4 flex items-end justify-between gap-4"><div><small>WHY TADKA</small><h2 className="text-3xl font-bold tracking-tight text-tadka-ink sm:text-4xl">Good food. Simple ordering.</h2></div></div>
          <div className="grid gap-3 md:grid-cols-3"><article className="rounded-tadka-md border border-tadka-line bg-white p-5"><b className="text-xs text-tadka-orange">01</b><strong className="mt-2 block font-semibold text-tadka-ink">Fresh kitchens</strong><span className="mt-2 block text-sm leading-6 text-tadka-muted">Discover live menus from local restaurants connected to TADKA.</span></article><article className="rounded-tadka-md border border-tadka-line bg-white p-5"><b className="text-xs text-tadka-orange">02</b><strong className="mt-2 block font-semibold text-tadka-ink">Clear pricing</strong><span className="mt-2 block text-sm leading-6 text-tadka-muted">See items, quantities, delivery and totals before you order.</span></article><article className="rounded-tadka-md border border-tadka-line bg-white p-5"><b className="text-xs text-tadka-orange">03</b><strong className="mt-2 block font-semibold text-tadka-ink">Live journey</strong><span className="mt-2 block text-sm leading-6 text-tadka-muted">Track your order from kitchen confirmation through delivery.</span></article></div>
        </section>
      </div>
    </main>
  );
}
