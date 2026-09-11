import SiteNav from '@/components/SiteNav';
import './globals.css';
import './tadka-theme.css';
import './tadka-modern.css';
import './tadka-icons.css';
import './tadka-v3.css';
import './tadka-v3-extra.css';
import './tadka-reference.css';
import './tadka-reference-nav.css';
import './tadka-final-ui.css';
import './restaurant-modern.css';
import './restaurant/access-state.css';
import './admin/tadka-admin-users.css';
import './auth/tadka-auth.css';
import './restaurant-polish.css';
import './restaurant/tadka-partner-v2.css';
import './restaurant-reference.css';
import './restaurant/spacing-fix.css';

export const metadata = { title:'Tadka — Food Delivery', description:'Order from local kitchens with Tadka.' };
export default function RootLayout({ children }) { return <html lang="en"><body><SiteNav />{children}</body></html>; }
