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
    <main className="page">
      <h1>System Health</h1>
      <p>Node API connectivity: <strong>{status}</strong></p>
      <p>Database checks are performed by the API health endpoint.</p>
    </main>
  );
}
