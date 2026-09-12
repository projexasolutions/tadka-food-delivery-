'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';
import './menu-image.css';

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
    <section className="partner-panel" id="add">
      <div className="panel-head"><div><h2>Add a new dish</h2><p>Create dishes customers can discover and order.</p></div><button className="icon-action" onClick={load} aria-label="Refresh menu"><span className="material-symbols-outlined">refresh</span></button></div>
      <form className="menu-add-form" onSubmit={add}>
        <input required minLength="2" maxLength="120" placeholder="Dish name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input required type="number" min="1" step="1" placeholder="Price (₹)" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
        <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <input maxLength="500" placeholder="Short description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <div className="menu-image-picker">
          <input ref={addImageRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickAddImage} />
          {form.imageUrl ? <div className="menu-image-preview"><img src={form.imageUrl} alt="Dish preview" /><button type="button" className="image-remove" onClick={() => { setForm({ ...form, imageUrl: '' }); if (addImageRef.current) addImageRef.current.value = ''; }} aria-label="Remove image">×</button></div> : <button type="button" className="image-picker-button" onClick={() => addImageRef.current?.click()}><span className="material-symbols-outlined">add_photo_alternate</span>Add Image</button>}
        </div>
        <button className="partner-btn primary"><span className="material-symbols-outlined">add</span>Add Dish</button>
      </form>
      {msg && <div className="partner-alert">{msg}<button onClick={() => setMsg('')}>×</button></div>}
    </section>

    <section className="partner-panel">
      <div className="panel-head"><div><h2>Dish catalog</h2><p>{items.filter((i) => i.isAvailable).length} available • {items.filter((i) => !i.isAvailable).length} hidden</p></div><input className="catalog-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search dishes…" /></div>
      <div className="menu-command-tabs"><button className={cat === 'all' ? 'active' : ''} onClick={() => setCat('all')}>All</button>{categories.map((c) => <button className={cat === c.id ? 'active' : ''} key={c.id} onClick={() => setCat(c.id)}>{c.name}</button>)}</div>
      {loading ? <div className="partner-empty compact">Loading menu…</div> : <div className="dish-admin-grid">
        {filtered.map((item) => <article className={`dish-admin ${!item.isAvailable ? 'hidden' : ''}`} key={item.id}>
          <div className="dish-admin-image">{item.imageUrl ? <img src={item.imageUrl} alt={item.name} onError={(e) => { e.currentTarget.src = fallbackImage; }} /> : <img src={fallbackImage} alt="Dish placeholder" />}</div>
          <div className="dish-admin-copy"><div><span className="category-type">{categories.find((c) => c.id === item.categoryId)?.name || 'Uncategorized'}</span><span className={`availability ${item.isAvailable ? 'yes' : 'no'}`}>{item.isAvailable ? 'AVAILABLE' : 'HIDDEN'}</span></div><h3>{item.name}</h3><p>{item.description || 'No description'}</p><strong>₹{Number(item.price).toFixed(0)}</strong></div>
          <div className="dish-admin-actions"><button onClick={() => toggle(item)} className="partner-btn secondary"><span className="material-symbols-outlined">{item.isAvailable ? 'visibility_off' : 'visibility'}</span>{item.isAvailable ? 'Hide' : 'Show'}</button><button onClick={() => setEdit({ ...item })} className="icon-action" aria-label="Edit dish"><span className="material-symbols-outlined">edit</span></button><button onClick={() => remove(item.id)} className="icon-action danger-icon" aria-label="Hide dish"><span className="material-symbols-outlined">delete</span></button></div>
        </article>)}
        {!filtered.length && <div className="partner-empty compact"><span className="material-symbols-outlined">search_off</span><b>No dishes found</b><p>Try another search or category.</p></div>}
      </div>}
    </section>

    {edit && <div className="modal-backdrop" onMouseDown={() => setEdit(null)}><div className="partner-modal" onMouseDown={(e) => e.stopPropagation()}><div className="panel-head"><div><h2>Edit dish</h2><p>Update the details customers see.</p></div><button className="icon-action" onClick={() => setEdit(null)}>×</button></div><form onSubmit={saveEdit}><label>Dish name<input required minLength="2" maxLength="120" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label><label>Price<input required type="number" min="1" step="1" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></label><label>Category<select value={edit.categoryId || ''} onChange={(e) => setEdit({ ...edit, categoryId: e.target.value })}><option value="">No category</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label><label>Description<textarea rows="4" maxLength="500" value={edit.description || ''} onChange={(e) => setEdit({ ...edit, description: e.target.value })} /></label><div className="edit-image-section"><span className="image-section-label">Dish image</span><div className="edit-image-preview">{edit.imageUrl ? <img src={edit.imageUrl} alt={edit.name} /> : <div className="edit-image-empty"><span className="material-symbols-outlined">image</span><span>No image</span></div>}<div className="edit-image-actions"><input ref={editImageRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={pickEditImage} /><button type="button" className="partner-btn secondary" onClick={() => editImageRef.current?.click()}><span className="material-symbols-outlined">edit</span>{edit.imageUrl ? 'Change Image' : 'Add Image'}</button>{edit.imageUrl && <button type="button" className="partner-btn secondary" onClick={() => { setEdit({ ...edit, imageUrl: '' }); if (editImageRef.current) editImageRef.current.value = ''; }}><span className="material-symbols-outlined">delete</span>Remove Image</button>}</div></div></div><div className="modal-actions"><button type="button" className="partner-btn secondary" onClick={() => setEdit(null)}>Cancel</button><button className="partner-btn primary"><span className="material-symbols-outlined">save</span>Save Changes</button></div></form></div></div>}
  </RestaurantShell>;
}
