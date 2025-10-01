import React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";
import TopHeader from "./TopHeader";
import BottomNavigation from "./BottomNavigation";
import BackButton from "./BackButton";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const isMobile = useIsMobile();
  const { isImpersonating } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex flex-col">
      {/* Impersonation banner */}
      <ImpersonationBanner />
      
      {/* Top Header */}
      <TopHeader />
      
      {/* Main Content */}
      <main className={`flex-1 ${isImpersonating ? 'pt-2' : ''} pb-20`}>
        {/* Back Button Container */}
        <div className="max-w-screen-xl mx-auto px-4 pt-4">
          <BackButton />
        </div>
        
        {children}
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  );
};

export default AppLayout;
