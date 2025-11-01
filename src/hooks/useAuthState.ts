import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/auth';
import type { Session } from '@supabase/supabase-js';
import { useFollowCounts } from './useFollowCounts';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [originalAdminUser, setOriginalAdminUser] = useState<User | null>(null);
  
  // Get follow counts for the current user
  const { followersCount, followingCount, refetchCounts } = useFollowCounts(session?.user?.id || '');

  const fetchUserProfile = async (userId: string) => {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) throw error;

    if (profile) {
      return {
        ...profile,
        avatar: profile.avatar_url,
        followersCount,
        followingCount,
      };
    }

    return null;
  };

  const impersonateUser = async (userId: string) => {
    if (!user || user.role !== 'admin') {
      throw new Error('Only admins can impersonate users');
    }

    // Store original admin user
    setOriginalAdminUser(user);
    setIsImpersonating(true);

    // Fetch the target user's profile
    const targetProfile = await fetchUserProfile(userId);
    if (targetProfile) {
      setUser(targetProfile);
    }
  };

  const exitImpersonation = async () => {
    if (!isImpersonating || !originalAdminUser) {
      return;
    }

    setUser(originalAdminUser);
    setIsImpersonating(false);
    setOriginalAdminUser(null);
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('AuthContext: Auth state change', _event, session?.user?.id);
      setSession(session);
      setIsLoading(false);

      if (session?.user) {
        // Defer Supabase calls with setTimeout to prevent deadlock
        setTimeout(async () => {
          try {
            const profile = await fetchUserProfile(session.user.id);

            if (profile) {
              setUser(profile);
              console.log('AuthContext: User set', profile);
            } else {
              console.log('AuthContext: No profile found, creating default');
              const basicUser = {
                id: session.user.id,
                email: session.user.email || '',
                username: session.user.email?.split('@')[0] || 'user',
                avatar_url: null,
                bio: null,
                role: 'free' as const,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                avatar: null,
                followersCount,
                followingCount,
              };
              setUser(basicUser);
            }
          } catch (err) {
            console.error('AuthContext: Error fetching profile:', err);
          }
        }, 0);
      } else {
        console.log('AuthContext: No session, clearing user');
        setUser(null);
        setIsImpersonating(false);
        setOriginalAdminUser(null);
      }
    });

    (async () => {
      try {
        console.log('AuthContext: Getting initial session');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Initial session result', session?.user?.id);
        setSession(session);

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);

          if (profile) {
            setUser(profile);
          } else {
            const basicUser = {
              id: session.user.id,
              email: session.user.email || '',
              username: session.user.email?.split('@')[0] || 'user',
              avatar_url: null,
              bio: null,
              role: 'free' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              avatar: null,
              followersCount,
              followingCount,
            };
            setUser(basicUser);
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('AuthContext: Initial session fetch failed:', err);
      } finally {
        setIsLoading(false);
      }
    })();

    return () => subscription.unsubscribe();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setSession(null);
    setIsImpersonating(false);
    setOriginalAdminUser(null);
  };

  // Update user counts when follow counts change
  useEffect(() => {
    if (user && session?.user?.id) {
      setUser(prev => prev ? {
        ...prev,
        followersCount,
        followingCount,
      } : null);
    }
  }, [followersCount, followingCount, session?.user?.id]);

  const refreshUser = async () => {
    if (session?.user) {
      const profile = await fetchUserProfile(session.user.id);

      if (profile) {
        setUser(profile);
        console.log('AuthContext: User refreshed', profile);
      }
    }
  };

  return {
    user,
    session,
    isLoading,
    clearAuth,
    refetchCounts,
    refreshUser,
    impersonateUser,
    exitImpersonation,
    isImpersonating,
    originalAdminUser,
  };
};