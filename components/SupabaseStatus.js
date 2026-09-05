'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function SupabaseStatus() {
  const [status, setStatus] = useState('Checking…');

  useEffect(() => {
    (async () => {
      const { error } = await supabase.from('restaurants').select('id').limit(1);
      setStatus(error ? `Not connected: ${error.message}` : 'Connected to Supabase');
    })();
  }, []);

  return <div className="card"><strong>Supabase:</strong> {status}</div>;
}
