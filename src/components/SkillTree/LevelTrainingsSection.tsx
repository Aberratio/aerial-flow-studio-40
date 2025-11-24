import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Play, CheckCircle, Lock } from "lucide-react";
import { useLevelTrainings } from "@/hooks/useLevelTrainings";
import { useNavigate } from "react-router-dom";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface LevelTrainingsSectionProps {
  levelId: string;
  sportCategory: string;
  isLevelUnlocked: boolean;
}

export default function LevelTrainingsSection({ levelId, sportCategory, isLevelUnlocked }: LevelTrainingsSectionProps) {
  const navigate = useNavigate();
  const { hasPremiumAccess } = useSubscriptionStatus();
  const { levelTrainings, isTrainingCompleted, isLoading } = useLevelTrainings(levelId);

  if (isLoading || levelTrainings.length === 0) return null;

  const handleStartTraining = (trainingId: string) => {
    navigate(`/training/library/session/${trainingId}?from=level&levelId=${levelId}&sportCategory=${sportCategory}`);
  };

  return (
    <div className="mt-6 space-y-3">
      <h4 className="text-sm font-semibold text-white/80 uppercase tracking-wide flex items-center gap-2">
        <Play className="w-4 h-4" />
        Treningi w tym poziomie
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {levelTrainings.map((lt) => {
          const completed = isTrainingCompleted(lt.training_id);
          const requiresPremium = lt.training.premium && !hasPremiumAccess;
          const canAccess = isLevelUnlocked && !requiresPremium;

          return (
            <Card key={lt.id} className={`overflow-hidden ${completed ? 'border-green-400/30' : 'border-blue-400/20'}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {lt.training.thumbnail_url && (
                    <img
                      src={lt.training.thumbnail_url}
                      alt={lt.training.title}
                      className="w-20 h-14 rounded object-cover"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-white">{lt.training.title}</p>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {lt.training.duration_seconds && (
                        <Badge variant="outline" className="text-xs">
                          {Math.round(lt.training.duration_seconds / 60)} min
                        </Badge>
                      )}
                      {lt.is_required && (
                        <Badge className="text-xs bg-orange-500/20 text-orange-400 border-orange-400/30">
                          Wymagany
                        </Badge>
                      )}
                      {completed && (
                        <Badge className="text-xs bg-green-500/20 text-green-400 border-green-400/30">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Ukończony
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleStartTraining(lt.training_id)}
                    disabled={!canAccess}
                    className={completed ? "bg-green-600 hover:bg-green-700" : ""}
                  >
                    {!canAccess ? <Lock className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
