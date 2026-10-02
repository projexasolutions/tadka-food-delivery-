import '@fontsource/metropolis/400.css';
import '@fontsource/material-symbols-outlined/500.css';
import '@fontsource/metropolis/500.css';
import '@fontsource/metropolis/600.css';
import '@fontsource/metropolis/700.css';
import SiteNav from '@/components/SiteNav';
import './tailwind.css';

export const metadata = { title:'Tadka — Food Delivery', description:'Order from local kitchens with Tadka.' };
export default function RootLayout({ children }) { return <html lang="en"><body><SiteNav />{children}</body></html>; }
