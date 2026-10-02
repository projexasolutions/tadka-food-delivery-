'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

async function api(path, options = {}) {
  const response = await fetch(`${apiUrl}${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body?.data;
}

const statusMeta = {
  assigned: { label: 'Assigned', icon: 'assignment' },
  accepted: { label: 'Accepted', icon: 'check_circle' },
  picked_up: { label: 'Picked up', icon: 'inventory_2' },
  delivered: { label: 'Delivered', icon: 'task_alt' },
};

export default function DeliveryPage() {
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [busyId, setBusyId] = useState(null);

  async function load() {
    setLoading(true);
    try {
      setDeliveries(await api('/v1/rider/deliveries') || []);
      setMessage('');
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void load(); }, []);

  async function advance(delivery) {
    const next = delivery.status === 'assigned'
      ? 'accepted'
      : delivery.status === 'accepted'
        ? 'picked_up'
        : 'delivered';

    setBusyId(delivery.id);
    try {
      await api(`/v1/rider/deliveries/${delivery.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next }),
      });
      await load();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusyId(null);
    }
  }

  const stats = useMemo(() => ({
    assigned: deliveries.filter((item) => item.status === 'assigned').length,
    active: deliveries.filter((item) => ['accepted', 'picked_up'].includes(item.status)).length,
    delivered: deliveries.filter((item) => item.status === 'delivered').length,
  }), [deliveries]);

  return (
    <main className="rider-app">
      <div className="rider-shell">
        <section className="rider-hero">
          <div>
            <span className="rider-kicker"><i /> RIDER CONSOLE</span>
            <h1>Your deliveries</h1>
            <p>Everything you need to accept, pick up and complete TADKA orders.</p>
          </div>
          <button className="rider-refresh" onClick={load} disabled={loading}>
            <span className="material-symbols-outlined">refresh</span>
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </section>

        <section className="rider-stats" aria-label="Delivery summary">
          <div className="rider-stat">
            <span className="rider-stat-icon orange"><span className="material-symbols-outlined">assignment</span></span>
            <div><b>{stats.assigned}</b><small>Waiting for you</small></div>
          </div>
          <div className="rider-stat">
            <span className="rider-stat-icon blue"><span className="material-symbols-outlined">near_me</span></span>
            <div><b>{stats.active}</b><small>Active deliveries</small></div>
          </div>
          <div className="rider-stat">
            <span className="rider-stat-icon green"><span className="material-symbols-outlined">task_alt</span></span>
            <div><b>{stats.delivered}</b><small>Completed</small></div>
          </div>
        </section>

        {message && (
          <div className="rider-alert" role="alert">
            <span className="material-symbols-outlined">error</span>
            <span>{message}</span>
            <button onClick={() => setMessage('')} aria-label="Dismiss">×</button>
          </div>
        )}

        <section className="rider-content-card">
          <div className="rider-section-head">
            <div>
              <span className="eyebrow">MY QUEUE</span>
              <h2>Assigned orders <em>{deliveries.length}</em></h2>
            </div>
            <span className="rider-live"><i /> Live</span>
          </div>

          {loading ? (
            <div className="rider-loading">
              <span className="rider-spinner" />
              <b>Loading your deliveries</b>
              <small>Checking for new assignments…</small>
            </div>
          ) : deliveries.length === 0 ? (
            <div className="rider-empty">
              <div className="rider-empty-art">
                <span className="material-symbols-outlined">two_wheeler</span>
              </div>
              <span className="rider-empty-badge">ALL CLEAR</span>
              <h3>No deliveries assigned</h3>
              <p>New delivery assignments will appear here automatically. You can refresh anytime to check for new orders.</p>
              <div className="rider-empty-actions">
                <button className="rider-primary" onClick={load}><span className="material-symbols-outlined">refresh</span> Check for deliveries</button>
                <Link className="rider-secondary" href="/account">Account</Link>
              </div>
            </div>
          ) : (
            <div className="rider-order-list">
              {deliveries.map((delivery) => {
                const meta = statusMeta[delivery.status] || statusMeta.assigned;
                const nextLabel = delivery.status === 'assigned'
                  ? 'Accept delivery'
                  : delivery.status === 'accepted'
                    ? 'Mark picked up'
                    : 'Mark delivered';

                return (
                  <article className="rider-order" key={delivery.id}>
                    <div className="rider-order-main">
                      <div className={`rider-order-icon ${delivery.status}`}>
                        <span className="material-symbols-outlined">{meta.icon}</span>
                      </div>
                      <div className="rider-order-info">
                        <div className="rider-order-title">
                          <span className="rider-order-id">ORDER #{delivery.orderId.slice(0, 8).toUpperCase()}</span>
                          <span className={`rider-status ${delivery.status}`}><i /> {meta.label}</span>
                        </div>
                        <h3>{delivery.restaurantName}</h3>
                        <p><span className="material-symbols-outlined">location_on</span>{delivery.address}</p>
                        <p><span className="material-symbols-outlined">call</span>{delivery.phone}</p>
                      </div>
                    </div>
                    <div className="rider-order-side">
                      <strong>₹{delivery.total}</strong>
                      {delivery.status !== 'delivered' ? (
                        <button className="rider-primary" onClick={() => advance(delivery)} disabled={busyId === delivery.id}>
                          <span className="material-symbols-outlined">{busyId === delivery.id ? 'progress_activity' : 'arrow_forward'}</span>
                          {busyId === delivery.id ? 'Updating…' : nextLabel}
                        </button>
                      ) : (
                        <span className="rider-complete"><span className="material-symbols-outlined">check</span> Completed</span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
