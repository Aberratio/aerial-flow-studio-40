import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronDown, ChevronUp, Clock, TrendingUp, Lock, Crown } from 'lucide-react';
import { AspectRatio } from '@/components/ui/aspect-ratio';

interface Challenge {
  id: string;
  title: string;
  description: string;
  level?: number;
  status: string;
  premium: boolean;
  duration: number;
  difficulty: string;
  userProgress: number;
  image: string;
  completedCycles?: number;
}

interface ChallengePathCardProps {
  seriesName: string;
  challenges: Challenge[];
  onChallengeClick: (challenge: Challenge) => void;
  onJoinChallenge: (challengeId: string) => void;
  hasAccess: boolean;
}

const ChallengePathCard = ({
  seriesName,
  challenges,
  onChallengeClick,
  onJoinChallenge,
  hasAccess,
}: ChallengePathCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Oblicz ukończone poziomy
  const completedLevels = challenges.filter(c => c.status === 'completed').length;
  const totalLevels = challenges.length;
  const progressPercentage = Math.round((completedLevels / totalLevels) * 100);

  // Sprawdź czy któryś poziom jest aktywny
  const hasActiveLevel = challenges.some(c => c.status === 'active');
  const isPremium = challenges.some(c => c.premium);
  const isNew = false; // TODO: Dodać logikę sprawdzania is_new

  // Główne CTA
  const mainCTAText = hasActiveLevel ? 'Kontynuuj' : 'Rozpocznij';

  // Miniatura pierwszego wyzwania
  const thumbnail = challenges[0]?.image || '';

  return (
    <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 relative group">
      {/* Premium Overlay */}
      {isPremium && !hasAccess && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="text-center space-y-4">
            <Lock className="w-12 h-12 mx-auto text-primary" />
            <div>
              <Badge variant="default" className="mb-2">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
              <p className="text-sm text-muted-foreground">Ta ścieżka wymaga dostępu Premium</p>
            </div>
            <Button variant="default" size="sm">
              Odblokuj Premium
            </Button>
          </div>
        </div>
      )}

      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Thumbnail */}
          <div className="relative overflow-hidden rounded-lg">
            <AspectRatio ratio={16 / 9}>
              <img
                src={thumbnail}
                alt={seriesName}
                className="object-cover w-full h-full"
              />
            </AspectRatio>
            {isPremium && hasAccess && (
              <Badge variant="default" className="absolute top-2 right-2">
                <Crown className="w-3 h-3 mr-1" />
                Premium
              </Badge>
            )}
            {isNew && (
              <Badge variant="secondary" className="absolute top-2 left-2">
                Nowe
              </Badge>
            )}
          </div>

          {/* Title & Description */}
          <div>
            <h3 className="text-lg font-semibold mb-1">{seriesName}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {challenges[0]?.description}
            </p>
          </div>

          {/* Progress Ring */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    className="text-muted"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 28}`}
                    strokeDashoffset={`${2 * Math.PI * 28 * (1 - progressPercentage / 100)}`}
                    className="text-primary transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-bold">
                    {completedLevels}/{totalLevels}
                  </span>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium">Postęp ścieżki</p>
                <p className="text-xs text-muted-foreground">
                  {completedLevels} z {totalLevels} poziomów
                </p>
              </div>
            </div>

            {/* Main CTA */}
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                const nextChallenge = hasActiveLevel
                  ? challenges.find(c => c.status === 'active')
                  : challenges.find(c => c.status === 'not-started') || challenges[0];
                if (nextChallenge) {
                  onJoinChallenge(nextChallenge.id);
                }
              }}
              disabled={isPremium && !hasAccess}
            >
              {mainCTAText}
            </Button>
          </div>

          {/* Collapsible Levels List */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full">
                {isOpen ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Ukryj poziomy
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Pokaż poziomy ({totalLevels})
                  </>
                )}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-2 mt-2">
              {challenges.map((challenge, index) => (
                <div
                  key={challenge.id}
                  className="flex items-center gap-3 p-2 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold">Poziom {challenge.level || index + 1}</span>
                      <Badge variant="outline" className="text-xs">
                        {challenge.difficulty}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {challenge.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{challenge.duration} dni</span>
                    </div>
                    {challenge.status !== 'not-started' && (
                      <Progress value={challenge.userProgress} className="h-1 mt-1" />
                    )}
                  </div>
                  <Button
                    variant={challenge.status === 'active' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      if (challenge.status === 'completed') {
                        onChallengeClick(challenge);
                      } else {
                        onJoinChallenge(challenge.id);
                      }
                    }}
                  >
                    {challenge.status === 'not-started' && 'Start'}
                    {challenge.status === 'active' && 'Kontynuuj'}
                    {challenge.status === 'completed' && 'Wyniki'}
                  </Button>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengePathCard;
