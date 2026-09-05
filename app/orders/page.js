"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { OrderStatus } from "../../components/OrderStatus";

const statusCopy = { pending: "Order received", confirmed: "Kitchen confirmed", preparing: "Being prepared", ready: "Ready for pickup", picked_up: "Picked up", on_the_way: "On the way", delivered: "Delivered", cancelled: "Cancelled" };

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [live, setLive] = useState(false);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("orders")
      .select("id,status,subtotal,delivery_fee,created_at,restaurants(name),order_items(id,quantity,price,name),delivery_assignments(id,status,rider_id,updated_at)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) setMessage(error.message);
    else setOrders(data || []);
    setLoading(false);
  }

  useEffect(() => {
    let channel;
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      await load();
      channel = supabase
        .channel(`customer-orders-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `user_id=eq.${user.id}` }, () => load())
        .on("postgres_changes", { event: "*", schema: "public", table: "delivery_assignments" }, () => load())
        .subscribe((status) => setLive(status === "SUBSCRIBED"));
    })();
    const timer = setInterval(load, 15000);
    return () => {
      mounted = false;
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  if (loading) return <main className="page"><div className="card">Loading your orders…</div></main>;

  return (
    <main className="page">
      <div className="page-head"><div><span className="eyebrow">ORDER HISTORY</span><h1>Your orders.</h1><p>Track every order from kitchen confirmation to doorstep.</p></div><span className={`live-indicator ${live ? "online" : ""}`}><i /> {live ? "Live tracking" : "Refreshing"}</span><Link className="primary" href="/restaurants">Order food</Link></div>
      {message && <p className="notice">{message}</p>}
      {!orders.length && <section className="card empty-state"><h2>No orders yet</h2><p>Completed checkouts will appear here.</p><Link className="primary" href="/restaurants">Explore restaurants</Link></section>}
      <div className="cards">
        {orders.map((order) => {
          const assignment = order.delivery_assignments?.[0];
          return <article className="card" key={order.id}>
            <div className="order-head"><div><span className="eyebrow">#{order.id.slice(0, 8).toUpperCase()}</span><h2 style={{ margin: "5px 0" }}>{order.restaurants?.name || "Restaurant"}</h2><p className="muted" style={{ fontSize: 12 }}>{new Date(order.created_at).toLocaleString()}</p></div><div style={{ textAlign: "right" }}><span className="status">{statusCopy[order.status] || order.status}</span><strong style={{ display: "block", fontSize: 20, marginTop: 7 }}>₹{(Number(order.subtotal) + Number(order.delivery_fee || 0)).toFixed(0)}</strong></div></div>
            <OrderStatus status={order.status} />
            {assignment && <p className="muted" style={{ fontSize: 12, margin: "10px 0 0" }}>Delivery: <b>{statusCopy[assignment.status] || assignment.status}</b></p>}
            <div className="items">{(order.order_items || []).map((item) => <div key={item.id}><span>{item.quantity} × {item.name || "Item"}</span><b>₹{(Number(item.price) * Number(item.quantity)).toFixed(0)}</b></div>)}</div>
            <div className="actions">{order.status !== "delivered" && order.status !== "cancelled" && <span className="btn secondary live-status"><span className="material-symbols-outlined">location_on</span> Live status</span>}{order.status === "delivered" && <Link className="btn primary" href={`/review?order=${order.id}`}>Rate order</Link>}</div>
          </article>;
        })}
      </div>
    </main>
  );
}
