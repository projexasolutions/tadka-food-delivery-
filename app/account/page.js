'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import './account.css';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

const roleLabels = {
  customer: 'Customer',
  restaurant_staff: 'Restaurant',
  rider: 'Delivery Partner',
  admin: 'Admin',
};

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/v1/auth/me`, { credentials: 'include', cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) return null;
        const body = await response.json();
        return body.data ?? null;
      })
      .then((data) => { if (active) setUser(data); })
      .catch(() => { if (active) setMessage('Unable to load your account.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  async function logout() {
    setMessage('');
    const response = await fetch(`${apiUrl}/v1/auth/logout`, { method: 'POST', credentials: 'include' });
    if (!response.ok) return setMessage('Unable to sign out. Please try again.');
    window.location.href = '/';
  }

  if (loading) {
    return <main className="accountPage"><div className="accountInner"><section className="panel"><p>Loading your account…</p></section></div></main>;
  }

  if (!user) {
    return (
      <main className="accountPage">
        <div className="accountInner">
          <section className="panel">
            <h1>Your account</h1>
            <p>Please sign in to continue.</p>
            <Link className="btn primary" href="/auth">Sign in</Link>
          </section>
        </div>
      </main>
    );
  }

  const role = roleLabels[user.role] || user.role || 'Customer';

  return (
    <main className="accountPage">
      <div className="accountInner">
        <header className="accountHeader">
          <span className="eyebrow">ACCOUNT</span>
          <h1>Welcome{user.fullName ? `, ${user.fullName}` : ''}.</h1>
          <p className="accountEmail">{user.email}</p>
        </header>

        <section className="accountCards" aria-label="Account options">
          <div className="accountCard roleCard">
            <div className="accountCardInfo">
              <strong className="accountCardTitle">Account Role</strong>
              <span className="accountCardText">Your access level on Tadka</span>
            </div>
            <span className="roleValue">{role}</span>
          </div>

          <Link className="accountCard" href="/account/profile">
            <span className="accountCardInfo">
              <strong className="accountCardTitle">Profile</strong>
              <span className="accountCardText">Manage your name, contact details and profile</span>
            </span>
            <span className="accountArrow" aria-hidden="true">→</span>
          </Link>

          <Link className="accountCard" href="/orders">
            <span className="accountCardInfo">
              <strong className="accountCardTitle">Your Orders</strong>
              <span className="accountCardText">Track your recent orders and order history</span>
            </span>
            <span className="accountArrow" aria-hidden="true">→</span>
          </Link>

          {user.role === 'restaurant_staff' && (
            <Link className="accountCard" href="/restaurant">
              <span className="accountCardInfo">
                <strong className="accountCardTitle">Restaurant Dashboard</strong>
                <span className="accountCardText">Manage your restaurant, menu and incoming orders</span>
              </span>
              <span className="accountArrow" aria-hidden="true">→</span>
            </Link>
          )}

          {user.role === 'rider' && (
            <Link className="accountCard" href="/delivery">
              <span className="accountCardInfo">
                <strong className="accountCardTitle">Delivery Dashboard</strong>
                <span className="accountCardText">View assigned deliveries and update delivery status</span>
              </span>
              <span className="accountArrow" aria-hidden="true">→</span>
            </Link>
          )}

          {user.role === 'admin' && (
            <Link className="accountCard" href="/admin">
              <span className="accountCardInfo">
                <strong className="accountCardTitle">Admin Dashboard</strong>
                <span className="accountCardText">Manage users, restaurants, orders and platform operations</span>
              </span>
              <span className="accountArrow" aria-hidden="true">→</span>
            </Link>
          )}
        </section>

        <div className="accountActions">
          <button className="signOutButton" onClick={logout}>Sign out</button>
        </div>
        {message && <p className="accountMessage">{message}</p>}
      </div>
    </main>
  );
}
