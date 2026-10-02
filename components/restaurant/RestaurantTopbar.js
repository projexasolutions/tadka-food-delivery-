'use client';

import Link from 'next/link';
import { useState } from 'react';

export default function RestaurantTopbar({ restaurant, notifications }) {
  const [bellOpen, setBellOpen] = useState(false);
  const recentNotifications = notifications.slice(0, 5);
  const unreadCount = notifications.length;

  return (
    <header className="partner-topbar">
      <form onSubmit={event => event.preventDefault()} className="partner-search"><input placeholder="Search orders, dishes, or customers" aria-label="Search restaurant data" /></form>
      <div className="partner-top-actions">
        <span className="kitchen-live"><i /> {restaurant.isOpen ? 'Kitchen Active' : 'Kitchen Paused'}</span>
        <Link href="/restaurant/menu#add" className="partner-add">+ Add New Dish</Link>
        <div className="notification-wrap">
          <button type="button" className={`icon-action notification-bell ${bellOpen ? 'active' : ''}`} aria-label="Notifications" aria-expanded={bellOpen} onClick={() => setBellOpen(value => !value)}>
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}
          </button>
          {bellOpen && (
            <div className="notification-popover">
              <div className="notification-popover-head"><div><strong>TADKA Notifications</strong><small>Live kitchen updates</small></div><span className="notification-live-dot">LIVE</span></div>
              {recentNotifications.length ? recentNotifications.map(item => (
                <Link href="/restaurant/notifications" className="notification-item" key={item.id} onClick={() => setBellOpen(false)}>
                  <span className="notification-icon"><span className="material-symbols-outlined">{String(item.title || '').toLowerCase().includes('order') ? 'receipt_long' : 'notifications'}</span></span>
                  <span><b>{item.title}</b><small>{item.body}</small><time>{new Date(item.createdAt).toLocaleString()}</time></span>
                </Link>
              )) : (
                <div className="notification-empty"><span className="material-symbols-outlined">notifications_none</span><b>All quiet in the kitchen</b><small>New order activity will appear here.</small></div>
              )}
              <Link href="/restaurant/notifications" className="notification-view-all" onClick={() => setBellOpen(false)}>View all notifications <span>→</span></Link>
            </div>
          )}
        </div>
        <Link href="/restaurant/profile" className="avatar" aria-label="Restaurant profile">R</Link>
      </div>
    </header>
  );
}
