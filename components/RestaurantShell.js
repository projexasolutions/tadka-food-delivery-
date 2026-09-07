'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const NAV_ITEMS = [
  ['Overview', '/restaurant'], ['Live Orders', '/restaurant/orders'], ['Menu Management', '/restaurant/menu'],
  ['Categories', '/restaurant/categories'], ['Analytics & Revenue', '/restaurant/analytics'], ['Customer Reviews', '/restaurant/reviews'],
  ['Restaurant Profile', '/restaurant/profile'], ['Notifications', '/restaurant/notifications'],
];

export default function RestaurantShell({ children, title, subtitle }) {
  const pathname = usePathname();
  const [restaurant, setRestaurant] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/v1/restaurant`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load restaurant.');
        return body?.data;
      })
      .then((data) => { if (active) setRestaurant(data || null); })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  async function toggleKitchen() {
    if (!restaurant || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${apiUrl}/v1/restaurant`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isOpen: !restaurant.isOpen }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update kitchen.');
      setRestaurant(body.data);
    } catch (err) { setError(err.message); }
    finally { setBusy(false); }
  }

  return (
    <div className="partner-app">
      <aside className="partner-sidebar">
        <Link href="/" className="partner-brand"><span className="partner-logo">T</span><span>TADKA <small>PARTNER HUB</small></span></Link>
        <div className="partner-restaurant-card">
          <span className="verified">VERIFIED KITCHEN</span>
          <button type="button" onClick={toggleKitchen} disabled={!restaurant || busy} className={`partner-open ${restaurant?.isOpen ? 'on' : 'off'}`}><i /> {restaurant?.isOpen ? 'OPEN' : 'CLOSED'}</button>
          <b>{restaurant?.name || 'Your Restaurant'}</b><span>{restaurant?.cuisine || 'Restaurant partner'}</span>
        </div>
        <nav className="partner-nav" aria-label="Restaurant navigation">{NAV_ITEMS.map(([label, href]) => <Link key={href} href={href} className={pathname === href ? 'active' : ''}><span>{label}</span>{label === 'Live Orders' && <em>LIVE</em>}</Link>)}</nav>
        <div className="partner-sidebar-bottom">
          <div className="kitchen-chime"><span>Kitchen Chime</span><b>ON</b><small>{restaurant?.isOpen ? 'Accepting Orders' : 'Paused'}</small></div>
          <Link href="/account" className="partner-user"><span className="avatar">R</span><span><b>Restaurant Manager</b><small>Partner account</small></span><span>⋮</span></Link>
        </div>
      </aside>
      <main className="partner-main">
        <header className="partner-topbar">
          <form onSubmit={(event) => event.preventDefault()} className="partner-search"><input placeholder="Search orders, dishes, or customers" aria-label="Search restaurant data" /></form>
          <div className="partner-top-actions"><span className="kitchen-live"><i /> Kitchen Active</span><Link href="/restaurant/menu#add" className="partner-add">+ Add New Dish</Link><Link href="/restaurant/notifications" className="icon-action" aria-label="Notifications">Alerts</Link><Link href="/restaurant/profile" className="avatar" aria-label="Restaurant profile">R</Link></div>
        </header>
        <div className="partner-content">
          <div className="partner-page-title"><div><span className="partner-kicker">{title || 'RESTAURANT PARTNER'}</span><h1>{subtitle || 'Your restaurant command center'}</h1></div>{error && <span className="partner-inline-error">{error}</span>}</div>
          {children}
        </div>
      </main>
    </div>
  );
}
