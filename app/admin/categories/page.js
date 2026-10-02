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
    <main className="min-h-screen bg-tadka-bg px-4 py-8 text-tadka-ink sm:px-6">
      <div className="mx-auto mb-7 w-full max-w-[1240px]"><div><span className="text-[10px] font-black tracking-[0.14em] text-tadka-orange">ADMIN</span><h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Categories</h1><p>Keep each restaurant's food catalog organized.</p></div></div>
      {message && <p className="mx-auto mb-4 w-full max-w-[1240px] rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{message}</p>}
      <section className="mx-auto mt-5 w-full max-w-[1240px] rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm">
        <form onSubmit={add} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <select required value={restaurantId} onChange={(event) => setRestaurantId(event.target.value)} aria-label="Restaurant">
            <option value="" disabled>Select restaurant</option>
            {restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}
          </select>
          <input required minLength={2} maxLength={80} placeholder="Category name" value={name} onChange={(event) => setName(event.target.value)} />
          <button className="rounded-xl bg-tadka-green px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange disabled:opacity-50" disabled={busy === 'add' || !restaurantId}>{busy === 'add' ? 'Adding…' : 'Add category'}</button>
        </form>
      </section>
      <section className="mx-auto mt-5 grid w-full max-w-[1240px] gap-3">
        {items.map((item) => <article className="flex items-center justify-between gap-4 rounded-xl border border-tadka-line bg-white p-4 shadow-tadka-sm" key={item.id}>
          <div><strong>{item.name}</strong><p>{item.restaurantName || 'Unassigned restaurant'}</p></div>
          <button className="rounded-xl border border-tadka-line px-3 py-2 text-xs font-bold text-tadka-danger hover:bg-orange-50 disabled:opacity-50" disabled={busy === item.id} onClick={() => remove(item.id)}>{busy === item.id ? 'Deleting…' : 'Delete'}</button>
        </article>)}
        {!message && !items.length && <section className="mx-auto mt-5 w-full max-w-[1240px] rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm"><p>No categories found.</p></section>}
      </section>
    </main>
  );
}
