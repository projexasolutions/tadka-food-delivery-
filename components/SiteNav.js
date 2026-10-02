'use client';

import { usePathname } from 'next/navigation';
import CustomerNav from '@/components/navigation/CustomerNav';
import AdminNav from '@/components/navigation/AdminNav';
import RiderNav from '@/components/navigation/RiderNav';

export default function SiteNav() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) return <AdminNav pathname={pathname} />;
  if (pathname.startsWith('/delivery')) return <RiderNav pathname={pathname} />;
  return <CustomerNav />;
}
