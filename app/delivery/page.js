'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRoleGuard } from '@/lib/useRoleGuard';

const NEXT_STATUS = {
  assigned: 'picked_up',
  picked_up: 'on_the_way',
  on_the_way: 'delivered',
};

const STATUS_LABELS = {
  assigned: 'Ready for pickup',
  picked_up: 'Picked up',
  on_the_way: 'On the way',
  delivered: 'Delivered',
};

const STATUS_ICONS = {
  assigned: 'inventory_2',
  picked_up: 'package_2',
  on_the_way: 'local_shipping',
  delivered: 'check_circle',
};

const STATUS_SEQUENCE = ['assigned', 'picked_up', 'on_the_way', 'delivered'];

export default function DeliveryPage() {
  const { checkingRole, profile } = useRoleGuard(['rider']);
  const [deliveries, setDeliveries] = useState([]);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState('');
  const [live, setLive] = useState(false);

  async function loadDeliveries() {
    if (!profile?.id) return;

    const { data, error } = await supabase
      .from('delivery_assignments')
      .select('id, order_id, status, created_at, updated_at, orders(status, restaurants(name))')
      .eq('rider_id', profile.id)
      .order('created_at', { ascending: false });

    if (error) setMessage(error.message);
    else setDeliveries(data || []);
  }

  useEffect(() => {
    if (checkingRole || !profile?.id) return;

    let channel;
    let mounted = true;

    async function setupLiveUpdates() {
      await loadDeliveries();
      if (!mounted) return;

      channel = supabase
        .channel(`rider-deliveries-${profile.id}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'delivery_assignments',
            filter: `rider_id=eq.${profile.id}`,
          },
          () => loadDeliveries(),
        )
        .subscribe((status) => setLive(status === 'SUBSCRIBED'));
    }

    setupLiveUpdates();
    const timer = setInterval(loadDeliveries, 15000);

    return () => {
      mounted = false;
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [checkingRole, profile?.id]);

  async function advance(delivery) {
    const next = NEXT_STATUS[delivery.status];
    if (!next || !profile?.id) return;

    setBusy(delivery.id);
    setMessage('');

    const { error } = await supabase
      .from('delivery_assignments')
      .update({ status: next })
      .eq('id', delivery.id)
      .eq('rider_id', profile.id)
      .eq('status', delivery.status);

    if (error) {
      setMessage(error.message);
    } else {
      setDeliveries((current) =>
        current.map((item) => (item.id === delivery.id ? { ...item, status: next } : item)),
      );
    }

    setBusy('');
  }

  const active = useMemo(
    () => deliveries.filter((delivery) => delivery.status !== 'delivered'),
    [deliveries],
  );

  if (checkingRole) {
    return <main className="container"><p>Checking rider access…</p></main>;
  }

  return (
    <main className="container delivery-page">
      <div className="page-head">
        <div>
          <span className="eyebrow">DELIVERY</span>
          <h1>Rider deliveries</h1>
          <p>Live assignments, pickup progress and delivery completion.</p>
        </div>
        <span className={`live-indicator ${live ? 'online' : ''}`}>
          <i /> {live ? 'Live updates' : 'Refreshing'}
        </span>
      </div>

      {active.length > 0 && (
        <section className="delivery-summary">
          <div><span>ACTIVE</span><strong>{active.length}</strong><small>deliveries in progress</small></div>
          <div><span>NEXT ACTION</span><strong>{STATUS_LABELS[NEXT_STATUS[active[0]?.status]] || 'Complete'}</strong><small>for your oldest active delivery</small></div>
        </section>
      )}

      {!deliveries.length && <section className="panel"><p>No deliveries assigned yet.</p></section>}

      <div className="cards delivery-list">
        {deliveries.map((delivery) => {
          const next = NEXT_STATUS[delivery.status];
          const step = STATUS_SEQUENCE.indexOf(delivery.status);

          return (
            <article className={`card delivery-card ${delivery.status === 'delivered' ? 'completed' : ''}`} key={delivery.id}>
              <div className="delivery-card-head">
                <div className="delivery-icon"><span className="material-symbols-outlined">{STATUS_ICONS[delivery.status] || 'local_shipping'}</span></div>
                <div>
                  <span className="eyebrow">ORDER #{delivery.order_id.slice(0, 8).toUpperCase()}</span>
                  <h3>{delivery.orders?.restaurants?.name || 'Restaurant'}</h3>
                </div>
                <span className="badge">{STATUS_LABELS[delivery.status] || delivery.status}</span>
              </div>

              <div className="delivery-steps">
                {STATUS_SEQUENCE.map((item, index) => (
                  <div className={index <= step ? 'done' : ''} key={item}>
                    <span>{index <= step ? '✓' : index + 1}</span>
                    <small>{STATUS_LABELS[item]}</small>
                  </div>
                ))}
              </div>

              <div className="delivery-meta">
                <span>Order status</span>
                <b>{STATUS_LABELS[delivery.orders?.status] || delivery.orders?.status || '—'}</b>
              </div>

              {next && (
                <button className="btn primary full" disabled={busy === delivery.id} onClick={() => advance(delivery)}>
                  {busy === delivery.id ? 'Updating…' : next === 'picked_up' ? 'Confirm pickup' : next === 'on_the_way' ? 'Start delivery' : 'Mark delivered'}
                </button>
              )}

              {delivery.status === 'delivered' && (
                <span className="done-mark"><span className="material-symbols-outlined">check_circle</span> Delivery complete</span>
              )}
            </article>
          );
        })}
      </div>

      {message && <p className="notice">{message}</p>}
    </main>
  );
}
