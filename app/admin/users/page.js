'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ROLES = [
  { id: 'customer', label: 'Customer', icon: 'person', color: 'blue', access: 'Browse, cart, checkout & orders', dashboard: '/' },
  { id: 'restaurant_staff', label: 'Restaurant Staff', icon: 'restaurant', color: 'orange', access: 'Menu, kitchen, orders & analytics', dashboard: '/restaurant' },
  { id: 'rider', label: 'Delivery Rider', icon: 'two_wheeler', color: 'green', access: 'Assigned deliveries & status updates', dashboard: '/delivery' },
  { id: 'admin', label: 'Admin', icon: 'admin_panel_settings', color: 'red', access: 'Platform, users, restaurants & orders', dashboard: '/admin' },
];
const ROLE_ACCESS = [
  ['Customer', 'Browse restaurants', 'Cart & checkout', 'Order history', 'Live order tracking'],
  ['Restaurant Staff', 'Restaurant dashboard', 'Menu & categories', 'Kitchen orders', 'Reviews & analytics'],
  ['Delivery Rider', 'Assigned deliveries', 'Pickup workflow', 'Delivery status', 'Customer delivery details'],
  ['Admin', 'User management', 'Restaurant management', 'Order operations', 'Categories & platform controls'],
];

export default function AdminUsers() {
  const [users, setUsers] = useState([]), [restaurants, setRestaurants] = useState([]), [message, setMessage] = useState('Loading users…'), [busy, setBusy] = useState(''), [query, setQuery] = useState(''), [roleFilter, setRoleFilter] = useState('all'), [drafts, setDrafts] = useState({});

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${apiUrl}/v1/admin/users`, { credentials: 'include', cache: 'no-store', signal: controller.signal }),
      fetch(`${apiUrl}/v1/admin/restaurants`, { credentials: 'include', cache: 'no-store', signal: controller.signal }),
    ]).then(async ([usersResponse, restaurantsResponse]) => {
      const usersBody = await usersResponse.json().catch(() => null), restaurantsBody = await restaurantsResponse.json().catch(() => null);
      if (!usersResponse.ok) throw new Error(usersBody?.error?.message || 'Unable to load users.');
      if (!restaurantsResponse.ok) throw new Error(restaurantsBody?.error?.message || 'Unable to load restaurants.');
      setUsers(usersBody.data || []); setRestaurants(restaurantsBody.data || []); setMessage('');
    }).catch((error) => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, []);

  const getDraft = (user) => drafts[user.id] || { role: user.role, restaurantId: user.restaurantId || '' };
  const setDraft = (user, changes) => { setDrafts((current) => ({ ...current, [user.id]: { ...getDraft(user), ...changes } })); setMessage(''); };

  async function saveAccess(user) {
    const draft = getDraft(user);
    if (draft.role === 'restaurant_staff' && !draft.restaurantId) { setMessage(`Choose a restaurant before assigning ${user.fullName || user.email} as Restaurant Staff.`); return; }
    setBusy(user.id); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/users/${user.id}/role`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role: draft.role, restaurantId: draft.role === 'restaurant_staff' ? draft.restaurantId : null }) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update user.');
      setUsers((current) => current.map((item) => item.id === user.id ? { ...item, role: body.data.role, restaurantId: body.data.restaurantId } : item));
      setDrafts((current) => { const next = { ...current }; delete next[user.id]; return next; });
      setMessage(`${user.fullName || user.email} access updated successfully.`);
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  }

  const counts = useMemo(() => ROLES.reduce((result, role) => ({ ...result, [role.id]: users.filter((user) => user.role === role.id).length }), {}), [users]);
  const filteredUsers = useMemo(() => { const value = query.trim().toLowerCase(); return users.filter((user) => (roleFilter === 'all' || user.role === roleFilter) && (!value || `${user.fullName || ''} ${user.email || ''}`.toLowerCase().includes(value))); }, [users, query, roleFilter]);

  return <main className="min-h-screen bg-tadka-bg px-4 py-8 text-tadka-ink sm:px-6"><div className="mx-auto w-full max-w-[1240px]">
    <div className="mb-7 flex items-end justify-between gap-5"><div><span className="eyebrow">ADMIN • ACCESS CONTROL</span><h1>User Management</h1><p>Assign a platform role and, when required, connect the account to its restaurant before access is granted.</p></div><Link className="admin-users-back" href="/admin"><span className="material-symbols-outlined">arrow_back</span>Dashboard</Link></div>
    <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Role overview">{ROLES.map((role) => <button key={role.id} type="button" className={`flex items-center gap-3 rounded-tadka-lg border p-4 text-left shadow-tadka-sm transition ${roleFilter === role.id ? "border-tadka-green bg-tadka-green-soft" : "border-tadka-line bg-white"}`} onClick={() => setRoleFilter(roleFilter === role.id ? 'all' : role.id)}><span className={`admin-role-icon ${role.color}`}><span className="material-symbols-outlined">{role.icon}</span></span><span className="admin-role-info"><strong>{role.label}</strong><small>{role.access}</small></span><b>{counts[role.id] || 0}</b></button>)}</section>
    <section className="mt-5 rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm"><div className="flex items-start justify-between gap-4"><div><span className="eyebrow">ROLE ACCESS</span><h2>What each role can access</h2></div><span className="admin-access-note">API permissions stay enforced.</span></div><div className="admin-access-table">{ROLE_ACCESS.map(([role, ...features]) => <div className="admin-access-row" key={role}><strong>{role}</strong>{features.map((feature) => <span key={feature}><span className="material-symbols-outlined">check_circle</span>{feature}</span>)}</div>)}</div></section>
    <section className="mt-5 rounded-tadka-lg border border-tadka-line bg-white p-6 shadow-tadka-sm"><div className="flex items-start justify-between gap-4"><div><span className="eyebrow">ACCOUNTS</span><h2>Platform users <em>{users.length}</em></h2><p><strong>Restaurant Staff:</strong> choose the role, choose the restaurant, then click <strong>Assign Staff</strong>. Nothing is changed until you save.</p></div></div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row"><label className="flex flex-1 items-center gap-2 rounded-xl border border-tadka-line bg-tadka-bg px-3"><span className="material-symbols-outlined">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email…" /></label><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">All roles</option>{ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></div>
      {message && <div className="mt-4 rounded-xl border border-orange-100 bg-orange-50 p-3 text-sm text-orange-900"><span className="material-symbols-outlined">info</span>{message}</div>}
      {filteredUsers.length > 0 ? <div className="mt-4 divide-y divide-tadka-line rounded-xl border border-tadka-line">{filteredUsers.map((user) => { const draft = getDraft(user), role = ROLES.find((item) => item.id === draft.role) || ROLES[0], changed = draft.role !== user.role || (draft.restaurantId || '') !== (user.restaurantId || ''), needsRestaurant = draft.role === 'restaurant_staff'; return <article className={`grid gap-4 p-4 lg:grid-cols-[1.4fr_1fr_1fr_auto] ${changed ? "bg-tadka-green-soft/40" : ""}`} key={user.id}>
        <div className="flex items-center gap-3"><span className={`admin-user-avatar ${role.color}`}>{(user.fullName || user.email || 'U').slice(0, 1).toUpperCase()}</span><div><strong>{user.fullName || 'Unnamed user'}</strong><span>{user.email}</span></div></div>
        <div className="admin-user-role"><label>Platform role<select value={draft.role} disabled={busy === user.id} onChange={(event) => setDraft(user, { role: event.target.value, restaurantId: event.target.value === 'restaurant_staff' ? draft.restaurantId : '' })}>{ROLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
        <div className="admin-user-restaurant"><label>Restaurant access {needsRestaurant && <small className="admin-required">Required</small>}<select value={draft.restaurantId} disabled={busy === user.id || !needsRestaurant} onChange={(event) => setDraft(user, { restaurantId: event.target.value })}><option value="">{needsRestaurant ? 'Choose restaurant…' : 'Not required'}</option>{restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}</select></label></div>
        <div className="admin-user-actions">{changed && <button type="button" className="rounded-xl bg-tadka-green px-3 py-2 text-xs font-bold text-white hover:bg-tadka-orange disabled:opacity-50" disabled={busy === user.id || (needsRestaurant && !draft.restaurantId)} onClick={() => saveAccess(user)}>{busy === user.id ? 'Saving…' : needsRestaurant ? 'Assign Staff' : 'Save Access'}</button>}<Link className="admin-user-dashboard" href={role.dashboard} title={`Open ${role.label} area`}><span className="material-symbols-outlined">open_in_new</span></Link></div>
      </article>; })}</div> : <div className="p-10 text-center text-sm text-tadka-muted"><span className="material-symbols-outlined">group_off</span><strong>No users match this filter</strong><span>Try another role or search term.</span></div>}
    </section>
  </div></main>;
}
