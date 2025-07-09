import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PricingModal } from './PricingModal';
import { useToast } from '@/hooks/use-toast';

interface ProfileUpgradeWrapperProps {
  children: React.ReactNode;
}

export const ProfileUpgradeWrapper = ({ children }: ProfileUpgradeWrapperProps) => {
  const { user, isFirstLogin, setIsFirstLogin } = useAuth();
  const { toast } = useToast();

  const handleUpgrade = () => {
    // TODO: Implement actual payment logic
    toast({
      title: "Upgrade Coming Soon",
      description: "Payment integration will be available soon!",
    });
    setIsFirstLogin(false);
  };

  const handleClose = () => {
    setIsFirstLogin(false);
  };

  return (
    <>
      {children}
      <PricingModal
        isOpen={isFirstLogin && user?.role === 'free'}
        onClose={handleClose}
        onUpgrade={handleUpgrade}
      />
    </>
  );
};