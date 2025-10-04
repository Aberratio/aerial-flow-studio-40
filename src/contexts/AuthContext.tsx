import React, { createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from '@/hooks/useAuthState';
import { useAuthOperations } from '@/hooks/useAuthOperations';
import type { AuthContextType } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();
  const { 
    user, 
    session, 
    isLoading, 
    clearAuth, 
    refetchCounts, 
    refreshUser, 
    impersonateUser, 
    exitImpersonation, 
    isImpersonating, 
    originalAdminUser 
  } = useAuthState();
  const { signIn, signUp, signOut, login, register, logout } = useAuthOperations();

  const handleSignOut = async () => {
    try {
      console.log('AuthContext: Starting sign out');
      await signOut();
      // Don't call clearAuth() - let onAuthStateChange handle it
      console.log('AuthContext: Sign out complete');
      navigate('/');
    } catch (error) {
      console.error('AuthContext: Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signIn, 
      signUp, 
      signOut: handleSignOut, 
      isLoading, 
      refetchCounts,
      refreshUser,
      // Backward compatibility
      login,
      register,
      logout: handleSignOut,
      // Admin impersonation
      impersonateUser,
      exitImpersonation,
      isImpersonating,
      originalAdminUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};