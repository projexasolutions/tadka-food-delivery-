'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function AdminApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [message, setMessage] = useState('');

  async function load() {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', (await supabase.auth.getUser()).data.user?.id).single();
    if (profile?.role !== 'admin') {
      setMessage('Admin access required.');
      return;
    }
    const { data, error } = await supabase.from('restaurant_applications').select('*').order('created_at', { ascending: false });
    if (error) setMessage(error.message);
    else setApps(data || []);
  }

  async function review(app, status) {
    setMessage("");
    const { error } = await supabase.rpc("review_restaurant_application", {
      p_application_id: app.id,
      p_status: status
    });
    if (error) return setMessage(error.message);
    setMessage(`Application ${status}.`);
    load();
  }

  useEffect(() => { load(); }, []);

  return (
    <main className="page">
      <h1>Restaurant Applications</h1>
      {message && <p>{message}</p>}
      <div className="grid">
        {apps.map(app => (
          <article className="card" key={app.id}>
            <h3>{app.restaurant_name}</h3>
            <p>{app.cuisine || 'Cuisine not specified'}</p>
            <p>Status: <strong>{app.status}</strong></p>
            {app.status === 'pending' && (
              <div className="actions">
                <button onClick={() => review(app, 'approved')}>Approve</button>
                <button onClick={() => review(app, 'rejected')}>Reject</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </main>
  );
}
