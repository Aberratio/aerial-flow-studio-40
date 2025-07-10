import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import PricingPlansModal from '@/components/PricingPlansModal';

interface PremiumRouteProps {
  children: React.ReactNode;
}

const PremiumRoute: React.FC<PremiumRouteProps> = ({ children }) => {
  const { user } = useAuth();
  
  // Check if user has premium access (role is premium, trainer, or admin)
  const hasPremiumAccess = user?.role && ['premium', 'trainer', 'admin'].includes(user.role);
  
  if (!hasPremiumAccess) {
    // Show pricing modal instead of the premium content
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-6">
        <PricingPlansModal 
          isOpen={true} 
          onClose={() => {
            // Redirect to feed when closing modal
            window.location.href = '/feed';
          }} 
        />
      </div>
    );
  }
  
  return <>{children}</>;
};

export default PremiumRoute;