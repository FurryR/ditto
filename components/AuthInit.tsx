'use client';

import { useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useUserStore } from '@/store/userStore';
import { User } from '@supabase/supabase-js';

function mapUser(user: User) {
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email ?? undefined,
    name: (meta.full_name || meta.name || meta.user_name || meta.userName) as string | undefined,
    avatar: (meta.avatar_url || meta.picture) as string | undefined,
    githubUsername: (meta.user_name || meta.preferred_username) as string | undefined,
  };
}

export function AuthInit() {
  const setUser = useUserStore((s) => s.setUser);
  const clearUser = useUserStore((s) => s.clearUser);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const syncUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!mounted) return;
      if (user) setUser(mapUser(user));
      else clearUser();
    };

    syncUser();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user;
      if (user) setUser(mapUser(user));
      else clearUser();
    });

    return () => {
      mounted = false;
      listener?.subscription.unsubscribe();
    };
  }, [setUser, clearUser]);

  return null;
}
