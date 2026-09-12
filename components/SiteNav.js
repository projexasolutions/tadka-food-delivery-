'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function SiteNav() {
  const pathname = usePathname();
  const router = useRouter();
  const locationRef = useRef(null);
  const [query, setQuery] = useState('');
  const [cartCount, setCartCount] = useState(0);
  const [location, setLocation] = useState('Choose location');
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState('');
  const [savedLocation, setSavedLocation] = useState(null);
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

  useEffect(() => {
    const stored = window.localStorage.getItem('tadka-delivery-location');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.label) { setSavedLocation(parsed); setLocation(parsed.label); }
      } catch { /* ignore invalid local data */ }
    }
  }, []);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) setLocationOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setLocationOpen(false); };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeOnOutside);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : '/restaurants');
  }

  function chooseLocation(label, detail = '') {
    const next = { label, detail };
    setSavedLocation(next);
    setLocation(label);
    window.localStorage.setItem('tadka-delivery-location', JSON.stringify(next));
    setLocationOpen(false);
    setLocationSearch('');
  }

  function requestLocation() {
    if (!navigator.geolocation) { setLocation('Location unavailable'); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const label = 'Current area';
        const detail = `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`;
        chooseLocation(label, detail);
        setLocationBusy(false);
      },
      () => { setLocation('Choose location'); setLocationBusy(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  const searchValue = locationSearch.trim().toLowerCase();
  const savedOptions = [
    { label: 'Home', detail: 'Saved delivery address', icon: 'home' },
    { label: 'Work', detail: 'Saved delivery address', icon: 'business' },
  ].filter((item) => !searchValue || `${item.label} ${item.detail}`.toLowerCase().includes(searchValue));

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-brand" href="/" aria-label="Tadka home"><img src="/tadka-logo.svg" alt="Tadka" className="site-logo" /></Link>
        <div className="location-wrap" ref={locationRef}>
          <button className={`location-chip ${locationOpen ? 'open' : ''}`} type="button" onClick={() => setLocationOpen((open) => !open)} aria-expanded={locationOpen} aria-haspopup="dialog" title="Choose delivery location">
            <span className="location-pin" aria-hidden="true"><span className="material-symbols-outlined">location_on</span></span>
            <span className="location-copy"><small>DELIVER TO</small><b>{locationBusy ? 'Finding…' : location}</b></span>
            <span className="location-arrow" aria-hidden="true"><span className="material-symbols-outlined">expand_more</span></span>
          </button>
          {locationOpen && (
            <div className="location-popover" role="dialog" aria-label="Choose your delivery location">
              <div className="location-popover-head"><strong>Choose your delivery location</strong><p>We’ll show restaurants and offers near you</p></div>
              <div className="location-search">
                <span className="material-symbols-outlined">search</span>
                <input autoFocus value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} placeholder="Search for area, street or landmark..." aria-label="Search delivery location" />
                {locationSearch && <button type="button" onClick={() => setLocationSearch('')} aria-label="Clear location search"><span className="material-symbols-outlined">close</span></button>}
              </div>
              <button className="current-location-row" type="button" onClick={requestLocation} disabled={locationBusy}>
                <span className="row-icon current"><span className="material-symbols-outlined">my_location</span></span>
                <span><b>{locationBusy ? 'Finding your location…' : 'Use my current location'}</b><small>Detect my location automatically</small></span>
                <span className="material-symbols-outlined row-arrow">chevron_right</span>
              </button>
              <div className="saved-heading"><span>SAVED LOCATIONS</span><button type="button" onClick={() => setLocationSearch('')}>Edit</button></div>
              {savedOptions.length > 0 && savedOptions.map((item) => (
                <button className={`saved-location-row ${savedLocation?.label === item.label ? 'selected' : ''}`} type="button" key={item.label} onClick={() => chooseLocation(item.label, item.detail)}>
                  <span className="row-icon"><span className="material-symbols-outlined">{item.icon}</span></span>
                  <span><b>{item.label}</b><small>{item.detail}</small></span>
                  <span className="location-radio" aria-hidden="true"><span /></span>
                </button>
              ))}
              {savedOptions.length === 0 && <div className="location-no-results">No saved location matches “{locationSearch}”.</div>}
              <button className="add-address-row" type="button" onClick={() => { setLocationSearch(''); setLocationOpen(false); router.push('/account'); }}>
                <span className="row-icon add"><span className="material-symbols-outlined">add</span></span>
                <span><b>Add new address</b><small>Manage your delivery addresses</small></span>
                <span className="material-symbols-outlined row-arrow">chevron_right</span>
              </button>
            </div>
          )}
        </div>
        <form className="nav-search" onSubmit={submitSearch} role="search">
          <span className="nav-search-icon" aria-hidden="true"><span className="material-symbols-outlined">search</span></span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search food" placeholder="Search for dishes, restaurants or cuisines" />
        </form>
        <nav className="site-links" aria-label="Primary navigation">
          <Link className={isActive('/') ? 'active' : ''} href="/">Home</Link><Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants">Explore</Link><Link href="/restaurants?offers=true">Offers</Link><Link href="/restaurants">Categories</Link><Link className={isActive('/account') ? 'active' : ''} href="/account">Account</Link>
        </nav>
        <Link className="nav-cart" href="/cart" aria-label={`Bag with ${cartCount} items`}><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</Link>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
        <Link className={isActive('/') ? 'active' : ''} href="/"><span>Home</span></Link><Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants"><span>Explore</span></Link><Link href="/restaurants?offers=true"><span>Offers</span></Link><Link className={isActive('/orders') ? 'active' : ''} href="/orders"><span>Orders</span></Link><Link className={isActive('/account') ? 'active' : ''} href="/account"><span>Account</span></Link><Link className={isActive('/cart') ? 'active' : ''} href="/cart"><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</Link>
      </nav>
      <style jsx global>{`
        .location-wrap{position:relative;z-index:120}.location-chip{cursor:pointer}.location-chip.open{border-color:#f15b2a;box-shadow:0 0 0 3px rgba(241,91,42,.08)}
        .location-pin{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#fff1e9;color:#f15b2a;flex:0 0 auto}.location-pin .material-symbols-outlined{font-size:17px}.location-arrow{display:grid;place-items:center}.location-arrow .material-symbols-outlined{font-size:19px}
        .location-popover{position:absolute;left:-52px;top:calc(100% + 10px);width:430px;background:#fff;border:1px solid #e8e1d9;border-radius:18px;box-shadow:0 20px 55px rgba(34,42,38,.16);padding:18px;overflow:hidden}.location-popover:before{content:"";position:absolute;top:-7px;left:72px;width:14px;height:14px;background:#fff;border-left:1px solid #e8e1d9;border-top:1px solid #e8e1d9;transform:rotate(45deg)}
        .location-popover-head{padding:2px 4px 13px}.location-popover-head strong{display:block;font-size:17px;letter-spacing:-.3px;color:#18312d}.location-popover-head p{margin:4px 0 0;font-size:12px;color:#78817e}
        .location-search{height:46px;border:1px solid #ded8d0;border-radius:10px;display:flex;align-items:center;gap:9px;padding:0 11px;background:#fff}.location-search:focus-within{border-color:#176052;box-shadow:0 0 0 3px rgba(23,96,82,.07)}.location-search>.material-symbols-outlined{font-size:20px;color:#274f47}.location-search input{border:0;outline:0;min-width:0;flex:1;font:inherit;font-size:13px;color:#1d302d;background:transparent}.location-search input::placeholder{color:#8a918f}.location-search button{border:0;background:transparent;color:#7c8581;display:grid;place-items:center;cursor:pointer;padding:2px}.location-search button .material-symbols-outlined{font-size:17px}
        .current-location-row,.saved-location-row,.add-address-row{width:100%;border:0;background:transparent;display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;padding:12px 4px;color:#19332e}.current-location-row{border-bottom:1px solid #ece7e0;padding-top:14px;padding-bottom:14px}.current-location-row:disabled{cursor:wait;opacity:.7}.row-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:#f8f4ef;color:#274f47;flex:0 0 auto}.row-icon.current,.row-icon.add{background:#fff2e9;color:#ef5a28}.row-icon .material-symbols-outlined{font-size:21px}.current-location-row>span:nth-child(2),.saved-location-row>span:nth-child(2),.add-address-row>span:nth-child(2){flex:1;min-width:0}.current-location-row b,.saved-location-row b,.add-address-row b{display:block;font-size:13px;font-weight:800}.current-location-row small,.saved-location-row small,.add-address-row small{display:block;font-size:11px;color:#7c8582;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row-arrow{font-size:19px;color:#697572}
        .saved-heading{display:flex;justify-content:space-between;align-items:center;padding:15px 4px 7px}.saved-heading span{font-size:10px;letter-spacing:1.3px;font-weight:900;color:#4d5c58}.saved-heading button{border:0;background:transparent;color:#ed5a28;font-size:12px;font-weight:800;cursor:pointer;padding:0}.saved-location-row{border-radius:10px}.saved-location-row:hover,.saved-location-row.selected{background:#fff8f2}.location-radio{width:22px;height:22px;border:1.5px solid #d7d1c9;border-radius:50%;display:grid;place-items:center;flex:0 0 auto}.saved-location-row.selected .location-radio{border:2px solid #ef5a28}.saved-location-row.selected .location-radio span{width:10px;height:10px;border-radius:50%;background:#ef5a28}.add-address-row{border-top:1px solid #ece7e0;margin-top:5px;padding-top:14px}.location-no-results{font-size:12px;color:#7a8581;padding:14px 4px}
        @media(max-width:800px){.location-popover{position:fixed;left:12px;right:12px;top:78px;width:auto;max-width:none}.location-popover:before{display:none}}
      `}</style>
    </header>
  );
}
