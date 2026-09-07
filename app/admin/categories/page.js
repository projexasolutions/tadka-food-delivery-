'use client';

import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function AdminCategories() {
  const [items, setItems] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [name, setName] = useState('');
  const [restaurantId, setRestaurantId] = useState('');
  const [message, setMessage] = useState('Loading categories…');
  const [busy, setBusy] = useState('');

  async function load() {
    const [categoriesResponse, restaurantsResponse] = await Promise.all([
      fetch(`${apiUrl}/v1/admin/categories`, { credentials: 'include', cache: 'no-store' }),
      fetch(`${apiUrl}/v1/admin/restaurants`, { credentials: 'include', cache: 'no-store' }),
    ]);
    const categoriesBody = await categoriesResponse.json().catch(() => null);
    const restaurantsBody = await restaurantsResponse.json().catch(() => null);
    if (!categoriesResponse.ok) throw new Error(categoriesBody?.error?.message || 'Unable to load categories.');
    if (!restaurantsResponse.ok) throw new Error(restaurantsBody?.error?.message || 'Unable to load restaurants.');
    setItems(categoriesBody.data); setRestaurants(restaurantsBody.data);
    setRestaurantId((current) => current || restaurantsBody.data[0]?.id || '');
    setMessage('');
  }

  useEffect(() => { load().catch((error) => setMessage(error.message)); }, []);

  async function add(event) {
    event.preventDefault(); setBusy('add'); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/categories`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ restaurantId, name }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to add category.');
      setName(''); await load();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(''); }
  }

  async function remove(id) {
    setBusy(id); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/categories/${id}`, { method: 'DELETE', credentials: 'include' });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to delete category.');
      setItems((current) => current.filter((item) => item.id !== id));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(''); }
  }

  return (
    <main className="container">
      <div className="page-head"><div><span className="eyebrow">ADMIN</span><h1>Categories</h1><p>Keep each restaurant's food catalog organized.</p></div></div>
      {message && <p className="notice">{message}</p>}
      <section className="panel">
        <form onSubmit={add} className="form-grid">
          <select required value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)} aria-label="Restaurant">
            <option value="" disabled>Select restaurant</option>
            {restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}
          </select>
          <input required minLength={2} maxLength={80} placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="btn primary" disabled={busy === 'add' || !restaurantId}>{busy === 'add' ? 'Adding…' : 'Add category'}</button>
        </form>
      </section>
      <section className="cards">
        {items.map((item) => <article className="card" key={item.id}>
          <div><strong>{item.name}</strong><p>{item.restaurantName || 'Unassigned restaurant'}</p></div>
          <button className="btn danger" disabled={busy === item.id} onClick={() => remove(item.id)}>{busy === item.id ? 'Deleting…' : 'Delete'}</button>
        </article>)}
        {!message && !items.length && <section className="panel"><p>No categories found.</p></section>}
      </section>
    </main>
  );
}
