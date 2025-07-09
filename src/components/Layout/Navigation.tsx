
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, User, LogOut, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  const navItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/library', icon: BookOpen, label: 'Library' },
    { path: '/challenges', icon: Trophy, label: 'Challenges' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed left-0 top-0 h-full w-20 lg:w-64 glass-effect border-r border-white/10 z-50">
      <div className="flex flex-col h-full p-4">
        {/* Logo */}
        <Link to="/feed" className="flex items-center space-x-3 mb-8 group">
          <div className="w-10 h-10 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">A</span>
          </div>
          <span className="gradient-text font-bold text-xl hidden lg:block group-hover:scale-105 transition-transform">
            AerialFit
          </span>
        </Link>

        {/* Search */}
        <div className="mb-6 hidden lg:block">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-10 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="hidden lg:block font-medium group-hover:translate-x-1 transition-transform">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>

        {/* User Profile */}
        <div className="border-t border-white/10 pt-4">
          <div className="flex items-center space-x-3 px-3 py-2">
            <Avatar className="w-8 h-8">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500">
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="hidden lg:block flex-1">
              <p className="text-white font-medium text-sm">{user?.username}</p>
              <p className="text-muted-foreground text-xs">{user?.email}</p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="ghost"
            size="sm"
            className="w-full mt-2 text-muted-foreground hover:text-white justify-start"
          >
            <LogOut className="w-4 h-4 mr-3" />
            <span className="hidden lg:block">Logout</span>
          </Button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
