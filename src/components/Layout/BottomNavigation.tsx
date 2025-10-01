import React from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Library, MessageSquare, Trophy, GraduationCap } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserRole } from "@/hooks/useUserRole";
import { cn } from "@/lib/utils";

const BottomNavigation: React.FC = () => {
  const isMobile = useIsMobile();
  const { isAdmin, isTrainer } = useUserRole();
  const location = useLocation();

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
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-white/10">
      <div className="flex justify-around items-center h-16 max-w-screen-xl mx-auto px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center justify-center flex-1 h-full transition-colors relative",
              isActive(item.path)
                ? "text-primary"
                : "text-muted-foreground hover:text-white"
            )}
          >
            {/* Active indicator */}
            {isActive(item.path) && (
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full" />
            )}
            
            <item.icon className="w-6 h-6 mb-1" />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
