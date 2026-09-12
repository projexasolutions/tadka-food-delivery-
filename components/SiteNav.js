'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ADDRESS_KEY = 'tadka-saved-addresses';
const LOCATION_KEY = 'tadka-delivery-location';

const emptyForm = {
  label: 'Home',
  address: '',
  landmark: '',
  city: '',
  pincode: '',
};

function makeId() {
  return `addr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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
      const storedAddresses = window.localStorage.getItem(ADDRESS_KEY);
      const storedLocation = window.localStorage.getItem(LOCATION_KEY);
      let parsedAddresses = [];
      if (storedAddresses) {
        const parsed = JSON.parse(storedAddresses);
        if (Array.isArray(parsed)) parsedAddresses = parsed;
      }

      if (parsedAddresses.length > 0) {
        setAddresses(parsedAddresses);
      }

      if (storedLocation) {
        const parsed = JSON.parse(storedLocation);
        if (parsed?.label) {
          setSavedLocation(parsed);
          setLocation(parsed.label);
        }
      } else if (parsedAddresses.length > 0) {
        const preferred = parsedAddresses.find((item) => item.isDefault) || parsedAddresses[0];
        selectAddress(preferred, false, parsedAddresses);
      }
    } catch {
      // Ignore malformed local storage and keep the selector usable.
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

  function persistAddresses(next) {
    setAddresses(next);
    window.localStorage.setItem(ADDRESS_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('tadka:addresses-updated', { detail: next }));
  }

  function selectAddress(address, close = true, source = addresses) {
    if (!address) return;
    const next = {
      ...address,
      detail: [address.address, address.landmark, address.city, address.pincode].filter(Boolean).join(', '),
    };
    setSavedLocation(next);
    setLocation(address.label);
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    window.localStorage.setItem('tadka-selected-address', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('tadka:location-updated', { detail: next }));
    if (close) {
      setLocationOpen(false);
      setLocationSearch('');
      setAddressMode('list');
    }
    if (source.length > 0) setAddresses(source);
  }

  function chooseCurrentLocation(label, detail) {
    const next = { label, detail, id: 'current-location', isCurrent: true };
    setSavedLocation(next);
    setLocation(label);
    window.localStorage.setItem(LOCATION_KEY, JSON.stringify(next));
    window.localStorage.setItem('tadka-selected-address', JSON.stringify(next));
    window.dispatchEvent(new CustomEvent('tadka:location-updated', { detail: next }));
    setLocationOpen(false);
    setLocationSearch('');
    setAddressMode('list');
  }

  function requestLocation() {
    if (!navigator.geolocation) { setLocation('Location unavailable'); return; }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const label = 'Current area';
        const detail = `${position.coords.latitude.toFixed(3)}, ${position.coords.longitude.toFixed(3)}`;
        chooseCurrentLocation(label, detail);
        setLocationBusy(false);
      },
      () => { setLocation('Choose location'); setLocationBusy(false); },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 },
    );
  }

  function openAddAddress() {
    setEditingId(null);
    setAddressForm({ ...emptyForm });
    setAddressError('');
    setAddressMode('form');
  }

  function openEditAddress(address) {
    setEditingId(address.id);
    setAddressForm({
      label: address.label || 'Home',
      address: address.address || '',
      landmark: address.landmark || '',
      city: address.city || '',
      pincode: address.pincode || '',
    });
    setAddressError('');
    setAddressMode('form');
  }

  function handleAddressChange(event) {
    const { name, value } = event.target;
    setAddressForm((current) => ({ ...current, [name]: value }));
  }

  function saveAddress(event) {
    event.preventDefault();
    const clean = Object.fromEntries(Object.entries(addressForm).map(([key, value]) => [key, value.trim()]));
    if (!clean.address || !clean.city || !/^\d{6}$/.test(clean.pincode)) {
      setAddressError('Enter address, city and a valid 6-digit pincode.');
      return;
    }

    let next;
    if (editingId) {
      next = addresses.map((item) => item.id === editingId ? { ...item, ...clean } : item);
    } else {
      const shouldDefault = addresses.length === 0;
      next = [...addresses, { ...clean, id: makeId(), isDefault: shouldDefault }];
    }

    if (!addresses.length && next.length) next = next.map((item, index) => ({ ...item, isDefault: index === 0 }));
    persistAddresses(next);
    const selected = editingId
      ? next.find((item) => item.id === editingId)
      : next[next.length - 1];
    selectAddress(selected, false, next);
    setAddressMode('list');
    setAddressSearchSafe('');
  }

  function setAddressSearchSafe(value) {
    setLocationSearch(value);
  }

  function setDefaultAddress(address) {
    const next = addresses.map((item) => ({ ...item, isDefault: item.id === address.id }));
    persistAddresses(next);
    const selected = next.find((item) => item.id === address.id);
    selectAddress(selected, false, next);
    setAddressMode('list');
  }

  function deleteAddress(address) {
    const next = addresses.filter((item) => item.id !== address.id);
    persistAddresses(next);
    const selectedId = savedLocation?.id;
    if (selectedId === address.id) {
      const replacement = next.find((item) => item.isDefault) || next[0];
      if (replacement) selectAddress(replacement, false, next);
      else {
        setSavedLocation(null);
        setLocation('Choose location');
        window.localStorage.removeItem(LOCATION_KEY);
        window.localStorage.removeItem('tadka-selected-address');
        window.dispatchEvent(new CustomEvent('tadka:location-updated', { detail: null }));
      }
    }
    setAddressMode('list');
  }

  const searchValue = locationSearch.trim().toLowerCase();
  const filteredAddresses = addresses.filter((item) => {
    if (!searchValue) return true;
    return [item.label, item.address, item.landmark, item.city, item.pincode].filter(Boolean).join(' ').toLowerCase().includes(searchValue);
  });

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
              {addressMode === 'form' ? (
                <form className="address-form" onSubmit={saveAddress}>
                  <div className="location-popover-head address-form-head">
                    <button className="back-button" type="button" onClick={() => { setAddressMode('list'); setAddressError(''); }} aria-label="Back to saved locations"><span className="material-symbols-outlined">arrow_back</span></button>
                    <div><strong>{editingId ? 'Edit address' : 'Add new address'}</strong><p>{editingId ? 'Update your saved delivery address' : 'Save an address for faster checkout'}</p></div>
                  </div>
                  <div className="address-labels" role="group" aria-label="Address type">
                    {['Home', 'Work', 'Other'].map((label) => (
                      <button key={label} type="button" className={addressForm.label === label ? 'active' : ''} onClick={() => setAddressForm((current) => ({ ...current, label }))}>
                        <span className="material-symbols-outlined">{label === 'Home' ? 'home' : label === 'Work' ? 'business' : 'location_on'}</span>{label}
                      </button>
                    ))}
                  </div>
                  <label className="address-field"><span>Full address *</span><textarea name="address" value={addressForm.address} onChange={handleAddressChange} placeholder="Flat / house no., building, street" rows={3} autoFocus /></label>
                  <label className="address-field"><span>Landmark</span><input name="landmark" value={addressForm.landmark} onChange={handleAddressChange} placeholder="Nearby landmark (optional)" /></label>
                  <div className="address-field-grid">
                    <label className="address-field"><span>City *</span><input name="city" value={addressForm.city} onChange={handleAddressChange} placeholder="City" /></label>
                    <label className="address-field"><span>Pincode *</span><input name="pincode" value={addressForm.pincode} onChange={handleAddressChange} placeholder="6-digit pincode" inputMode="numeric" maxLength={6} /></label>
                  </div>
                  {addressError && <p className="address-error" role="alert">{addressError}</p>}
                  <div className="address-form-actions">
                    <button className="address-cancel" type="button" onClick={() => { setAddressMode('list'); setAddressError(''); }}>Cancel</button>
                    <button className="address-save" type="submit">{editingId ? 'Save changes' : 'Save address'}</button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="location-popover-head"><strong>Choose your delivery location</strong><p>We’ll show restaurants and offers near you</p></div>
                  <div className="location-search">
                    <span className="material-symbols-outlined">search</span>
                    <input autoFocus value={locationSearch} onChange={(event) => setLocationSearch(event.target.value)} placeholder="Search saved address..." aria-label="Search saved addresses" />
                    {locationSearch && <button type="button" onClick={() => setLocationSearch('')} aria-label="Clear location search"><span className="material-symbols-outlined">close</span></button>}
                  </div>
                  <button className="current-location-row" type="button" onClick={requestLocation} disabled={locationBusy}>
                    <span className="row-icon current"><span className="material-symbols-outlined">my_location</span></span>
                    <span><b>{locationBusy ? 'Finding your location…' : 'Use my current location'}</b><small>Detect my location automatically</small></span>
                    <span className="material-symbols-outlined row-arrow">chevron_right</span>
                  </button>
                  <div className="saved-heading"><span>SAVED LOCATIONS</span><button type="button" onClick={() => { setLocationSearch(''); setAddressMode('manage'); }}>Manage</button></div>

                  {filteredAddresses.length > 0 && filteredAddresses.map((item) => (
                    <div className={`saved-location-row ${savedLocation?.id === item.id ? 'selected' : ''}`} key={item.id}>
                      <button className="saved-location-main" type="button" onClick={() => selectAddress(item)}>
                        <span className="row-icon"><span className="material-symbols-outlined">{item.label === 'Home' ? 'home' : item.label === 'Work' ? 'business' : 'location_on'}</span></span>
                        <span><b>{item.label}{item.isDefault && <em>DEFAULT</em>}</b><small>{[item.address, item.landmark, item.city, item.pincode].filter(Boolean).join(', ')}</small></span>
                        <span className="location-radio" aria-hidden="true"><span /></span>
                      </button>
                      <button className="address-more" type="button" onClick={() => openEditAddress(item)} aria-label={`Edit ${item.label} address`} title="Edit address"><span className="material-symbols-outlined">edit</span></button>
                    </div>
                  ))}
                  {filteredAddresses.length === 0 && <div className="location-no-results">{addresses.length ? `No saved address matches “${locationSearch}”.` : 'No saved addresses yet.'}</div>}

                  <button className="add-address-row" type="button" onClick={openAddAddress}>
                    <span className="row-icon add"><span className="material-symbols-outlined">add</span></span>
                    <span><b>Add new address</b><small>Save Home, Work or another delivery address</small></span>
                    <span className="material-symbols-outlined row-arrow">chevron_right</span>
                  </button>

                  {addressMode === 'manage' && (
                    <div className="address-manager">
                      <div className="manager-title"><strong>Manage saved addresses</strong><button type="button" onClick={() => setAddressMode('list')} aria-label="Close address manager"><span className="material-symbols-outlined">close</span></button></div>
                      {addresses.map((item) => (
                        <div className="manager-row" key={item.id}>
                          <div><b>{item.label}</b><small>{item.city} · {item.pincode}</small></div>
                          <div className="manager-actions">
                            {!item.isDefault && <button type="button" onClick={() => setDefaultAddress(item)}>Set default</button>}
                            <button type="button" onClick={() => openEditAddress(item)} aria-label={`Edit ${item.label}`}><span className="material-symbols-outlined">edit</span></button>
                            <button className="delete" type="button" onClick={() => deleteAddress(item)} aria-label={`Delete ${item.label}`}><span className="material-symbols-outlined">delete</span></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}
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
        .location-popover{position:absolute;left:-52px;top:calc(100% + 10px);width:430px;max-height:min(720px,calc(100vh - 105px));overflow:auto;background:#fff;border:1px solid #e8e1d9;border-radius:18px;box-shadow:0 20px 55px rgba(34,42,38,.16);padding:18px}.location-popover:before{content:"";position:absolute;top:-7px;left:72px;width:14px;height:14px;background:#fff;border-left:1px solid #e8e1d9;border-top:1px solid #e8e1d9;transform:rotate(45deg)}
        .location-popover-head{padding:2px 4px 13px}.location-popover-head strong{display:block;font-size:17px;letter-spacing:-.3px;color:#18312d}.location-popover-head p{margin:4px 0 0;font-size:12px;color:#78817e}.address-form-head{display:flex;align-items:center;gap:10px}.address-form-head>div{min-width:0}.back-button{width:34px;height:34px;border:1px solid #e6dfd7;border-radius:9px;background:#fff;display:grid;place-items:center;color:#274f47;cursor:pointer;flex:0 0 auto}.back-button .material-symbols-outlined{font-size:19px}
        .location-search{height:46px;border:1px solid #ded8d0;border-radius:10px;display:flex;align-items:center;gap:9px;padding:0 11px;background:#fff}.location-search:focus-within{border-color:#176052;box-shadow:0 0 0 3px rgba(23,96,82,.07)}.location-search>.material-symbols-outlined{font-size:20px;color:#274f47}.location-search input{border:0;outline:0;min-width:0;flex:1;font:inherit;font-size:13px;color:#1d302d;background:transparent}.location-search input::placeholder{color:#8a918f}.location-search button{border:0;background:transparent;color:#7c8581;display:grid;place-items:center;cursor:pointer;padding:2px}.location-search button .material-symbols-outlined{font-size:17px}
        .current-location-row,.saved-location-row,.add-address-row{width:100%;border:0;background:transparent;display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;padding:12px 4px;color:#19332e}.current-location-row{border-bottom:1px solid #ece7e0;padding-top:14px;padding-bottom:14px}.current-location-row:disabled{cursor:wait;opacity:.7}.row-icon{width:38px;height:38px;display:grid;place-items:center;border-radius:50%;background:#f8f4ef;color:#274f47;flex:0 0 auto}.row-icon.current,.row-icon.add{background:#fff2e9;color:#ef5a28}.row-icon .material-symbols-outlined{font-size:21px}.current-location-row>span:nth-child(2){flex:1;min-width:0}.current-location-row b,.saved-location-row b,.add-address-row b{display:block;font-size:13px;font-weight:800}.current-location-row small,.saved-location-row small,.add-address-row small{display:block;font-size:11px;color:#7c8582;margin-top:3px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.row-arrow{font-size:19px;color:#697572}
        .saved-heading{display:flex;justify-content:space-between;align-items:center;padding:15px 4px 7px}.saved-heading span{font-size:10px;letter-spacing:1.3px;font-weight:900;color:#4d5c58}.saved-heading button{border:0;background:transparent;color:#ed5a28;font-size:12px;font-weight:800;cursor:pointer;padding:0}.saved-location-row{border-radius:10px;gap:5px}.saved-location-row:hover,.saved-location-row.selected{background:#fff8f2}.saved-location-main{min-width:0;flex:1;border:0;background:transparent;display:flex;align-items:center;gap:12px;text-align:left;cursor:pointer;padding:0;color:#19332e}.saved-location-main>span:nth-child(2){flex:1;min-width:0}.saved-location-main b{display:flex;align-items:center;gap:7px}.saved-location-main em{font-style:normal;font-size:8px;letter-spacing:.7px;padding:3px 5px;border-radius:4px;background:#eaf4f0;color:#176052}.location-radio{width:22px;height:22px;border:1.5px solid #d7d1c9;border-radius:50%;display:grid;place-items:center;flex:0 0 auto}.saved-location-row.selected .location-radio{border:2px solid #ef5a28}.saved-location-row.selected .location-radio span{width:10px;height:10px;border-radius:50%;background:#ef5a28}.address-more{width:34px;height:34px;border:0;border-radius:8px;background:transparent;color:#687572;display:grid;place-items:center;cursor:pointer}.address-more:hover{background:#f4eee7;color:#176052}.address-more .material-symbols-outlined{font-size:18px}.add-address-row{border-top:1px solid #ece7e0;margin-top:5px;padding-top:14px}.add-address-row>span:nth-child(2){flex:1;min-width:0}.location-no-results{font-size:12px;color:#7a8581;padding:14px 4px}
        .address-labels{display:flex;gap:7px;margin:0 0 13px}.address-labels button{height:38px;flex:1;border:1px solid #e2dbd3;border-radius:9px;background:#fff;color:#465752;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer}.address-labels button.active{border-color:#ef5a28;background:#fff4ed;color:#d94e20}.address-labels .material-symbols-outlined{font-size:17px}.address-field{display:block;margin:0 0 11px}.address-field>span{display:block;font-size:11px;font-weight:800;color:#3e504b;margin:0 0 5px}.address-field input,.address-field textarea{width:100%;box-sizing:border-box;border:1px solid #ded8d0;border-radius:9px;background:#fff;padding:10px 11px;outline:0;font:inherit;font-size:12px;color:#1d302d;resize:vertical}.address-field input{height:42px}.address-field textarea{min-height:72px}.address-field input:focus,.address-field textarea:focus{border-color:#176052;box-shadow:0 0 0 3px rgba(23,96,82,.07)}.address-field-grid{display:grid;grid-template-columns:1fr 1fr;gap:9px}.address-error{margin:2px 0 10px;padding:8px 9px;border-radius:7px;background:#fff0ed;color:#b33e25;font-size:11px}.address-form-actions{display:flex;gap:8px;border-top:1px solid #ece7e0;margin-top:13px;padding-top:13px}.address-cancel,.address-save{height:42px;border-radius:9px;font-size:12px;font-weight:800;cursor:pointer}.address-cancel{flex:1;border:1px solid #ded8d0;background:#fff;color:#40504c}.address-save{flex:1.5;border:1px solid #ef5a28;background:#ef5a28;color:#fff}.address-manager{margin-top:12px;border-top:1px solid #ece7e0;padding-top:12px}.manager-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:7px}.manager-title strong{font-size:13px;color:#19332e}.manager-title button{border:0;background:transparent;color:#697572;cursor:pointer}.manager-row{display:flex;align-items:center;gap:8px;padding:10px 0;border-bottom:1px solid #f0ebe5}.manager-row>div:first-child{flex:1;min-width:0}.manager-row b{display:block;font-size:12px;color:#19332e}.manager-row small{display:block;margin-top:3px;font-size:10px;color:#7b8581}.manager-actions{display:flex;align-items:center;gap:4px}.manager-actions button{border:1px solid #e1dbd3;background:#fff;color:#31534b;border-radius:7px;min-height:30px;padding:0 7px;font-size:10px;font-weight:800;cursor:pointer}.manager-actions button:hover{background:#f7f2ec}.manager-actions button.delete{color:#c94b32}.manager-actions .material-symbols-outlined{font-size:16px}
        @media(max-width:800px){.location-popover{position:fixed;left:12px;right:12px;top:78px;width:auto;max-width:none}.location-popover:before{display:none}}
      `}</style>
    </header>
  );
}
