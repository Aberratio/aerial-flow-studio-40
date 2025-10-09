import React, { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Library, MessageSquare, Trophy, GraduationCap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";
import ProfileAvatar from "./ProfileAvatar";
import { AdminDropdown } from "./AdminDropdown";
import { AdminUserImpersonationModal } from "@/components/AdminUserImpersonationModal";

const TopHeader: React.FC = () => {
  const isMobile = useIsMobile();
  const { isAdmin, isTrainer } = useUserRole();
  const location = useLocation();
  const [isImpersonateModalOpen, setIsImpersonateModalOpen] = useState(false);

  const navItems = [
    { path: "/library", icon: Library, label: "Library" },
    { path: "/feed", icon: MessageSquare, label: "Feed" },
    { path: "/challenges", icon: Trophy, label: "Challenges" },
  ];

  // Add Training for admins/trainers
  if (isAdmin || isTrainer) {
    navItems.splice(1, 0, { path: "/training", icon: GraduationCap, label: "Training" });
  }

  const isActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur-lg border-b border-white/10">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <NavLink to="/library" className="flex items-center space-x-2">
          <img 
            src="/iguana-logo.svg" 
            alt="IguanaFlow" 
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-white">
            IguanaFlow
          </span>
        </NavLink>

        {/* Desktop Navigation */}
        {!isMobile && (
          <nav className="flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors",
                  isActive(item.path)
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </nav>
        )}

        {/* Right side - Admin & Profile */}
        <div className="flex items-center space-x-2">
          {isAdmin && (
            <AdminDropdown onImpersonateClick={() => setIsImpersonateModalOpen(true)} />
          )}
          <ProfileAvatar />
        </div>
      </div>

      <AdminUserImpersonationModal
        isOpen={isImpersonateModalOpen}
        onClose={() => setIsImpersonateModalOpen(false)}
      />
    </header>
  );
};

export default TopHeader;
