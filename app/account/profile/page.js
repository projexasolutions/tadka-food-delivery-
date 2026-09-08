'use client';

import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function ProfilePage() {
  const [form, setForm] = useState({ fullName: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/v1/auth/me`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Please sign in to edit your profile.');
        setForm({ fullName: body.data.user.fullName || '' });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(event) {
    event.preventDefault(); setSaving(true); setMessage(''); setError('');
    try {
      const response = await fetch(`${apiUrl}/v1/auth/profile`, { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to save profile.');
      setForm({ fullName: body.data.user.fullName || '' }); setMessage('Profile updated successfully.');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  if (loading) return <main className="container"><section className="panel"><p>Loading profile…</p></section></main>;

  return <main className="container"><section className="panel"><span className="eyebrow">PROFILE</span><h1>Profile settings</h1>
    <form onSubmit={save} className="form-grid"><input required minLength={2} maxLength={100} placeholder="Full name" value={form.fullName} onChange={(e) => setForm({ fullName: e.target.value })} /><button className="btn primary" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button></form>
    {message && <p className="notice">{message}</p>}{error && <p className="notice">{error}</p>}
  </section></main>;
}
