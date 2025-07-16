import React, { createContext, useContext } from 'react';
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
  const { user, session, isLoading, isFirstLogin, setIsFirstLogin, showIntroModal, setShowIntroModal, markIntroAsComplete, clearAuth, refetchCounts, refreshUser } = useAuthState();
  const { signIn, signUp, signOut, login, register, logout } = useAuthOperations();

  const handleSignOut = async () => {
    await signOut();
    clearAuth();
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      signIn, 
      signUp, 
      signOut: handleSignOut, 
      isLoading, 
      isFirstLogin, 
      setIsFirstLogin,
      showIntroModal,
      setShowIntroModal,
      markIntroAsComplete,
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