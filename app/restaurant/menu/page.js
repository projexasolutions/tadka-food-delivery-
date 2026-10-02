'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const emptyForm = { name: '', description: '', price: '', categoryId: '', imageUrl: '' };
const fallbackImage = 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=900&q=80';

async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, { ...options, credentials: 'include', cache: 'no-store', headers: { 'Content-Type': 'application/json', ...(options.headers || {}) } });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body?.data;
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    if (!file?.type?.startsWith('image/')) return reject(new Error('Please select an image file.'));
    if (file.size > 8 * 1024 * 1024) return reject(new Error('Image must be 8 MB or smaller.'));
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 1200;
        const scale = Math.min(1, max / Math.max(img.width, img.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(img.width * scale));
        canvas.height = Math.max(1, Math.round(img.height * scale));
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.onerror = () => reject(new Error('Could not read that image.'));
      img.src = reader.result;
    };
    reader.onerror = () => reject(new Error('Could not read that image.'));
    reader.readAsDataURL(file);
  });
}

export default function RestaurantMenu() {
  const [restaurant, setRestaurant] = useState(null);
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [edit, setEdit] = useState(null);
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('all');
  const [msg, setMsg] = useState('');
  const [loading, setLoading] = useState(true);
  const addImageRef = useRef(null);
  const editImageRef = useRef(null);

  async function load() {
    setLoading(true);
    try {
      const data = await api('/v1/restaurant/menu');
      setItems(data?.items || []);
      setCategories(data?.categories || []);
      const current = await api('/v1/restaurant');
      setRestaurant(current);
      setMsg('');
    } catch (error) {
      setMsg(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function add(event) {
    event.preventDefault();
    try {
      await api('/v1/restaurant/menu/items', { method: 'POST', body: JSON.stringify({ name: form.name.trim(), description: form.description.trim() || null, price: Number(form.price), categoryId: form.categoryId || null, imageUrl: form.imageUrl || null }) });
      setForm(emptyForm);
      if (addImageRef.current) addImageRef.current.value = '';
      setMsg('Dish added to your menu.');
      await load();
    } catch (error) { setMsg(error.message); }
  }

  async function saveEdit(event) {
    event.preventDefault();
    try {
      await api(`/v1/restaurant/menu/items/${edit.id}`, { method: 'PATCH', body: JSON.stringify({ name: edit.name.trim(), description: edit.description?.trim() || null, price: Number(edit.price), categoryId: edit.categoryId || null, imageUrl: edit.imageUrl || null }) });
      setEdit(null);
      setMsg('Dish updated.');
      await load();
    } catch (error) { setMsg(error.message); }
  }

  async function pickAddImage(event) {
    try {
      const imageUrl = await compressImage(event.target.files?.[0]);
      setForm((current) => ({ ...current, imageUrl }));
      setMsg('Image selected. Click Add Dish to save it.');
    } catch (error) { setMsg(error.message); }
  }

  async function pickEditImage(event) {
    try {
      const imageUrl = await compressImage(event.target.files?.[0]);
      setEdit((current) => ({ ...current, imageUrl }));
      setMsg('New image selected. Click Save Changes to save it.');
    } catch (error) { setMsg(error.message); }
  }

  async function toggle(item) {
    try {
      const updated = await api(`/v1/restaurant/menu/items/${item.id}`, { method: 'PATCH', body: JSON.stringify({ isAvailable: !item.isAvailable }) });
      setItems((current) => current.map((value) => value.id === item.id ? { ...value, ...updated } : value));
    } catch (error) { setMsg(error.message); }
  }

  async function remove(id) {
    if (!window.confirm('Hide this menu item?')) return;
    try {
      await api(`/v1/restaurant/menu/items/${id}`, { method: 'DELETE' });
      setItems((current) => current.map((item) => item.id === id ? { ...item, isAvailable: false } : item));
      setMsg('Dish hidden from customers.');
    } catch (error) { setMsg(error.message); }
  }

  const filtered = useMemo(() => items.filter((item) => (cat === 'all' || item.categoryId === cat) && `${item.name} ${item.description || ''}`.toLowerCase().includes(query.toLowerCase())), [items, cat, query]);

  return <RestaurantShell title="MENU MANAGEMENT" subtitle="Menu & Dish Catalog">
    <section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm" id="add">
      <div className="flex items-start justify-between gap-4"><div><h2>Add a new dish</h2><p>Create dishes customers can discover and order.</p></div><button className="icon-action" onClick={load} aria-label="Refresh menu"><span className="material-symbols-outlined">refresh</span></button></div>
      <form className="mt-5 grid gap-3 md:grid-cols-2" onSubmit={add}>
        <input required minLength="2" maxLength="120" placeholder="Dish name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="number" min="1" step="1" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input maxLength="500" placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="relative min-w-0 md:min-w-[180px]">
          <input ref={addImageRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAddImage} />
          {form.imageUrl ? <div className="relative h-[46px] w-full overflow-hidden rounded-xl bg-tadka-bg"><img src={form.imageUrl} alt="Dish preview" /><button type="button" className="absolute right-1 top-1 grid h-7 w-7 place-items-center rounded-full border-0 bg-black/65 text-xl leading-none text-white" onClick={() => { setForm({ ...form, imageUrl: '' }); if (addImageRef.current) addImageRef.current.value = ''; }} aria-label="Remove image">×</button></div> : <button type="button" className="inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl border border-dashed border-black/20 bg-white/70 text-sm font-bold text-tadka-muted" onClick={() => addImageRef.current?.click()}><span className="material-symbols-outlined">add_photo_alternate</span>Add Image</button>}
        </div>
        <button className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark"><span className="material-symbols-outlined">add</span>Add Dish</button>
      </form>
      {msg && <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900">{msg}<button onClick={() => setMsg('')}>×</button></div>}
    </section>

    <section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">
      <div className="flex items-start justify-between gap-4"><div><h2>Dish catalog</h2><p>{items.filter((i) => i.isAvailable).length} available • {items.filter((i) => !i.isAvailable).length} hidden</p></div><input className="w-full max-w-xs rounded-xl border border-tadka-line bg-white px-3 py-2.5 text-sm outline-none focus:border-tadka-green" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes…" /></div>
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1"><button className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold ${cat === "all" ? "border-tadka-green bg-tadka-green text-white" : "border-tadka-line bg-white text-tadka-muted"}`} onClick={() => setCat('all')}>All</button>{categories.map((c) => <button className={`shrink-0 rounded-xl border px-3 py-2 text-xs font-bold ${cat === c.id ? "border-tadka-green bg-tadka-green text-white" : "border-tadka-line bg-white text-tadka-muted"}`} key={c.id} onClick={() => setCat(c.id)}>{c.name}</button>)}</div>
      {loading ? <div className="partner-empty compact">Loading menu…</div> : <div className="mt-5 grid gap-4 md:grid-cols-2">
        {filtered.map((item) => <article className="grid gap-4 rounded-2xl border border-tadka-line bg-white p-4 shadow-tadka-sm sm:grid-cols-[112px_1fr_auto]" key={item.id}>
          <div className="h-28 w-28 overflow-hidden rounded-xl bg-tadka-bg">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} onError={(e) => { e.currentTarget.src = fallbackImage; }} /> : <img src={fallbackImage} alt="Dish placeholder" />}</div>
          <div className="min-w-0"><div><span className="category-type">{categories.find((c) => c.id === item.categoryId)?.name || 'Uncategorized'}</span><span className="ml-2 rounded-full bg-tadka-green-soft px-2 py-1 text-[9px] font-black text-tadka-success">{item.isAvailable ? 'AVAILABLE' : 'HIDDEN'}</span></div><h3>{item.name}</h3><p>{item.description || 'No description'}</p><strong>₹{Number(item.price).toFixed(0)}</strong></div>
          <div className="flex items-center gap-2 sm:flex-col sm:items-stretch sm:justify-center"><button onClick={() => toggle(item)} className="rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink hover:bg-tadka-bg"><span className="material-symbols-outlined">{item.isAvailable ? 'visibility_off' : 'visibility'}</span>{item.isAvailable ? 'Hide' : 'Show'}</button><button onClick={() => setEdit({ ...item })} className="icon-action" aria-label="Edit dish"><span className="material-symbols-outlined">edit</span></button><button onClick={() => remove(item.id)} className="icon-action danger-icon" aria-label="Hide dish"><span className="material-symbols-outlined">delete</span></button></div>
        </article>)}
        {!filtered.length && <div className="partner-empty compact"><span className="material-symbols-outlined">search_off</span><b>No dishes found</b><p>Try another search or category.</p></div>}
      </div>}
    </section>

    {edit && <div className="fixed inset-0 z-50 grid place-items-center bg-tadka-ink/50 p-4" onMouseDown={() => setEdit(null)}><div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-lg" onMouseDown={(e) => e.stopPropagation()}><div className="flex items-start justify-between gap-4"><div><h2>Edit dish</h2><p>Update the details customers see.</p></div><button className="icon-action" onClick={() => setEdit(null)}>×</button></div><form onSubmit={saveEdit}><label>Dish name<input required minLength="2" maxLength="120" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label><label>Price<input required type="number" min="1" step="1" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></label><label>Category<select value={edit.categoryId || ''} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Description<textarea rows="4" maxLength="500" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></label><div className="mt-2"><span className="mb-2 block text-sm font-bold text-tadka-ink">Dish image</span><div className="overflow-hidden rounded-2xl border border-tadka-line bg-tadka-bg">{edit.imageUrl ? <img src={edit.imageUrl} alt={edit.name} /> : <div className="flex h-[190px] flex-col items-center justify-center gap-1.5 text-tadka-subtle"><span className="material-symbols-outlined">image</span><span>No image</span></div>}<div className="flex flex-wrap gap-2 p-2.5"><input ref={editImageRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickEditImage} /><button type="button" className="rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink hover:bg-tadka-bg" onClick={() => editImageRef.current?.click()}><span className="material-symbols-outlined">edit</span>{edit.imageUrl ? 'Change Image' : 'Add Image'}</button>{edit.imageUrl && <button type="button" className="rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink hover:bg-tadka-bg" onClick={() => { setEdit({ ...edit, imageUrl: '' }); if (editImageRef.current) editImageRef.current.value = ''; }}><span className="material-symbols-outlined">delete</span>Remove Image</button>}</div></div></div><div className="mt-6 flex justify-end gap-2"><button type="button" className="rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold text-tadka-ink hover:bg-tadka-bg" onClick={() => setEdit(null)}>Cancel</button><button className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark"><span className="material-symbols-outlined">save</span>Save Changes</button></div></form></div></div>}
  </RestaurantShell>;
}
