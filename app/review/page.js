'use client';

import Link from 'next/link';

export default function ReviewPage() {
  return (
    <main className="container">
      <section className="panel">
        <span className="eyebrow">FEEDBACK</span>
        <h1>Reviews are coming soon</h1>
        <p>Order reviews are not enabled in the current PostgreSQL domain yet. No review is submitted until that API is available.</p>
        <Link className="btn primary" href="/orders">View your orders</Link>
      </section>
    </main>
  );
}
