'use client';

import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ROLES = ['customer', 'restaurant_staff', 'rider', 'admin'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]); const [restaurants, setRestaurants] = useState([]);
  const [message, setMessage] = useState('Loading users…'); const [busy, setBusy] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    Promise.all([
      fetch(`${apiUrl}/v1/admin/users`, { credentials: 'include', cache: 'no-store', signal: controller.signal }),
      fetch(`${apiUrl}/v1/admin/restaurants`, { credentials: 'include', cache: 'no-store', signal: controller.signal }),
    ]).then(async ([usersResponse, restaurantsResponse]) => {
      const usersBody = await usersResponse.json().catch(() => null); const restaurantsBody = await restaurantsResponse.json().catch(() => null);
      if (!usersResponse.ok) throw new Error(usersBody?.error?.message || 'Unable to load users.');
      if (!restaurantsResponse.ok) throw new Error(restaurantsBody?.error?.message || 'Unable to load restaurants.');
      setUsers(usersBody.data); setRestaurants(restaurantsBody.data); setMessage('');
    }).catch((error) => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, []);

  async function updateUser(id, role, restaurantId) {
    setBusy(id); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/users/${id}/role`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, restaurantId: role === 'restaurant_staff' ? restaurantId : null }),
      });
      const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error?.message || 'Unable to update user.');
      setUsers((current) => current.map((user) => user.id === id ? { ...user, role: body.data.role, restaurantId: body.data.restaurantId } : user));
    } catch (error) { setMessage(error.message); } finally { setBusy(''); }
  }

  return (
    <main className="container">
      <div className="page-head"><div><span className="eyebrow">ADMIN</span><h1>User Management</h1><p>Manage platform roles and restaurant access.</p></div></div>
      <section className="panel">
        {message && <p>{message}</p>}
        {users.length > 0 && <div className="table user-table">
          <div className="table-row table-heading"><span>User</span><span>Email</span><span>Role</span><span>Restaurant</span></div>
          {users.map((user) => <div className="table-row" key={user.id}>
            <span>{user.fullName || 'Unnamed'}</span><span>{user.email}</span>
            <select value={user.role} disabled={busy === user.id} onChange={(event) => updateUser(user.id, event.target.value, user.restaurantId)} aria-label={`Role for ${user.fullName || user.email}`}>
              {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
            <select value={user.restaurantId || ''} disabled={busy === user.id || user.role !== 'restaurant_staff'} onChange={(event) => updateUser(user.id, user.role, event.target.value || null)} aria-label={`Restaurant for ${user.fullName || user.email}`}>
              <option value="">No restaurant</option>{restaurants.map((restaurant) => <option key={restaurant.id} value={restaurant.id}>{restaurant.name}</option>)}
            </select>
          </div>)}
        </div>}
      </section>
    </main>
  );
}
