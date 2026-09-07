'use client';

import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminRestaurantsPage() {
  const [restaurants, setRestaurants] = useState([]);
  const [message, setMessage] = useState('Loading restaurants…');
  const [busy, setBusy] = useState('');

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

  async function toggleRestaurant(restaurant) {
    setBusy(restaurant.id); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/restaurants/${restaurant.id}`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ isOpen: !restaurant.isOpen }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update restaurant.');
      setRestaurants((current) => current.map((item) => item.id === restaurant.id ? { ...item, isOpen: body.data.isOpen } : item));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(''); }
  }

  return (
    <main className="container">
      <div className="page-head"><div><span className="eyebrow">ADMIN</span><h1>Restaurant Management</h1><p>Review partner restaurants and control their availability.</p></div></div>
      {message && <section className="panel"><p>{message}</p></section>}
      <section className="cards">
        {restaurants.map((restaurant) => <article className="card admin-restaurant-row" key={restaurant.id}>
          <div><h3>{restaurant.name}</h3><p>{restaurant.cuisine || 'Restaurant'} · Rating {restaurant.rating ?? '—'}</p></div>
          <span className={`badge ${restaurant.isOpen ? '' : 'badge-muted'}`}>{restaurant.isOpen ? 'Open' : 'Closed'}</span>
          <button className="btn" disabled={busy === restaurant.id} onClick={() => toggleRestaurant(restaurant)}>{busy === restaurant.id ? 'Saving…' : restaurant.isOpen ? 'Close restaurant' : 'Open restaurant'}</button>
        </article>)}
        {!message && !restaurants.length && <section className="panel"><p>No restaurants found.</p></section>}
      </section>
    </main>
  );
}
