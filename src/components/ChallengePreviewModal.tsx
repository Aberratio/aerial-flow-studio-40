import React, { useState, useEffect } from "react";
import {
  Calendar,
  Trophy,
  Users,
  Clock,
  ChevronRight,
  X,
  Play,
  ZoomIn,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChallengeDetailsModal } from "@/components/ChallengeDetailsModal";
import ExerciseImageModal from "@/components/ExerciseImageModal";
import RetakeChallengeModal from "@/components/RetakeChallengeModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level?: string;
  level?: number;
  start_date?: string;
  end_date?: string;
  status: string;
  created_by: string;
  image_url?: string;
  premium?: boolean;
  achievements?: Array<{
    id: string;
    name: string;
    points: number;
    icon: string;
  }>;
  training_days?: Array<{
    id: string;
    day_number: number;
    title: string;
    description: string;
    is_rest_day?: boolean;
    exercises?: Array<{
      id: string;
      figure: {
        id: string;
        name: string;
        difficulty_level: string;
        category: string;
        instructions?: string;
        image_url?: string;
      };
      sets?: number;
      reps?: number;
      hold_time_seconds?: number;
    }>;
    training_day_exercises?: Array<{
      id: string;
      figure: {
        id: string;
        name: string;
        difficulty_level: string;
        category: string;
        instructions?: string;
        image_url?: string;
      };
      sets?: number;
      reps?: number;
      hold_time_seconds?: number;
    }>;
  }>;
  participants_count?: number;
}

interface ChallengePreviewModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  ctaMessage: string;
}

