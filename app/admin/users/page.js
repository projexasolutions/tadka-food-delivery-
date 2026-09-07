'use client';

import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const ROLES = ['customer', 'restaurant_staff', 'rider', 'admin'];

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('Loading users…');
  const [busy, setBusy] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    fetch(`${apiUrl}/v1/admin/users`, { credentials: 'include', cache: 'no-store', signal: controller.signal })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Unable to load users.');
        return body.data;
      })
      .then((data) => { setUsers(data); setMessage(''); })
      .catch((error) => { if (error.name !== 'AbortError') setMessage(error.message); });
    return () => controller.abort();
  }, []);

  async function updateRole(id, role) {
    setBusy(id); setMessage('');
    try {
      const response = await fetch(`${apiUrl}/v1/admin/users/${id}/role`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update role.');
      setUsers((current) => current.map((user) => user.id === id ? { ...user, role: body.data.role } : user));
    } catch (error) { setMessage(error.message); }
    finally { setBusy(''); }
  }

  return (
    <main className="container">
      <div className="page-head"><div><span className="eyebrow">ADMIN</span><h1>User Management</h1><p>Manage platform roles and account access.</p></div></div>
      <section className="panel">
        {message && <p>{message}</p>}
        {users.length > 0 && <div className="table user-table">
          <div className="table-row table-heading"><span>User</span><span>Email</span><span>Role</span></div>
          {users.map((user) => <div className="table-row" key={user.id}>
            <span>{user.fullName || 'Unnamed'}</span><span>{user.email}</span>
            <select value={user.role} disabled={busy === user.id} onChange={(event) => updateRole(user.id, event.target.value)} aria-label={`Role for ${user.fullName || user.email}`}>
              {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>)}
        </div>}
      </section>
    </main>
  );
}
