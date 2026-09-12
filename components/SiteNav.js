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
      else { setSavedLocation(null); setLocation('Choose location'); window.localStorage.removeItem(LOCATION_KEY); window.localStorage.removeItem(SELECTED_KEY); window.dispatchEvent(new CustomEvent('tadka:location-updated', { detail: null })); }
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
      <style jsx global>{`
        .location-wrap{position:relative;z-index:120}.location-chip{cursor:pointer}.location-chip.open{border-color:#f15b2a;box-shadow:0 0 0 3px rgba(241,91,42,.08)}
        .location-pin{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:#fff1e9;color:#f15b2a;flex:0 0 auto}.location-pin .material-symbols-outlined{font-size:17px}.location-arrow{display:grid;place-items:center}.location-arrow .material-symbols-outlined{font-size:19px}
        .location-backdrop{position:fixed;inset:0;z-index:1000;background:rgba(25,34,31,.48);backdrop-filter:blur(4px);display:flex;align-items:flex-start;justify-content:center;padding:100px 24px 30px;overflow:auto}.location-dialog{width:min(920px,100%);background:#fff;border:1px solid rgba(232,225,217,.9);border-radius:24px;box-shadow:0 30px 90px rgba(24,35,31,.28);overflow:hidden}.location-list-dialog{width:430px;margin-right:auto;margin-left:calc(50% - 470px);border-radius:18px}.location-list-inner{padding:18px}.location-popover-head{padding:2px 4px 13px}.location-popover-head strong{display:block;font-size:17px;letter-spacing:-.3px;color:#18312d}.location-popover-head p{margin:4px 0 0;font-size:12px;color:#78817e}
        .premium-address-form{display:grid;grid-template-columns:40% 60%;min-height:610px}.address-visual-panel{position:relative;padding:42px 38px 30px;background:linear-gradient(145deg,#fff8f2 0%,#fff0e3 100%);border-right:1px solid #f0e2d7}.address-visual-icon{width:48px;height:48px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#f15b2a;box-shadow:0 7px 18px rgba(241,91,42,.13)}.address-visual-icon .material-symbols-outlined{font-size:29px}.address-visual-panel h2{margin:18px 0 7px;font-size:31px;line-height:1.06;letter-spacing:-1.1px;color:#1d302d}.address-visual-panel>p{margin:0;max-width:310px;color:#5f6c68;font-size:14px;line-height:1.55}.address-illustration{height:215px;margin:7px -4px 0;display:grid;place-items:center}.address-illustration svg{width:100%;height:100%;filter:drop-shadow(0 10px 12px rgba(196,120,75,.12))}.address-benefits{display:grid;gap:15px;margin-top:4px}.address-benefits>div{display:flex;align-items:center;gap:12px}.benefit-icon{width:38px;height:38px;border-radius:50%;background:#fff;display:grid;place-items:center;color:#f15b2a;flex:0 0 auto}.benefit-icon .material-symbols-outlined{font-size:20px}.address-benefits b{display:block;font-size:12px;color:#233b36}.address-benefits small{display:block;margin-top:3px;font-size:10px;color:#78817e}
        .address-form-panel{position:relative;padding:31px 28px 25px;background:#fff}.address-close{position:absolute;right:20px;top:18px;border:0;background:transparent;color:#60706b;width:32px;height:32px;border-radius:8px;display:grid;place-items:center;cursor:pointer}.address-close:hover{background:#f5f1ed}.address-close .material-symbols-outlined{font-size:20px}.address-close-mobile{display:none}.address-form-title{padding-right:42px;margin-bottom:16px}.address-form-title strong{display:block;font-size:16px;color:#203630}.address-form-title span{display:block;margin-top:4px;font-size:11px;color:#7b8581}.address-labels{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:17px}.address-labels button{height:51px;border:1px solid #ded8d0;border-radius:11px;background:#fff;color:#465752;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:7px;cursor:pointer}.address-labels button.active{border-color:#f15b2a;background:#fff5ee;color:#e95322;box-shadow:0 0 0 1px rgba(241,91,42,.1)}.address-labels .material-symbols-outlined{font-size:19px}.address-field{display:block;margin:0 0 13px}.address-field>span{display:block;font-size:11px;font-weight:800;color:#304640;margin:0 0 6px}.address-field>span em{font-style:normal;font-weight:600;color:#88918e}.field-with-icon{height:48px;border:1px solid #ded8d0;border-radius:10px;display:flex;align-items:center;gap:10px;padding:0 12px;background:#fff}.field-with-icon:focus-within{border-color:#176052;box-shadow:0 0 0 3px rgba(23,96,82,.07)}.field-with-icon>.material-symbols-outlined{font-size:20px;color:#62726d;flex:0 0 auto}.field-with-icon input,.field-with-icon textarea{border:0;outline:0;min-width:0;flex:1;width:100%;background:transparent;color:#20332f;font:inherit;font-size:12px}.field-with-icon textarea{height:38px;padding:9px 0;resize:none}.field-with-icon input::placeholder,.field-with-icon textarea::placeholder{color:#8b9390}.address-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:13px}.current-location-card{width:100%;border:0;border-radius:12px;background:linear-gradient(90deg,#fff6ef,#fffaf7);display:flex;align-items:center;gap:12px;padding:13px 14px;margin:4px 0 13px;text-align:left;color:#203630;cursor:pointer}.current-location-card:hover{background:#fff1e6}.current-location-card:disabled{opacity:.7;cursor:wait}.current-location-card>span:nth-child(2){flex:1}.current-location-icon{width:36px;height:36px;border-radius:50%;background:#fff;color:#f15b2a;display:grid;place-items:center;box-shadow:0 4px 10px rgba(241,91,42,.09)}.current-location-icon .material-symbols-outlined{font-size:19px}.current-location-card b{display:block;font-size:12px}.current-location-card small{display:block;margin-top:3px;font-size:10px;color:#7c8582}.current-location-card>span:last-child{font-size:19px;color:#5e6e69}.default-address{display:flex;align-items:center;gap:9px;cursor:pointer;margin:3px 0 12px;position:relative}.default-address input{position:absolute;opacity:0;pointer-events:none}.fake-check{width:25px;height:25px;border-radius:6px;background:#ef5a28;color:#fff;display:grid;place-items:center;flex:0 0 auto}.fake-check .material-symbols-outlined{font-size:17px;font-weight:800}.default-address:not(:has(input:checked)) .fake-check{background:#fff;border:1.5px solid #d8d1c9;color:transparent}.default-address>span:nth-child(3){flex:1}.default-address b{display:block;font-size:12px;color:#243b36}.default-address small{display:block;margin-top:3px;font-size:10px;color:#7d8783}.default-mark{color:#e8a31a}.default-mark .material-symbols-outlined{font-size:17px}.address-error{margin:0 0 10px;padding:8px 9px;border-radius:7px;background:#fff0ed;color:#b33e25;font-size:10px}.address-form-actions{display:grid;grid-template-columns:1fr 1.5fr;gap:11px;border-top:1px solid #eee8e2;margin-top:3px;padding-top:15px}.address-cancel,.address-save{height:48px;border-radius:11px;font-size:12px;font-weight:800;cursor:pointer}.address-cancel{border:1px solid #ded8d0;background:#fff;color:#304640}.address-save{border:1px solid #f15b2a;background:#f15b2a;color:#fff;box-shadow:0 7px 16px rgba(241,91,42,.18)}
        .location-search{height:46px;border:1px solid #ded8d0;border-radius:10px;display:flex;align-items:center;gap:9px;padding:0 11px;background:#fff}.location-search:focus-within{border-color:#176052;box-shadow:0 0 0 3px rgba(23,96,82,.07)}.location-search>.material-symbols-outlined{font-size:20px;color:#274f47}.location-search input{border:0;outline:0;min-width:0;flex:1;font:inherit;font-size:13px;color:#1d302d;background:transparent}.location-search input::placeholder{color:#8a918f}.location-search button{border:0;background:transparent;color:#7c8581;display:grid;place-items:center;cursor:pointer;padding:2px}.location-search button .material-symbols-outlined{font-size:17px}.current-location-row,.saved-location-row,.add-address-row{width:100%;border:0;background:transparent;display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;padding:12px 4px;color:#19332e}.current-location-row{border-bottom:1px solid #ece7e0;padding-top:14px;padding-bottom:14px}.current-location-row:disabled{cursor:wait;opacity:.7}.row-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:#f8f4ef;color:#274f47;flex:0 0 auto}.row-icon.current,.row-icon.add{background:#fff2e9;color:#ef5a28}.row-icon .material-symbols-outlined{font-size:21px}.current-location-row>span:nth-child(2){flex:1;min-width:0}.current-location-row b,.saved-location-row b,.add-address-row b{display:block;font-size:13px;font-weight:800}.current-location-row small,.saved-location-row small,.add-address-row small{display:block;font-size:11px;color:#7c8582;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row-arrow{font-size:19px;color:#697572}.saved-heading{display:flex;justify-content:space-between;align-items:center;padding:15px 4px 7px}.saved-heading span{font-size:10px;letter-spacing:1.3px;font-weight:900;color:#4d5c58}.saved-heading button{border:0;background:transparent;color:#ed5a28;font-size:12px;font-weight:800;cursor:pointer;padding:0}.saved-location-row{border-radius:10px;gap:5px}.saved-location-row:hover,.saved-location-row.selected{background:#fff8f2}.saved-location-main{min-width:0;flex:1;border:0;background:transparent;display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;padding:0;color:#19332e}.saved-location-main>span:nth-child(2){flex:1;min-width:0}.saved-location-main b{display:flex;align-items:center;gap:7px}.saved-location-main em{font-style:normal;font-size:8px;letter-spacing:.7px;padding:3px 5px;border-radius:4px;background:#eaf4f0;color:#176052}.location-radio{width:22px;height:22px;border:1.5px solid #d7d1c9;border-radius:50%;display:grid;place-items:center;flex:0 0 auto}.saved-location-row.selected .location-radio{border:2px solid #ef5a28}.saved-location-row.selected .location-radio span{width:10px;height:10px;border-radius:50%;background:#ef5a28}.address-more{width:34px;height:34px;border:0;border-radius:8px;background:transparent;color:#687572;display:grid;place-items:center;cursor:pointer}.address-more:hover{background:#f4eee7;color:#176052}.address-more .material-symbols-outlined{font-size:18px}.add-address-row{border-top:1px solid #ece7e0;margin-top:5px;padding-top:14px}.add-address-row>span:nth-child(2){flex:1;min-width:0}.location-no-results{font-size:12px;color:#7a8581;padding:14px 4px}.address-manager{margin-top:12px;border-top:1px solid #ece7e0;padding-top:12px}.manager-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}.manager-title strong{font-size:13px;color:#19332e}.manager-title button{border:0;background:transparent;color:#697572;cursor:pointer}.manager-row{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #f0ebe5}.manager-row>div:first-child{flex:1;min-width:0}.manager-row b{display:block;font-size:12px;color:#19332e}.manager-row small{display:block;margin-top:3px;font-size:10px;color:#7b8581}.manager-actions{display:flex;align-items:center;gap:4px}.manager-actions button{border:1px solid #e1dbd3;background:#fff;color:#31534b;border-radius:7px;min-height:30px;padding:0 7px;font-size:10px;font-weight:800;cursor:pointer}.manager-actions button:hover{background:#f7f2ec}.manager-actions button.delete{color:#c94b32}.manager-actions .material-symbols-outlined{font-size:16px}
        @media(max-width:900px){.premium-address-form{grid-template-columns:1fr}.address-visual-panel{display:none}.location-dialog.address-dialog{width:min(600px,100%)}.address-form-panel{padding:24px 20px 20px}.address-close-mobile{display:grid;position:absolute;right:15px;top:15px;width:34px;height:34px;border:1px solid #e5ddd5;border-radius:8px;background:#fff;color:#566761;place-items:center}.address-close{display:none}.address-form-title{padding-right:45px}.location-backdrop{padding:72px 14px 24px}}
        @media(max-width:800px){.location-list-dialog{width:100%;margin:0}.location-backdrop{padding:78px 12px 18px}.address-field-grid{grid-template-columns:1fr}.address-labels{gap:7px}.address-labels button{height:46px}}
      `}</style>
    </header>
  );
}
