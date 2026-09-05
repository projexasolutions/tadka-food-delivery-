'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRoleGuard } from '@/lib/useRoleGuard';

const ROLES = ['customer', 'restaurant_staff', 'rider', 'admin'];

export default function AdminUsers() {
  const { checkingRole } = useRoleGuard(['admin']);
  const [users, setUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (checkingRole) return;

    async function loadUsers() {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, role, created_at')
        .order('created_at', { ascending: false });

      if (error) setMessage(error.message);
      else setUsers(data || []);
      setLoading(false);
    }

    loadUsers();
  }, [checkingRole]);

  async function updateRole(id, role) {
    setBusy(id);
    setMessage('');

    const { error } = await supabase.from('profiles').update({ role }).eq('id', id);

    if (error) {
      setMessage(error.message);
    } else {
      setUsers((current) =>
        current.map((user) => (user.id === id ? { ...user, role } : user)),
      );
    }

    setBusy('');
  }

  if (checkingRole) {
    return <main className="container"><p>Checking admin access…</p></main>;
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>User Management</h1>
          <p>Manage platform roles and account access.</p>
        </div>
      </div>

      <section className="panel">
        {loading ? (
          <p>Loading users…</p>
        ) : (
          <div className="table user-table">
            <div className="table-row table-heading">
              <span>User</span><span>Phone</span><span>Role</span>
            </div>
            {users.map((user) => (
              <div className="table-row" key={user.id}>
                <span>{user.full_name || 'Unnamed'}</span>
                <span>{user.phone || '—'}</span>
                <select
                  value={user.role}
                  disabled={busy === user.id}
                  onChange={(event) => updateRole(user.id, event.target.value)}
                  aria-label={`Role for ${user.full_name || 'user'}`}
                >
                  {ROLES.map((role) => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>
            ))}
          </div>
        )}
      </section>

      {message && <p className="notice">{message}</p>}
    </main>
  );
}
