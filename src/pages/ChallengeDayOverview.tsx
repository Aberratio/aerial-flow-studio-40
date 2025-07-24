import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Calendar as CalendarIcon,
  Trophy,
  Users,
  Clock,
  Play,
  ChevronLeft,
  CalendarDays,
  Target,
  RotateCcw,
  AlertTriangle,
  Edit,
  CheckCircle,
  Pause,
  Star,
  Volume2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Calendar } from "@/components/ui/calendar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import {
  format,
  parseISO,
  addDays,
  isSameDay,
  startOfMonth,
  endOfMonth,
  isAfter,
  isBefore,
} from "date-fns";
import ChallengeExerciseModal from "@/components/ChallengeExerciseModal";
import ChallengeTimer from "@/components/ChallengeTimer";

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

interface TrainingDay {
  id: string;
  day_number: number;
  title: string;
  description: string;
  is_rest_day?: boolean;
  exercises: Exercise[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  type?: string;
}

interface TrainingDayBasic {
  id: string;
  day_number: number;
  is_rest_day?: boolean;
}

interface TrainingDayExercise {
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

const ChallengeDayOverview = () => {
  const { challengeId, dayId } = useParams<{
    challengeId: string;
    dayId: string;
  }>();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [trainingDay, setTrainingDay] = useState<TrainingDay | null>(null);
  const [dayNumber, setDayNumber] = useState(1);
  const [totalDays, setTotalDays] = useState(0);

  const [allDays, setAllDays] = useState<TrainingDayBasic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDayCompleted, setIsDayCompleted] = useState(false);
  const [dayProgress, setDayProgress] = useState<any>(null);
  const [participationStatus, setParticipationStatus] = useState<string>("");
  const [userParticipant, setUserParticipant] = useState<any>(null);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [restDayAction, setRestDayAction] = useState(false);
  const [failedDayAction, setFailedDayAction] = useState(false);
  const { user } = useAuth();
  const { canCreateChallenges } = useUserRole();
  const { toast } = useToast();

