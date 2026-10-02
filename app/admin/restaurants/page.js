'use client';

import { useEffect, useMemo, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [message, setMessage] = useState('Loading restaurants…');
  const [busy, setBusy] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: '', cuisine: '', description: '', deliveryFee: '0' });

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/v1/admin/restaurants`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load restaurants.');
        return body.data;
      })
      .then((data) => { setRestaurants(data); setMessage(''); })
      .catch((error) => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, []);

  async function createRestaurant(event) {
    event.preventDefault(); setBusy('create'); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/restaurants`, { method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, deliveryFee: Number(form.deliveryFee || 0) }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to create restaurant.');
      setRestaurants((current) => [body.data, ...current]); setForm({ name: '', cuisine: '', description: '', deliveryFee: '0' }); setShowCreate(false); setMessage('Restaurant created successfully.');
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  }

  async function toggleRestaurant(restaurant) {
    setBusy(restaurant.id);
    setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/restaurants/${restaurant.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOpen: !restaurant.isOpen }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update restaurant.');
      setRestaurants((current) => current.map((item) => item.id === restaurant.id ? { ...item, isOpen: body.data.isOpen } : item));
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy('');
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return restaurants.filter((restaurant) => {
      const matchesQuery = !q || [restaurant.name, restaurant.cuisine].some((value) => String(value || '').toLowerCase().includes(q));
      const matchesFilter = filter === 'all' || (filter === 'open' ? restaurant.isOpen : !restaurant.isOpen);
      return matchesQuery && matchesFilter;
    });
  }, [restaurants, query, filter]);

  const openCount = restaurants.filter((restaurant) => restaurant.isOpen).length;
  const closedCount = restaurants.length - openCount;

  return (
    <main className="admin-restaurants-page">
      <div className="admin-restaurants-wrap">
        <header className="admin-restaurants-head">
          <div>
            <div className="admin-breadcrumb"><span>ADMIN</span><b>/</b><span>RESTAURANTS</span></div>
            <div className="admin-restaurants-title-row">
              <div className="admin-page-icon">R</div>
              <div>
                <h1>Restaurant Management</h1>
                <p>Monitor partner restaurants and control their availability from one place.</p>
              </div>
            </div>
          </div>
          <div className="admin-restaurants-head-actions"><div className="admin-live-pill"><i /> Live data</div><button className="admin-create-restaurant-btn" onClick={() => setShowCreate(true)}><span>+</span> Add restaurant</button></div>
        </header>

        <section className="admin-restaurant-stats">
          <div><span>Total restaurants</span><strong>{restaurants.length}</strong><small>Partner locations</small></div>
          <div><span>Currently open</span><strong>{openCount}</strong><small className="positive">Available to customers</small></div>
          <div><span>Currently closed</span><strong>{closedCount}</strong><small>Not accepting orders</small></div>
        </section>

        <section className="admin-restaurant-toolbar">
          <div className="admin-restaurant-search">
            <span>⌕</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search restaurants or cuisine…" />
          </div>
          <div className="admin-filter-group">
            {['all', 'open', 'closed'].map((item) => (
              <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>
                {item === 'all' ? 'All' : item === 'open' ? 'Open' : 'Closed'}
              </button>
            ))}
          </div>
        </section>

        {message && <section className="admin-restaurant-alert">{message}</section>}

        <section className="admin-restaurant-list">
          <div className="admin-list-heading">
            <div><span className="eyebrow">PARTNER LOCATIONS</span><h2>Restaurants <em>{filtered.length}</em></h2></div>
            <span>{filtered.length} shown</span>
          </div>

          {filtered.map((restaurant) => (
            <article className="admin-restaurant-card" key={restaurant.id}>
              <div className="admin-restaurant-avatar">{restaurant.name?.trim()?.charAt(0)?.toUpperCase() || 'R'}</div>
              <div className="admin-restaurant-info">
                <div className="admin-restaurant-name-row">
                  <h3>{restaurant.name}</h3>
                  <span className={restaurant.isOpen ? 'admin-status-chip open' : 'admin-status-chip closed'}>
                    <i /> {restaurant.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
                <p>{restaurant.cuisine || 'Restaurant'} <b>•</b> Rating {restaurant.rating ?? '—'}</p>
              </div>
              <div className="admin-restaurant-action">
                <button
                  className={restaurant.isOpen ? 'admin-close-btn' : 'admin-open-btn'}
                  disabled={busy === restaurant.id}
                  onClick={() => toggleRestaurant(restaurant)}
                >
                  {busy === restaurant.id ? 'Saving…' : restaurant.isOpen ? 'Close restaurant' : 'Open restaurant'}
                </button>
              </div>
            </article>
          ))}

          {!message && !filtered.length && (
            <div className="admin-restaurant-empty">
              <strong>No restaurants found</strong>
              <span>Try another search or filter.</span>
            </div>
          )}
        </section>
      </div>
    
        {showCreate && <div className="admin-modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setShowCreate(false); }}>
          <form className="admin-create-modal" onSubmit={createRestaurant}>
            <div className="admin-create-modal-head"><div><span className="eyebrow">NEW PARTNER</span><h2>Add restaurant</h2><p>Create a restaurant first, then assign staff to it from User Management.</p></div><button type="button" onClick={() => setShowCreate(false)}>×</button></div>
            <label>Restaurant name<input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} placeholder="e.g. Tadka Kitchen" /></label>
            <div className="admin-create-grid"><label>Cuisine<input value={form.cuisine} onChange={e => setForm({...form,cuisine:e.target.value})} placeholder="Indian, Chinese…" /></label><label>Delivery fee (₹)<input type="number" min="0" value={form.deliveryFee} onChange={e => setForm({...form,deliveryFee:e.target.value})} /></label></div>
            <label>Description<textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} placeholder="Short restaurant description…" rows="3" /></label>
            <div className="admin-create-actions"><button type="button" onClick={() => setShowCreate(false)}>Cancel</button><button className="primary" disabled={busy === 'create'}>{busy === 'create' ? 'Creating…' : 'Create restaurant'}</button></div>
          </form>
        </div>}
    </main>
  );
}
