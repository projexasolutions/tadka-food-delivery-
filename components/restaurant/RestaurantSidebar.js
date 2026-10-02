import Link from 'next/link';

export default function RestaurantSidebar({ restaurant, navItems }) {
  return (
    <aside className="sticky top-0 flex h-screen w-[260px] shrink-0 flex-col border-r border-tadka-line bg-white p-4">
      <Link href="/" className="mb-5 flex items-center gap-3 px-2 py-3 text-tadka-ink"><span className="grid h-10 w-10 place-items-center rounded-xl bg-tadka-orange font-black text-white">T</span><span>TADKA <small className="ml-1 text-[9px] font-bold tracking-widest text-tadka-muted">PARTNER HUB</small></span></Link>
      <div className="mb-4 rounded-xl border border-tadka-line bg-tadka-bg p-3">
        <span className="text-[9px] font-black tracking-widest text-tadka-success">VERIFIED KITCHEN</span>
        <button type="button" className="mt-3 flex w-full items-center gap-2 rounded-lg border border-tadka-line bg-white px-3 py-2 text-xs font-bold" disabled={restaurant.busy} onClick={restaurant.onToggle}>
          <span className={`h-2 w-2 rounded-full ${restaurant.isOpen ? 'bg-tadka-success' : 'bg-tadka-danger'}`} /> {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
        </button>
        <b>{restaurant.name}</b>
        <span>{restaurant.cuisine || 'Restaurant partner'}</span>
      </div>
      <nav className="flex flex-1 flex-col gap-1" aria-label="Restaurant navigation">
        {navItems.map(([label, href]) => <Link key={href} href={href} className={`flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold ${restaurant.pathname === href ? 'bg-tadka-green text-white' : 'text-tadka-muted hover:bg-tadka-bg hover:text-tadka-ink'}`}><span>{label}</span>{label === 'Live Orders' && <em className="rounded-full bg-tadka-orange px-2 py-0.5 text-[9px] font-black text-white not-italic">LIVE</em>}</Link>)}
      </nav>
      <div className="mt-auto space-y-3 pt-4">
        <div className="rounded-xl bg-tadka-green-soft p-3 text-sm"><span>Kitchen Chime</span><b>{restaurant.isOpen ? 'ON' : 'OFF'}</b><small>{restaurant.isOpen ? 'Accepting Orders' : 'Paused'}</small></div>
        <Link href="/account" className="flex items-center gap-2 rounded-xl border border-tadka-line p-2.5 text-sm"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-tadka-orange font-bold text-white">R</span><span><b>Restaurant Manager</b><small>Partner account</small></span><span>⋮</span></Link>
      </div>
    </aside>
  );
}