const ChallengePreviewModal: React.FC<ChallengePreviewModalProps> = ({
  challenge: initialChallenge,
  isOpen,
  onClose,
  ctaMessage,
}) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRetakeModalOpen, setIsRetakeModalOpen] = useState(false);
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<{
    name: string;
    image_url?: string;
    difficulty_level: string;
    instructions?: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const { user } = useAuth();
  const { canCreateChallenges } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && initialChallenge) {
      fetchChallengeDetails(initialChallenge.id);
    }
  }, [isOpen, initialChallenge]);

  const fetchChallengeDetails = async (challengeId: string) => {
    setIsLoading(true);
    try {
      // Fetch challenge with achievements and training days
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select(
          `
          *,
          challenge_achievements (
            achievement:achievements (
              id, name, points, icon
            )
          ),
          challenge_training_days (
            id, day_number, title, description, duration_seconds,
            training_day_exercises (
              id, sets, reps, hold_time_seconds, rest_time_seconds,
              figure:figures (
                id, name, difficulty_level, category, image_url, instructions
              )
            )
          )
        `
        )
        .eq("id", challengeId)
        .single();

      if (challengeError) throw challengeError;

      // Fetch participants count
      const { count: participantsCount } = await supabase
        .from("challenge_participants")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId);

      setChallenge({
        ...challengeData,
        achievements:
          challengeData.challenge_achievements?.map(
            (ca: any) => ca.achievement
          ) || [],
        training_days: (challengeData.challenge_training_days || []).map(
          (d: any) => ({
            ...d,
            is_rest_day: (d.training_day_exercises?.length || 0) === 0,
          })
        ),
        participants_count: participantsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching challenge details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canEditChallenge = () => {
    return (
      canCreateChallenges &&
      challenge &&
      (user?.id === challenge.created_by || user?.role === "admin")
    );
  };

  if (!challenge) return null;

  const translateDifficulty = (level: string) => {
    const translations: Record<string, string> = {
      beginner: "Początkujący",
      intermediate: "Średni",
      advanced: "Zaawansowany",
    };
    return translations[level.toLowerCase()] || level;
  };

  const getDifficultyFromChallenge = () => {
    return translateDifficulty(challenge.difficulty_level || "");
  };

  const getUniqueExercisesWithImages = () => {
    const exerciseMap = new Map<
      string,
      {
        name: string;
        image_url?: string;
        difficulty_level: string;
        instructions?: string;
      }
    >();

    challenge.training_days?.forEach((day) => {
      if (!day.is_rest_day && day.training_day_exercises) {
        day.training_day_exercises.forEach((exercise) => {
          if (!exerciseMap.has(exercise.figure.name)) {
            exerciseMap.set(exercise.figure.name, {
              name: exercise.figure.name,
              image_url: exercise.figure.image_url,
              difficulty_level: exercise.figure.difficulty_level,
              instructions: exercise.figure.instructions,
            });
          }
        });
      }
    });

    return Array.from(exerciseMap.values());
  };

  const calculateDailyDuration = () => {
    const durations: number[] = [];

    challenge.training_days?.forEach((day) => {
      if (!day.is_rest_day) {
        // Use duration_seconds from database if available, otherwise calculate
        if ((day as any).duration_seconds !== undefined) {
          durations.push((day as any).duration_seconds);
        } else if (day.exercises) {
          let dayDuration = 0;
          day.exercises.forEach((exercise) => {
            const sets = exercise.sets || 1;
            const holdTime = exercise.hold_time_seconds || 30;
            const restTime = (exercise as any).rest_time_seconds || 15;
            dayDuration += sets * (holdTime + restTime);
          });
          durations.push(dayDuration);
        }
      }
    });

    if (durations.length === 0)
      return { min: 0, max: 0, shortest: 0, longest: 0 };

    const minSeconds = Math.min(...durations);
    const maxSeconds = Math.max(...durations);

    return {
      min: Math.ceil(minSeconds / 60), // Convert to minutes
      max: Math.ceil(maxSeconds / 60),
      shortest: Math.ceil(minSeconds / 60),
      longest: Math.ceil(maxSeconds / 60),
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "draft":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-400";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-400";
      case "Advanced":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getButtonText = (status: string) => {
    const challengeStatus = initialChallenge?.status;

    if (
      challengeStatus === "done" ||
      challengeStatus === "completed" ||
      challengeStatus === "failed"
    ) {
      return "Retake Challenge";
    }

    return ctaMessage;
  };

  const handleRetakeChallenge = async (startDate: Date) => {
    if (!user || !challenge) return;

    setIsRetaking(true);
    try {
      // Reset the user's challenge progress to start over
      const { error: deleteProgressError } = await supabase
        .from("challenge_day_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("challenge_id", challenge.id);

      if (deleteProgressError) throw deleteProgressError;

      // Reset participant status
      const { error: updateParticipantError } = await supabase
        .from("challenge_participants")
        .update({
          current_day_number: 1,
          last_completed_day: 0,
          status: "active",
          completed: false,
        })
        .eq("user_id", user.id)
        .eq("challenge_id", challenge.id);

      if (updateParticipantError) throw updateParticipantError;

      toast({
        title: "Challenge Reset!",
        description: `Your progress has been reset. The challenge will start on ${startDate.toLocaleDateString()}.`,
      });

      setIsRetakeModalOpen(false);
      onClose();

      // Navigate to challenge preview page
      navigate(`/challenges/${challenge.id}`);
    } catch (error) {
      console.error("Error retaking challenge:", error);
      toast({
        title: "Error",
        description: "Failed to reset challenge progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRetaking(false);
    }
  };

  const handleExerciseClick = (exercise: {
    name: string;
    image_url?: string;
    difficulty_level: string;
    instructions?: string;
  }) => {
    setSelectedExercise(exercise);
    setIsExerciseModalOpen(true);
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-xl glass-effect border-white/10 text-white">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">
              Ładowanie szczegółów wyzwania...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto glass-effect border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold text-white pr-2">
              {challenge.title}
            </DialogTitle>
            {canEditChallenge() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/challenges/${challenge.id}/edit`);
                }}
                className="border-white/20 text-white hover:bg-white/10 flex-shrink-0"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Challenge Image */}
          <div className="relative h-48 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            {challenge.image_url ? (
              <img
                src={challenge.image_url}
                alt={challenge.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="w-12 h-12 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-3 right-3">
              <Badge
                className={`${getStatusColor(
                  challenge.status
                )} bg-black/80 backdrop-blur-sm text-xs`}
              >
                {challenge.status === "published"
                  ? "Dostępne"
                  : challenge.status}
              </Badge>
            </div>
            <div className="absolute bottom-3 left-3 flex gap-2">
              <Badge
                variant="outline"
                className="border-white/30 text-white/90 text-xs"
              >
                {challenge.training_days?.length || 0} Dni
              </Badge>
              {challenge.level && (
                <Badge
                  variant="outline"
                  className="border-purple-400/50 text-purple-300 bg-purple-500/20 text-xs"
                >
                  Poziom {challenge.level}
                </Badge>
              )}
            </div>
          </div>

          {/* Compact Stats */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="glass-effect border-white/10 p-3 text-center">
              <Clock className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Czas trwania</div>
              <div className="text-sm text-white font-semibold">
                {challenge.training_days?.length || 0} dni
              </div>
            </Card>

            <Card className="glass-effect border-white/10 p-3 text-center">
              <Trophy className="w-4 h-4 text-purple-400 mx-auto mb-1" />
              <div className="text-xs text-muted-foreground">Trudność</div>
              <Badge
                className={`${getDifficultyColor(
                  getDifficultyFromChallenge()
                )} text-xs mt-1`}
              >
                {getDifficultyFromChallenge()}
              </Badge>
            </Card>
          </div>

          {/* Achievements and Duration in one row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Achievements */}
            {challenge.achievements && challenge.achievements.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-white">
                  Osiągnięcia
                </h3>
                <div className="space-y-1">
                  {challenge.achievements.slice(0, 2).map((achievement) => (
                    <div
                      key={achievement.id}
                      className="bg-background/20 rounded-lg p-2 flex items-center gap-2"
                    >
                      <span className="text-xs">{achievement.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white truncate">
                          {achievement.name}
                        </div>
                        <div className="text-xs text-purple-400">
                          {achievement.points} pkt
                        </div>
                      </div>
                    </div>
                  ))}
                  {challenge.achievements.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{challenge.achievements.length - 2} więcej
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Duration */}
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-white">Czas trwania</h3>
              <div className="bg-background/20 rounded-lg p-2">
                <div className="text-xs text-white font-medium">
                  {challenge.training_days?.length || 0} dni
                </div>
                <div className="text-xs text-muted-foreground">
                  {challenge.training_days?.filter((day) => !day.is_rest_day)
                    .length || 0}{" "}
                  dni treningowych
                </div>
              </div>
            </div>
          </div>

          {/* Training Overview */}
          {challenge.training_days && challenge.training_days.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-white">Trening</h3>

              {/* Compact Daily Time */}
              <Card className="glass-effect border-white/10 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-muted-foreground">
                      Dzienny czas
                    </span>
                  </div>
                  <div className="text-sm text-white font-semibold">
                    {(() => {
                      const { min, max } = calculateDailyDuration();
                      if (min === max) {
                        return `${min} min`;
                      }
                      return `${min}-${max} min`;
                    })()}
                  </div>
                </div>
              </Card>

              {/* Exercises Grid */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white">
                  Ćwiczenia ({getUniqueExercisesWithImages().length})
                </h4>
                <div className="text-muted-foreground">
                  {(() => {
                    const exercises = getUniqueExercisesWithImages();
                    if (exercises.length === 0) {
                      return (
                        <p className="text-xs">Brak skonfigurowanych ćwiczeń</p>
                      );
                    }
                    return (
                      <div className="grid grid-cols-2 gap-2">
                        {exercises.slice(0, 6).map((exercise, index) => (
                          <div
                            key={index}
                            className="group cursor-pointer"
                            onClick={() => handleExerciseClick(exercise)}
                          >
                            <div className="flex items-center gap-2 p-2 rounded-lg glass-effect border-white/10 hover:border-white/20 transition-all">
                              <div className="relative">
                                {exercise.image_url ? (
                                  <>
                                    <img
                                      src={exercise.image_url}
                                      alt={exercise.name}
                                      className="w-8 h-8 rounded object-cover"
                                    />
                                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded flex items-center justify-center">
                                      <ZoomIn className="w-3 h-3 text-white" />
                                    </div>
                                  </>
                                ) : (
                                  <div className="w-8 h-8 rounded bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                                    <Trophy className="w-4 h-4 text-purple-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="text-xs font-medium text-white truncate group-hover:text-purple-300 transition-colors">
                                  {exercise.name}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                        {exercises.length > 6 && (
                          <div className="text-xs text-muted-foreground col-span-2 text-center py-1">
                            +{exercises.length - 6} więcej ćwiczeń
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Compact Challenge Stats */}
              <div className="text-xs text-muted-foreground bg-white/5 rounded-lg p-3">
                <p>
                  <span className="font-medium">
                    {challenge.training_days?.length || 0} dni
                  </span>{" "}
                  łącznie •{" "}
                  <span className="font-medium">
                    {challenge.training_days?.filter((day) => !day.is_rest_day)
                      .length || 0}
                  </span>{" "}
                  treningowe •{" "}
                  <span className="font-medium">
                    {challenge.training_days?.filter((day) => day.is_rest_day)
                      .length || 0}
                  </span>{" "}
                  odpoczynku
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Zamknij
            </Button>

            {/* Dynamic Action Button */}
            {(() => {
              const challengeStatus = initialChallenge?.status;

              if (
                challengeStatus === "done" ||
                challengeStatus === "completed" ||
                challengeStatus === "failed"
              ) {
                return (
                  <Button
                    variant="destructive"
                    onClick={() => setIsRetakeModalOpen(true)}
                    className="flex-1"
                  >
                    Powtórz wyzwanie
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                );
              }

              return (
                <Button
                  className="flex-1"
                  variant="primary"
                  onClick={async () => {
                    if (challenge.status === "published") {
                      // Check if it's a "Join Challenge" action (no user participation yet)
                      const challengeStatus = initialChallenge?.status;

                      if (
                        challengeStatus === "not-started" ||
                        challengeStatus === "available"
                      ) {
                        // User is joining the challenge - replicate the join logic from Challenges page
                        if (!user) return;

                        // Check if challenge is premium and user has access
                        if (challenge.premium) {
                          // This would need access to the checkChallengeAccess function
                          // For now, we'll navigate and let the challenge page handle it
                        }

                        // Automatically start today
                        const today = new Date();

                        try {
                          const { error, data } = await supabase
                            .from("challenge_participants")
                            .insert({
                              challenge_id: challenge.id,
                              user_id: user.id,
                              status: "active",
                              user_started_at: today.toISOString(),
                            })
                            .select();

                          if (error) throw error;

                          console.log(
                            "User joined challenge from modal, now generating calendar..."
                          );

                          // Check if calendar already exists before generating
                          // Calendar generation skipped; handled by challenge page

                          // Small delay to ensure calendar generation completes
                          await new Promise((resolve) =>
                            setTimeout(resolve, 500)
                          );

                          onClose();
                          navigate(`/challenges/${challenge.id}`);
                          toast({
                            title: "Sukces!",
                            description: "Dołączyłeś do wyzwania. Powodzenia!",
                          });
                        } catch (error) {
                          console.error("Error joining challenge:", error);
                          toast({
                            title: "Błąd",
                            description:
                              "Nie udało się dołączyć do wyzwania. Spróbuj ponownie.",
                            variant: "destructive",
                          });
                        }
                      } else {
                        // Just navigate for other statuses
                        onClose();
                        navigate(`/challenges/${challenge.id}`);
                      }
                    }
                  }}
                  disabled={challenge.status !== "published"}
                >
                  {getButtonText(challenge.status)}
                </Button>
              );
            })()}
          </div>
        </div>
      </DialogContent>

      {/* Challenge Details Modal */}
      {challenge.training_days && (
        <ChallengeDetailsModal
          challenge={{
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            level: getDifficultyFromChallenge(),
            totalDays: challenge.training_days.length,
            currentDay: 0,
            completedDays: 0,
            image: challenge.image_url || "",
            days: challenge.training_days.map((day, index) => ({
              day: index + 1,
              dayId: day.id, // Add the actual training day ID
              title: day.title || `Day ${index + 1}`,
              description: day.is_rest_day
                ? "Rest Day"
                : day.description || "Training session",
              duration: day.is_rest_day ? "Rest" : "30-45 mins",
              completed: false,
              figures: day.is_rest_day
                ? []
                : day.exercises?.map((ex) => ex.figure.name) || [],
              isRestDay: day.is_rest_day,
            })),
            training_days: challenge.training_days,
          }}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onStart={() => {
            setIsDetailsModalOpen(false);
            onClose();
          }}
          onContinue={() => {
            setIsDetailsModalOpen(false);
            onClose();
          }}
        />
      )}

      {/* Retake Challenge Confirmation Modal */}
      <RetakeChallengeModal
        isOpen={isRetakeModalOpen}
        onClose={() => setIsRetakeModalOpen(false)}
        onConfirm={handleRetakeChallenge}
        challengeTitle={challenge?.title || ""}
        isLoading={isRetaking}
      />

      {/* Exercise Image Modal */}
      <ExerciseImageModal
        exercise={selectedExercise}
        isOpen={isExerciseModalOpen}
        onClose={() => {
          setIsExerciseModalOpen(false);
          setSelectedExercise(null);
        }}
      />
    </Dialog>
  );
};

export default ChallengePreviewModal;
