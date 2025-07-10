import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { PricingModal } from './PricingModal';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

interface ProfileUpgradeWrapperProps {
  children: React.ReactNode;
}

export const ProfileUpgradeWrapper = ({ children }: ProfileUpgradeWrapperProps) => {
  const { user, isFirstLogin, setIsFirstLogin } = useAuth();
  const { toast } = useToast();
  const { hasPremiumAccess } = useSubscriptionStatus();

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
    // Mark that pricing modal was shown to this user
    if (user?.id) {
      localStorage.setItem(`pricing_shown_${user.id}`, 'true');
    }
  };

  return (
    <>
      {children}
      <PricingModal
        isOpen={isFirstLogin && !hasPremiumAccess}
        onClose={handleClose}
        onUpgrade={handleUpgrade}
      />
    </>
  );
};