'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default function RiderAccountPage() {
  const [user, setUser] = useState(null);
  const [fullName, setFullName] = useState('');
  const [available, setAvailable] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(apiUrl + '/v1/auth/me', { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json().catch(() => null);
        if (!response.ok) throw new Error(body?.error?.message || 'Please sign in.');
        const next = body?.data?.user || body?.data;
        setUser(next);
        setFullName(next?.fullName || '');
        try {
          setAvailable(localStorage.getItem('tadka-rider-available') !== 'false');
          setNotifications(localStorage.getItem('tadka-rider-notifications') !== 'false');
        } catch {}
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(event) {
    event.preventDefault();
    setSaving(true); setMessage(''); setError('');
    try {
      const response = await fetch(apiUrl + '/v1/auth/profile', {
        method: 'PATCH', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to save profile.');
      setUser(body?.data?.user || body?.data || user);
      setMessage('Profile updated successfully.');
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  function setAvailability(value) {
    setAvailable(value);
    localStorage.setItem('tadka-rider-available', String(value));
  }

  function setNotificationPreference(value) {
    setNotifications(value);
    localStorage.setItem('tadka-rider-notifications', String(value));
  }

  async function logout() {
    await fetch(apiUrl + '/v1/auth/logout', { method: 'POST', credentials: 'include' });
    window.location.href = '/auth';
  }

  if (loading) return <main className="rider-settings"><div className="rider-settings-loading">Loading rider settings…</div></main>;
  if (!user) return <main className="rider-settings"><div className="rider-settings-loading"><h2>Sign in required</h2><p>{error || 'Please sign in to access rider settings.'}</p><Link href="/auth" className="rider-settings-primary">Sign in</Link></div></main>;

  const initials = (user.fullName || user.email || 'R').split(/\s+/).map((x) => x[0]).slice(0, 2).join('').toUpperCase();

  return (
    <main className="rider-settings">
      <div className="rider-settings-wrap">
        <div className="rider-settings-head">
          <div><span className="rider-kicker"><i /> RIDER ACCOUNT</span><h1>Account settings</h1><p>Manage your rider profile, availability and delivery preferences.</p></div>
          <Link href="/delivery" className="rider-settings-back"><span className="material-symbols-outlined">arrow_back</span>Back to deliveries</Link>
        </div>

        <div className="rider-settings-grid">
          <section className="rider-settings-card rider-profile-card">
            <div className="rider-profile-banner">
              <div className="rider-profile-avatar">{initials}</div>
              <div><span>DELIVERY PARTNER</span><h2>{user.fullName || 'TADKA Rider'}</h2><p>{user.email}</p></div>
              <span className="rider-account-badge"><i /> Active</span>
            </div>
            <form className="rider-profile-form" onSubmit={saveProfile}>
              <div className="rider-settings-section-title"><span className="material-symbols-outlined">person</span><div><h3>Personal information</h3><small>These details identify you as a TADKA delivery partner.</small></div></div>
              <label>Full name<input value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={100} /></label>
              <label>Email address<input value={user.email || ''} readOnly /><small>Email is linked to your TADKA login.</small></label>
              <div className="rider-settings-role"><span className="material-symbols-outlined">badge</span><div><small>ACCOUNT ROLE</small><b>Delivery Partner</b></div><span>Rider</span></div>
              {message && <div className="rider-settings-success"><span className="material-symbols-outlined">check_circle</span>{message}</div>}
              {error && <div className="rider-settings-error"><span className="material-symbols-outlined">error</span>{error}</div>}
              <button className="rider-settings-primary" disabled={saving}>{saving ? 'Saving changes…' : 'Save profile changes'}</button>
            </form>
          </section>

          <div className="rider-settings-side">
            <section className="rider-settings-card">
              <div className="rider-settings-section-title"><span className="material-symbols-outlined">toggle_on</span><div><h3>Rider availability</h3><small>Control whether you receive new delivery assignments.</small></div></div>
              <button className={'rider-toggle-row ' + (available ? 'on' : '')} onClick={() => setAvailability(!available)}>
                <span className="rider-toggle-icon"><span className="material-symbols-outlined">{available ? 'two_wheeler' : 'pause_circle'}</span></span>
                <span><b>{available ? 'Available for deliveries' : 'Currently unavailable'}</b><small>{available ? 'You can receive new orders.' : 'New assignments are paused.'}</small></span>
                <span className="rider-toggle"><i /></span>
              </button>
            </section>

            <section className="rider-settings-card">
              <div className="rider-settings-section-title"><span className="material-symbols-outlined">notifications</span><div><h3>Notifications</h3><small>Choose how you want to receive rider updates.</small></div></div>
              <button className={'rider-toggle-row no-border ' + (notifications ? 'on' : '')} onClick={() => setNotificationPreference(!notifications)}>
                <span className="rider-toggle-icon blue"><span className="material-symbols-outlined">{notifications ? 'notifications_active' : 'notifications_off'}</span></span>
                <span><b>Delivery notifications</b><small>{notifications ? 'New assignments will alert you.' : 'Notifications are turned off.'}</small></span>
                <span className="rider-toggle"><i /></span>
              </button>
            </section>

            <section className="rider-settings-card rider-account-actions">
              <div className="rider-settings-section-title"><span className="material-symbols-outlined">security</span><div><h3>Account</h3><small>Manage your session.</small></div></div>
              <Link href="/delivery" className="rider-action-link"><span className="material-symbols-outlined">dashboard</span>Rider dashboard<span>→</span></Link>
              <button className="rider-action-link danger" onClick={logout}><span className="material-symbols-outlined">logout</span>Sign out<span>→</span></button>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
