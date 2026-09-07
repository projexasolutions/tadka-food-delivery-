"use client";

import Link from "next/link";

export default function NotificationsPage() {
  return <main className="container">
    <div className="page-head"><div><span className="eyebrow">UPDATES</span><h1>Notifications</h1><p>Order and platform updates will appear here.</p></div></div>
    <section className="panel"><h3>Notifications are being upgraded</h3><p className="muted">Live notifications will be enabled after the notification domain is migrated to the Tadka API.</p><Link className="secondary" href="/orders">View your orders</Link></section>
  </main>;
}
