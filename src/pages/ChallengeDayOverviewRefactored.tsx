import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Clock,
  Play,
  CheckCircle,
  XCircle,
  Pause,
  RotateCcw,
  ChevronLeft,
  AlertTriangle,
  Target,
  Trophy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChallengeCalendar } from "@/hooks/useChallengeCalendar";
import ChallengeExerciseModal from "@/components/ChallengeExerciseModal";
import { format, parseISO } from "date-fns";

interface TrainingDay {
  id: string;
  day_number: number;
  title: string;
  description: string;
  is_rest_day: boolean;
  exercises: Array<{
    id: string;
    figure: {
      id: string;
      name: string;
      difficulty_level: string;
      category: string;
      image_url?: string;
      video_url?: string;
      instructions?: string;
    };
    sets?: number;
    reps?: number;
    hold_time_seconds?: number;
    rest_time_seconds?: number;
    video_url?: string;
    audio_url?: string;
    notes?: string;
  }>;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level?: string;
  start_date: string;
  end_date: string;
  status: string;
  image_url?: string;
  type: string;
}

const ChallengeDayOverviewRefactored = () => {
  const { challengeId, dayId } = useParams<{
    challengeId: string;
    dayId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [trainingDay, setTrainingDay] = useState<TrainingDay | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExerciseModal, setShowExerciseModal] = useState(false);
  const [participationStatus, setParticipationStatus] = useState<string>("");
  const [userParticipant, setUserParticipant] = useState<any>(null);

  // Use the new refactored challenge calendar hook
  const {
    calendarDays,
    isLoading: calendarLoading,
    changeDayStatus,
    getCalendarDayByTrainingDay,
    loadCalendar,
  } = useChallengeCalendar(challengeId || "");

  useEffect(() => {
    if (challengeId && dayId) {
      fetchChallengeAndDay();
    }
  }, [challengeId, dayId]);

  const fetchChallengeAndDay = async () => {
    try {
      setIsLoading(true);

      // Fetch challenge details
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();
      if (challengeError) throw challengeError;
      setChallenge(challengeData);

      // Fetch training day details
      const { data: trainingDayData, error: trainingDayError } = await supabase
        .from("challenge_training_days")
        .select(
          `
          *,
          training_day_exercises (
            *,
            figure:figures (
              id, name, difficulty_level, category, image_url, video_url, instructions
            )
          )
        `
        )
        .eq("id", dayId)
        .single();
      if (trainingDayError) throw trainingDayError;

      // Transform the data to match our interface
      const transformedTrainingDay: TrainingDay = {
        id: trainingDayData.id,
        day_number: trainingDayData.day_number,
        title: trainingDayData.title || `Day ${trainingDayData.day_number}`,
        description: trainingDayData.description || "",
        is_rest_day: trainingDayData.is_rest_day || false,
        exercises:
          trainingDayData.training_day_exercises?.map((exercise: any) => ({
            id: exercise.id,
            figure: exercise.figure,
            sets: exercise.sets,
            reps: exercise.reps,
            hold_time_seconds: exercise.hold_time_seconds,
            rest_time_seconds: exercise.rest_time_seconds,
            video_url: exercise.video_url,
            audio_url: exercise.audio_url,
            notes: exercise.notes,
          })) || [],
      };

      setTrainingDay(transformedTrainingDay);

      // Check user participation
      if (user) {
        const { data: participationData } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("challenge_id", challengeId)
          .eq("user_id", user.id)
          .single();
        if (participationData) {
          setParticipationStatus(participationData.status);
          setUserParticipant(participationData);
        }
      }
    } catch (error) {
      console.error("Error fetching challenge and day:", error);
      toast({
        title: "Error",
        description: "Failed to load challenge details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (
    newStatus: "completed" | "failed" | "rest"
  ) => {
    if (!user || !challengeId || !trainingDay) return;

    try {
      // Find the calendar day for this training day
      const calendarDay = getCalendarDayByTrainingDay(trainingDay.id);
      if (!calendarDay) {
        toast({
          title: "Error",
          description: "Calendar day not found. Please try again.",
          variant: "destructive",
        });
        return;
      }

      // Change the day status using the new hook
      await changeDayStatus(calendarDay.calendar_date, newStatus);

      // Navigate back to challenge preview
      navigate(`/challenge/${challengeId}`);
    } catch (error) {
      console.error("Error changing status:", error);
      toast({
        title: "Error",
        description: "Failed to change day status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const calculateDuration = () => {
    if (!challenge) return "";
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const handleTimerComplete = async () => {
    if (!user) return;
    await handleStatusChange("completed");
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  if (isLoading || calendarLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!challenge || !trainingDay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white">Challenge or training day not found</div>
      </div>
    );
  }

  // Get the current calendar day status
  const calendarDay = getCalendarDayByTrainingDay(trainingDay.id);
  const isCompleted = calendarDay?.status === "completed";
  const isFailed = calendarDay?.status === "failed";
  const isRest = calendarDay?.status === "rest";
  const isRetry = calendarDay?.is_retry;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(`/challenge/${challengeId}`)}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Challenge
            </Button>
            <div className="h-6 w-px bg-white/20"></div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                {challenge.title}
              </h1>
              <p className="text-muted-foreground">
                Day {trainingDay.day_number}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Day Status Card */}
            {(isCompleted || isFailed || isRest) && (
              <Card className="glass-effect border-white/10 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {isCompleted || isRest ? (
                        <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        </div>
                      ) : (
                        <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                          <AlertTriangle className="w-6 h-6 text-red-400" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">
                        {isCompleted
                          ? "Day Completed! 🎉"
                          : isRest
                          ? "Rest Day Completed! 🌿"
                          : "Day Previously Failed"}
                      </h3>
                      <p className="text-muted-foreground mb-3">
                        {isCompleted
                          ? `Great job! You completed this training day. You're viewing this day for reference only.`
                          : isRest
                          ? `Well done! You completed this rest day. Recovery is important for progress.`
                          : "This day was marked as failed and can be retried. Start a new attempt below."}
                      </p>
                      {calendarDay && (
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium">Status:</span>{" "}
                          {isCompleted
                            ? "Completed"
                            : isRest
                            ? "Rest Day Completed"
                            : "Failed"}{" "}
                          {isRetry && (
                            <>
                              <span className="font-medium ml-2">Attempt:</span>{" "}
                              {calendarDay.attempt_number}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Day Details Card */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl mb-2">
                      {trainingDay.title}
                    </CardTitle>
                    <p className="text-muted-foreground">
                      {trainingDay.description}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {isRetry && (
                      <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                        🔄 Retry Attempt
                      </Badge>
                    )}
                    {trainingDay.is_rest_day ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        🌴 Rest Day
                      </Badge>
                    ) : (
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                        💪 Workout Day
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {trainingDay.is_rest_day ? (
                  <div className="text-center py-8">
                    <div className="text-6xl mb-4">🌴</div>
                    <h3 className="text-xl font-semibold text-white mb-2">
                      Rest Day
                    </h3>
                    <p className="text-muted-foreground mb-6">
                      Take time to recover and let your body heal. Rest is just
                      as important as training!
                    </p>
                    {!isRest && (
                      <Button
                        onClick={() => handleStatusChange("rest")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Rest Day Complete
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Exercise List */}
                    <div>
                      <h3 className="text-lg font-semibold text-white mb-4">
                        Exercises ({trainingDay.exercises.length})
                      </h3>
                      <div className="space-y-3">
                        {trainingDay.exercises.map((exercise, index) => (
                          <div
                            key={exercise.id}
                            className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-sm">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="text-white font-medium">
                                  {exercise.figure.name}
                                </h4>
                                <div className="flex items-center space-x-2 mt-1">
                                  <Badge
                                    className={getDifficultyColor(
                                      exercise.figure.difficulty_level
                                    )}
                                  >
                                    {exercise.figure.difficulty_level}
                                  </Badge>
                                  {exercise.sets && exercise.reps && (
                                    <Badge
                                      variant="outline"
                                      className="border-white/20 text-white"
                                    >
                                      {exercise.sets} sets × {exercise.reps}{" "}
                                      reps
                                    </Badge>
                                  )}
                                  {exercise.hold_time_seconds && (
                                    <Badge
                                      variant="outline"
                                      className="border-white/20 text-white"
                                    >
                                      <Clock className="w-3 h-3 mr-1" />
                                      {exercise.hold_time_seconds}s hold
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {!isCompleted && !isFailed && (
                      <div className="flex space-x-3 pt-6 border-t border-white/10">
                        <Button
                          onClick={() => handleStatusChange("completed")}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Completed
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange("rest")}
                          className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                        >
                          <Pause className="w-4 h-4 mr-2" />
                          Rest Day
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => handleStatusChange("failed")}
                          className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                        >
                          <XCircle className="w-4 h-4 mr-2" />
                          Failed
                        </Button>

                        {challenge.type === "timer" && (
                          <Button
                            onClick={() => setShowExerciseModal(true)}
                            className="flex-1 bg-purple-600 hover:bg-purple-700"
                          >
                            <Play className="w-4 h-4 mr-2" />
                            Start Timer
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Challenge Info Card */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Challenge Info</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-white font-medium">
                      {challenge.title}
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      {challenge.description}
                    </p>
                  </div>

                  <Separator className="bg-white/10" />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-muted-foreground">Difficulty</div>
                      <Badge
                        className={getDifficultyColor(
                          challenge.difficulty_level || ""
                        )}
                      >
                        {challenge.difficulty_level || "Intermediate"}
                      </Badge>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Duration</div>
                      <div className="text-white">{calculateDuration()}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Type</div>
                      <div className="text-white">
                        {challenge.type === "timer" ? "Timer" : "Manual"}
                      </div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Status</div>
                      <div className="text-white capitalize">
                        {participationStatus}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Progress Card */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Your Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Day {trainingDay.day_number}
                    </span>
                    <span className="text-sm text-white">
                      {isCompleted
                        ? "Completed"
                        : isFailed
                        ? "Failed"
                        : isRest
                        ? "Rest"
                        : "Pending"}
                    </span>
                  </div>

                  {calendarDay && (
                    <div className="text-sm text-muted-foreground">
                      <div>Attempt: {calendarDay.attempt_number}</div>
                      {calendarDay.completed_at && (
                        <div>
                          Completed:{" "}
                          {format(
                            parseISO(calendarDay.completed_at),
                            "MMM dd, yyyy"
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Exercise Timer Modal */}
      {showExerciseModal && trainingDay && (
        <ChallengeExerciseModal
          isOpen={showExerciseModal}
          onClose={() => setShowExerciseModal(false)}
          challengeId={challengeId!}
          dayId={dayId!}
          dayNumber={trainingDay.day_number}
          exercises={trainingDay.exercises}
        />
      )}
    </div>
  );
};

export default ChallengeDayOverviewRefactored;
