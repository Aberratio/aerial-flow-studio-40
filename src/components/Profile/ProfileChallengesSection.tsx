import React from 'react';
import { Target, CheckCircle2, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { UserChallenge } from '@/hooks/useUserChallenges';

interface ProfileChallengesSectionProps {
  challenges: UserChallenge[];
  loading?: boolean;
  compact?: boolean;
}

const getDifficultyColor = (level: string | null) => {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    case 'intermediate':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
    case 'advanced':
      return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
    default:
      return 'bg-muted text-muted-foreground border-border';
  }
};

const getDifficultyLabel = (level: string | null) => {
  switch (level?.toLowerCase()) {
    case 'beginner':
      return 'Początkujący';
    case 'intermediate':
      return 'Średniozaawansowany';
    case 'advanced':
      return 'Zaawansowany';
    default:
      return level || 'Nieznany';
  }
};

const ChallengeCard: React.FC<{ challenge: UserChallenge; compact?: boolean }> = ({ challenge, compact }) => {
  const isCompleted = challenge.status === 'completed';
  
  return (
    <div className={`
      relative overflow-hidden rounded-xl border transition-all duration-300
      ${isCompleted 
        ? 'bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/30' 
        : 'bg-gradient-to-br from-purple-500/10 to-pink-500/5 border-purple-500/30 hover:border-purple-500/50'
      }
    `}>
      <div className={`flex ${compact ? 'p-3 gap-3' : 'p-4 gap-4'}`}>
        {/* Challenge Image */}
        <div className={`${compact ? 'w-14 h-14' : 'w-16 h-16'} rounded-lg overflow-hidden flex-shrink-0 bg-muted`}>
          {challenge.image_url ? (
            <img 
              src={challenge.image_url} 
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
          )}
        </div>

        {/* Challenge Info */}
        <div className="flex-1 min-w-0">
          <h4 className={`font-semibold text-foreground ${compact ? 'text-sm' : 'text-base'} line-clamp-2 leading-tight mb-1`}>
            {challenge.title}
          </h4>
          
          {/* Progress Bar */}
          <div className="mb-2">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-muted-foreground">
                Dzień {challenge.current_day} z {challenge.total_days}
              </span>
              <span className={`font-medium ${isCompleted ? 'text-emerald-400' : 'text-purple-400'}`}>
                {challenge.progress_percent}%
              </span>
            </div>
            <Progress 
              value={challenge.progress_percent} 
              className={`h-2 ${isCompleted ? '[&>div]:bg-emerald-500' : '[&>div]:bg-gradient-to-r [&>div]:from-purple-500 [&>div]:to-pink-500'}`}
            />
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            {isCompleted ? (
              <Badge variant="outline" className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                <CheckCircle2 className="w-3 h-3 mr-1" />
                Ukończone
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 text-xs">
                <Flame className="w-3 h-3 mr-1" />
                Aktywne
              </Badge>
            )}
            <Badge variant="outline" className={`text-xs ${getDifficultyColor(challenge.difficulty_level)}`}>
              {getDifficultyLabel(challenge.difficulty_level)}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ProfileChallengesSection: React.FC<ProfileChallengesSectionProps> = ({ 
  challenges, 
  loading,
  compact = false 
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="animate-pulse rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-lg bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-full" />
                <div className="h-5 bg-muted rounded w-1/3" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (challenges.length === 0) {
    return (
      <div className="text-center py-8">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
        <p className="text-muted-foreground text-sm">Brak wyzwań do wyświetlenia</p>
      </div>
    );
  }

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  return (
    <div className="space-y-4">
      {/* Active Challenges */}
      {activeChallenges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Flame className="w-4 h-4 text-purple-400" />
            <h4 className="text-sm font-medium text-foreground">Aktywne wyzwania</h4>
            <Badge variant="secondary" className="text-xs">{activeChallenges.length}</Badge>
          </div>
          <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {activeChallenges.slice(0, compact ? 3 : 4).map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} compact={compact} />
            ))}
          </div>
        </div>
      )}

      {/* Completed Challenges */}
      {completedChallenges.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <h4 className="text-sm font-medium text-foreground">Ukończone wyzwania</h4>
            <Badge variant="secondary" className="text-xs">{completedChallenges.length}</Badge>
          </div>
          <div className={`grid gap-3 ${compact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {completedChallenges.slice(0, compact ? 2 : 4).map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} compact={compact} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
