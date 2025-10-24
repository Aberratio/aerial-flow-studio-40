import { useAuth } from '@/contexts/AuthContext';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';

export const useCanAccessTraining = (isPremium: boolean) => {
  const { user } = useAuth();
  const { hasPremiumAccess } = useSubscriptionStatus();

  const canAccess = !isPremium || hasPremiumAccess;
  
  return { canAccess, isPremiumUser: hasPremiumAccess };
};
