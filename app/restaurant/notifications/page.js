'use client';
import { useEffect, useState } from 'react';
import RestaurantShell from '@/components/RestaurantShell';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export default function Notifications() {
  const [items, setItems] = useState([]); const [loading, setLoading] = useState(true); const [message, setMessage] = useState('');
  useEffect(() => { fetch(`${apiUrl}/v1/notifications`, { credentials: 'include', cache: 'no-store' }).then(async (response) => { const body = await response.json().catch(() => null); if (!response.ok) throw new Error(body?.error?.message || 'Unable to load notifications.'); setItems(body.data || []); }).catch((error) => setMessage(error.message)).finally(() => setLoading(false)); }, []);
  return <RestaurantShell title="NOTIFICATIONS" subtitle="Kitchen & partner alerts"><section className="partner-panel"><div className="panel-head"><div><h2>Notification center</h2><p>Live operational alerts derived from your current order activity.</p></div></div>{loading ? <div className="partner-empty compact"><b>Loading notifications…</b></div> : message ? <div className="partner-empty compact"><b>{message}</b></div> : !items.length ? <div className="partner-empty compact"><span className="material-symbols-outlined">notifications_none</span><b>No notifications</b><p>New order activity will appear here.</p></div> : <div className="stack-list">{items.map((item) => <article className="list-row" key={item.id}><div><strong>{item.title}</strong><p>{item.body}</p></div><small>{new Date(item.createdAt).toLocaleString()}</small></article>)}</div>}</section></RestaurantShell>;
}
