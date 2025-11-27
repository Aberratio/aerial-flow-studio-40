import React from 'react';
import { Card } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Camera, Users, Dumbbell, BookOpen } from 'lucide-react';

interface QuickActionCardProps {
  icon: React.ReactNode;
  label: string;
  href: string;
  onClick?: () => void;
}

const QuickActionCard = ({ icon, label, href, onClick }: QuickActionCardProps) => {
  const content = (
    <Card className="group cursor-pointer bg-white/5 hover:bg-gradient-to-br hover:from-purple-500/20 hover:to-pink-500/20 border-white/10 hover:border-purple-500/30 transition-all duration-300 hover:scale-105">
      <div className="p-4 text-center">
        <div className="flex items-center justify-center mb-2 text-3xl">
          {icon}
        </div>
        <p className="text-xs sm:text-sm font-medium text-white">{label}</p>
      </div>
    </Card>
  );

  if (onClick) {
    return <div onClick={onClick}>{content}</div>;
  }

  return <Link to={href}>{content}</Link>;
};

interface QuickActionsProps {
  onInviteFriends: () => void;
}

export const QuickActions = ({ onInviteFriends }: QuickActionsProps) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <QuickActionCard 
        icon={<Camera className="w-6 h-6 text-purple-400" />}
        label="Dodaj post" 
        href="/feed" 
      />
      <QuickActionCard 
        icon={<Users className="w-6 h-6 text-pink-400" />}
        label="Znajdź znajomych" 
        href="/feed"
        onClick={onInviteFriends}
      />
      <QuickActionCard 
        icon={<Dumbbell className="w-6 h-6 text-blue-400" />}
        label="Rozpocznij trening" 
        href="/challenges" 
      />
      <QuickActionCard 
        icon={<BookOpen className="w-6 h-6 text-green-400" />}
        label="Przeglądaj bibliotekę" 
        href="/library" 
      />
    </div>
  );
};
