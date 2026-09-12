'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import './restaurant-notifications.css';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
const NAV_ITEMS = [['Overview','/restaurant'],['Live Orders','/restaurant/orders'],['Menu Management','/restaurant/menu'],['Categories','/restaurant/categories'],['Analytics & Revenue','/restaurant/analytics'],['Customer Reviews','/restaurant/reviews'],['Restaurant Profile','/restaurant/profile'],['Notifications','/restaurant/notifications']];

export default function RestaurantShell({ children, title, subtitle }) {
  const pathname = usePathname();
  const [restaurant, setRestaurant] = useState(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]);
  const [bellOpen, setBellOpen] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(`${apiUrl}/v1/restaurant`, { credentials:'include', cache:'no-store' })
      .then(async response => { const body = await response.json().catch(()=>null); if (!response.ok) throw new Error(body?.error?.message || 'Unable to load restaurant.'); return body?.data; })
      .then(data => { if (active) { setRestaurant(data || null); setError(''); } })
      .catch(err => { if (active) { setRestaurant(null); setError(err.message); } });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const loadNotifications = async () => {
      try {
        const response = await fetch(`${apiUrl}/v1/notifications`, { credentials:'include', cache:'no-store' });
        const body = await response.json().catch(()=>null);
        if (response.ok && active) setNotifications(Array.isArray(body?.data) ? body.data : []);
      } catch {}
    };
    loadNotifications();
    const timer = window.setInterval(loadNotifications, 15000);
    return () => { active = false; window.clearInterval(timer); };
  }, []);

  async function toggleKitchen() {
    if (!restaurant || busy) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`${apiUrl}/v1/restaurant`, { method:'PATCH', credentials:'include', headers:{'Content-Type':'application/json'}, body:JSON.stringify({isOpen:!restaurant.isOpen}) });
      const body = await response.json().catch(()=>null);
      if (!response.ok) throw new Error(body?.error?.message || 'Unable to update kitchen.');
      setRestaurant(body.data);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  if (restaurant === undefined) return <div className="partner-app partner-loading"><main className="partner-main"><div className="partner-content"><div className="partner-empty"><span className="metric-label">RESTAURANT PARTNER</span><h2>Checking restaurant access…</h2><p>Loading your assigned restaurant and permissions.</p></div></div></main></div>;

  if (restaurant === null) return <div className="partner-app"><aside className="partner-sidebar"><Link href="/" className="partner-brand"><span className="partner-logo">T</span><span>TADKA <small>PARTNER HUB</small></span></Link><div className="partner-restaurant-card restricted"><span className="verified">ACCOUNT STATUS</span><span className="partner-access-pill">ACCESS REQUIRED</span><b>No restaurant assigned</b><span>Administrator assignment required</span></div><nav className="partner-nav"><Link href="/account" className="active"><span>Account</span></Link><Link href="/"><span>Back to Tadka</span></Link></nav><div className="partner-sidebar-bottom"><Link href="/account" className="partner-user"><span className="avatar">R</span><span><b>Partner account</b><small>View account</small></span></Link></div></aside><main className="partner-main"><header className="partner-topbar"><div className="partner-access-top"><span className="partner-access-dot" /> Restaurant access unavailable</div><Link href="/account" className="partner-add">Open Account</Link></header><div className="partner-content"><div className="partner-page-title"><div><span className="partner-kicker">{title || 'RESTAURANT PARTNER'}</span><h1>Restaurant access required</h1></div></div><div className="partner-empty partner-access-empty"><span className="metric-label">RESTAURANT</span><h2>{error || 'No restaurant is assigned to this account.'}</h2><p>Your administrator must assign this account the <b>Restaurant Staff</b> role and an approved restaurant before restaurant tools become available.</p><div className="partner-access-actions"><Link className="partner-btn primary" href="/account">Back to account</Link><Link className="partner-btn secondary" href="/">Browse Tadka</Link></div></div></div></main></div>;

  const unreadCount = notifications.length;
  const recentNotifications = notifications.slice(0, 5);

  return <div className="partner-app"><aside className="partner-sidebar"><Link href="/" className="partner-brand"><span className="partner-logo">T</span><span>TADKA <small>PARTNER HUB</small></span></Link><div className="partner-restaurant-card"><span className="verified">VERIFIED KITCHEN</span><button type="button" onClick={toggleKitchen} disabled={busy} className={`partner-open ${restaurant.isOpen?'on':'off'}`}><i /> {restaurant.isOpen?'OPEN':'CLOSED'}</button><b>{restaurant.name}</b><span>{restaurant.cuisine || 'Restaurant partner'}</span></div><nav className="partner-nav" aria-label="Restaurant navigation">{NAV_ITEMS.map(([label,href])=><Link key={href} href={href} className={pathname===href?'active':''}><span>{label}</span>{label==='Live Orders'&&<em>LIVE</em>}</Link>)}</nav><div className="partner-sidebar-bottom"><div className="kitchen-chime"><span>Kitchen Chime</span><b>{restaurant.isOpen?'ON':'OFF'}</b><small>{restaurant.isOpen?'Accepting Orders':'Paused'}</small></div><Link href="/account" className="partner-user"><span className="avatar">R</span><span><b>Restaurant Manager</b><small>Partner account</small></span><span>⋮</span></Link></div></aside><main className="partner-main"><header className="partner-topbar"><form onSubmit={e=>e.preventDefault()} className="partner-search"><input placeholder="Search orders, dishes, or customers" aria-label="Search restaurant data" /></form><div className="partner-top-actions"><span className="kitchen-live"><i /> {restaurant.isOpen?'Kitchen Active':'Kitchen Paused'}</span><Link href="/restaurant/menu#add" className="partner-add">+ Add New Dish</Link><div className="notification-wrap"><button type="button" className={`icon-action notification-bell ${bellOpen?'active':''}`} aria-label="Notifications" aria-expanded={bellOpen} onClick={() => setBellOpen(value => !value)}><span className="material-symbols-outlined">notifications</span>{unreadCount > 0 && <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>}</button>{bellOpen && <div className="notification-popover"><div className="notification-popover-head"><div><strong>TADKA Notifications</strong><small>Live kitchen updates</small></div><span className="notification-live-dot">LIVE</span></div>{recentNotifications.length ? recentNotifications.map(item => <Link href="/restaurant/notifications" className="notification-item" key={item.id} onClick={() => setBellOpen(false)}><span className="notification-icon"><span className="material-symbols-outlined">{String(item.title || '').toLowerCase().includes('order') ? 'receipt_long' : 'notifications'}</span></span><span><b>{item.title}</b><small>{item.body}</small><time>{new Date(item.createdAt).toLocaleString()}</time></span></Link>) : <div className="notification-empty"><span className="material-symbols-outlined">notifications_none</span><b>All quiet in the kitchen</b><small>New order activity will appear here.</small></div>}<Link href="/restaurant/notifications" className="notification-view-all" onClick={() => setBellOpen(false)}>View all notifications <span>→</span></Link></div>}</div><Link href="/restaurant/profile" className="avatar" aria-label="Restaurant profile">R</Link></div></header><div className="partner-content"><div className="partner-page-title"><div><span className="partner-kicker">{title || 'RESTAURANT PARTNER'}</span><h1>{subtitle || 'Your restaurant command center'}</h1></div>{error&&<span className="partner-inline-error">{error}</span>}</div>{children}</div></main></div>;
}
