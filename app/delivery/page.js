'use client';

import Link from 'next/link';

export default function DeliveryPage() {
  return <main className="container delivery-page">
    <div className="page-head"><div><span className="eyebrow">DELIVERY</span><h1>Rider deliveries</h1><p>Delivery operations are being migrated to the Tadka API.</p></div></div>
    <section className="panel"><h3>Rider workflow is temporarily unavailable</h3><p className="muted">The previous delivery-assignment data source has been retired. This screen will be re-enabled when the delivery domain is backed by PostgreSQL and the API.</p><Link className="secondary" href="/account">Back to account</Link></section>
  </main>;
}
