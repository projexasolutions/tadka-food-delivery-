import Link from 'next/link';

export default function RiderNav({ pathname }) {
  const links = [
    ['/delivery', 'Deliveries', 'local_shipping'],
    ['/delivery/summary', 'Summary', 'receipt_long'],
    ['/delivery/account', 'Profile', 'person'],
    ['/delivery/support', 'Support', 'support_agent'],
  ];

  return (
    <header className="rider-navbar rider-navbar-new">
      <div className="rider-navbar-inner">
        <Link href="/delivery" className="rider-brand rider-brand-new" aria-label="Tadka rider console">
          <img src="/tadka-logo.svg" alt="Tadka" />
          <span className="rider-brand-divider" />
          <span className="rider-brand-text"><b>RIDER</b><small>PARTNER APP</small></span>
        </Link>
        <nav className="rider-nav-links rider-nav-links-new" aria-label="Rider navigation">
          {links.map(([href, label, icon]) => (
            <Link key={href} href={href} className={pathname === href || (href !== '/delivery' && pathname.startsWith(href)) ? 'active' : ''}>
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="rider-nav-right rider-nav-right-new">
          <div className="rider-live-pill"><i /> <span>Online</span></div>
          <Link href="/" className="rider-home-btn" aria-label="Customer view">
            <span className="material-symbols-outlined">storefront</span>
            <span>Customer</span>
          </Link>
          <Link href="/delivery/account" className="rider-profile-btn" aria-label="Profile">
            <span className="material-symbols-outlined">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
