import React from 'react';
import { useNavigate } from 'react-router-dom';
import PricingPlansModal from '@/components/PricingPlansModal';

const PricingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-6">
      <PricingPlansModal 
        isOpen={true} 
        onClose={() => navigate('/feed')} 
      />
    </div>
  );
};

export default PricingPage;