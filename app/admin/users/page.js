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
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [message, setMessage] = useState('Loading users…');
  const [busy, setBusy] = useState('');
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${apiUrl}/v1/admin/users`, { credentials: 'include', cache: 'no-store', signal: controller.signal }),
      fetch(`${apiUrl}/v1/admin/restaurants`, { credentials: 'include', cache: 'no-store', signal: controller.signal }),
    ]).then(async ([usersResponse, restaurantsResponse]) => {
      const usersBody = await usersResponse.json().catch(() => null);
      const restaurantsBody = await restaurantsResponse.json().catch(() => null);
      if (!usersResponse.ok) throw new Error(usersBody?.error?.message || 'Unable to load users.');
      if (!restaurantsResponse.ok) throw new Error(restaurantsBody?.error?.message || 'Unable to load restaurants.');
      setUsers(usersBody.data || []);
      setRestaurants(restaurantsBody.data || []);
      setMessage('');
    }).catch((error) => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, []);

  async function updateUser(id, role, restaurantId) {
    setBusy(id); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/users/${id}/role`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, restaurantId: role === 'restaurant_staff' ? restaurantId : null }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update user.');
      setUsers((current) => current.map((user) => user.id === id ? { ...user, role: body.data.role, restaurantId: body.data.restaurantId } : user));
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  }

  const counts = useMemo(() => ROLES.reduce((result, role) => ({ ...result, [role.id]: users.filter((user) => user.role === role.id).length }), {}), [users]);
  const filteredUsers = useMemo(() => {
    const value = query.trim().toLowerCase();
    return users.filter((user) => {
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesQuery = !value || `${user.fullName || ''} ${user.email || ''}`.toLowerCase().includes(value);
      return matchesRole && matchesQuery;
    });
  }, [users, query, roleFilter]);

  return (
    <main className="admin-users-page">
      <div className="admin-users-wrap">
        <div className="admin-users-head">
          <div><span className="eyebrow">ADMIN • ACCESS CONTROL</span><h1>User Management</h1><p>Assign platform roles, restaurant access and the features each account can use.</p></div>
          <Link className="admin-users-back" href="/admin"><span className="material-symbols-outlined">arrow_back</span>Dashboard</Link>
        </div>

        <section className="admin-role-grid" aria-label="Role overview">
          {ROLES.map((role) => (
            <button key={role.id} type="button" className={`admin-role-card ${roleFilter === role.id ? 'selected' : ''}`} onClick={() => setRoleFilter(roleFilter === role.id ? 'all' : role.id)}>
              <span className={`admin-role-icon ${role.color}`}><span className="material-symbols-outlined">{role.icon}</span></span>
              <span className="admin-role-info"><strong>{role.label}</strong><small>{role.access}</small></span>
              <b>{counts[role.id] || 0}</b>
            </button>
          ))}
        </section>

        <section className="admin-access-panel">
          <div className="admin-panel-title"><div><span className="eyebrow">ROLE ACCESS</span><h2>What each role can access</h2></div><span className="admin-access-note">Permissions remain enforced by the API.</span></div>
          <div className="admin-access-table">
            {ROLE_ACCESS.map(([role, ...features]) => <div className="admin-access-row" key={role}><strong>{role}</strong>{features.map((feature) => <span key={feature}><span className="material-symbols-outlined">check_circle</span>{feature}</span>)}</div>)}
          </div>
        </section>

        <section className="admin-users-panel">
          <div className="admin-panel-title"><div><span className="eyebrow">ACCOUNTS</span><h2>Platform users <em>{users.length}</em></h2><p>Change a user's role below. Restaurant Staff must also be assigned to a restaurant.</p></div></div>
          <div className="admin-users-toolbar"><label className="admin-users-search"><span className="material-symbols-outlined">search</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email…" /></label><select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value)}><option value="all">All roles</option>{ROLES.map((role) => <option key={role.id} value={role.id}>{role.label}</option>)}</select></div>
          {message && <div className="admin-users-message"><span className="material-symbols-outlined">info</span>{message}</div>}
          {filteredUsers.length > 0 ? <div className="admin-user-list">
            {filteredUsers.map((user) => {
              const role = ROLES.find((item) => item.id === user.role) || ROLES[0];
              return <article className="admin-user-row" key={user.id}>
                <div className="admin-user-main"><span className={`admin-user-avatar ${role.color}`}>{(user.fullName || user.email || 'U').slice(0, 1).toUpperCase()}</span><div><strong>{user.fullName || 'Unnamed user'}</strong><span>{user.email}</span></div></div>
                <div className="admin-user-role"><label>Platform role<select value={user.role} disabled={busy === user.id} onChange={(event) => updateUser(user.id, event.target.value, user.restaurantId)}>{ROLES.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label></div>
                <div className="admin-user-restaurant"><label>Restaurant access<select value={user.restaurantId || ''} disabled={busy === user.id || user.role !== 'restaurant_staff'} onChange={(event) => updateUser(user.id, user.role, event.target.value || null)}><option value="">{user.role === 'restaurant_staff' ? 'Select restaurant' : 'Not required'}</option>{restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}</select></label></div>
                <Link className="admin-user-dashboard" href={role.dashboard} title={`Open ${role.label} area`}><span className="material-symbols-outlined">open_in_new</span></Link>
              </article>;
            })}
          </div> : <div className="admin-users-empty"><span className="material-symbols-outlined">group_off</span><strong>No users match this filter</strong><span>Try another role or search term.</span></div>}
        </section>
      </div>
    </main>
  );
}
