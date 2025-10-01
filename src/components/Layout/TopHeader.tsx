import React from "react";
import { Link } from "react-router-dom";

const TopHeader: React.FC = () => {
  return (
    <header className="w-full bg-gradient-to-b from-background to-transparent border-b border-white/5">
      <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link to="/home" className="flex items-center space-x-2">
          <img 
            src="/iguana-logo.svg" 
            alt="IguanaFlow" 
            className="h-8 w-8"
          />
          <span className="text-xl font-bold text-white hidden sm:inline">
            IguanaFlow
          </span>
        </Link>

        {/* Right side - placeholder for future features */}
        <div className="flex items-center space-x-4">
          {/* Reserved for notifications, search, etc. */}
        </div>
      </div>
    </header>
  );
};

export default TopHeader;
