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
    <header className="sticky top-0 z-50 border-b border-tadka-line bg-white/95 backdrop-blur">
      <div className="mx-auto flex min-h-[68px] w-full max-w-[1400px] items-center gap-6 px-4 sm:px-6 lg:px-8">
        <Link href="/admin" className="flex shrink-0 items-center gap-3 text-tadka-ink">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-tadka-orange font-black text-white">T</span>
          <span><b>TADKA</b><small>ADMIN CONSOLE</small></span>
        </Link>
        <nav className="hidden items-center gap-5 text-sm font-semibold text-tadka-muted lg:flex" aria-label="Admin navigation">
          {links.map(([href, label]) => (
            <Link key={href} href={href} className={`transition hover:text-tadka-green ${pathname === href ? 'text-tadka-green' : ''}`}>{label}</Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <span className="hidden items-center gap-2 text-xs font-bold text-tadka-green sm:flex"><i /> Admin</span>
          <Link href="/" className="rounded-xl border border-tadka-line px-3 py-2 text-xs font-bold text-tadka-green hover:bg-tadka-bg">Customer view ↗</Link>
        </div>
      </div>
    </header>
  );
}
