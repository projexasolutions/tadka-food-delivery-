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
  const [location, setLocation] = useState('Choose location');
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
      } catch { if (mounted) setCartCount(0); }
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
      () => { setLocation('Current area'); setLocationBusy(false); },
      () => { setLocation('Choose location'); setLocationBusy(false); },
    );
  }

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-brand" href="/" aria-label="Tadka home">
          <img src="/tadka-logo.svg" alt="Tadka" className="site-logo" />
        </Link>
        <button className="location-chip" type="button" onClick={requestLocation} title="Choose delivery location">
          <span className="location-pin" aria-hidden="true">●</span>
          <span><small>DELIVER TO</small><b>{locationBusy ? 'Finding…' : location}</b></span>
          <span className="location-arrow" aria-hidden="true">⌄</span>
        </button>
        <form className="nav-search" onSubmit={submitSearch} role="search">
          <span className="nav-search-icon" aria-hidden="true">SEARCH</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search food" placeholder="Search for dishes, restaurants or cuisines" />
        </form>
        <nav className="site-links" aria-label="Primary navigation">
          <Link className={isActive('/') ? 'active' : ''} href="/">Home</Link>
          <Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants">Explore</Link>
          <Link href="/restaurants?offers=true">Offers</Link>
          <Link href="/restaurants">Categories</Link>
          <Link className={isActive('/account') ? 'active' : ''} href="/account">Account</Link>
        </nav>
        <Link className="nav-cart" href="/cart" aria-label={`Bag with ${cartCount} items`}><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</Link>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link className={isActive('/') ? 'active' : ''} href="/"><span>Home</span></Link>
        <Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants"><span>Explore</span></Link>
        <Link href="/restaurants?offers=true"><span>Offers</span></Link>
        <Link className={isActive('/orders') ? 'active' : ''} href="/orders"><span>Orders</span></Link>
        <Link className={isActive('/account') ? 'active' : ''} href="/account"><span>Account</span></Link>
        <Link className={isActive('/cart') ? 'active' : ''} href="/cart"><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</Link>
      </nav>
    </header>
  );
}
