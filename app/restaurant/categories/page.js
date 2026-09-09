'use client';

import { useEffect, useMemo, useState } from 'react';
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
  const [items, setItems] = useState([]);
  const [name, setName] = useState('');
  const [editing, setEditing] = useState(null);
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const data = await api('/v1/restaurant/menu');
      setCats(data?.categories || []);
      setItems(data?.items || []);
      setMsg('');
    } catch (error) { setMsg(error.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function add(event) {
    event.preventDefault();
    try { await api('/v1/restaurant/categories', { method: 'POST', body: JSON.stringify({ name: name.trim() }) }); setName(''); setMsg('Category added.'); await load(); }
    catch (error) { setMsg(error.message); }
  }

  async function saveEdit(event) {
    event.preventDefault();
    try { await api(`/v1/restaurant/categories/${editing.id}`, { method: 'PATCH', body: JSON.stringify({ name: editing.name.trim() }) }); setEditing(null); setMsg('Category updated.'); await load(); }
    catch (error) { setMsg(error.message); }
  }

  async function remove(id) {
    if (!window.confirm('Delete this category? Menu items will remain uncategorized.')) return;
    try { await api(`/v1/restaurant/categories/${id}`, { method: 'DELETE' }); setMsg('Category removed.'); await load(); }
    catch (error) { setMsg(error.message); }
  }

  const itemCount = useMemo(() => cats.reduce((map, cat) => { map[cat.id] = items.filter((item) => item.categoryId === cat.id).length; return map; }, {}), [cats, items]);

  return <RestaurantShell title="MENU COMMAND" subtitle="Categories">
    <section className="partner-panel">
      <div className="panel-head"><div><h2>Menu Categories</h2><p>Organize dishes into simple sections customers can scan quickly.</p></div><button className="icon-action" onClick={load} aria-label="Refresh categories"><span className="material-symbols-outlined">refresh</span></button></div>
      <form className="inline-form" onSubmit={add}><input value={name} onChange={(e) => setName(e.target.value)} minLength="2" maxLength="80" placeholder="New category name" required/><button className="partner-btn primary"><span className="material-symbols-outlined">add</span>Add Category</button></form>
      {msg && <div className="partner-alert">{msg}<button onClick={() => setMsg('')}>×</button></div>}
      <div className="category-list">
        {loading ? <div className="partner-empty compact">Loading categories…</div> : cats.map((c) => <div className="category-row" key={c.id}>
          <span className="material-symbols-outlined">category</span><span className="category-main"><b>{c.name}</b><small>{itemCount[c.id] || 0} dish{itemCount[c.id] === 1 ? '' : 'es'}</small></span><span className="category-type">Restaurant</span>
          <button className="icon-action" onClick={() => setEditing({ ...c })} aria-label={`Edit ${c.name}`}><span className="material-symbols-outlined">edit</span></button>
          <button className="icon-action danger-icon" onClick={() => remove(c.id)} aria-label={`Delete ${c.name}`}><span className="material-symbols-outlined">delete</span></button>
        </div>)}
        {!loading && !cats.length && <div className="partner-empty compact"><span className="material-symbols-outlined">category</span><b>No categories yet</b><p>Add your first menu section above.</p></div>}
      </div>
    </section>

    {editing && <div className="modal-backdrop" onMouseDown={() => setEditing(null)}><div className="partner-modal" onMouseDown={(e) => e.stopPropagation()}><div className="panel-head"><div><h2>Edit category</h2><p>Rename this section without changing its dishes.</p></div><button className="icon-action" onClick={() => setEditing(null)}>×</button></div><form onSubmit={saveEdit}><label>Category name<input required minLength="2" maxLength="80" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}/></label><div className="modal-actions"><button type="button" className="partner-btn secondary" onClick={() => setEditing(null)}>Cancel</button><button className="partner-btn primary"><span className="material-symbols-outlined">save</span>Save Changes</button></div></form></div></div>}
  </RestaurantShell>;
}
