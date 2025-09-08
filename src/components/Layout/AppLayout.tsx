import React, { useState, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import Navigation from "./Navigation";
import { useAuth } from "@/contexts/AuthContext";
import { ImpersonationBanner } from "@/components/ImpersonationBanner";

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { user, isImpersonating } = useAuth();

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobile && sidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isMobile, sidebarOpen]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10">
      {/* Impersonation banner */}
      <ImpersonationBanner />
      
      {/* Mobile Menu Button */}
      {isMobile && (
        <Button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className={`fixed ${isImpersonating ? 'top-16' : 'top-4'} left-4 z-[70]`}
          variant="primary"
          size="sm"
        >
          {sidebarOpen ? (
            <X className="w-4 h-4" />
          ) : (
            <Menu className="w-4 h-4" />
          )}
        </Button>
      )}

      {/* Mobile Overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Navigation isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <main
        className={`${
          isMobile 
            ? `ml-0 ${isImpersonating ? 'pt-26' : 'pt-14'}` 
            : `ml-20 lg:ml-64 ${isImpersonating ? 'pt-12' : ''}`
        } min-h-screen transition-all duration-300`}
      >
        {children}
      </main>
    </div>
  );
};

export default AppLayout;
