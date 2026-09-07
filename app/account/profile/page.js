'use client';

import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProfilePage() {
  const [form, setForm] = useState({ fullName: '' });
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/v1/auth/me`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = await response.json();
        return body.data ?? null;
      })
      .then((user) => { if (user) setForm({ fullName: user.fullName || '' }); })
      .catch(() => setMessage('Unable to load your profile.'))
      .finally(() => setLoading(false));
  }, []);

  async function save(event) {
    event.preventDefault();
    setMessage('Profile editing API is not enabled yet.');
  }

  if (loading) return <main className="container"><section className="panel"><p>Loading profile…</p></section></main>;

  return <main className="container"><section className="panel"><span className="eyebrow">PROFILE</span><h1>Profile settings</h1>
    <form onSubmit={save} className="form-grid"><input placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ fullName: e.target.value })} /><button className="btn primary" disabled>Save changes</button></form>
    {message && <p className="notice">{message}</p>}
  </section></main>;
}
