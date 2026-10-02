'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const roleLabels = { customer: 'Customer', restaurant_staff: 'Restaurant Staff', rider: 'Delivery Partner', admin: 'Admin' };

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetch(`${apiUrl}/v1/auth/me`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Please sign in to edit your profile.');
        const nextUser = body.data?.user || body.data || null;
        setUser(nextUser);
        setFullName(nextUser?.fullName || '');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function save(event) {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const response = await fetch(`${apiUrl}/v1/auth/profile`, {
        method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to save profile.');
      const nextUser = body.data?.user || body.data || user;
      setUser(nextUser); setFullName(nextUser?.fullName || fullName); setMessage('Your profile has been updated.');
    } catch (err) { setError(err.message); } finally { setSaving(false); }
  }

  if (loading) return <main className="min-h-screen bg-tadka-bg px-3 py-7 text-tadka-ink sm:px-6 sm:py-9"><div className="mx-auto my-16 max-w-2xl rounded-2xl border border-tadka-line bg-white p-10 text-center shadow-tadka-sm">Loading your profile…</div></main>;

  if (!user) return <main className="min-h-screen bg-tadka-bg px-3 py-7 text-tadka-ink sm:px-6 sm:py-9"><div className="mx-auto my-16 max-w-2xl rounded-2xl border border-tadka-line bg-white p-10 text-center shadow-tadka-sm"><span className="block text-[10px] font-black tracking-[0.15em] text-tadka-orange">TADKA ACCOUNT</span><h1>Sign in to manage your profile.</h1><p>Your profile details and account access will appear here.</p><Link href="/auth" className="inline-flex items-center justify-center rounded-xl bg-tadka-orange px-4 py-3 text-xs font-black text-white hover:bg-tadka-orange-dark">Sign in / Create account</Link></div></main>;

  const initials = (user.fullName || user.email || 'U').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const role = roleLabels[user.role] || user.role || 'Customer';

  return (
    <main className="min-h-screen bg-tadka-bg px-3 py-7 text-tadka-ink sm:px-6 sm:py-9">
      <div className="mx-auto w-full max-w-[1180px]">
        <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <span className="block text-[10px] font-black tracking-[0.15em] text-tadka-orange">YOUR PROFILE</span>
            <h1>Make TADKA feel more personal.</h1>
            <p>Keep your account details up to date for a smoother ordering experience.</p>
          </div>
          <Link href="/account" className="inline-flex items-center rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-xs font-bold hover:bg-tadka-bg">← Back to account</Link>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.55fr)_minmax(300px,.85fr)]">
          <section className="profileCard profileEditor">
            <div className="mb-6 flex items-center gap-4 border-b border-tadka-line pb-6">
              <div className="grid h-16 w-16 flex-none place-items-center rounded-full bg-tadka-orange text-xl font-black text-white">{initials}</div>
              <div><span className="block text-[10px] font-black tracking-[0.15em] text-tadka-orange">PERSONAL DETAILS</span><h2>{user.fullName || 'Tadka customer'}</h2><p>{user.email}</p></div>
            </div>
            <form className="max-w-2xl" onSubmit={save}>
              <label className="mb-2 block text-xs font-black" htmlFor="fullName">Full name</label>
              <input className="h-[52px] w-full rounded-xl border border-tadka-line bg-white px-4 text-sm outline-none focus:border-tadka-orange focus:ring-4 focus:ring-orange-100" id="fullName" required minLength={2} maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
              <p className="my-2 mb-5 text-xs text-tadka-muted">This name is used across your TADKA account.</p>
              <button className="profilePrimary profileSave" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </form>
            {message && <div className="mt-4 rounded-xl border border-green-200 bg-tadka-green-soft p-3 text-xs text-tadka-success">✓ {message}</div>}
            {error && <div className="mt-4 rounded-xl border border-orange-200 bg-orange-50 p-3 text-xs text-tadka-danger">{error}</div>}
          </section>

          <aside className="grid gap-4">
            <section className="profileCard infoCard">
              <div className="mb-2 flex items-center justify-between"><h2>Account details</h2><span className="rounded-full bg-tadka-green-soft px-2.5 py-1.5 text-[9px] font-black text-tadka-success">Active</span></div>
              <div className="flex justify-between gap-4 border-t border-tadka-line py-3.5 text-xs"><span>Account type</span><strong>{role}</strong></div>
              <div className="flex justify-between gap-4 border-t border-tadka-line py-3.5 text-xs"><span>Email</span><strong>{user.email}</strong></div>
              <div className="flex justify-between gap-4 border-t border-tadka-line py-3.5 text-xs"><span>Access</span><strong>{role === 'Customer' ? 'Ordering & account' : 'Partner dashboard'}</strong></div>
            </section>

            <section className="profileCard profileLinks">
              <span className="block text-[10px] font-black tracking-[0.15em] text-tadka-orange">QUICK ACCESS</span>
              <h2>Where do you want to go?</h2>
              <Link href="/orders"><span><b>My Orders</b><small>Track and reorder your meals</small></span><b>→</b></Link>
              <Link href="/restaurants"><span><b>Discover Food</b><small>Find restaurants around you</small></span><b>→</b></Link>
              <Link href="/cart"><span><b>Your Bag</b><small>Review items before checkout</small></span><b>→</b></Link>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}
