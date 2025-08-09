import React from 'react';

const LandingPageManagement = () => {
  console.log('LandingPageManagement: Component loading...');
  
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Landing Page Management</h1>
            <p className="text-white/60 mt-2">
              Basic component loaded successfully
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageManagement;