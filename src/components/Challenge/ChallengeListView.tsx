import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Crown,
  Clock,
  TrendingUp,
  MoreVertical,
  Eye,
  Play,
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LazyImage } from "@/components/LazyImage";
import { useIsMobile } from "@/hooks/use-mobile";
import { useNavigate } from "react-router-dom";
import { useDictionary } from "@/contexts/DictionaryContext";

interface Challenge {
  id: string;
  title: string;
  description: string;
  level?: number;
  status: string;
  created_by: string;
  premium: boolean;
  price_usd: number;
  price_pln: number;
  duration: number;
  participants: number;
  difficulty: string;
  userProgress: number;
  image: string;
  userParticipating: boolean;
  created_at: string;
  updated_at?: string;
  series_name?: string;
  series_order?: number;
  is_new?: boolean;
  completedCycles?: number;
  start_date?: string;
  end_date?: string;
  category?: string;
}

interface ChallengeListViewProps {
  challenges: Challenge[];
  onChallengeClick: (challenge: Challenge) => void;
  onPurchase: (challenge: Challenge) => void;
  onJoinChallenge: (challengeId: string) => void;
  getDifficultyColor: (difficulty: string) => string;
  getButtonText: (status: string) => string;
  userPurchases: Record<string, boolean>;
  hasPremiumAccess: boolean;
}

export const ChallengeListView: React.FC<ChallengeListViewProps> = ({
  challenges,
  onChallengeClick,
  onPurchase,
  onJoinChallenge,
  getDifficultyColor,
  getButtonText,
  userPurchases,
  hasPremiumAccess,
}) => {
  const isMobile = useIsMobile();
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {challenges.map((challenge) => {
        const isPremiumLocked =
          challenge.premium &&
          !hasPremiumAccess &&
          !userPurchases[challenge.id];

        return (
          <Card
            key={challenge.id}
            className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer group overflow-hidden"
            onClick={() => onChallengeClick(challenge)}
          >
            <CardContent className="p-3 md:p-4">
              <div className="flex gap-3 md:gap-4">
                {/* Thumbnail - kwadrat 80x80 / 96x96 */}
                <div className="relative w-20 h-20 md:w-24 md:h-24 flex-shrink-0 rounded-lg overflow-hidden">
                  {challenge.image ? (
                    <LazyImage
                      src={challenge.image}
                      alt={challenge.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                      skeletonClassName="w-full h-full rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center rounded-lg">
                      <span className="text-3xl">🏆</span>
                    </div>
                  )}

                  {/* Premium badge overlay */}
                  {isPremiumLocked && (
                    <div className="absolute top-1 right-1">
                      <Badge className="bg-yellow-500/90 text-xs backdrop-blur-sm">
                        <Crown className="w-2.5 h-2.5 mr-1" />
                        Premium
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  {/* Top section */}
                  <div>
                    <h3 className="text-white font-semibold text-sm md:text-base leading-tight line-clamp-1 mb-1">
                      {challenge.title}
                    </h3>
                    <p className="text-xs text-white/60 line-clamp-1 mb-2">
                      {challenge.description}
                    </p>

                    {/* Meta - jedna linia z kompaktnymi info */}
                    <div className="flex items-center gap-2 flex-wrap text-xs mb-2">
                      <div className="flex items-center gap-1 text-white/60">
                        <Clock className="w-3 h-3" />
                        <span>{challenge.duration} dni</span>
                      </div>
                      {challenge.level && (
                        <div className="flex items-center gap-1 text-white/60">
                          <TrendingUp className="w-3 h-3" />
                          <span className="hidden sm:inline">Poz. </span>
                          <span>{challenge.level}</span>
                        </div>
                      )}
                      <Badge
                        variant="outline"
                        className={`${getDifficultyColor(
                          challenge.difficulty
                        )} text-xs`}
                      >
                        <span className="sm:hidden">
                          {challenge.difficulty}
                        </span>
                        <span className="hidden sm:inline">
                          {challenge.difficulty}
                        </span>
                      </Badge>
                    </div>
                  </div>

                  {/* Progress */}
                  {challenge.userParticipating && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">Postęp</span>
                        <span className="text-white/80">
                          {challenge.userProgress}%
                        </span>
                      </div>
                      <Progress
                        value={challenge.userProgress}
                        className="h-1.5"
                      />
                      {challenge.completedCycles &&
                      challenge.completedCycles > 1 ? (
                        <p className="text-xs text-white/50 mt-1">
                          Cykle: {challenge.completedCycles}
                        </p>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Actions - mobile: dropdown, desktop: buttons */}
                <div className="flex-shrink-0 flex flex-col justify-center gap-2">
                  {!isMobile ? (
                    <>
                      {!challenge.userParticipating && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            onChallengeClick(challenge);
                          }}
                          className="whitespace-nowrap"
                        >
                          <Eye className="w-3 h-3 mr-1" />
                          Szczegóły
                        </Button>
                      )}
                      <Button
                        size="sm"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (isPremiumLocked) {
                            onPurchase(challenge);
                          } else if (challenge.status === "active") {
                            navigate(`/challenges/${challenge.id}`);
                          } else if (challenge.status === "completed") {
                            onChallengeClick(challenge);
                          } else {
                            await onJoinChallenge(challenge.id);
                          }
                        }}
                        className="whitespace-nowrap"
                      >
                        {isPremiumLocked && <Crown className="w-3 h-3 mr-1" />}
                        {!isPremiumLocked && <Play className="w-3 h-3 mr-1" />}
                        {isPremiumLocked
                          ? "Wykup"
                          : getButtonText(challenge.status)}
                      </Button>
                    </>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-white/20 rounded-full"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="w-4 h-4 text-white/60" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="bg-slate-900/95 border-white/20"
                      >
                        {!challenge.userParticipating && (
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onChallengeClick(challenge);
                            }}
                            className="text-blue-400"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            Szczegóły
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (isPremiumLocked) {
                              onPurchase(challenge);
                            } else if (challenge.status === "active") {
                              navigate(`/challenges/${challenge.id}`);
                            } else if (challenge.status === "completed") {
                              onChallengeClick(challenge);
                            } else {
                              await onJoinChallenge(challenge.id);
                            }
                          }}
                          className={
                            isPremiumLocked
                              ? "text-yellow-400"
                              : "text-green-400"
                          }
                        >
                          {isPremiumLocked ? (
                            <Crown className="w-4 h-4 mr-2" />
                          ) : (
                            <Play className="w-4 h-4 mr-2" />
                          )}
                          {isPremiumLocked
                            ? "Wykup"
                            : getButtonText(challenge.status)}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
