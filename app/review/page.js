'use client';

import Link from 'next/link';

export default function ReviewPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">
        <span className="text-[10px] font-black uppercase tracking-[.14em] text-tadka-orange">FEEDBACK</span>
        <h1>Reviews are coming soon</h1>
        <p>Order reviews are not enabled in the current PostgreSQL domain yet. No review is submitted until that API is available.</p>
        <Link className="rounded-xl bg-tadka-orange px-4 py-3 text-sm font-bold text-white" href="/orders">View your orders</Link>
      </section>
    </main>
  );
}
