import Link from 'next/link';

export default function AdminNav({ pathname }) {
  const links = [
    ['/admin', 'Overview'],
    ['/admin/users', 'Users'],
    ['/admin/restaurants', 'Restaurants'],
    ['/admin/operations', 'Operations'],
    ['/admin/categories', 'Categories'],
  ];

  return (
    <header className="admin-navbar">
      <div className="admin-navbar-inner">
        <Link href="/admin" className="admin-brand">
          <span className="admin-brand-mark">T</span>
          <span><b>TADKA</b><small>ADMIN CONSOLE</small></span>
        </Link>
        <nav className="admin-nav-links" aria-label="Admin navigation">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={pathname === href ? 'active' : ''}>{label}</Link>
          ))}
        </nav>
        <div className="admin-nav-actions">
          <span className="admin-online"><i /> Admin</span>
          <Link href="/" className="admin-customer-link">Customer view ↗</Link>
        </div>
      </div>
    </header>
  );
}
