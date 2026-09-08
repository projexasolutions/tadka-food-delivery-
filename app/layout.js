import SiteNav from '@/components/SiteNav';
import './globals.css';
import './tadka-theme.css';
import './tadka-modern.css';

export const metadata = {
  title: 'Tadka — Food Delivery',
  description: 'Order from local kitchens with Tadka.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <SiteNav />
        {children}
      </body>
    </html>
  );
}
