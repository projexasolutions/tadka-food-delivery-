const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export default async function HealthPage() {
  let status = 'Unavailable';
  try {
    const response = await fetch(`${apiUrl}/health`, { cache: 'no-store' });
    status = response.ok ? 'OK' : 'Needs attention';
  } catch {
    status = 'Unavailable';
  }
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">
        <span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">SYSTEM HEALTH</span>
        <h1 className="mt-2 text-3xl font-black tracking-tight">System Health</h1>
        <p className="mt-3 text-sm text-tadka-muted">Node API connectivity: <strong className="text-tadka-ink">{status}</strong></p>
        <p className="mt-2 text-sm text-tadka-muted">Database checks are performed by the API health endpoint.</p>
      </section>
    </main>
  );
}