'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import './profile.css';

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

  if (loading) return <main className="profilePage"><div className="profileLoading">Loading your profile…</div></main>;

  if (!user) return <main className="profilePage"><div className="profileSignedOut"><span className="profileKicker">TADKA ACCOUNT</span><h1>Sign in to manage your profile.</h1><p>Your profile details and account access will appear here.</p><Link href="/auth" className="profilePrimary">Sign in / Create account</Link></div></main>;

  const initials = (user.fullName || user.email || 'U').split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();
  const role = roleLabels[user.role] || user.role || 'Customer';

  return (
    <main className="profilePage">
      <div className="profileWrap">
        <div className="profileTop">
          <div>
            <span className="profileKicker">YOUR PROFILE</span>
            <h1>Make TADKA feel more personal.</h1>
            <p>Keep your account details up to date for a smoother ordering experience.</p>
          </div>
          <Link href="/account" className="profileBack">← Back to account</Link>
        </div>

        <div className="profileGrid">
          <section className="profileCard profileEditor">
            <div className="profileCardHead">
              <div className="profileAvatar">{initials}</div>
              <div><span className="profileKicker">PERSONAL DETAILS</span><h2>{user.fullName || 'Tadka customer'}</h2><p>{user.email}</p></div>
            </div>
            <form onSubmit={save}>
              <label htmlFor="fullName">Full name</label>
              <input id="fullName" required minLength={2} maxLength={100} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
              <p className="profileHint">This name is used across your TADKA account.</p>
              <button className="profilePrimary profileSave" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
            </form>
            {message && <div className="profileSuccess">✓ {message}</div>}
            {error && <div className="profileError">{error}</div>}
          </section>

          <aside className="profileSide">
            <section className="profileCard infoCard">
              <div className="profileCardTitle"><h2>Account details</h2><span className="profileStatus">Active</span></div>
              <div className="profileInfoRow"><span>Account type</span><strong>{role}</strong></div>
              <div className="profileInfoRow"><span>Email</span><strong>{user.email}</strong></div>
              <div className="profileInfoRow"><span>Access</span><strong>{role === 'Customer' ? 'Ordering & account' : 'Partner dashboard'}</strong></div>
            </section>

            <section className="profileCard profileLinks">
              <span className="profileKicker">QUICK ACCESS</span>
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
