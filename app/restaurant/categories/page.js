'use client';

import { useEffect, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body?.data;
}

export default function Categories() {
  const [cats, setCats] = useState([]);
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try { setCats((await api('/v1/restaurant/menu'))?.categories || []); setMsg(''); }
    catch (error) { setMsg(error.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function add(event) {
    event.preventDefault();
    try { await api('/v1/restaurant/categories', { method: 'POST', body: JSON.stringify({ name: name.trim() }) }); setName(''); setMsg('Category added.'); await load(); }
    catch (error) { setMsg(error.message); }
  }

  async function remove(id) {
    if (!window.confirm('Delete this category? Menu items will remain uncategorized.')) return;
    try { await api(`/v1/restaurant/categories/${id}`, { method: 'DELETE' }); setMsg('Category removed.'); await load(); }
    catch (error) { setMsg(error.message); }
  }

  return <RestaurantShell title="MENU COMMAND" subtitle="Categories"><section className="partner-panel"><div className="panel-head"><div><h2>Menu Categories</h2><p>Organize your restaurant menu with reusable categories.</p></div><button className="icon-action" onClick={load} aria-label="Refresh categories"><span className="material-symbols-outlined">refresh</span></button></div><form className="inline-form" onSubmit={add}><input value={name} onChange={(e) => setName(e.target.value)} minLength="2" maxLength="80" placeholder="New category name" required/><button className="partner-btn primary"><span className="material-symbols-outlined">add</span>Add Category</button></form>{msg&&<div className="partner-alert">{msg}<button onClick={() => setMsg('')}>×</button></div>}<div className="category-list">{loading?<div className="partner-empty compact">Loading categories…</div>:cats.map((c)=><div className="category-row" key={c.id}><span className="material-symbols-outlined">category</span><b>{c.name}</b><span className="category-type">Restaurant</span><button className="icon-action danger-icon" onClick={() => remove(c.id)} aria-label={`Delete ${c.name}`}><span className="material-symbols-outlined">delete</span></button></div>)}{!loading&&!cats.length&&<div className="partner-empty compact">No categories yet.</div>}</div></section></RestaurantShell>;
}
