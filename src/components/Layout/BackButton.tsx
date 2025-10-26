import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BackButtonProps {
  fallbackRoute?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ fallbackRoute = "/library" }) => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't show back button on main pages
  const mainPages = ["/", "/library", "/feed", "/challenges", "/profile", "/training", "/aerial-journey"];
  const isMainPage = mainPages.includes(location.pathname);

  if (isMainPage) {
    return null;
  }

  const handleBack = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallbackRoute);
    }
  };

  return (
    <Button
      onClick={handleBack}
      variant="ghost"
      size="sm"
      className="text-muted-foreground hover:text-white"
    >
      <ChevronLeft className="w-5 h-5" />
      <span className="ml-1">Wróć</span>
    </Button>
  );
};

export default BackButton;
