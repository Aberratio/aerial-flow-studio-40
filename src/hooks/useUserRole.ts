import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useUserRole = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setUserRole(null);
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (error) throw error;
        setUserRole(data?.role || null);
      } catch (error) {
        console.error('Error fetching user role:', error);
        setUserRole(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  const isTrainer = userRole === 'trainer';
  const isAdmin = userRole === 'admin';
  const isPremium = userRole === 'premium';
  const isFree = userRole === 'free';
  const canCreateChallenges = isTrainer || isAdmin;
  const canAccessLibrary = isPremium || isTrainer || isAdmin;

  return {
    userRole,
    isLoading,
    isTrainer,
    isAdmin,
    isPremium,
    isFree,
    canCreateChallenges,
    canAccessLibrary
  };
};