  // Helper function to get the next attempt number
  const getNextAttemptNumber = async (
    userId: string,
    challengeId: string,
    dayId: string
  ): Promise<number> => {
    const { data: existingProgress } = await supabase
      .from("challenge_day_progress")
      .select("attempt_number")
      .eq("user_id", userId)
      .eq("challenge_id", challengeId)
      .eq("training_day_id", dayId)
      .order("attempt_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    return existingProgress ? existingProgress.attempt_number + 1 : 1;
  };

  // Helper function to check if this is a retry attempt
  const isRetryAttempt = (): boolean => {
    return dayProgress && dayProgress.attempt_number > 1;
  };

  // Helper function to check if this attempt is completed
  const isAttemptCompleted = (): boolean => {
    return (
      dayProgress &&
      (dayProgress.status === "completed" || dayProgress.status === "rest")
    );
  };

  // Helper function to check if this attempt is failed
  const isAttemptFailed = (): boolean => {
    return dayProgress && dayProgress.status === "failed";
  };

  // Helper function to check if we should show action buttons
  const shouldShowActionButtons = (): boolean => {
    // Show action buttons if:
    // 1. No progress exists (first attempt)
    // 2. Latest attempt failed (allow retry)
    // 3. This is a retry attempt and not completed
    return (
      !dayProgress ||
      isAttemptFailed() ||
      (isRetryAttempt() && !isAttemptCompleted())
    );
  };

  useEffect(() => {
    console.log("challengeId", challengeId);
    console.log("dayId", dayId);
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

      // Check if user has already completed or failed this specific day
      if (user) {
        // Get the latest progress attempt for this training day
        const { data: progressData, error: progressError } = await supabase
          .from("challenge_day_progress")
          .select("*")
          .eq("user_id", user.id)
          .eq("challenge_id", challengeId)
          .eq("training_day_id", dayId)
          .order("attempt_number", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (!progressError && progressData) {
          setDayProgress(progressData);

          // Only mark as completed if the LATEST attempt is actually completed or rest
          // Failed attempts should allow retry by creating a new attempt
          if (
            progressData.status === "completed" ||
            progressData.status === "rest"
          ) {
            setIsDayCompleted(true);
          }
        }

        // Fetch user's participation status
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

      // Fetch all training days for this challenge to determine day number
      const { data: allDays, error: allDaysError } = await supabase
        .from("challenge_training_days")
        .select("id, day_number, is_rest_day")
        .eq("challenge_id", challengeId)
        .order("day_number");
      if (allDaysError) throw allDaysError;
      setTotalDays(allDays?.length || 0);
      setAllDays(allDays || []);
      const currentDay = allDays?.find((day) => day.id === dayId);
      setDayNumber(currentDay?.day_number || 1);

      // Fetch specific training day with exercises
      const { data: dayData, error: dayError } = await supabase
        .from("challenge_training_days")
        .select(
          `
          *,
          training_day_exercises (
            *,
            figure:figures (
              id, name, difficulty_level, category, instructions, image_url
            )
          )
        `
        )
        .eq("id", dayId)
        .single();
      if (dayError) throw dayError;
      setTrainingDay({
        ...dayData,
        exercises:
          dayData.training_day_exercises?.map((ex: TrainingDayExercise) => ({
            id: ex.id,
            sets: ex.sets,
            reps: ex.reps,
            hold_time_seconds: ex.hold_time_seconds,
            rest_time_seconds: ex.rest_time_seconds,
            video_url: ex.video_url,
            audio_url: ex.audio_url,
            notes: ex.notes,
            figure: ex.figure,
          })) || [],
      });
    } catch (error) {
      console.error("Error fetching challenge day:", error);
      navigate("/challenges");
    } finally {
      setIsLoading(false);
    }
  };

  const getExerciseIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case "warmup":
        return "🔥";
      case "strength":
        return "💪";
      case "flexibility":
        return "🤸";
      case "flow":
        return "💫";
      case "cooldown":
        return "🌿";
      default:
        return "📋";
    }
  };

  const getExerciseColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "border-green-500/30 text-green-400";
      case "intermediate":
        return "border-yellow-500/30 text-yellow-400";
      case "advanced":
        return "border-red-500/30 text-red-400";
      default:
        return "border-gray-500/30 text-gray-400";
    }
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

