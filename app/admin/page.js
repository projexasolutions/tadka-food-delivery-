'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

const TABLES = [
  ['profiles', 'USERS', 'Registered accounts'],
  ['restaurants', 'RESTAURANTS', 'Partner locations'],
  ['orders', 'ORDERS', 'Total orders'],
  ['menu_items', 'MENU ITEMS', 'Published catalog'],
];

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [message, setMessage] = useState('Loading…');

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setMessage('Login required');
        return;
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (profileError || profile?.role !== 'admin') {
        setMessage('Admin access required.');
        return;
      }

      const results = await Promise.all(
        TABLES.map(async ([table]) => {
          const { count, error } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true });

          return [table, error ? 0 : count || 0];
        }),
      );

      if (!mounted) return;

      setStats(Object.fromEntries(results));
      setMessage('');
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const restaurantCount = stats?.restaurants || 0;
  const orderCount = stats?.orders || 0;
  const menuCount = stats?.menu_items || 0;

  return (
    <main className="admin-shell">
      <div className="admin-top">
        <div>
          <span className="eyebrow">PLATFORM ADMIN</span>
          <h1>Operations overview</h1>
          <p className="muted">A clear view of what is happening across Tadka.</p>
        </div>
        <div className="admin-top-actions">
          <span className="admin-date">Live platform data</span>
          <Link href="/" className="btn secondary">
            Customer view
          </Link>
        </div>
      </div>

      {message && <div className="admin-alert">{message}</div>}

      {stats && (
        <>
          <section className="admin-kpis">
            {TABLES.map(([table, label, description]) => (
              <div className="admin-kpi" key={table}>
                <span>{label}</span>
                <b>{stats[table]}</b>
                <small>{description}</small>
              </div>
            ))}
          </section>

          <section className="admin-grid">
            <div className="admin-card admin-main-card">
              <div className="admin-card-head">
                <div>
                  <span className="eyebrow">CONTROL CENTER</span>
                  <h2>Platform operations</h2>
                </div>
                <span className="admin-status">Healthy</span>
              </div>

              <div className="admin-links">
                <Link href="/admin/users">
                  <b>Users</b>
                  <small>Accounts and roles</small>
                </Link>
                <Link href="/admin/restaurants">
                  <b>Restaurants</b>
                  <small>Partners and approvals</small>
                </Link>
                <Link href="/admin/operations">
                  <b>Operations</b>
                  <small>Order and platform operations</small>
                </Link>
                <Link href="/admin/categories">
                  <b>Categories</b>
                  <small>Restaurant catalog structure</small>
                </Link>
              </div>
            </div>

            <div className="admin-card admin-side-card">
              <span className="eyebrow">QUICK VIEW</span>
              <h2>Today at a glance</h2>
              <div className="admin-summary">
                <div>
                  <span>Orders per restaurant</span>
                  <b>{restaurantCount ? (orderCount / restaurantCount).toFixed(1) : '0.0'}</b>
                </div>
                <div>
                  <span>Menu depth</span>
                  <b>{restaurantCount ? (menuCount / restaurantCount).toFixed(1) : '0.0'}</b>
                </div>
              </div>
              <p className="muted">
                Use the operations areas to review platform activity without clutter.
              </p>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
