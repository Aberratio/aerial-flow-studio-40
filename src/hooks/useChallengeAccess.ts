import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "./useSubscriptionStatus";

export const useChallengeAccess = (challengeId?: string) => {
  const [userPurchases, setUserPurchases] = useState<Record<string, boolean>>(
    {}
  );
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { hasPremiumAccess } = useSubscriptionStatus();

  const checkChallengeAccess = async (cId?: string) => {
    if (!user || !cId) return false;

    // If user has premium subscription, they have access to all challenges
    if (hasPremiumAccess) return true;

    // Check if user purchased this specific challenge
    return userPurchases[cId] || false;
  };

  const fetchUserPurchases = async () => {
    if (!user) {
      setUserPurchases({});
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("user_challenge_purchases")
        .select("challenge_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const purchasesMap = data.reduce((acc, purchase) => {
        acc[purchase.challenge_id] = true;
        return acc;
      }, {} as Record<string, boolean>);

      setUserPurchases(purchasesMap);
    } catch (error) {
      console.error("Error fetching user purchases:", error);
      setUserPurchases({});
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPurchases();
  }, [user]);

  const hasAccessToChallenge = async (cId: string) => {
    return await checkChallengeAccess(cId);
  };

  const refreshPurchases = useCallback(async () => {
    await fetchUserPurchases();
  }, [user]);

  return {
    userPurchases,
    isLoading,
    hasAccessToChallenge,
    checkChallengeAccess,
    refreshPurchases,
  };
};
