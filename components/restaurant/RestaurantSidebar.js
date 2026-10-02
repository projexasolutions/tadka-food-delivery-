import Link from 'next/link';

export default function RestaurantSidebar({ restaurant, navItems }) {
  return (
    <aside className="partner-sidebar">
      <Link href="/" className="partner-brand"><span className="partner-logo">T</span><span>TADKA <small>PARTNER HUB</small></span></Link>
      <div className="partner-restaurant-card">
        <span className="verified">VERIFIED KITCHEN</span>
        <button type="button" className={`partner-open ${restaurant.isOpen ? 'on' : 'off'}`} disabled={restaurant.busy} onClick={restaurant.onToggle}>
          <i /> {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
        </button>
        <b>{restaurant.name}</b>
        <span>{restaurant.cuisine || 'Restaurant partner'}</span>
      </div>
      <nav className="partner-nav" aria-label="Restaurant navigation">
        {navItems.map(([label, href]) => <Link key={href} href={href} className={restaurant.pathname === href ? 'active' : ''}><span>{label}</span>{label === 'Live Orders' && <em>LIVE</em>}</Link>)}
      </nav>
      <div className="partner-sidebar-bottom">
        <div className="kitchen-chime"><span>Kitchen Chime</span><b>{restaurant.isOpen ? 'ON' : 'OFF'}</b><small>{restaurant.isOpen ? 'Accepting Orders' : 'Paused'}</small></div>
        <Link href="/account" className="partner-user"><span className="avatar">R</span><span><b>Restaurant Manager</b><small>Partner account</small></span><span>⋮</span></Link>
      </div>
    </aside>
  );
}
