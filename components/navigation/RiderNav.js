import Link from 'next/link';

export default function RiderNav({ pathname }) {
  const links = [
    ['/delivery', 'Deliveries', 'local_shipping'],
    ['/delivery/summary', 'Summary', 'receipt_long'],
    ['/delivery/account', 'Profile', 'person'],
    ['/delivery/support', 'Support', 'support_agent'],
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-tadka-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-[1400px] items-center gap-4 px-4 sm:px-6">
        <Link href="/delivery" className="flex items-center gap-2 text-tadka-ink" aria-label="Tadka rider console">
          <img src="/tadka-logo.svg" alt="Tadka" />
          <span className="h-7 w-px bg-tadka-line" />
          <span className="flex flex-col leading-none"><b>RIDER</b><small>PARTNER APP</small></span>
        </Link>
        <nav className="hidden items-center gap-1 md:flex" aria-label="Rider navigation">
          {links.map(([href, label, icon]) => (
            <Link key={href} href={href} className={`rounded-lg px-3 py-2 text-sm font-semibold ${pathname === href || (href !== "/delivery" && pathname.startsWith(href)) ? "bg-tadka-green text-white" : "text-tadka-muted hover:bg-tadka-bg"}`}>
              <span className="material-symbols-outlined">{icon}</span>
              <span>{label}</span>
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-tadka-green-soft px-3 py-2 text-xs font-bold text-tadka-success"><i /> <span>Online</span></div>
          <Link href="/" className="hidden rounded-xl border border-tadka-line px-3 py-2 text-sm font-bold sm:flex" aria-label="Customer view">
            <span className="material-symbols-outlined">storefront</span>
            <span>Customer</span>
          </Link>
          <Link href="/delivery/account" className="grid h-10 w-10 place-items-center rounded-xl border border-tadka-line" aria-label="Profile">
            <span className="material-symbols-outlined">person</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
