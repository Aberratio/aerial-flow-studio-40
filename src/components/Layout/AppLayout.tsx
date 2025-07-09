
import React from 'react';
import Navigation from './Navigation';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <Navigation />
      <main className="ml-20 lg:ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
