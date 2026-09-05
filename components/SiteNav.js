'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [location, setLocation] = useState('Your location');
  const [locationBusy, setLocationBusy] = useState(false);

  const isActive = (path) =>
    pathname === path || (path !== '/' && pathname.startsWith(path));

  useEffect(() => {
    let mounted = true;

    const loadCartCount = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      if (!user) {
        setCartCount(0);
        return;
      }

      const { data: cart } = await supabase
        .from('carts')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!cart) {
        setCartCount(0);
        return;
      }

      const { data: items } = await supabase
        .from('cart_items')
        .select('quantity')
        .eq('cart_id', cart.id);

      if (mounted) {
        setCartCount(
          (items || []).reduce(
            (total, item) => total + Number(item.quantity || 0),
            0,
          ),
        );
      }
    };

    loadCartCount();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => { void loadCartCount(); });

    const refreshCart = () => loadCartCount();
    window.addEventListener('tadka:cart-updated', refreshCart);

    return () => {
      mounted = false;
      subscription.unsubscribe();
      window.removeEventListener('tadka:cart-updated', refreshCart);
    };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : '/restaurants');
  }

  function requestLocation() {
    if (!navigator.geolocation) {
      setLocation('Location unavailable');
      return;
    }

    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      () => {
        setLocation('Current location');
        setLocationBusy(false);
      },
      () => {
        setLocation('Location denied');
        setLocationBusy(false);
      },
    );
  }

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-brand" href="/" aria-label="Tadka home">
          <span className="brand-mark">T</span>
          Tadka
        </Link>

        <button
          className="location-chip"
          type="button"
          onClick={requestLocation}
          title="Use your current location"
        >
          <span className="nav-label">Deliver to</span>
          <span>{locationBusy ? 'Locating…' : 'Delivering to'}</span>
          <b>{location}</b>
        </button>

        <form className="nav-search" onSubmit={submitSearch} role="search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search food"
            placeholder="Search dishes, restaurants, cuisines..."
          />
        </form>

        <nav className="site-links" aria-label="Primary navigation">
          <Link className={isActive('/') ? 'active' : ''} href="/">
            Explore
          </Link>
          <Link
            className={isActive('/restaurants') ? 'active' : ''}
            href="/restaurants"
          >
            Restaurants
          </Link>
          <Link className={isActive('/orders') ? 'active' : ''} href="/orders">
            Orders
          </Link>
        </nav>

        <Link className="nav-cart" href="/cart" aria-label={`Cart with ${cartCount} items`}>
          <span className="count">{cartCount}</span>
          <span>Cart</span>
        </Link>

        <Link className="nav-account" href="/account" aria-label="Account">
          Account
        </Link>
      </div>

      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link className={isActive('/') ? 'active' : ''} href="/">
          <small>Explore</small>
        </Link>
        <Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants">
          <small>Restaurants</small>
        </Link>
        <Link className={isActive('/orders') ? 'active' : ''} href="/orders">
          <small>Orders</small>
        </Link>
        <Link className={isActive('/account') ? 'active' : ''} href="/account">
          <small>Account</small>
        </Link>
      </nav>
    </header>
  );
}
