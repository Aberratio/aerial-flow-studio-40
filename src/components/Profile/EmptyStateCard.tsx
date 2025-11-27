import React from 'react';
import { Button } from '@/components/ui/button';
import { LucideIcon } from 'lucide-react';

interface EmptyStateCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  iconColor?: string;
}

export const EmptyStateCard = ({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  iconColor = 'text-purple-400',
}: EmptyStateCardProps) => {
  return (
    <div className="text-center py-12">
      <div className={`w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center`}>
        <Icon className={`w-10 h-10 sm:w-12 sm:h-12 ${iconColor}`} />
      </div>
      <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
        {title}
      </h3>
      <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm mx-auto px-4">
        {description}
      </p>
      <Button 
        onClick={onAction}
        className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
      >
        {actionLabel}
      </Button>
    </div>
  );
};
