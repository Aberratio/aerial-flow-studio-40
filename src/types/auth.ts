import type { Session } from '@supabase/supabase-js';

export interface User {
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

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
  refetchCounts: () => void;
  refreshUser: () => Promise<void>;
  // Backward compatibility
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  // Admin impersonation
  impersonateUser: (userId: string) => Promise<void>;
  exitImpersonation: () => Promise<void>;
  isImpersonating: boolean;
  originalAdminUser: User | null;
}