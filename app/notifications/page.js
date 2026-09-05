"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [live, setLive] = useState(false);
  const [message, setMessage] = useState("");

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase
      .from("notifications")
      .select("id,title,message,type,read,created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) setMessage(error.message);
    else setItems(data || []);
  }

  useEffect(() => {
    let channel;
    let mounted = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      await load();
      channel = supabase
        .channel(`notifications-${user.id}`)
        .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => load())
        .subscribe((status) => setLive(status === "SUBSCRIBED"));
    })();
    return () => { mounted = false; if (channel) supabase.removeChannel(channel); };
  }, []);

  async function mark(id) {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (error) setMessage(error.message);
    else setItems(x => x.map(n => n.id === id ? { ...n, read: true } : n));
  }

  async function markAll() {
    const { error } = await supabase.rpc("mark_all_notifications_read");
    if (error) setMessage(error.message);
    else setItems(x => x.map(n => ({ ...n, read: true })));
  }

  const unread = items.filter(n => !n.read).length;

  return <main className="container">
    <div className="page-head"><div><span className="eyebrow">UPDATES</span><h1>Notifications</h1><p>Order and platform updates will appear here.</p></div><span className={`live-indicator ${live ? "online" : ""}`}><i /> {live ? "Live updates" : "Refreshing"}</span></div>
    <div className="panel-head" style={{ marginBottom: 14 }}><strong>{unread} unread</strong><button className="btn secondary" disabled={!unread} onClick={markAll}>Mark all read</button></div>
    {message && <p className="notice">{message}</p>}
    <div className="cards">{items.map(n => <button type="button" className={`card notification-card ${n.read ? "" : "unread"}`} key={n.id} onClick={() => !n.read && mark(n.id)} style={{ textAlign: "left", cursor: n.read ? "default" : "pointer" }}><strong>{n.title}</strong><p>{n.message}</p><small>{new Date(n.created_at).toLocaleString()}</small>{!n.read && <span className="badge">Unread</span>}</button>)}
    {!items.length && <section className="panel"><p>No notifications yet.</p></section>}</div>
  </main>;
}
