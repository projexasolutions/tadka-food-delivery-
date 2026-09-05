'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRoleGuard } from '@/lib/useRoleGuard';

const EMPTY_STATS = { users: 0, restaurants: 0, orders: 0, revenue: 0 };

export default function AdminOperations() {
  const { checkingRole } = useRoleGuard(['admin']);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [orders, setOrders] = useState([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState('');

  useEffect(() => {
    if (checkingRole) return;

    async function loadOperations() {
      setLoading(true);
      setMessage('');

      const [usersResult, restaurantsResult, ordersCountResult, recentOrdersResult] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('restaurants').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase
          .from('orders')
          .select('id, subtotal, delivery_fee, status, payment_status, created_at, restaurants(name)')
          .order('created_at', { ascending: false })
          .limit(12),
      ]);

      const error =
        usersResult.error ||
        restaurantsResult.error ||
        ordersCountResult.error ||
        recentOrdersResult.error;

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const revenue = (recentOrdersResult.data || [])
        .filter((order) => order.payment_status === 'paid')
        .reduce(
          (sum, order) => sum + Number(order.subtotal || 0) + Number(order.delivery_fee || 0),
          0,
        );

      setStats({
        users: usersResult.count || 0,
        restaurants: restaurantsResult.count || 0,
        orders: ordersCountResult.count || 0,
        revenue,
      });
      setOrders(recentOrdersResult.data || []);
      setLoading(false);
    }

    loadOperations();
  }, [checkingRole]);

  async function cancelOrder(id) {
    setBusy(id);
    setMessage('');

    const { error } = await supabase.rpc('advance_order_status', {
      p_order_id: id,
      p_next_status: 'cancelled',
    });

    if (error) {
      setMessage(error.message);
    } else {
      setOrders((current) =>
        current.map((order) => (order.id === id ? { ...order, status: 'cancelled' } : order)),
      );
    }

    setBusy('');
  }

  if (checkingRole) {
    return <main className="container"><p>Checking admin access…</p></main>;
  }

  return (
    <main className="container">
      <div className="page-head">
        <div>
          <span className="eyebrow">ADMIN OPERATIONS</span>
          <h1>Platform Control Center</h1>
          <p>Monitor orders, payments and platform activity.</p>
        </div>
      </div>

      <section className="stats-grid">
        <div className="stat"><small>Users</small><strong>{stats.users}</strong></div>
        <div className="stat"><small>Restaurants</small><strong>{stats.restaurants}</strong></div>
        <div className="stat"><small>Orders</small><strong>{stats.orders}</strong></div>
        <div className="stat"><small>Paid revenue in recent orders</small><strong>₹{stats.revenue.toFixed(2)}</strong></div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <div><span className="eyebrow">RECENT</span><h2>Recent orders</h2></div>
          <span className="muted">Latest 12</span>
        </div>

        {loading ? (
          <p>Refreshing operations…</p>
        ) : (
          <div className="table operations-table">
            <div className="table-row table-heading">
              <span>Order</span><span>Restaurant</span><span>Status</span><span>Payment</span><span>Total</span><span />
            </div>
            {orders.map((order) => (
              <div className="table-row" key={order.id}>
                <span>#{order.id.slice(0, 8)}</span>
                <span>{order.restaurants?.name || 'Restaurant'}</span>
                <span>{order.status}</span>
                <span>{order.payment_status}</span>
                <strong>₹{(Number(order.subtotal || 0) + Number(order.delivery_fee || 0)).toFixed(2)}</strong>
                <span>
                  {order.status !== 'delivered' && order.status !== 'cancelled' && (
                    <button className="btn danger" disabled={busy === order.id} onClick={() => cancelOrder(order.id)}>
                      {busy === order.id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {message && <p className="notice">{message}</p>}
    </main>
  );
}
