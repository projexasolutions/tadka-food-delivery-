'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const NAV_ITEMS = [
  ['Overview', '/restaurant'],
  ['Live Orders', '/restaurant/orders'],
  ['Menu Management', '/restaurant/menu'],
  ['Categories', '/restaurant/categories'],
  ['Analytics & Revenue', '/restaurant/analytics'],
  ['Customer Reviews', '/restaurant/reviews'],
  ['Restaurant Profile', '/restaurant/profile'],
  ['Notifications', '/restaurant/notifications'],
];

export default function RestaurantShell({ children, title, subtitle }) {
  const pathname = usePathname();
  const [restaurant, setRestaurant] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadRestaurant() {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) return;

      const { data, error: queryError } = await supabase
        .from('restaurants')
        .select('id,name,cuisine,is_open')
        .eq('owner_id', auth.user.id)
        .maybeSingle();

      if (active) {
        if (queryError) setError(queryError.message);
        setRestaurant(data || null);
      }
    }

    loadRestaurant();
    return () => { active = false; };
  }, []);

  async function toggleKitchen() {
    if (!restaurant || busy) return;

    setBusy(true);
    setError('');
    const isOpen = !restaurant.is_open;
    const { error: updateError } = await supabase
      .from('restaurants')
      .update({ is_open: isOpen })
      .eq('id', restaurant.id);

    if (updateError) setError(updateError.message);
    else setRestaurant((current) => ({ ...current, is_open: isOpen }));
    setBusy(false);
  }

  return (
    <div className="partner-app">
      <aside className="partner-sidebar">
        <Link href="/" className="partner-brand">
          <span className="partner-logo">T</span>
          <span>TADKA <small>PARTNER HUB</small></span>
        </Link>

        <div className="partner-restaurant-card">
          <span className="verified">VERIFIED KITCHEN</span>
          <button type="button" onClick={toggleKitchen} disabled={!restaurant || busy} className={`partner-open ${restaurant?.is_open ? 'on' : 'off'}`}>
            <i /> {restaurant?.is_open ? 'OPEN' : 'CLOSED'}
          </button>
          <b>{restaurant?.name || 'Your Restaurant'}</b>
          <span>{restaurant?.cuisine || 'Restaurant partner'}</span>
        </div>

        <nav className="partner-nav" aria-label="Restaurant navigation">
          {NAV_ITEMS.map(([label, href]) => (
            <Link key={href} href={href} className={pathname === href ? 'active' : ''}>
              <span>{label}</span>
              {label === 'Live Orders' && <em>LIVE</em>}
            </Link>
          ))}
        </nav>

        <div className="partner-sidebar-bottom">
          <div className="kitchen-chime">
            <span>Kitchen Chime</span>
            <b>ON</b>
            <small>{restaurant?.is_open ? 'Accepting Orders' : 'Paused'}</small>
          </div>
          <Link href="/account" className="partner-user">
            <span className="avatar">R</span>
            <span><b>Restaurant Manager</b><small>Partner account</small></span>
            <span>⋮</span>
          </Link>
        </div>
      </aside>

      <main className="partner-main">
        <header className="partner-topbar">
          <form onSubmit={(event) => event.preventDefault()} className="partner-search">
            <input placeholder="Search orders, dishes, or customers" aria-label="Search restaurant data" />
          </form>
          <div className="partner-top-actions">
            <span className="kitchen-live"><i /> Kitchen Active</span>
            <Link href="/restaurant/menu#add" className="partner-add">+ Add New Dish</Link>
            <Link href="/restaurant/notifications" className="icon-action" aria-label="Notifications">Alerts</Link>
            <Link href="/restaurant/profile" className="avatar" aria-label="Restaurant profile">R</Link>
          </div>
        </header>

        <div className="partner-content">
          <div className="partner-page-title">
            <div><span className="partner-kicker">{title || 'RESTAURANT PARTNER'}</span><h1>{subtitle || 'Your restaurant command center'}</h1></div>
            {error && <span className="partner-inline-error">{error}</span>}
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
