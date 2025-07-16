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
  
  // Get follow counts for the current user
  const { followersCount, followingCount, refetchCounts } = useFollowCounts(session?.user?.id || '');

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        try {
          console.log('AuthContext: Auth state change', _event, session?.user?.id);
          setSession(session);

          if (session?.user) {
            // Update login tracking for login events
            if (_event === 'SIGNED_IN' || _event === 'TOKEN_REFRESHED') {
              try {
                await supabase.rpc('update_user_login_tracking', {
                  user_id: session.user.id
                });
                console.log('AuthContext: Login tracking updated');
              } catch (trackingError) {
                console.error('AuthContext: Failed to update login tracking:', trackingError);
              }
            }

            const { data: profile, error } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            console.log('AuthContext: Profile fetch result', { profile, error });

            if (error) throw error;

            if (profile) {
              const userWithCompat = {
                ...profile,
                avatar: profile.avatar_url,
                followersCount,
                followingCount,
              };
              setUser(userWithCompat);
              console.log('AuthContext: User set', userWithCompat);

              // Check if user is new and hasn't seen pricing modal yet
              const createdAt = new Date(profile.created_at);
              const now = new Date();
              const hoursDiff = (now.getTime() - createdAt.getTime()) / (1000 * 3600);
              // Only show for truly new users who are free and haven't been shown before
              if (hoursDiff < 1 && profile.role === 'free' && !localStorage.getItem(`pricing_shown_${profile.id}`)) {
                setIsFirstLogin(true);
              }
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
          } else {
            console.log('AuthContext: No session, clearing user');
            setUser(null);
          }
        } catch (err) {
          console.error('AuthContext: onAuthStateChange error:', err);
        } finally {
          setIsLoading(false);
        }
      })();
    });

    (async () => {
      try {
        console.log('AuthContext: Getting initial session');
        const { data: { session } } = await supabase.auth.getSession();
        console.log('AuthContext: Initial session result', session?.user?.id);
        setSession(session);

        if (session?.user) {
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          console.log('AuthContext: Initial profile fetch result', { profile, error });

          if (error) throw error;

          if (profile) {
            const userWithCompat = {
              ...profile,
              avatar: profile.avatar_url,
              followersCount,
              followingCount,
            };
            setUser(userWithCompat);
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
        console.log('AuthContext: User refreshed', userWithCompat);
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
