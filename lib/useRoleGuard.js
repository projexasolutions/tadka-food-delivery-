'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export function useRoleGuard(allowedRoles = []) {
  const router = useRouter();
  const roleKey = allowedRoles.join('|');
  const [checkingRole, setCheckingRole] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function checkAccess() {
      setCheckingRole(true);
      setProfile(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (cancelled) return;

      if (authError || !user) {
        setCheckingRole(false);
        router.replace('/auth');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      const hasAccess =
        !error &&
        data &&
        (!roleKey || allowedRoles.includes(data.role));

      if (!hasAccess) {
        setCheckingRole(false);
        router.replace('/account');
        return;
      }

      setProfile(data);
      setCheckingRole(false);
    }

    checkAccess();

    return () => {
      cancelled = true;
    };
  }, [router, roleKey]);

  return { checkingRole, profile };
}
