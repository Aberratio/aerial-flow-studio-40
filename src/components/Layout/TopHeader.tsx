import React from "react";
import { Link } from "react-router-dom";
import ProfileAvatar from "./ProfileAvatar";

const TopHeader: React.FC = () => {
  return (
    <header className="w-full bg-gradient-to-b from-background to-transparent border-b border-white/5">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/library" className="flex items-center space-x-2">
          <img 
            src="/iguana-logo.svg" 
            alt="IguanaFlow" 
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-white">
            IguanaFlow
          </span>
        </Link>

        {/* Right side - Profile Avatar */}
        <div className="flex items-center space-x-4">
          <ProfileAvatar />
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
