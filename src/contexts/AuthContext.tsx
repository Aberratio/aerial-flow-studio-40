
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  email: string;
  username: string;
  avatar_url?: string;
  bio?: string;
  role: 'free' | 'premium' | 'trainer' | 'admin';
  created_at: string;
  updated_at: string;
  // Computed properties for backward compatibility
  avatar?: string;
  followersCount?: number;
  followingCount?: number;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  isFirstLogin: boolean;
  setIsFirstLogin: (value: boolean) => void;
  // Backward compatibility
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
            .eq('id', session.user.id);

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

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }
  };

  const signUp = async (email: string, password: string, username: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          username: username,
        },
      },
    });

    if (error) {
      throw error;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      throw error;
    }
    setUser(null);
    setSession(null);
  };

  // For backward compatibility with existing code
  const login = signIn;
  const register = signUp;
  const logout = signOut;

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signIn, 
      signUp, 
      signOut, 
      isLoading, 
      isFirstLogin, 
      setIsFirstLogin,
      // Backward compatibility
      login,
      register,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
