'use client';

import { useEffect, useMemo, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered', 'cancelled'];
const pretty = (value) => String(value || '').replaceAll('_', ' ');

async function api(path) {
  const response = await fetch(`${apiUrl}${path}`, { credentials: 'include', cache: 'no-store' });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.error?.message || 'Request failed.');
  return body?.data;
}

function dayKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function Analytics() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      setOrders((await api('/v1/restaurant/orders')) || []);
      setMsg('');
    } catch (error) { setMsg(error.message); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  const delivered = useMemo(() => orders.filter((order) => order.status === 'delivered'), [orders]);
  const revenue = useMemo(() => delivered.reduce((sum, order) => sum + Number(order.total || 0), 0), [delivered]);
  const avg = delivered.length ? revenue / delivered.length : 0;
  const active = orders.filter((order) => !['delivered', 'cancelled'].includes(order.status));
  const completionRate = orders.length ? Math.round((delivered.length / orders.length) * 100) : 0;

  const byStatus = useMemo(() => {
    const counts = orders.reduce((map, order) => { map[order.status] = (map[order.status] || 0) + 1; return map; }, {});
    return statusOrder.filter((status) => counts[status]).map((status) => [status, counts[status]]);
  }, [orders]);

  const last7Days = useMemo(() => {
    const today = new Date();
    const days = Array.from({ length: 7 }, (_, index) => {
      const date = new Date(today); date.setHours(0, 0, 0, 0); date.setDate(today.getDate() - (6 - index));
      return { key: dayKey(date), label: date.toLocaleDateString([], { weekday: 'short' }), orders: 0, revenue: 0 };
    });
    const map = Object.fromEntries(days.map((day) => [day.key, day]));
    orders.forEach((order) => {
      const day = map[dayKey(order.createdAt)];
      if (!day) return;
      day.orders += 1;
      if (order.status === 'delivered') day.revenue += Number(order.total || 0);
    });
    return days;
  }, [orders]);

  const peakOrders = Math.max(1, ...last7Days.map((day) => day.orders));
  const peakRevenue = Math.max(1, ...last7Days.map((day) => day.revenue));

  return <RestaurantShell title="ANALYTICS & REVENUE" subtitle="Analytics & Revenue Intelligence">
    {msg && <div className="partner-alert">{msg}<button onClick={() => setMsg('')} aria-label="Dismiss">×</button></div>}
    {loading ? <div className="partner-panel partner-empty"><span className="material-symbols-outlined">analytics</span><b>Loading restaurant analytics…</b><p>Preparing your latest order data.</p></div> : <>
      <div className="partner-metrics">
        <Metric title="Delivered Revenue" value={`₹${revenue.toFixed(0)}`} icon="payments" sub="Completed orders" />
        <Metric title="Delivered Orders" value={delivered.length} icon="task_alt" sub={`${completionRate}% of all orders`} />
        <Metric title="Average Order" value={`₹${avg.toFixed(0)}`} icon="shopping_bag" sub="Per delivered order" />
        <Metric title="Active Orders" value={active.length} icon="local_shipping" sub="Currently in pipeline" />
      </div>

      <div className="partner-two-col">
        <section className="partner-panel analytics-chart-panel">
          <div className="panel-head"><div><h2>Orders — last 7 days</h2><p>Real order volume from your restaurant account.</p></div><button className="partner-btn secondary" onClick={load}>Refresh</button></div>
          <div className="analytics-bars" aria-label="Orders over the last seven days">
            {last7Days.map((day) => <div className="analytics-bar-col" key={day.key}><span className="analytics-bar-value">{day.orders}</span><div className="analytics-bar-track"><i style={{ height: `${Math.max(day.orders ? 10 : 3, (day.orders / peakOrders) * 100)}%` }} /></div><small>{day.label}</small></div>)}
          </div>
        </section>

        <section className="partner-panel">
          <div className="panel-head"><div><h2>Revenue snapshot</h2><p>Delivered orders only.</p></div></div>
          <div className="analytics-summary"><div><span>Completed revenue</span><strong>₹{revenue.toFixed(0)}</strong></div><div><span>Average delivered order</span><strong>₹{avg.toFixed(0)}</strong></div><div><span>Completion rate</span><strong>{completionRate}%</strong></div></div>
        </section>
      </div>

      <div className="partner-two-col">
        <section className="partner-panel analytics-chart-panel">
          <div className="panel-head"><div><h2>Delivered revenue — last 7 days</h2><p>Revenue is recognized only when an order is delivered.</p></div></div>
          <div className="analytics-bars revenue-bars" aria-label="Revenue over the last seven days">
            {last7Days.map((day) => <div className="analytics-bar-col" key={day.key}><span className="analytics-bar-value">₹{day.revenue.toFixed(0)}</span><div className="analytics-bar-track"><i style={{ height: `${Math.max(day.revenue ? 10 : 3, (day.revenue / peakRevenue) * 100)}%` }} /></div><small>{day.label}</small></div>)}
          </div>
        </section>

        <section className="partner-panel">
          <div className="panel-head"><div><h2>Order throughput</h2><p>Current distribution by order status.</p></div></div>
          <div className="category-list">{byStatus.map(([status, count]) => <div className="category-row" key={status}><span className={`status-dot ${status}`} /><b>{pretty(status)}</b><span className="category-type">{count}</span></div>)}{!byStatus.length && <div className="partner-empty compact"><span className="material-symbols-outlined">bar_chart</span><b>No order data yet</b><p>Your analytics will populate as orders arrive.</p></div>}</div>
        </section>
      </div>
    </>}
  </RestaurantShell>;
}

function Metric({ title, value, icon, sub }) { return <div className="metric"><span className="metric-icon material-symbols-outlined">{icon}</span><small>{title}</small><strong>{value}</strong><span>{sub}</span></div>; }
