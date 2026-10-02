'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ADDRESS_KEY = 'tadka-saved-addresses';
const LOCATION_KEY = 'tadka-delivery-location';
const SELECTED_KEY = 'tadka-selected-address';
const emptyForm = { label: 'Home', address: '', landmark: '', city: '', pincode: '', isDefault: false };

function makeId() { return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }

export default function CustomerNav() {
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
  const [addresses, setAddresses] = useState([]);
  const [addressMode, setAddressMode] = useState('list');
  const [editingId, setEditingId] = useState(null);
  const [addressForm, setAddressForm] = useState(emptyForm);
  const [addressError, setAddressError] = useState('');
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
    try {
      const stored = window.localStorage.getItem(ADDRESS_KEY);
      const storedLocation = window.localStorage.getItem(LOCATION_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) setAddresses(parsed);
      }
      if (storedLocation) {
        const parsed = JSON.parse(storedLocation);
        if (parsed?.label) { setSavedLocation(parsed); setLocation(parsed.label); }
      }
    } catch { /* ignore malformed local data */ }
  }, []);

  useEffect(() => {
    const closeOnOutside = (event) => {
      if (locationRef.current && !locationRef.current.contains(event.target)) setLocationOpen(false);
    };
    const closeOnEscape = (event) => { if (event.key === 'Escape') setLocationOpen(false); };
    document.addEventListener('mousedown', closeOnOutside);
    document.addEventListener('keydown', closeOnEscape);
    return () => { document.removeEventListener('mousedown', closeOnOutside); document.removeEventListener('keydown', closeOnEscape); };
  }, []);

  function submitSearch(event) {
    event.preventDefault();
    const value = query.trim();
    router.push(value ? `/restaurants?q=${encodeURIComponent(value)}` : '/restaurants');
  }

  function persistAddresses(next) {
    setAddresses(next);
    window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('tadka:addresses-updated', { detail: next }));
  }

  function selectAddress(address, close = true) {
    if (!address) return;
    const detail = [address.address, address.landmark, address.city, address.pincode].filter(Boolean).join(', ');
    const next = { ...address, detail };
    setSavedLocation(next);
    setLocation(address.label);
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    window.localStorage.setItem(SELECTED_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('tadka:location-updated', { detail: next }));
    if (close) { setLocationOpen(false); setLocationSearch(''); setAddressMode('list'); }
  }

  function chooseCurrentLocation() {
    if (!navigator.geolocation) { setLocation('Location unavailable'); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const detail = `${position.coords.latitude.toFixed(5)}, ${position.coords.longitude.toFixed(5)}`;
        const next = { id: 'current-location', label: 'Current area', detail, isCurrent: true };
        setSavedLocation(next); setLocation(next.label);
        window.localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
        window.localStorage.setItem(SELECTED_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent('tadka:location-updated', { detail: next }));
        setLocationBusy(false); setLocationOpen(false); setAddressMode('list');
      },
      () => { setLocationBusy(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function openAddAddress() {
    setEditingId(null); setAddressForm({ ...emptyForm, isDefault: addresses.length === 0 }); setAddressError(''); setAddressMode('form');
  }

  function openEditAddress(address) {
    setEditingId(address.id);
    setAddressForm({ label: address.label || 'Home', address: address.address || '', landmark: address.landmark || '', city: address.city || '', pincode: address.pincode || '', isDefault: !!address.isDefault });
    setAddressError(''); setAddressMode('form');
  }

  function saveAddress(event) {
    event.preventDefault();
    const clean = Object.fromEntries(Object.entries(addressForm).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value]));
    if (!clean.address || !clean.city || !/^\d{6}$/.test(clean.pincode)) { setAddressError('Enter address, city and a valid 6-digit pincode.'); return; }

    let next;
    if (editingId) {
      next = addresses.map((item) => item.id === editingId ? { ...item, ...clean } : item);
    } else {
      next = [...addresses, { ...clean, id: makeId() }];
    }
    const makeDefault = clean.isDefault || next.filter((item) => item.isDefault).length === 0;
    next = next.map((item) => ({ ...item, isDefault: makeDefault ? item.id === (editingId || next[next.length - 1].id) : item.isDefault }));
    persistAddresses(next);
    const saved = next.find((item) => item.id === (editingId || next[next.length - 1].id));
    selectAddress(saved, false);
    setAddressMode('list'); setLocationSearch('');
  }

  function setDefaultAddress(address) {
    const next = addresses.map((item) => ({ ...item, isDefault: item.id === address.id }));
    persistAddresses(next); selectAddress(next.find((item) => item.id === address.id), false); setAddressMode('list');
  }

  function deleteAddress(address) {
    const next = addresses.filter((item) => item.id !== address.id);
    if (next.length && !next.some((item) => item.isDefault)) next[0] = { ...next[0], isDefault: true };
    persistAddresses(next);
    if (savedLocation?.id === address.id) {
      const replacement = next.find((item) => item.isDefault) || next[0];
      if (replacement) selectAddress(replacement, false);
      else {
        setSavedLocation(null); setLocation('Choose location');
        window.localStorage.removeItem(LOCATION_KEY);
        window.localStorage.removeItem(SELECTED_KEY);
        window.dispatchEvent(new CustomEvent('tadka:location-updated', { detail: null }));
      }
    }
  }

  const searchValue = locationSearch.trim().toLowerCase();
  const filteredAddresses = addresses.filter((item) => !searchValue || [item.label, item.address, item.landmark, item.city, item.pincode].filter(Boolean).join(' ').toLowerCase().includes(searchValue));

  return (
    <header className="site-nav">
      <div className="site-nav-inner">
        <Link className="site-brand" href="/" aria-label="Tadka home"><img src="/tadka-logo.svg" alt="Tadka" className="site-logo" /></Link>
        <div className="location-wrap" ref={locationRef}>
          <button className={`location-chip ${locationOpen ? 'open' : ''}`} type="button" onClick={() => setLocationOpen((open) => !open)} aria-expanded={locationOpen} aria-haspopup="dialog" title="Choose delivery location">
            <span className="location-pin" aria-hidden="true"><span className="material-symbols-outlined">location_on</span></span>
            <span className="location-copy"><small>DELIVER TO</small><b>{locationBusy ? 'Finding...' : location}</b></span>
            <span className="location-arrow" aria-hidden="true"><span className="material-symbols-outlined">expand_more</span></span>
          </button>

          {locationOpen && (
            <div className={`location-backdrop ${addressMode === 'form' ? 'address-backdrop' : ''}`}>
              <div className={`location-dialog ${addressMode === 'form' ? 'address-dialog' : 'location-list-dialog'}`} role="dialog" aria-modal="true" aria-label={addressMode === 'form' ? 'Add new address' : 'Choose your delivery location'}>
                {addressMode === 'form' ? (
                  <form className="premium-address-form" onSubmit={saveAddress}>
                    <aside className="address-visual-panel">
                      <button className="address-close-mobile" type="button" onClick={() => setLocationOpen(false)} aria-label="Close"><span className="material-symbols-outlined">close</span></button>
                      <div className="address-visual-icon"><span className="material-symbols-outlined">location_on</span></div>
                      <h2>{editingId ? 'Edit your address' : 'Add new address'}</h2>
                      <p>Save your address for faster checkout and a smoother delivery experience.</p>
                      <div className="address-illustration" aria-hidden="true">
                        <svg viewBox="0 0 320 220" role="presentation"><ellipse cx="160" cy="193" rx="112" ry="17" fill="#f7d9c4"/><path d="M72 171h176v25H72z" fill="#f8eee7"/><path d="M91 142l69-54 69 54v42H91z" fill="#fff"/><path d="M78 143l82-67 82 67-13 14-69-57-69 57z" fill="#f15b2a"/><path d="M146 184v-40h28v40" fill="#f5c7ad"/><rect x="108" y="145" width="22" height="26" rx="3" fill="#dfece5"/><circle cx="205" cy="154" r="14" fill="#e8f2e8"/><path d="M204 148c-9 0-16 7-16 16 0 12 16 28 16 28s16-16 16-28c0-9-7-16-16-16z" fill="#f15b2a"/><circle cx="204" cy="164" r="5" fill="#fff"/><path d="M67 179c-8-25 8-43 24-43 13 0 23 10 23 23 0 11-9 20-20 20z" fill="#9ccf9b"/><path d="M252 179c8-25-8-43-24-43-13 0-23 10-23 23 0 11 9 20 20 20z" fill="#9ccf9b"/><path d="M54 183h22M244 183h22" stroke="#c7b8ac" strokeWidth="3" strokeLinecap="round"/></svg>
                      </div>
                      <div className="address-benefits">
                        <div><span className="benefit-icon"><span className="material-symbols-outlined">bolt</span></span><span><b>Faster checkout</b><small>Place orders in seconds</small></span></div>
                        <div><span className="benefit-icon"><span className="material-symbols-outlined">verified_user</span></span><span><b>Accurate delivery</b><small>Get your food at the right location</small></span></div>
                        <div><span className="benefit-icon"><span className="material-symbols-outlined">favorite</span></span><span><b>Multiple addresses</b><small>Save home, work or other places</small></span></div>
                      </div>
                    </aside>
                    <section className="address-form-panel">
                      <button className="address-close" type="button" onClick={() => setLocationOpen(false)} aria-label="Close address form"><span className="material-symbols-outlined">close</span></button>
                      <div className="address-form-title"><strong>Address type</strong><span>{editingId ? 'Update your saved delivery details' : 'Where should we deliver your order?'}</span></div>
                      <div className="address-labels" role="group" aria-label="Address type">
                        {['Home', 'Work', 'Other'].map((label) => <button key={label} type="button" className={addressForm.label === label ? 'active' : ''} onClick={() => setAddressForm((current) => ({ ...current, label }))}><span className="material-symbols-outlined">{label === 'Home' ? 'home' : label === 'Work' ? 'business' : 'location_on'}</span>{label}</button>)}
                      </div>
                      <label className="address-field"><span>Full address *</span><div className="field-with-icon"><span className="material-symbols-outlined">home</span><textarea name="address" value={addressForm.address} onChange={(event) => setAddressForm((current) => ({ ...current, address: event.target.value }))} placeholder="Flat / House no., Building name, Street name" rows={2} autoFocus /></div></label>
                      <label className="address-field"><span>Landmark <em>(optional)</em></span><div className="field-with-icon"><span className="material-symbols-outlined">location_on</span><input name="landmark" value={addressForm.landmark} onChange={(event) => setAddressForm((current) => ({ ...current, landmark: event.target.value }))} placeholder="Nearby landmark (e.g. Near City Mall)" /></div></label>
                      <div className="address-field-grid">
                        <label className="address-field"><span>City *</span><div className="field-with-icon"><span className="material-symbols-outlined">location_city</span><input name="city" value={addressForm.city} onChange={(event) => setAddressForm((current) => ({ ...current, city: event.target.value }))} placeholder="Enter city" /></div></label>
                        <label className="address-field"><span>Pincode *</span><div className="field-with-icon"><span className="material-symbols-outlined">pin</span><input name="pincode" value={addressForm.pincode} onChange={(event) => setAddressForm((current) => ({ ...current, pincode: event.target.value.replace(/\D/g, '').slice(0, 6) }))} placeholder="6-digit pincode" inputMode="numeric" maxLength={6} /></div></label>
                      </div>
                      <button className="current-location-card" type="button" onClick={chooseCurrentLocation} disabled={locationBusy}><span className="current-location-icon"><span className="material-symbols-outlined">my_location</span></span><span><b>{locationBusy ? 'Detecting your location...' : 'Use my current location'}</b><small>Detect your location automatically</small></span><span className="material-symbols-outlined">chevron_right</span></button>
                      <label className="default-address"><input type="checkbox" checked={addressForm.isDefault} onChange={(event) => setAddressForm((current) => ({ ...current, isDefault: event.target.checked }))} /><span className="fake-check"><span className="material-symbols-outlined">check</span></span><span><b>Set as default address</b><small>This will be used for all future orders</small></span><span className="default-mark"><span className="material-symbols-outlined">star</span></span></label>
                      {addressError && <p className="address-error" role="alert">{addressError}</p>}
                      <div className="address-form-actions"><button className="address-cancel" type="button" onClick={() => setLocationOpen(false)}>Cancel</button><button className="address-save" type="submit">{editingId ? 'Save changes' : 'Save address'}</button></div>
                    </section>
                  </form>
                ) : (
                  <div className="location-list-inner">
                    <div className="location-popover-head"><strong>Choose your delivery location</strong><p>We'll show restaurants and offers near you</p></div>
                    <div className="location-search"><span className="material-symbols-outlined">search</span><input autoFocus value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} placeholder="Search saved address..." aria-label="Search saved addresses" />{locationSearch && <button type="button" onClick={() => setLocationSearch('')} aria-label="Clear"><span className="material-symbols-outlined">close</span></button>}</div>
                    <button className="current-location-row" type="button" onClick={chooseCurrentLocation} disabled={locationBusy}><span className="row-icon current"><span className="material-symbols-outlined">my_location</span></span><span><b>{locationBusy ? 'Finding your location...' : 'Use my current location'}</b><small>Detect my location automatically</small></span><span className="material-symbols-outlined row-arrow">chevron_right</span></button>
                    <div className="saved-heading"><span>SAVED LOCATIONS</span><button type="button" onClick={() => setAddressMode('manage')}>Manage</button></div>
                    {filteredAddresses.length > 0 && filteredAddresses.map((item) => <div className={`saved-location-row ${savedLocation?.id === item.id ? 'selected' : ''}`} key={item.id}><button className="saved-location-main" type="button" onClick={() => selectAddress(item)}><span className="row-icon"><span className="material-symbols-outlined">{item.label === 'Home' ? 'home' : item.label === 'Work' ? 'business' : 'location_on'}</span></span><span><b>{item.label}{item.isDefault && <em>DEFAULT</em>}</b><small>{[item.address, item.landmark, item.city, item.pincode].filter(Boolean).join(', ')}</small></span><span className="location-radio"><span /></span></button><button className="address-more" type="button" onClick={() => openEditAddress(item)} aria-label={`Edit ${item.label}`}><span className="material-symbols-outlined">edit</span></button></div>)}
                    {filteredAddresses.length === 0 && <div className="location-no-results">{addresses.length ? `No saved address matches “${locationSearch}”.` : 'No saved addresses yet.'}</div>}
                    <button className="add-address-row" type="button" onClick={openAddAddress}><span className="row-icon add"><span className="material-symbols-outlined">add</span></span><span><b>Add new address</b><small>Save Home, Work or another delivery address</small></span><span className="material-symbols-outlined row-arrow">chevron_right</span></button>
                    {addressMode === 'manage' && <div className="address-manager"><div className="manager-title"><strong>Manage saved addresses</strong><button type="button" onClick={() => setAddressMode('list')}><span className="material-symbols-outlined">close</span></button></div>{addresses.map((item) => <div className="manager-row" key={item.id}><div><b>{item.label}</b><small>{item.city} · {item.pincode}</small></div><div className="manager-actions">{!item.isDefault && <button type="button" onClick={() => setDefaultAddress(item)}>Set default</button>}<button type="button" onClick={() => openEditAddress(item)} aria-label="Edit"><span className="material-symbols-outlined">edit</span></button><button className="delete" type="button" onClick={() => deleteAddress(item)} aria-label="Delete"><span className="material-symbols-outlined">delete</span></button></div></div>)}</div>}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        <form className="nav-search" onSubmit={submitSearch} role="search"><span className="nav-search-icon" aria-hidden="true"><span className="material-symbols-outlined">search</span></span><input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search food" placeholder="Search for dishes, restaurants or cuisines" /></form>
        <nav className="site-links" aria-label="Primary navigation"><Link className={isActive('/') ? 'active' : ''} href="/">Home</Link><Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants">Explore</Link><Link href="/restaurants?offers=true">Offers</Link><Link href="/restaurants">Categories</Link><Link className={isActive('/account') ? 'active' : ''} href="/account">Account</Link></nav>
        <Link className="nav-cart" href="/cart" aria-label={`Bag with ${cartCount} items`}><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</Link>
      </div>
      <nav className="mobile-bottom-nav" aria-label="Mobile navigation"><Link className={isActive('/') ? 'active' : ''} href="/"><span>Home</span></Link><Link className={isActive('/restaurants') ? 'active' : ''} href="/restaurants"><span>Explore</span></Link><Link href="/restaurants?offers=true"><span>Offers</span></Link><Link className={isActive('/orders') ? 'active' : ''} href="/orders"><span>Orders</span></Link><Link className={isActive('/account') ? 'active' : ''} href="/account"><span>Account</span></Link><Link className={isActive('/cart') ? 'active' : ''} href="/cart"><span>Bag</span>{cartCount > 0 && <b>{cartCount}</b>}</Link></nav>
    </header>
  );
}
