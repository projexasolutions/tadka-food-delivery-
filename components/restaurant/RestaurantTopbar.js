'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RestaurantTopbar({ restaurant, notifications }) {
  const [bellOpen, setBellOpen] = useState(false);
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.length;

  return (
    <header className="sticky top-0 z-20 flex min-h-16 items-center justify-between gap-4 border-b border-tadka-line bg-white/95 px-6 backdrop-blur">
      <form onSubmit={event => event.preventDefault()} className="min-w-0 flex-1"><input placeholder="Search orders, dishes, or customers" aria-label="Search restaurant data" /></form>
      <div className="flex items-center gap-3">
        <span className="hidden items-center gap-2 text-xs font-bold text-tadka-muted lg:flex"><span className={`h-2 w-2 rounded-full ${restaurant.isOpen ? 'bg-tadka-success' : 'bg-tadka-danger'}`} /> {restaurant.isOpen ? 'Kitchen Active' : 'Kitchen Paused'}</span>
        <Link href="/restaurant/menu#add" className="rounded-xl bg-tadka-orange px-4 py-2.5 text-sm font-bold text-white hover:bg-tadka-orange-dark">+ Add New Dish</Link>
        <div className="relative">
          <button type="button" className={`relative grid h-10 w-10 place-items-center rounded-xl border border-tadka-line bg-white ${bellOpen ? 'bg-tadka-bg' : ''}`} aria-label="Notifications" aria-expanded={bellOpen} onClick={() => setBellOpen(value => !value)}>
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="absolute -right-1 -top-1 min-w-5 rounded-full bg-tadka-orange px-1.5 py-0.5 text-center text-[10px] font-bold text-white">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {bellOpen && (
            <div className="absolute right-0 top-12 z-50 w-[360px] overflow-hidden rounded-2xl border border-tadka-line bg-white shadow-tadka-lg">
              <div className="flex items-center justify-between border-b border-tadka-line p-4"><div><strong>TADKA Notifications</strong><small>Live kitchen updates</small></div><span className="rounded-full bg-tadka-green-soft px-2 py-1 text-[9px] font-black text-tadka-success">LIVE</span></div>
              {recentNotifications.length ? recentNotifications.map(item => (
                <Link href="/restaurant/notifications" className="flex gap-3 border-b border-tadka-line p-4 hover:bg-tadka-bg" key={item.id} onClick={() => setBellOpen(false)}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-tadka-bg"><span className="material-symbols-outlined">{String(item.title || '').toLowerCase().includes('order') ? 'receipt_long' : 'notifications'}</span></span>
                  <span><b>{item.title}</b><small>{item.body}</small><time>{new Date(item.createdAt).toLocaleString()}</time></span>
                </Link>
              )) : (
                <div className="p-8 text-center text-tadka-muted"><span className="material-symbols-outlined">notifications_none</span><b>All quiet in the kitchen</b><small>New order activity will appear here.</small></div>
              )}
              <Link href="/restaurant/notifications" className="block p-3 text-center text-sm font-bold text-tadka-green hover:bg-tadka-bg" onClick={() => setBellOpen(false)}>View all notifications <span>→</span></Link>
            </div>
          )}
        </div>
        <Link href="/restaurant/profile" className="grid h-10 w-10 place-items-center rounded-full bg-tadka-green font-bold text-white" aria-label="Restaurant profile">R</Link>
      </div>
    </header>
  );
}