  const handleStartDay = () => {
    if (challenge?.type === "timer") {
      navigate(`/challenge/${challengeId}/day/${dayId}/timer`);
    } else {
      navigate(`/challenge/${challengeId}/day/${dayId}/manual`);
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    // Handle exercise click - could open exercise details modal
    console.log("Exercise clicked:", exercise);
  };

  const canEditChallenge = () => {
    return (
      canCreateChallenges &&
      (user?.role === "admin" || challenge?.created_by === user?.id)
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user) return;

    try {
      // Get the next attempt number for this training day
      const nextAttemptNumber = await getNextAttemptNumber(
        user.id,
        challengeId!,
        dayId!
      );

      const { error } = await supabase.from("challenge_day_progress").insert({
        user_id: user.id,
        challenge_id: challengeId!,
        training_day_id: dayId!,
        exercises_completed: 0,
        total_exercises: trainingDay!.exercises.length,
        status: newStatus,
        changed_status_at: new Date().toISOString(),
        notes: `User marked day as ${newStatus}`,
        attempt_number: nextAttemptNumber,
      });

      if (error) throw error;

      toast({
        title: `Day Marked as ${
          newStatus.charAt(0).toUpperCase() + newStatus.slice(1)
        }`,
        description: `This day has been marked as ${newStatus}.`,
      });

      window.location.reload();
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
    await completeDay();
  };

  const completeDay = async (startDate?: Date) => {
    if (!user) return;

    try {
      // Get the next attempt number for this training day
      const nextAttemptNumber = await getNextAttemptNumber(
        user.id,
        challengeId!,
        dayId!
      );

      const completionData = {
        user_id: user.id,
        challenge_id: challengeId!,
        training_day_id: dayId!,
        exercises_completed: trainingDay!.exercises.length,
        total_exercises: trainingDay!.exercises.length,
        changed_status_at: new Date().toISOString(),
        status: "completed",
        attempt_number: nextAttemptNumber,
      };

      // Always create a new entry for each attempt
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .insert(completionData);

      if (progressError) throw progressError;

      setIsDayCompleted(true);

      // If start date was provided, update the user's started_at date
      if (startDate) {
        const { error: participantError } = await supabase
          .from("challenge_participants")
          .update({ user_started_at: startDate.toISOString() })
          .eq("challenge_id", challengeId!)
          .eq("user_id", user.id);

        if (participantError) throw participantError;
      }

      // Create activity entry for points
      const { error: activityError } = await supabase.rpc(
        "create_activity_with_points",
        {
          user_id: user.id,
          activity_type: "challenge_day_completed",
          activity_data: {
            challenge_id: challengeId,
            training_day_id: dayId,
            exercises_completed: trainingDay!.exercises.length,
          },
          target_user_id: null,
          points: 25, // Award 25 points for completing a challenge day
        }
      );

      if (activityError)
        console.error("Error creating activity:", activityError);

      toast({
        title: "Workout Complete!",
        description: `Great job! You've completed all ${
          trainingDay!.exercises.length
        } exercises and earned 25 points!`,
      });
    } catch (error) {
      console.error("Error saving progress:", error);
      toast({
        title: "Workout Complete!",
        description: "Great job completing your training session!",
        variant: "default",
      });
    }
  };

  const handleRestDayWithDate = async (startDate: Date) => {
    if (!user) return;

    try {
      // Update participant's start date
      const { error: participantError } = await supabase
        .from("challenge_participants")
        .update({ user_started_at: startDate.toISOString() })
        .eq("challenge_id", challengeId!)
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      // Get the next attempt number for this training day
      const nextAttemptNumber = await getNextAttemptNumber(
        user.id,
        challengeId!,
        dayId!
      );

      // Mark rest day as completed
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .insert({
          user_id: user.id,
          challenge_id: challengeId!,
          training_day_id: dayId!,
          exercises_completed: 0,
          total_exercises: 0,
          changed_status_at: new Date().toISOString(),
          status: "rest",
          attempt_number: nextAttemptNumber,
        });

      if (progressError) throw progressError;

      toast({
        title: "Rest Day Complete!",
        description: "Great job taking time to recover! You earned 10 points.",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error completing rest day:", error);
      toast({
        title: "Error",
        description: "Failed to mark rest day as complete. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFailedDayWithDate = async (startDate: Date) => {
    if (!user) return;

    try {
      // Update participant's start date
      const { error: participantError } = await supabase
        .from("challenge_participants")
        .update({ user_started_at: startDate.toISOString() })
        .eq("challenge_id", challengeId!)
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      // Get the next attempt number for this training day
      const nextAttemptNumber = await getNextAttemptNumber(
        user.id,
        challengeId!,
        dayId!
      );

      // Mark day as failed
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .insert({
          user_id: user.id,
          challenge_id: challengeId!,
          training_day_id: dayId!,
          exercises_completed: 0,
          total_exercises: trainingDay!.exercises.length,
          status: "failed",
          changed_status_at: new Date().toISOString(),
          notes: "User marked day as failed - needs retry",
          attempt_number: nextAttemptNumber,
        });

      if (progressError) throw progressError;

      toast({
        title: "Day Marked as Failed",
        description: "This day will be retried tomorrow. Don't give up!",
      });

      window.location.reload();
    } catch (error) {
      console.error("Error marking day as failed:", error);
      toast({
        title: "Error",
        description: "Failed to mark day as failed. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!challenge || !trainingDay) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Challenge day not found
          </h2>
          <Button onClick={() => navigate("/challenges")} variant="outline">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/challenges/${challengeId}`)}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Challenge
            </Button>

            {canEditChallenge() && (
              <Button
                variant="outline"
                onClick={() => navigate(`/challenges/${challengeId}/edit`)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Challenge
              </Button>
            )}
          </div>

          {/* Status Info Box for Completed/Failed Days */}
          {dayProgress &&
            (dayProgress.status === "completed" ||
              dayProgress.status === "rest" ||
              dayProgress.status === "failed") && (
              <Card className="glass-effect border-white/10 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {dayProgress.status === "completed" ||
                      dayProgress.status === "rest" ? (
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
                        {dayProgress.status === "completed"
                          ? "Day Completed! 🎉"
                          : dayProgress.status === "rest"
                          ? "Rest Day Completed! 🌿"
                          : "Day Previously Failed"}
                      </h3>
                      <p className="text-muted-foreground mb-3">
                        {dayProgress.status === "completed"
                          ? `Great job! You completed this training day on ${new Date(
                              dayProgress.changed_status_at
                            ).toLocaleDateString()}. You're viewing this day for reference only.`
                          : dayProgress.status === "rest"
                          ? `Well done! You completed this rest day on ${new Date(
                              dayProgress.changed_status_at
                            ).toLocaleDateString()}. Recovery is important for progress.`
                          : "This day was marked as failed and can be retried. Start a new attempt below."}
                      </p>
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Status:</span>{" "}
                        {dayProgress.status === "completed"
                          ? "Completed"
                          : dayProgress.status === "rest"
                          ? "Rest Day Completed"
                          : "Failed"}{" "}
                        •<span className="font-medium ml-2">Date:</span>{" "}
                        {new Date(
                          dayProgress.changed_status_at
                        ).toLocaleDateString()}
                        {dayProgress.attempt_number > 1 && (
                          <>
                            <span className="font-medium ml-2">Attempt:</span>{" "}
                            {dayProgress.attempt_number}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
        </div>

        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Challenge Timeline</h3>
              <span className="text-muted-foreground text-sm">
                Day {dayNumber} of {totalDays}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              {Array.from({ length: totalDays }, (_, i) => {
                const dayNum = i + 1;
                const isCurrentDay = dayNum === dayNumber;
                const isPastDay = dayNum < dayNumber;
                const dayInfo = allDays?.find((d) => d.day_number === dayNum);
                const isRestDay = dayInfo?.is_rest_day;

                return (
                  <div key={i} className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                        isCurrentDay
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                          : isPastDay
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-white/10 text-white/50 border border-white/20"
                      }`}
                    >
                      {isPastDay ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : isRestDay ? (
                        <span className="text-sm">🌿</span>
                      ) : (
                        dayNum
                      )}
                    </div>
                    {i < totalDays - 1 && (
                      <div
                        className={`w-4 h-0.5 ${
                          isPastDay ? "bg-green-500/30" : "bg-white/20"
                        }`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Challenge Day Content */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Day {dayNumber}: {trainingDay.title}
              {isRetryAttempt() && (
                <Badge
                  variant="outline"
                  className="ml-2 border-orange-500/30 text-orange-400"
                >
                  Attempt {dayProgress?.attempt_number}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              {trainingDay.description}
            </p>

            {/* Exercises List */}
            {trainingDay.exercises.length > 0 ? (
              <div className="space-y-4">
                <h4 className="text-white font-medium mb-3">Exercises</h4>
                {trainingDay.exercises.map((exercise, index) => (
                  <div
                    key={exercise.id}
                    className="p-4 rounded-lg border bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleExerciseClick(exercise)}
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        {exercise.figure.image_url ? (
                          <img
                            src={exercise.figure.image_url}
                            alt={exercise.figure.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl py-[10px]">
                            {getExerciseIcon(exercise.figure.category)}
                          </span>
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold flex items-center">
                            <span className="text-lg mr-2">
                              {getExerciseIcon(exercise.figure.category)}
                            </span>
                            {exercise.figure.name}
                          </h3>
                          <Badge
                            className={getDifficultyColor(
                              exercise.figure.difficulty_level
                            )}
                          >
                            {exercise.figure.difficulty_level}
                          </Badge>
                        </div>

                        {exercise.figure.instructions && (
                          <p className="text-muted-foreground text-sm mb-2">
                            {exercise.figure.instructions}
                          </p>
                        )}

                        {/* Exercise Parameters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2">
                          {exercise.sets && (
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-purple-400 rounded-full" />
                              <span>{exercise.sets} sets</span>
                            </div>
                          )}
                          {exercise.reps && (
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-blue-400 rounded-full" />
                              <span>{exercise.reps} reps</span>
                            </div>
                          )}
                          {exercise.hold_time_seconds && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-green-400" />
                              <span>{exercise.hold_time_seconds}s hold</span>
                            </div>
                          )}
                          {exercise.rest_time_seconds && (
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                              <span>{exercise.rest_time_seconds}s rest</span>
                            </div>
                          )}
                        </div>

                        {/* Media and Notes */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {exercise.video_url && (
                            <Badge variant="outline" className="text-xs">
                              <Play className="w-3 h-3 mr-1" />
                              Video
                            </Badge>
                          )}
                          {exercise.audio_url && (
                            <Badge variant="outline" className="text-xs">
                              <Volume2 className="w-3 h-3 mr-1" />
                              Audio
                            </Badge>
                          )}
                        </div>

                        {exercise.notes && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center text-purple-400 text-sm mb-1">
                              <Star className="w-3 h-3 mr-1" />
                              Notes
                            </div>
                            <p className="text-white text-sm">
                              {exercise.notes}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Card className="glass-effect border-white/10 mb-6">
                <CardContent className="p-8 text-center">
                  <div className="space-y-6">
                    <div className="w-24 h-24 mx-auto bg-gradient-to-br from-green-500/20 to-blue-500/20 rounded-full flex items-center justify-center">
                      <span className="text-4xl">🌿</span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Rest Day
                      </h3>
                      <p className="text-muted-foreground text-lg mb-4">
                        Recovery is just as important as training
                      </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
                      <div className="bg-white/5 rounded-lg p-4">
                        <span className="text-2xl mb-2 block">💤</span>
                        <h4 className="text-white font-medium">Rest</h4>
                        <p className="text-sm text-muted-foreground">
                          Get quality sleep
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <span className="text-2xl mb-2 block">🥗</span>
                        <h4 className="text-white font-medium">Nutrition</h4>
                        <p className="text-sm text-muted-foreground">
                          Eat nutrient-rich foods
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-lg p-4">
                        <span className="text-2xl mb-2 block">🧘</span>
                        <h4 className="text-white font-medium">Mindfulness</h4>
                        <p className="text-sm text-muted-foreground">
                          Practice meditation
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons - Show based on attempt status */}
        {shouldShowActionButtons() && (
          <div className="space-y-4">
            {/* Primary Action Button */}
            <div className="flex space-x-3">
              {!trainingDay.is_rest_day ? (
                <Button
                  variant="primary"
                  onClick={handleStartDay}
                  disabled={trainingDay.exercises.length === 0}
                  className="flex-1 disabled:opacity-50"
                >
                  <Play className="w-4 h-4 mr-2" />
                  {isRetryAttempt()
                    ? `Retry Day ${dayNumber}`
                    : `Start Day ${dayNumber}`}
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    if (!user) return;

                    try {
                      // Get the next attempt number for this training day
                      const nextAttemptNumber = await getNextAttemptNumber(
                        user.id,
                        challengeId!,
                        dayId!
                      );

                      // Mark rest day as completed
                      const { error: progressError } = await supabase
                        .from("challenge_day_progress")
                        .insert({
                          user_id: user.id,
                          challenge_id: challengeId!,
                          training_day_id: dayId!,
                          exercises_completed: 0,
                          total_exercises: 0,
                          changed_status_at: new Date().toISOString(),
                          status: "rest",
                          attempt_number: nextAttemptNumber,
                        });

                      if (progressError) throw progressError;

                      // Award points for rest day completion
                      const { error: activityError } = await supabase.rpc(
                        "create_activity_with_points",
                        {
                          user_id: user.id,
                          activity_type: "challenge_day_completed",
                          activity_data: {
                            challenge_id: challengeId,
                            training_day_id: dayId,
                            exercises_completed: 0,
                          },
                          points: 10, // Award 10 points for completing a rest day
                        }
                      );

                      if (activityError)
                        console.error(
                          "Error creating activity:",
                          activityError
                        );

                      toast({
                        title: "Rest Day Complete!",
                        description:
                          "Great job taking time to recover! You earned 10 points.",
                      });

                      // Refresh to update progress
                      window.location.reload();
                    } catch (error) {
                      console.error("Error completing rest day:", error);
                      toast({
                        title: "Error",
                        description:
                          "Failed to mark rest day as complete. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="flex-1 bg-gradient-to-r from-green-500 via-teal-500 to-blue-500 hover:from-green-600 hover:via-teal-600 hover:to-blue-600"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Rest Day
                </Button>
              )}

              <Button
                variant="outline"
                onClick={() => navigate(`/challenges/${challengeId}`)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Back to Challenge
              </Button>
            </div>

            {/* Additional Action Buttons - Only for non-rest days */}
            {!trainingDay.is_rest_day && (
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!user) return;

                    try {
                      // Get the next attempt number for this training day
                      const nextAttemptNumber = await getNextAttemptNumber(
                        user.id,
                        challengeId!,
                        dayId!
                      );

                      const { error } = await supabase
                        .from("challenge_day_progress")
                        .insert({
                          user_id: user.id,
                          challenge_id: challengeId!,
                          training_day_id: dayId!,
                          exercises_completed: 0,
                          total_exercises: trainingDay.exercises.length,
                          status: "rest",
                          changed_status_at: new Date().toISOString(),
                          notes: "User set additional rest day",
                          attempt_number: nextAttemptNumber,
                        });

                      if (error) throw error;

                      toast({
                        title: "Rest Day Set",
                        description:
                          "Today has been marked as a rest day. Take time to recover!",
                      });

                      window.location.reload();
                    } catch (error) {
                      console.error("Error setting rest day:", error);
                      toast({
                        title: "Error",
                        description:
                          "Failed to set rest day. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Set Rest Day
                </Button>

                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!user) return;

                    try {
                      // Get the next attempt number for this training day
                      const nextAttemptNumber = await getNextAttemptNumber(
                        user.id,
                        challengeId!,
                        dayId!
                      );

                      const { error } = await supabase
                        .from("challenge_day_progress")
                        .insert({
                          user_id: user.id,
                          challenge_id: challengeId!,
                          training_day_id: dayId!,
                          exercises_completed: 0,
                          total_exercises: trainingDay.exercises.length,
                          status: "failed",
                          changed_status_at: new Date().toISOString(),
                          notes: "User marked day as failed - needs retry",
                          attempt_number: nextAttemptNumber,
                        });

                      if (error) throw error;

                      toast({
                        title: "Day Marked as Failed",
                        description:
                          "This day will be retried tomorrow. Don't give up!",
                      });

                      window.location.reload();
                    } catch (error) {
                      console.error("Error marking day as failed:", error);
                      toast({
                        title: "Error",
                        description:
                          "Failed to mark day as failed. Please try again.",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Mark as Failed
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Back to Challenge Button - Always show for completed days */}
        {isAttemptCompleted() && (
          <div className="flex justify-center mt-6">
            <Button
              variant="outline"
              onClick={() => navigate(`/challenges/${challengeId}`)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Back to Challenge Overview
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDayOverview;
