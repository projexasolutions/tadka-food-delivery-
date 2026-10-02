import '@fontsource/metropolis/400.css';
import '@fontsource/metropolis/500.css';
import '@fontsource/metropolis/600.css';
import '@fontsource/metropolis/700.css';
import SiteNav from '@/components/SiteNav';
import './globals.css';
import './customer-ui.css';
import './tadka-icons.css';
import './restaurant/access-state.css';
import './admin/tadka-admin-users.css';
import './restaurant/partner-ui.css';
import './restaurant-scroll-fix.css';
import './restaurant/menu-ui-fix.css';
import './tadka-ui-system.css';
import './tailwind.css';

export const metadata = { title:'Tadka — Food Delivery', description:'Order from local kitchens with Tadka.' };
export default function RootLayout({ children }) { return <html lang="en"><body><SiteNav />{children}</body></html>; }
