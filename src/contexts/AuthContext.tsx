
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
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        
        if (session?.user) {
          // Get user profile from profiles table
          const { data: profile, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile && !error) {
            // Add backward compatibility properties
            const userWithCompat = {
              ...profile,
              avatar: profile.avatar_url,
              followersCount: 0, // Will be calculated from user_follows table later
              followingCount: 0, // Will be calculated from user_follows table later
            };
            setUser(userWithCompat);
            
            // Check if this is a first login (profile created recently)
            const createdAt = new Date(profile.created_at);
            const now = new Date();
            const timeDiff = now.getTime() - createdAt.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);
            
            if (hoursDiff < 1 && profile.role === 'free') {
              setIsFirstLogin(true);
            }
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      
      if (session?.user) {
        // Get user profile from profiles table
        supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single()
          .then(({ data: profile, error }) => {
            if (profile && !error) {
              // Add backward compatibility properties
              const userWithCompat = {
                ...profile,
                avatar: profile.avatar_url,
                followersCount: 0, // Will be calculated from user_follows table later
                followingCount: 0, // Will be calculated from user_follows table later
              };
              setUser(userWithCompat);
            }
            setIsLoading(false);
          });
      } else {
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
