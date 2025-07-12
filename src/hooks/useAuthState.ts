import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/auth';
import type { Session } from '@supabase/supabase-js';
import { useFollowCounts } from './useFollowCounts';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  
  // Get follow counts for the current user - but only fetch after auth is established
  const { followersCount, followingCount, refetchCounts } = useFollowCounts(user?.id || '');

  const fetchProfile = async (userId: string) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;

      if (profile) {
        const userWithCompat = {
          ...profile,
          avatar: profile.avatar_url,
          followersCount: 0, // Will be updated separately
          followingCount: 0, // Will be updated separately
        };
        setUser(userWithCompat);

        // Check if user is new and hasn't seen pricing modal yet
        const createdAt = new Date(profile.created_at);
        const now = new Date();
        const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 3600);
        if (hoursDiff < 1 && profile.role === 'free' && !localStorage.getItem(`pricing_shown_${profile.id}`)) {
          setIsFirstLogin(true);
        }
      } else {
        const basicUser = {
          id: userId,
          email: session?.user?.email || '',
          username: session?.user?.email?.split('@')[0] || 'user',
          avatar_url: null,
          bio: null,
          role: 'free' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          avatar: null,
          followersCount: 0,
          followingCount: 0,
        };
        setUser(basicUser);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      try {
        console.log('AuthContext: Auth state change', _event, session?.user?.id);
        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
          console.log('AuthContext: Profile fetch complete');
        } else {
          console.log('AuthContext: No session, clearing user');
          setUser(null);
        }
      } catch (err) {
        console.error('AuthContext: onAuthStateChange error:', err);
      } finally {
        setIsLoading(false);
      }
    });

    (async () => {
      try {
        console.log('AuthContext: Getting initial session');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Initial session result', session?.user?.id);
        setSession(session);

        if (session?.user) {
          await fetchProfile(session.user.id);
          console.log('AuthContext: Initial profile fetch complete');
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
  };

  // Update user counts when follow counts change (separated to avoid circular deps)
  useEffect(() => {
    if (user && followersCount !== undefined && followingCount !== undefined) {
      setUser(prev => prev ? {
        ...prev,
        followersCount,
        followingCount,
      } : null);
    }
  }, [followersCount, followingCount, user?.id]); // Only depend on user.id, not the full user object

  const refreshUser = async () => {
    if (session?.user) {
      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle();

        if (!error && profile) {
          const userWithCompat = {
            ...profile,
            avatar: profile.avatar_url,
            followersCount,
            followingCount,
          };
          setUser(userWithCompat);
          console.log('AuthContext: User refreshed');
        }
      } catch (err) {
        console.error('Error refreshing user:', err);
      }
    }
  };

  return {
    user,
    session,
    isLoading,
    isFirstLogin,
    setIsFirstLogin,
    clearAuth,
    refetchCounts,
    refreshUser,
  };
};
