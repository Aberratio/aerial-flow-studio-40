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
  const { user, session, isLoading, clearAuth, refetchCounts, refreshUser } = useAuthState();
  const { signIn, signUp, signOut, login, register, logout } = useAuthOperations();

  const handleSignOut = async () => {
    await signOut();
    clearAuth();
    navigate('/');
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
      logout: handleSignOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};