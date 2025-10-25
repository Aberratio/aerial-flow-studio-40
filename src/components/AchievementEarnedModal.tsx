import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Trophy, Star, Gift } from 'lucide-react';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface AchievementEarnedModalProps {
  achievement: Achievement | null;
  isOpen: boolean;
  onClose: () => void;
}

export const AchievementEarnedModal = ({ achievement, isOpen, onClose }: AchievementEarnedModalProps) => {
  if (!achievement) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
            Osiągnięcie Odblokowane!
          </DialogTitle>
          <DialogDescription className="text-base">
            Gratulacje! Zdobyłeś nowe osiągnięcie.
          </DialogDescription>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-6 border border-yellow-200 dark:border-yellow-800">
            <div className="text-4xl mb-3">{achievement.icon}</div>
            <h3 className="text-xl font-bold text-foreground mb-2">{achievement.name}</h3>
            <p className="text-muted-foreground mb-3">{achievement.description}</p>
            <Badge className="bg-gradient-to-r from-yellow-600 to-orange-600 text-white">
              <Star className="w-3 h-3 mr-1" />
              {achievement.points} pkt
            </Badge>
          </div>
          
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Gift className="w-4 h-4" />
            <span>Twoje punkty zostały zaktualizowane!</span>
          </div>
        </div>
        
        <div className="mt-6">
          <Button onClick={onClose} className="w-full bg-gradient-to-r from-yellow-600 to-orange-600 hover:from-yellow-700 hover:to-orange-700">
            Super!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};