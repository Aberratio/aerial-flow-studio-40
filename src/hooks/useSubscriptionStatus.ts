import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionStatus {
  subscribed: boolean;
  subscription_tier: string | null;
  subscription_end: string | null;
}

export const useSubscriptionStatus = () => {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus>({
    subscribed: false,
    subscription_tier: null,
    subscription_end: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const checkSubscription = async () => {
    if (!user) {
      setSubscriptionStatus({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      
      setSubscriptionStatus(data);
    } catch (error) {
      console.error('Error checking subscription:', error);
      setSubscriptionStatus({
        subscribed: false,
        subscription_tier: null,
        subscription_end: null,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkSubscription();
  }, [user]);

  const hasPremiumAccess = subscriptionStatus.subscribed || 
    (user?.role && ['premium', 'trainer', 'admin'].includes(user.role));

  return {
    ...subscriptionStatus,
    isLoading,
    hasPremiumAccess,
    checkSubscription,
  };
};