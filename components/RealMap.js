'use client';

import { useMemo } from 'react';

export default function RealMap({ address = 'Nagpur, Maharashtra, India', className = '' }) {
  const query = useMemo(() => encodeURIComponent(address || 'Nagpur, Maharashtra, India'), [address]);
  const src = `https://www.google.com/maps?q=${query}&output=embed`;
  const link = `https://www.google.com/maps/search/?api=1&query=${query}`;

  return (
    <div className={`real-map ${className}`}>
      <iframe
        title="Delivery location map"
        src={src}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <a className="map-open" href={link} target="_blank" rel="noreferrer">Open in Google Maps ↗</a>
    </div>
  );
}
