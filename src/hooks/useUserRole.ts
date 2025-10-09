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
        // Fetch from user_roles table (security definer protected)
        const { data, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .single();

        if (error) {
          // Fallback to profiles for backward compatibility
          const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();
          
          setUserRole(profileData?.role || null);
        } else {
          setUserRole(data?.role || null);
        }
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