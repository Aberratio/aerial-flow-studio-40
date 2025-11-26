import React, { useState, useEffect } from "react";
import { Clock, Trophy, CheckCircle, Play, Volume2, X } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDictionary } from "@/contexts/DictionaryContext";

interface Exercise {
  id: string;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  video_url?: string;
  audio_url?: string;
  notes?: string;
  figure: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
    instructions?: string;
    image_url?: string;
  };
}

interface ChallengeExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  dayId: string;
  dayNumber: number;
  exercises: Exercise[];
}

const ChallengeExerciseModal: React.FC<ChallengeExerciseModalProps> = ({
  isOpen,
  onClose,
  challengeId,
  dayId,
  dayNumber,
  exercises,
}) => {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(
    new Set()
  );
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const { getDifficultyLabel } = useDictionary();

  useEffect(() => {
    if (isOpen && user) {
      loadCompletedExercises();
    }
  }, [isOpen, user, dayId]);

  const loadCompletedExercises = async () => {
    try {
      // Load user's progress for this specific day
      const { data, error } = await supabase
        .from("challenge_day_progress")
        .select("exercises_completed, total_exercises")
        .eq("user_id", user?.id)
        .eq("challenge_id", challengeId)
        .eq("training_day_id", dayId)
        .single();

      if (!error && data) {
        // For now, we'll mark all exercises as completed if the day was completed
        // In a more advanced implementation, you could store individual exercise completion
        if (data.exercises_completed === data.total_exercises) {
          const allCompleted = new Set(exercises.map((ex) => ex.id));
          setCompletedExercises(allCompleted);
        }
      } else {
        // No previous progress found, start fresh
        setCompletedExercises(new Set());
      }
    } catch (error) {
      console.error("Error loading completed exercises:", error);
      setCompletedExercises(new Set());
    }
  };

  const toggleExerciseCompletion = (exerciseId: string) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(exerciseId)) {
      newCompleted.delete(exerciseId);
    } else {
      newCompleted.add(exerciseId);
    }
    setCompletedExercises(newCompleted);
  };

  const completionPercentage =
    exercises.length > 0
      ? (completedExercises.size / exercises.length) * 100
      : 0;

  const handleFinishDay = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Save individual day progress
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .upsert(
          {
            user_id: user.id,
            challenge_id: challengeId,
            training_day_id: dayId,
            exercises_completed: completedExercises.size,
            total_exercises: exercises.length,
            status: completionPercentage === 100 ? "completed" : "partial",
            changed_status_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,challenge_id,training_day_id",
          }
        );

      if (progressError) throw progressError;

      // Check if day is fully completed
      const isFullyCompleted = completionPercentage === 100;

      if (isFullyCompleted) {
        // Update challenge participant status if day is fully completed
        const { error: participantError } = await supabase
          .from("challenge_participants")
          .update({
            status: "active", // Keep as active, they can continue to next day
            updated_at: new Date().toISOString(),
          })
          .eq("challenge_id", challengeId)
          .eq("user_id", user.id);

        if (participantError) throw participantError;

        // Create activity entry for points
        const { error: activityError } = await supabase.rpc(
          "create_activity_with_points",
          {
            user_id: user.id,
            activity_type: "challenge_day_completed",
            activity_data: {
              challenge_id: challengeId,
              training_day_id: dayId,
              exercises_completed: completedExercises.size,
            },
            points: 25, // Award 25 points for completing a challenge day
          }
        );

        if (activityError)
          console.error("Error creating activity:", activityError);
      }

      toast({
        title: isFullyCompleted ? "Day Completed!" : "Progress Saved!",
        description: isFullyCompleted
          ? `Congratulations! You've completed all ${exercises.length} exercises and earned 25 points!`
          : `Progress saved: ${completedExercises.size} out of ${exercises.length} exercises completed.`,
      });

      onClose();

      // If day is completed, navigate to next day or back to challenge
      if (isFullyCompleted) {
        // Refresh the page to update progress display
        window.location.reload();
      }
    } catch (error) {
      console.error("Error finishing day:", error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] glass-effect border-white/10 text-white overflow-hidden flex flex-col p-4 md:p-6">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-xl md:text-2xl gradient-text">
            Dzień {dayNumber} - Ćwiczenia
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-4 md:-mx-6 px-4 md:px-6">
          <div className="space-y-4 md:space-y-6 pb-4">
            {/* Progress Overview */}
            <Card className="glass-effect border-white/10">
              <CardContent className="p-4 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base md:text-lg font-semibold text-white">
                      Postęp
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {completedExercises.size} z {exercises.length} ćwiczeń
                      ukończono
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-bold gradient-text">
                      {Math.round(completionPercentage)}%
                    </div>
                    <Trophy className="w-5 h-5 md:w-6 md:h-6 text-purple-400 mx-auto mt-1" />
                  </div>
                </div>
                <Progress value={completionPercentage} className="h-2 md:h-3" />
              </CardContent>
            </Card>

            {/* Exercise List */}
            <div className="space-y-3 md:space-y-4">
              <h3 className="text-base md:text-lg font-semibold text-white">
                Ćwiczenia
              </h3>
              {exercises.map((exercise, index) => {
                const isCompleted = completedExercises.has(exercise.id);
                return (
                  <Card
                    key={exercise.id}
                    className={`glass-effect transition-all duration-200 ${
                      isCompleted
                        ? "border-green-500/50 bg-green-500/10"
                        : "border-white/10"
                    }`}
                  >
                    <CardContent className="p-3 md:p-6">
                      <div className="flex items-start gap-2 md:gap-4">
                        {/* Completion Checkbox */}
                        <div className="flex items-center mt-1 flex-shrink-0">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() =>
                              toggleExerciseCompletion(exercise.id)
                            }
                            className="w-4 h-4 md:w-5 md:h-5"
                          />
                        </div>

                        {/* Exercise Image */}
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 md:w-16 md:h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                            {exercise.figure.image_url ? (
                              <img
                                src={exercise.figure.image_url}
                                alt={exercise.figure.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Trophy className="w-6 h-6 md:w-8 md:h-8 text-white/40" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Exercise Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2 gap-2">
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold text-white mb-1 text-sm md:text-base">
                                {index + 1}. {exercise.figure.name}
                              </h4>
                              <Badge className="mb-2 text-xs">
                                {getDifficultyLabel(
                                  exercise.figure.difficulty_level
                                )}
                              </Badge>
                            </div>
                            {isCompleted && (
                              <CheckCircle className="w-4 h-4 md:w-5 md:h-5 text-green-400 flex-shrink-0" />
                            )}
                          </div>

                          {exercise.figure.instructions && (
                            <p className="text-muted-foreground text-xs md:text-sm mb-3 break-words">
                              {exercise.figure.instructions}
                            </p>
                          )}

                          {/* Exercise Parameters */}
                          <div className="grid grid-cols-2 gap-2 md:gap-3 text-xs mb-3">
                            {exercise.sets && (
                              <div className="flex items-center gap-1 md:gap-2">
                                <span className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0" />
                                <span className="truncate">
                                  {exercise.sets} serie
                                </span>
                              </div>
                            )}
                            {exercise.reps && (
                              <div className="flex items-center gap-1 md:gap-2">
                                <span className="w-2 h-2 bg-blue-400 rounded-full flex-shrink-0" />
                                <span className="truncate">
                                  {exercise.reps} powtórzeń
                                </span>
                              </div>
                            )}
                            {exercise.hold_time_seconds && (
                              <div className="flex items-center gap-1 md:gap-2">
                                <Clock className="w-3 h-3 text-green-400 flex-shrink-0" />
                                <span className="truncate">
                                  {exercise.hold_time_seconds}s trzymaj
                                </span>
                              </div>
                            )}
                            {exercise.rest_time_seconds && (
                              <div className="flex items-center gap-1 md:gap-2">
                                <span className="w-2 h-2 bg-yellow-400 rounded-full flex-shrink-0" />
                                <span className="truncate">
                                  {exercise.rest_time_seconds}s odpoczynek
                                </span>
                              </div>
                            )}
                          </div>

                          {/* Media Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {exercise.video_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20 text-white hover:bg-white/10 text-xs h-7 md:h-8"
                                onClick={() =>
                                  window.open(exercise.video_url, "_blank")
                                }
                              >
                                <Play className="w-3 h-3 mr-1" />
                                Video
                              </Button>
                            )}
                            {exercise.audio_url && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-white/20 text-white hover:bg-white/10 text-xs h-7 md:h-8"
                                onClick={() =>
                                  window.open(exercise.audio_url, "_blank")
                                }
                              >
                                <Volume2 className="w-3 h-3 mr-1" />
                                Audio
                              </Button>
                            )}
                          </div>

                          {exercise.notes && (
                            <div className="bg-white/5 rounded-lg p-2 md:p-3 mt-3">
                              <p className="text-white text-xs md:text-sm break-words">
                                {exercise.notes}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </ScrollArea>

        {/* Action Buttons */}
        <div className="flex gap-2 md:gap-3 pt-4 flex-shrink-0">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 border-white/20 text-white hover:bg-white/10 text-sm md:text-base"
          >
            Zamknij
          </Button>
          <Button
            onClick={handleFinishDay}
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-sm md:text-base"
          >
            {isLoading ? "Zapisywanie..." : "Zakończ dzień"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeExerciseModal;
