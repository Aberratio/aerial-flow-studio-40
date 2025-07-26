import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import PricingPlansModal from "@/components/PricingPlansModal";

interface PremiumRouteProps {
  children: React.ReactNode;
}

const PremiumRoute: React.FC<PremiumRouteProps> = ({ children }) => {
  const { user } = useAuth();
  const { hasPremiumAccess, isLoading } = useSubscriptionStatus();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!hasPremiumAccess) {
    // Show pricing modal instead of the premium content
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center p-6">
        <PricingPlansModal
          isOpen={true}
          onClose={() => {
            // Redirect to feed when closing modal
            window.location.href = "/feed";
          }}
        />
      </div>
    );
  }

  return <>{children}</>;
};

export default PremiumRoute;
