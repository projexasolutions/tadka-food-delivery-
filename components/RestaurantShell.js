'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import RestaurantSidebar from '@/components/restaurant/RestaurantSidebar';
import RestaurantTopbar from '@/components/restaurant/RestaurantTopbar';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const NAV_ITEMS = [['Overview','/restaurant'],['Live Orders','/restaurant/orders'],['Menu Management','/restaurant/menu'],['Categories','/restaurant/categories'],['Analytics & Revenue','/restaurant/analytics'],['Customer Reviews','/restaurant/reviews'],['Restaurant Profile','/restaurant/profile'],['Notifications','/restaurant/notifications']];

export default function RestaurantShell({ children, title, subtitle }) {
  const pathname = usePathname();
  const [restaurant, setRestaurant] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/v1/restaurant`, { credentials:'include', cache:'no-store' })
      .then(async response => { const body = await response.json().catch(()=>null); if (!response.ok) throw new Error(body?.error?.message || 'Unable to load restaurant.'); return body?.data; })
      .then(data => { if (active) { setRestaurant(data || null); setError(''); } })
      .catch(err => { if (active) { setRestaurant(null); setError(err.message); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch(`${apiUrl}/v1/notifications`, { credentials:'include', cache:'no-store' });
        const body = await response.json().catch(()=>null);
        if (response.ok && active) setNotifications(Array.isArray(body?.data) ? body.data : []);
      } catch {}
    };
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function toggleKitchen() {
    if (!restaurant || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${apiUrl}/v1/restaurant`, { method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({isOpen:!restaurant.isOpen}) });
      const body = await response.json().catch(()=>null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update kitchen.');
      setRestaurant(body.data);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (restaurant === undefined) return <div className="min-h-screen bg-tadka-bg"><main className="min-h-screen min-w-0 lg:pl-0"><div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8"><div className="grid min-h-[240px] place-items-center rounded-2xl border border-tadka-line bg-white p-8 text-center shadow-tadka-sm"><span className="text-[10px] font-black tracking-[.14em] text-tadka-orange">RESTAURANT PARTNER</span><h2>Checking restaurant access…</h2><p>Loading your assigned restaurant and permissions.</p></div></div></main></div>;

  if (restaurant === null) return (
    <div className="min-h-screen bg-tadka-bg">
      <aside className="hidden min-h-screen border-r border-tadka-line bg-white lg:block">
        <Link href="/" className="flex items-center gap-3 p-6 text-sm font-black text-tadka-green"><span className="grid h-10 w-10 place-items-center rounded-xl bg-tadka-orange text-lg font-black text-white">T</span><span>TADKA <small>PARTNER HUB</small></span></Link>
        <div className="mx-4 grid gap-2 rounded-2xl border border-orange-100 bg-orange-50 p-4"><span className="text-[10px] font-black tracking-wider text-tadka-muted">ACCOUNT STATUS</span><span className="w-fit rounded-full bg-white px-2.5 py-1 text-[9px] font-black text-tadka-danger">ACCESS REQUIRED</span><b>No restaurant assigned</b><span>Administrator assignment required</span></div>
        <nav className="grid gap-1 p-4"><Link href="/account" className="rounded-xl bg-tadka-green px-3 py-2.5 text-sm font-bold text-white"><span>Account</span></Link><Link href="/"><span>Back to Tadka</span></Link></nav>
        <div className="mt-auto p-4"><Link href="/account" className="flex items-center gap-3 rounded-xl border border-tadka-line p-3"><span className="grid h-9 w-9 place-items-center rounded-full bg-tadka-green text-sm font-bold text-white">R</span><span><b>Partner account</b><small>View account</small></span></Link></div>
      </aside>
      <main className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden">
        <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between border-b border-tadka-line bg-white/95 px-4 backdrop-blur sm:px-6"><div className="flex items-center gap-2 text-xs font-bold text-tadka-muted"><span className="h-2 w-2 rounded-full bg-tadka-danger" /> Restaurant access unavailable</div><Link href="/account" className="rounded-xl bg-tadka-orange px-4 py-2.5 text-xs font-black text-white hover:bg-tadka-orange-dark">Open Account</Link></header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden scrollbar-gutter-stable p-4 sm:p-6 lg:p-8"><div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">{title || 'RESTAURANT PARTNER'}</span><h1>Restaurant access required</h1></div></div><div className="mx-auto mt-6 grid max-w-[780px] place-items-center rounded-2xl border border-dashed border-tadka-line bg-white p-8 text-center shadow-tadka-sm sm:p-14"><span className="text-[10px] font-black uppercase tracking-[.12em] text-tadka-muted">RESTAURANT</span><h2>{error || 'No restaurant is assigned to this account.'}</h2><p>Your administrator must assign this account the <b>Restaurant Staff</b> role and an approved restaurant before restaurant tools become available.</p><div className="flex flex-wrap gap-2"><Link className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white" href="/account">Back to account</Link><Link className="rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink" href="/">Browse Tadka</Link></div></div></div>
      </main>
    </div>
  );

  const restaurantView = { ...restaurant, busy, pathname, onToggle: toggleKitchen };
  return (
    <div className="flex h-screen min-h-0 w-full overflow-hidden bg-tadka-bg">
      <RestaurantSidebar restaurant={restaurantView} navItems={NAV_ITEMS} />
      <main className="partner-main">
        <RestaurantTopbar restaurant={restaurant} notifications={notifications} />
        <div className="partner-content">
          <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">{title || 'RESTAURANT PARTNER'}</span><h1>{subtitle || 'Your restaurant command center'}</h1></div>{error && <span className="rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-xs font-bold text-tadka-danger">{error}</span>}</div>
          {children}
        </div>
      </main>
    </div>
  );
}
