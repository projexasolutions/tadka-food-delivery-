'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRoleGuard } from '@/lib/useRoleGuard';

const ACTIVE_ORDER_STATUSES = ['ready', 'picked_up', 'on_the_way'];

export default function AdminDelivery() {
  const { checkingRole } = useRoleGuard(['admin']);
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (checkingRole) return;

    async function loadDeliveryControl() {
      setLoading(true);
      setMessage('');

      const [ordersResult, ridersResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id, status, created_at, restaurants(name), delivery_assignments(id, rider_id, status)')
          .in('status', ACTIVE_ORDER_STATUSES)
          .order('created_at', { ascending: false }),
        supabase
          .from('profiles')
          .select('id, full_name')
          .eq('role', 'rider')
          .order('full_name'),
      ]);

      const error = ordersResult.error || ridersResult.error;
      if (error) setMessage(error.message);

      setOrders(ordersResult.data || []);
      setRiders(ridersResult.data || []);
      setLoading(false);
    }

    loadDeliveryControl();
  }, [checkingRole]);

  async function assignRider(orderId, riderId) {
    if (!riderId) return;

    setBusy(orderId);
    setMessage('');

    const { error } = await supabase
      .from('delivery_assignments')
      .upsert(
        { order_id: orderId, rider_id: riderId, status: 'assigned' },
        { onConflict: 'order_id' },
      );

    if (error) {
      setMessage(error.message);
      setBusy('');
      return;
    }

    setOrders((current) =>
      current.map((order) => {
        if (order.id !== orderId) return order;
        return {
          ...order,
          delivery_assignments: [{ id: order.delivery_assignments?.[0]?.id, rider_id: riderId, status: 'assigned' }],
        };
      }),
    );
    setBusy('');
  }

  if (checkingRole) {
    return <main className="container"><p>Checking admin access…</p></main>;
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">ADMIN</span>
          <h1>Delivery Control</h1>
          <p>Assign ready orders and keep delivery handoffs moving.</p>
        </div>
      </div>

      {loading ? (
        <section className="panel"><p>Loading delivery operations…</p></section>
      ) : (
        <div className="cards">
          {orders.map((order) => {
            const assignment = order.delivery_assignments?.[0];
            return (
              <article className="card" key={order.id}>
                <div className="delivery-admin-head">
                  <div>
                    <h3>#{order.id.slice(0, 8)}</h3>
                    <p>{order.restaurants?.name || 'Restaurant'} · {order.status}</p>
                  </div>
                  <span className="badge">{assignment ? assignment.status : 'Unassigned'}</span>
                </div>

                <select
                  value={assignment?.rider_id || ''}
                  disabled={busy === order.id || Boolean(assignment?.rider_id)}
                  onChange={(event) => assignRider(order.id, event.target.value)}
                  aria-label={`Assign rider to order ${order.id.slice(0, 8)}`}
                >
                  <option value="" disabled>Assign rider…</option>
                  {riders.map((rider) => (
                    <option key={rider.id} value={rider.id}>{rider.full_name || 'Rider'}</option>
                  ))}
                </select>

                {assignment?.rider_id && <p className="notice">Rider assigned · {assignment.status}</p>}
              </article>
            );
          })}
          {!orders.length && <section className="panel"><p>No orders are currently waiting for delivery assignment.</p></section>}
        </div>
      )}

      {message && <p className="notice">{message}</p>}
    </main>
  );
}
