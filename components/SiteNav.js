'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [location, setLocation] = useState('Your location');
  const [locationBusy, setLocationBusy] = useState(false);

  const isActive = (path) => pathname === path || (path !== '/' && pathname.startsWith(path));

  useEffect(() => {
    let mounted = true;
    const loadCartCount = async () => {
      try {
        const response = await fetch(`${apiUrl}/v1/cart`, { credentials: 'include', cache: 'no-store' });
        if (!mounted) return;
        if (response.status === 401) { setCartCount(0); return; }
        if (!response.ok) throw new Error('Unable to load cart.');
        const body = await response.json();
        setCartCount((body?.data?.items || []).reduce((total, item) => total + Number(item.quantity || 0), 0));
      } catch {
        if (mounted) setCartCount(0);
      }
    };
    void loadCartCount();
    const refreshCart = () => { void loadCartCount(); };
    window.addEventListener('tadka:cart-updated', refreshCart);
    return () => { mounted = false; window.removeEventListener('tadka:cart-updated', refreshCart); };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : '/restaurants');
  }

  function requestLocation() {
    if (!navigator.geolocation) { setLocation('Location unavailable'); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      () => { setLocation('Current location'); setLocationBusy(false); },
      () => { setLocation('Location denied'); setLocationBusy(false); },
    );
  }

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-brand" href="/" aria-label="Tadka home"><span className="brand-mark">T</span>Tadka</Link>
        <button className="location-chip" type="button" onClick={requestLocation} title="Use your current location">
          <span className="nav-label">Deliver to</span><span>Delivering to</span><b>{locationBusy ? 'Locating…' : location}</b>
        </button>
        <form className="nav-search" onSubmit={submitSearch} role="search"><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search food" placeholder="Search dishes, restaurants, cuisines..." /></form>
        <nav className="site-links" aria-label="Primary navigation">
          <Link className={isActive('/') ? 'active' : ''} href="/">Explore</Link>
          <Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants">Restaurants</Link>
          <Link className={isActive('/orders') ? 'active' : ''} href="/orders">Orders</Link>
        </nav>
        <Link className="nav-cart" href="/cart" aria-label={`Cart with ${cartCount} items`}><span className="count">{cartCount}</span><span>Cart</span></Link>
        <Link className="nav-account" href="/account" aria-label="Account">Account</Link>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link className={isActive('/') ? 'active' : ''} href="/"><small>Explore</small></Link>
        <Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants"><small>Restaurants</small></Link>
        <Link className={isActive('/orders') ? 'active' : ''} href="/orders"><small>Orders</small></Link>
        <Link className={isActive('/account') ? 'active' : ''} href="/account"><small>Account</small></Link>
      </nav>
    </header>
  );
}
