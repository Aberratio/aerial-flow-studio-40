import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';
import { pl } from 'date-fns/locale';

interface ProfilePreviewAchievementsProps {
  achievements: any[];
}

export const ProfilePreviewAchievements = ({ achievements }: ProfilePreviewAchievementsProps) => {
  if (achievements.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">Ostatnie osiągnięcia</h3>
      <div className="grid grid-cols-2 gap-3">
        {achievements.map((achievement) => (
          <Card key={achievement.id} className="glass-effect border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center space-x-2">
                <span className="text-2xl">{achievement.achievements.icon}</span>
                <div>
                  <p className="font-medium text-white text-sm">{achievement.achievements.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(achievement.earned_at), { addSuffix: true, locale: pl })}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
