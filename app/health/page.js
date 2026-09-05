import SupabaseStatus from '@/components/SupabaseStatus';
import { supabase } from '@/lib/supabase';

export default async function HealthPage() {
  const { error } = await supabase.from('restaurants').select('id').limit(1);
  return (
    <main className="page">
      <h1>System Health</h1>
      <p>Database connectivity: <strong>{error ? 'Needs configuration' : 'OK'}</strong></p>
      <p>Next step: sign in and test each role flow.</p><SupabaseStatus />
    </main>
  );
}
