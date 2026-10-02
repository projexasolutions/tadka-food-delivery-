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
    <section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">
      <div className="flex items-start justify-between gap-4"><div><h2>Menu Categories</h2><p>Organize dishes into simple sections customers can scan quickly.</p></div><button className="grid h-10 w-10 place-items-center rounded-xl border border-tadka-line bg-white hover:bg-tadka-bg" onClick={load} aria-label="Refresh categories"><span className="material-symbols-outlined">refresh</span></button></div>
      <form className="mt-5 flex flex-col gap-3 sm:flex-row" onSubmit={add}><input value={name} onChange={(e) => setName(e.target.value)} minLength="2" maxLength="80" placeholder="New category name" required/><button className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark"><span className="material-symbols-outlined">add</span>Add Category</button></form>
      {msg && <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{msg}<button onClick={() => setMsg('')}>×</button></div>}
      <div className="mt-5 divide-y divide-tadka-line overflow-hidden rounded-xl border border-tadka-line">
        {loading ? <div className="p-8 text-center text-tadka-muted">Loading categories…</div> : cats.map((c) => <div className="flex items-center gap-3 p-4" key={c.id}>
          <span className="material-symbols-outlined">category</span><span className="min-w-0 flex-1"><b className="block">{c.name}</b><small className="mt-1 block text-xs text-tadka-muted">{itemCount[c.id] || 0} dish{itemCount[c.id] === 1 ? '' : 'es'}</small></span><span className="rounded-full bg-tadka-bg px-2 py-1 text-[10px] font-bold text-tadka-muted">Restaurant</span>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-tadka-line bg-white hover:bg-tadka-bg" onClick={() => setEditing({ ...c })} aria-label={`Edit ${c.name}`}><span className="material-symbols-outlined">edit</span></button>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-red-200 bg-white text-tadka-danger hover:bg-red-50" onClick={() => remove(c.id)} aria-label={`Delete ${c.name}`}><span className="material-symbols-outlined">delete</span></button>
        </div>)}
        {!loading && !cats.length && <div className="grid place-items-center p-8 text-center text-tadka-muted"><span className="material-symbols-outlined">category</span><b>No categories yet</b><p>Add your first menu section above.</p></div>}
      </div>
    </section>

    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-tadka-ink/50 p-4" onMouseDown={() => setEditing(null)}><div className="w-full max-w-lg rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-lg" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><h2>Edit category</h2><p>Rename this section without changing its dishes.</p></div><button className="grid h-10 w-10 place-items-center rounded-xl border border-tadka-line bg-white hover:bg-tadka-bg" onClick={() => setEditing(null)}>×</button></div><form onSubmit={saveEdit}><label>Category name<input required minLength="2" maxLength="80" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })}/></label><div className="mt-6 flex justify-end gap-2"><button type="button" className="rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink hover:bg-tadka-bg" onClick={() => setEditing(null)}>Cancel</button><button className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark"><span className="material-symbols-outlined">save</span>Save Changes</button></div></form></div></div>}
  </RestaurantShell>;
}
