'use client';

import Link from 'next/link';
import { useState } from 'react';

const faqs = [
  ['How do I accept a delivery?', 'Open Deliveries, find the assigned order and tap Accept delivery. The order then moves to your Active queue.'],
  ['What if the restaurant has not prepared the order?', 'Contact the restaurant first. If the delay continues, use TADKA support and include the order number.'],
  ['What if I cannot find the customer?', 'Use the customer phone number shown on the delivery card and contact support if you still cannot complete the handoff.'],
  ['How do I stop receiving new assignments?', 'Open Account Settings and switch Rider availability to unavailable.'],
];

export default function RiderSupportPage() {
  const [open, setOpen] = useState(0);
  const [sent, setSent] = useState(false);

  return (
    <main className="min-h-screen bg-tadka-bg px-4 py-8 text-tadka-ink sm:px-6">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div><span className="inline-flex items-center gap-2 text-[10px] font-black tracking-widest text-tadka-orange"><i /> RIDER SUPPORT</span><h1>Help & support</h1><p>Quick answers and direct ways to get help while delivering.</p></div>
          <Link href="/delivery" className="inline-flex items-center gap-2 rounded-xl border border-tadka-line bg-white px-3 py-2 text-sm font-bold"><span className="material-symbols-outlined">arrow_back</span>Back to deliveries</Link>
        </div>

        <div className="mb-4 flex flex-col justify-between gap-4 rounded-2xl bg-tadka-green p-6 text-white md:flex-row md:items-center">
          <div><span className="material-symbols-outlined">support_agent</span><div><b>Need help with a delivery?</b><p>Keep your order number ready so the support team can help faster.</p></div></div>
          <a href="mailto:support@tadka.com?subject=TADKA%20Rider%20Support">Contact support →</a>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <section className="rounded-2xl border border-tadka-line bg-white p-6 shadow-tadka-sm">
            <div className="mb-5 flex items-start gap-3"><span className="material-symbols-outlined">help</span><div><h3>Frequently asked questions</h3><small>Common rider situations.</small></div></div>
            <div className="mt-4 divide-y divide-tadka-line rounded-xl border border-tadka-line">{faqs.map(([q,a],i)=><div key={q} className="p-4"><button onClick={() => setOpen(open === i ? -1 : i)}><b>{q}</b><span className="material-symbols-outlined">{open === i ? 'remove' : 'add'}</span></button>{open === i && <p>{a}</p>}</div>)}</div>
          </section>
          <aside className="space-y-4">
            <section className="rider-settings-card rider-contact-card"><span className="material-symbols-outlined">mail</span><h3>Email support</h3><p>Send the order number and a short description of the issue.</p><a href="mailto:support@tadka.com">support@tadka.com</a></section>
            <section className="rider-settings-card rider-contact-card"><span className="material-symbols-outlined">dashboard</span><h3>Rider dashboard</h3><p>Return to your delivery queue and continue working.</p><Link href="/delivery">Open dashboard →</Link></section>
            {sent && <div className="flex items-center gap-2 rounded-xl bg-tadka-green-soft p-3 text-sm text-tadka-success"><span className="material-symbols-outlined">check_circle</span>Support request ready. Your email app can now send it.</div>}
          </aside>
        </div>
      </div>
    </main>
  );
}
