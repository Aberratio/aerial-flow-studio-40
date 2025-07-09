import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User } from '@/types/auth';
import type { Session } from '@supabase/supabase-js';

export const useAuthState = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLogin, setIsFirstLogin] = useState(false);

  useEffect(() => {
    console.log('AuthContext: Setting up auth state listener');
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('AuthContext: Auth state change', event, session?.user?.id);
        setSession(session);
        
        if (session?.user) {
          console.log('AuthContext: Getting user profile for', session.user.id);
          // Get user profile from profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          console.log('AuthContext: Profile fetch result', { profile, error });

          if (profile && !error) {
            // Add backward compatibility properties
            const userWithCompat = {
              ...profile,
              avatar: profile.avatar_url,
              followersCount: 0, // Will be calculated from user_follows table later
              followingCount: 0, // Will be calculated from user_follows table later
            };
            setUser(userWithCompat);
            console.log('AuthContext: User set', userWithCompat);
            
            // Check if this is a first login (profile created recently)
            const createdAt = new Date(profile.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - createdAt.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);
            
            if (hoursDiff < 1 && profile.role === 'free') {
              setIsFirstLogin(true);
            }
          } else if (!profile && !error) {
            console.log('AuthContext: No profile found for user, creating default user object');
            // Create a basic user object from session data if no profile exists
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
              followersCount: 0,
              followingCount: 0,
            };
            setUser(basicUser);
            console.log('AuthContext: Basic user set', basicUser);
          } else {
            console.error('AuthContext: Profile fetch failed', error);
          }
        } else {
          console.log('AuthContext: No session, clearing user');
          setUser(null);
        }
        
        console.log('AuthContext: Setting loading to false');
        setIsLoading(false);
      }
    );

    // Get initial session
    console.log('AuthContext: Getting initial session');
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('AuthContext: Initial session result', session?.user?.id);
      setSession(session);
      
      if (session?.user) {
        console.log('AuthContext: Getting initial profile for', session.user.id);
        // Get user profile from profiles table
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .maybeSingle()
          .then(({ data: profile, error }) => {
            console.log('AuthContext: Initial profile fetch result', { profile, error });
            if (profile && !error) {
              // Add backward compatibility properties
              const userWithCompat = {
                ...profile,
                avatar: profile.avatar_url,
                followersCount: 0, // Will be calculated from user_follows table later
                followingCount: 0, // Will be calculated from user_follows table later
              };
              setUser(userWithCompat);
              console.log('AuthContext: Initial user set', userWithCompat);
            } else if (!profile && !error) {
              console.log('AuthContext: No initial profile found, creating default user object');
              // Create a basic user object from session data if no profile exists
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
                followersCount: 0,
                followingCount: 0,
              };
              setUser(basicUser);
              console.log('AuthContext: Initial basic user set', basicUser);
            } else {
              console.error('AuthContext: Initial profile fetch failed', error);
            }
            console.log('AuthContext: Setting initial loading to false');
            setIsLoading(false);
          });
      } else {
        console.log('AuthContext: No initial session, setting loading to false');
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const clearAuth = () => {
    setUser(null);
    setSession(null);
  };

  return {
    user,
    session,
    isLoading,
    isFirstLogin,
    setIsFirstLogin,
    clearAuth,
  };
};