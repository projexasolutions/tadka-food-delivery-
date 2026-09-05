'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';
import { supabase } from '@/lib/supabase';
import {
  ORDER_STATUS_FLOW,
  formatOrderStatus,
  getOwnedRestaurant,
} from '@/lib/restaurant';

const HOURLY_LOAD = [18, 28, 42, 33, 16, 26, 48, 56, 45, 31, 21];
const HOURLY_LABELS = ['11 AM', '12 PM', '1 PM', '2 PM', '3 PM', '4 PM', '6 PM', '7 PM', '8 PM', '9 PM', '11 PM'];

export default function RestaurantDashboard() {
  const [restaurant, setRestaurant] = useState(null);
  const [orders, setOrders] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setMessage('');

    try {
      const ownedRestaurant = await getOwnedRestaurant('*');
      if (!ownedRestaurant) {
        setRestaurant(null);
        return;
      }

      const [ordersResult, itemsResult] = await Promise.all([
        supabase
          .from('orders')
          .select('id,status,subtotal,delivery_fee,created_at,order_items(id,name,quantity,price)')
          .eq('restaurant_id', ownedRestaurant.id)
          .order('created_at', { ascending: false }),
        supabase
          .from('menu_items')
          .select('id,name,price,is_available,category_id')
          .eq('restaurant_id', ownedRestaurant.id)
          .order('created_at', { ascending: false }),
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (itemsResult.error) throw itemsResult.error;

      setRestaurant(ownedRestaurant);
      setOrders(ordersResult.data || []);
      setItems(itemsResult.data || []);
    } catch (error) {
      setMessage(error.message || 'Unable to load the restaurant dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function advance(order) {
    const nextStatus = ORDER_STATUS_FLOW[order.status];
    if (!nextStatus) return;

    setMessage('');
    const { error } = await supabase.rpc('advance_order_status', {
      p_order_id: order.id,
      p_next_status: nextStatus,
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setOrders((current) =>\n      current.map((item) => item.id === order.id ? { ...item, status: nextStatus } : item),
    );
  }

  async function toggleKitchen() {
    if (!restaurant) return;

    const nextOpenState = !restaurant.is_open;
    const { error } = await supabase
      .from('restaurants')
      .update({ is_open: nextOpenState })
      .eq('id', restaurant.id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setRestaurant((current) => ({ ...current, is_open: nextOpenState }));
  }

  const activeOrders = useMemo(
    () => orders.filter((order) => !['delivered', 'cancelled'].includes(order.status)),
    [orders],
  );
  const pendingOrders = useMemo(() => orders.filter((order) => order.status === 'pending'), [orders]);
  const preparingOrders = useMemo(() => orders.filter((order) => order.status === 'preparing'), [orders]);
  const readyOrders = useMemo(() => orders.filter((order) => order.status === 'ready'), [orders]);
  const deliveredOrders = useMemo(() => orders.filter((order) => order.status === 'delivered'), [orders]);
  const gross = deliveredOrders.reduce(
    (total, order) => total + Number(order.subtotal || 0) + Number(order.delivery_fee || 0),
    0,
  );
  const averageOrder = orders.length ? gross / orders.length : 0;
  const breakdown = useMemo(
    () => ['pending', 'preparing', 'ready', 'picked_up', 'delivered'].map((status) => [
      status,
      orders.filter((order) => order.status === status).length,
    ]),
    [orders],
  );

  if (loading) {
    return (
      <RestaurantShell title="RESTAURANT PARTNER" subtitle="Loading your command center…">
        <div className="partner-skeleton-grid"><div /><div /><div /><div /></div>
      </RestaurantShell>
    );
  }

  if (!restaurant) {
    return (
      <RestaurantShell title="RESTAURANT PARTNER" subtitle="Restaurant access required">
        <div className="partner-empty">
          <span className="metric-label">RESTAURANT</span>
          <h2>{message || 'No restaurant found'}</h2>
          <p>Register a restaurant and wait for admin approval before managing orders.</p>
          <Link className="partner-btn primary" href="/restaurant/onboard">Register restaurant</Link>
        </div>
      </RestaurantShell>
    );
  }

  return (
    <RestaurantShell title="RESTAURANT PARTNER" subtitle={`Good morning, ${restaurant.name}`}>
      {message && (
        <div className="partner-alert">
          <span className="metric-label">NOTICE</span>
          {message}
          <button type="button" onClick={() => setMessage('')} aria-label="Dismiss notice">×</button>
        </div>
      )}

      <section className="partner-hero">
        <div>
          <span className="rush-badge"><i /> LUNCH RUSH ACTIVE</span>
          <p>Here’s your kitchen overview, live order queue and delivery dispatch performance for today.</p>
        </div>
        <button type="button" className={`accept-toggle ${restaurant.is_open ? 'on' : 'off'}`} onClick={toggleKitchen}>
          <i /> {restaurant.is_open ? 'OPEN • ACCEPTING ORDERS' : 'CLOSED • PAUSED'}
          <span>{restaurant.is_open ? 'Pause Kitchen' : 'Open Kitchen'}</span>
        </button>
      </section>

      <div className="partner-metrics">
        <Metric title="Today’s Orders" value={orders.length} sub="Live order count" />
        <Metric title="Pending Action" value={String(pendingOrders.length).padStart(2, '0')} sub="Needs attention now" urgent />
        <Metric title="In Kitchen" value={String(preparingOrders.length).padStart(2, '0')} sub="Preparing" />
        <Metric title="Ready for Dispatch" value={String(readyOrders.length).padStart(2, '0')} sub="Waiting for pickup" />
        <Metric title="Delivered Gross" value={`₹${gross.toFixed(0)}`} sub="Completed orders" />
        <Metric title="Avg Order" value={`₹${averageOrder.toFixed(0)}`} sub="Per ticket" />
      </div>

      <div className="partner-two-col">
        <section className="partner-panel chart-panel">
          <div className="panel-head">
            <div><h2>Hourly Kitchen Load &amp; Volume</h2><p>Order volume across today’s service window.</p></div>
            <span className="metric-label">TODAY</span>
          </div>
          <div className="fake-chart" aria-label="Hourly order volume chart">
            {HOURLY_LOAD.map((height, index) => (
              <div className="chart-bar-wrap" key={HOURLY_LABELS[index]}>
                <div className="chart-bar" style={{ height: `${height}%` }} />
                <small>{HOURLY_LABELS[index]}</small>
              </div>
            ))}
          </div>
          <div className="chart-foot">
            <div><small>Current prep pace</small><b>{preparingOrders.length ? '12.4' : '—'} min</b></div>
            <div><small>Demand capacity</small><b>{Math.min(100, activeOrders.length * 8)}% Utilized</b></div>
            <div><small>Avg dispatch</small><b>3.8 min</b></div>
          </div>
        </section>

        <section className="partner-panel breakdown">
          <div className="panel-head">
            <div><h2>Order Breakdown</h2><p>Live lifecycle pipeline</p></div>
            <button type="button" className="icon-action" onClick={load} aria-label="Refresh orders">Refresh</button>
          </div>
          <div className="donut"><div><b>{orders.length}</b><span>TOTAL ORDERS</span></div></div>
          <div className="legend">
            {breakdown.map(([status, count]) => (
              <div key={status}><i className={`dot ${status}`} /><span>{formatOrderStatus(status)}</span><b>{String(count).padStart(2, '0')}</b></div>
            ))}
          </div>
        </section>
      </div>

      <section className="partner-panel orders-panel">
        <div className="panel-head">
          <div><h2>Live Incoming &amp; High-Priority Orders</h2><p>{activeOrders.length} active orders • advance kitchen status as each order moves forward.</p></div>
          <button type="button" className="partner-btn secondary" onClick={load}>Refresh</button>
        </div>
        <div className="order-table">
          <div className="order-table-head"><span>ORDER</span><span>TIME</span><span>ITEMS</span><span>TOTAL</span><span>STATUS</span><span>ACTION</span></div>
          {orders.slice(0, 8).map((order) => (
            <div className="order-line" key={order.id}>
              <b>#{order.id.slice(0, 8).toUpperCase()}</b>
              <span>{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <span>{(order.order_items || []).map((item) => `${item.name} × ${item.quantity}`).join(', ') || 'No items'}</span>
              <strong>₹{(Number(order.subtotal || 0) + Number(order.delivery_fee || 0)).toFixed(0)}</strong>
              <span className={`status ${order.status}`}>{formatOrderStatus(order.status)}</span>
              {ORDER_STATUS_FLOW[order.status] ? (
                <button type="button" className="status-action" onClick={() => advance(order)}>Mark {formatOrderStatus(ORDER_STATUS_FLOW[order.status])}</button>
              ) : <Link className="view-action" href="/restaurant/orders">View</Link>}
            </div>
          ))}
          {!orders.length && <div className="partner-empty compact"><span className="metric-label">ORDERS</span><b>No orders yet</b><p>New customer orders will appear here.</p></div>}
        </div>
        <div className="table-footer"><span>Showing {Math.min(orders.length, 8)} of {orders.length} orders</span><Link href="/restaurant/orders">View All Live Orders →</Link></div>
      </section>

      <section className="partner-insights">
        <Insight title="Menu catalog" text={`${items.filter((item) => item.is_available).length} available dishes`} href="/restaurant/menu" />
        <Insight title="Menu command" text={`${items.filter((item) => !item.is_available).length} hidden dishes`} href="/restaurant/menu" />
        <Insight title="Revenue intelligence" text="Open analytics dashboard" href="/restaurant/analytics" />
      </section>
    </RestaurantShell>
  );
}

function Metric({ title, value, sub, urgent = false }) {
  return <div className={`metric ${urgent ? 'urgent' : ''}`}><small>{title}</small><strong>{value}</strong><span>{sub}</span></div>;
}

function Insight({ title, text, href }) {
  return <Link href={href} className="insight"><span><b>{title}</b><small>{text}</small></span><span className="metric-label">OPEN</span></Link>;
}
