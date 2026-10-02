"use client";

import Link from "next/link";

export default function NotificationsPage() {
  return <main className="mx-auto w-full max-w-5xl px-4 py-10">
    <div className="mb-6"><div><span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">UPDATES</span><h1>Notifications</h1><p>Order and platform updates will appear here.</p></div></div>
    <section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm"><h3>Notifications are being upgraded</h3><p className="text-sm text-tadka-muted">Live notifications will be enabled after the notification domain is migrated to the Tadka API.</p><Link className="inline-flex rounded-xl border border-tadka-line bg-white px-4 py-2.5 text-sm font-bold" href="/orders">View your orders</Link></section>
  </main>;
}
