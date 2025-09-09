import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { useUserAchievements } from '@/hooks/useUserAchievements';

export const AchievementsSection: React.FC = () => {
  const { achievements, loading: achievementsLoading } = useUserAchievements();

  return (
    <Card className="glass-effect border-white/10 mb-6">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Recent Achievements</h2>
        </div>
        {achievementsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading achievements...</div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No achievements earned yet!</p>
            <p className="text-sm mt-2">Start training to unlock your first achievement</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.slice(0, 4).map((achievement, index) => (
              <div 
                key={index} 
                className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group relative"
                title={achievement.description}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className="text-white font-semibold text-sm">{achievement.name}</div>
                <div className="text-purple-400 text-xs font-semibold mt-1">+{achievement.points} pts</div>
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-800 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {achievement.description}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};