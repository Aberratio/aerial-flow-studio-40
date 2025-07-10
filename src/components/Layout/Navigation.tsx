import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, BookOpen, Trophy, User, LogOut, Mail, Users, Dumbbell, Settings, Crown, Lock } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Navigation = () => {
  const location = useLocation();
  const { user, logout } = useAuth();

  // Check if user has premium access
  const hasPremiumAccess = user?.role && ['premium', 'trainer', 'admin'].includes(user.role);

  const freeNavItems = [
    { path: '/feed', icon: Home, label: 'Feed' },
    { path: '/friends', icon: Users, label: 'Friends' },
    { path: '/profile', icon: User, label: 'Profile' },
    { path: '/inbox', icon: Mail, label: 'Inbox' },
  ];

  const premiumNavItems = [
    { path: '/library', icon: BookOpen, label: 'Library', premium: true },
    { path: '/challenges', icon: Trophy, label: 'Challenges', premium: true },
    { path: '/training', icon: Dumbbell, label: 'Training', premium: true },
  ];

  // Admin-only items
  const adminItems = user?.role === 'admin' ? [
    { path: '/admin/achievements', icon: Settings, label: 'Achievements' },
  ] : [];

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
            AerialJourney
          </span>
        </Link>

        {/* Free Navigation Items */}
        <div className="flex-1 space-y-2">
          {freeNavItems.map((item) => {
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
                <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                <span className="hidden lg:block font-medium">{item.label}</span>
              </Link>
            );
          })}

          {/* Premium Section */}
          <div className="hidden lg:block border-t border-white/10 my-4"></div>
          <div className="flex items-center space-x-2 px-3 mb-2">
            <Crown className="w-4 h-4 text-yellow-400" />
            <span className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Premium
            </span>
            {!hasPremiumAccess && (
              <Badge className="hidden lg:block bg-yellow-500/20 text-yellow-400 text-xs">
                Upgrade
              </Badge>
            )}
          </div>
          
          {premiumNavItems.map((item) => {
            const Icon = item.icon;
            const isDisabled = !hasPremiumAccess;
            
            return (
              <Link
                key={item.path}
                to={isDisabled ? '/pricing' : item.path}
                className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition-all group relative ${
                  isActive(item.path) && !isDisabled
                    ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white'
                    : isDisabled
                    ? 'text-muted-foreground/50 cursor-not-allowed'
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${!isDisabled ? 'group-hover:scale-110' : ''} transition-transform`} />
                <span className="hidden lg:block font-medium">{item.label}</span>
                {isDisabled && (
                  <Lock className="w-3 h-3 hidden lg:block ml-auto text-muted-foreground/50" />
                )}
              </Link>
            );
          })}

          {/* Admin Section */}
          {adminItems.length > 0 && (
            <>
              <div className="hidden lg:block border-t border-white/10 my-4"></div>
              <div className="hidden lg:block text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2">
                Admin
              </div>
              {adminItems.map((item) => {
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
                    <Icon className="w-5 h-5 flex-shrink-0 group-hover:scale-110 transition-transform" />
                    <span className="hidden lg:block font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </>
          )}
        </div>

        {/* Footer Links */}
        <div className="mt-auto mb-4 space-y-2">
          <Link
            to="/privacy-policy"
            className="flex items-center justify-center text-xs text-muted-foreground hover:text-white transition-colors"
          >
            Privacy Policy
          </Link>
          <Link
            to="/terms-of-use"
            className="flex items-center justify-center text-xs text-muted-foreground hover:text-white transition-colors"
          >
            Terms of Use
          </Link>
          <Link
            to="/about"
            className="flex items-center justify-center text-xs text-muted-foreground hover:text-white transition-colors"
          >
            About Us
          </Link>
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