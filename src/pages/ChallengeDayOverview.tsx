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
import { useChallengeCalendar } from "@/hooks/useChallengeCalendar";

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

interface UserChallengeCalendar {
  id: string;
  training_day_id: string;
  user_id: string;
  status: string;
  is_retry: boolean;
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
  const [userChallengeCalendar, setUserChallengeCalendar] =
    useState<UserChallengeCalendar | null>(null);
  const [participationStatus, setParticipationStatus] = useState<string>("");
  const [userParticipant, setUserParticipant] = useState<any>(null);
  const [showStartDateModal, setShowStartDateModal] = useState(false);
  const [restDayAction, setRestDayAction] = useState(false);
  const [failedDayAction, setFailedDayAction] = useState(false);
  const { user } = useAuth();
  const { canCreateChallenges } = useUserRole();

  // Use the new refactored challenge calendar hook
  const {
    isLoading: calendarLoading,
    changeDayStatus,
    getCalendarDayByTrainingDay,
  } = useChallengeCalendar(challengeId || "");
  const { toast } = useToast();

  // Helper function to check if this is a retry attempt
  const isRetryAttempt = (): boolean => {
    return userChallengeCalendar && userChallengeCalendar.is_retry;
  };

  // Helper function to check if this attempt is completed
  const isAttemptCompleted = (): boolean => {
    return (
      userChallengeCalendar &&
      (userChallengeCalendar.status === "completed" ||
        userChallengeCalendar.status === "rest")
    );
  };

  // Helper function to check if we should show action buttons
  const shouldShowActionButtons = (): boolean => {
    return (
      userChallengeCalendar &&
      (userChallengeCalendar.status === "pending" ||
        userChallengeCalendar.status === "rest")
    );
  };

  const fetchChallengeAndDay = async () => {
    try {
      setIsLoading(true);

      console.log("dayId", dayId);
      console.log("challengeId", challengeId);
      console.log("user?.id", user?.id);
      console.log("userChallengeCalendar", userChallengeCalendar);
      console.log("userParticipant", userParticipant);

      // Fetch challenge details
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select("*")
        .eq("id", challengeId)
        .single();

      console.log("challengeData", challengeData);

      if (challengeError) throw challengeError;
      setChallenge(challengeData);

      // Fetch user challenge calendar details
      const {
        data: userChallengeCalendarData,
        error: userChallengeCalendarError,
      } = await supabase
        .from("user_challenge_calendar_days")
        .select("*")
        .eq("id", dayId)
        .eq("user_id", user?.id)
        .single();
      if (userChallengeCalendarError) throw userChallengeCalendarError;
      setUserChallengeCalendar(userChallengeCalendarData);

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
        .eq("id", userChallengeCalendarData.training_day_id)
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

  useEffect(() => {
    if (challengeId && dayId && user?.id) {
      fetchChallengeAndDay();
    }
  }, [challengeId, dayId]);

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
      navigate(`/challenges/${challengeId}`);
    } catch (error) {
      console.error("Error changing status:", error);
      toast({
        title: "Error",
        description: "Failed to change day status. Please try again.",
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

  // Get the current calendar day status
  const calendarDay = getCalendarDayByTrainingDay(trainingDay.id);
  const isCompleted = calendarDay?.status === "completed";
  const isFailed = calendarDay?.status === "failed";
  const isRest = calendarDay?.status === "rest";
  const isRetry = calendarDay?.is_retry;

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
          {userChallengeCalendar &&
            (userChallengeCalendar.status === "completed" ||
              userChallengeCalendar.status === "rest" ||
              userChallengeCalendar.status === "failed") && (
              <Card className="glass-effect border-white/10 mb-6">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {userChallengeCalendar.status === "completed" ||
                      userChallengeCalendar.status === "rest" ? (
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
                        {userChallengeCalendar.status === "completed"
                          ? "Day Completed! 🎉"
                          : userChallengeCalendar.status === "rest"
                          ? "Rest Day Completed! 🌿"
                          : "Day Previously Failed"}
                      </h3>
                      {/* <p className="text-muted-foreground mb-3">
                        {userChallengeCalendar.status === "completed"
                          ? `Great job! You completed this training day on ${new Date(
                              userChallengeCalendar.changed_status_at
                            ).toLocaleDateString()}. You're viewing this day for reference only.`
                          : userChallengeCalendar.status === "rest"
                          ? `Well done! You completed this rest day on ${new Date(
                              userChallengeCalendar.changed_status_at
                            ).toLocaleDateString()}. Recovery is important for progress.`
                          : "This day was marked as failed and can be retried. Start a new attempt below."}
                      </p> */}
                      <div className="text-sm text-muted-foreground">
                        <span className="font-medium">Status:</span>{" "}
                        {userChallengeCalendar.status === "completed"
                          ? "Completed"
                          : userChallengeCalendar.status === "rest"
                          ? "Rest Day Completed"
                          : "Failed"}{" "}
                        {/* •<span className="font-medium ml-2">Date:</span>{" "}
                        {new Date(
                          userChallengeCalendar.changed_status_at
                        ).toLocaleDateString()}
                        {userChallengeCalendar.attempt_number > 1 && (
                          <>
                            <span className="font-medium ml-2">Attempt:</span>{" "}
                            {userChallengeCalendar.attempt_number}
                          </>
                        )} */}
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
              {/* {isRetryAttempt() && (
                <Badge
                  variant="outline"
                  className="ml-2 border-orange-500/30 text-orange-400"
                >
                  Attempt {userChallengeCalendar?.attempt_number}
                </Badge>
              )} */}
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
                  onClick={() => handleStatusChange("rest")}
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
                  onClick={() => handleStatusChange("rest")}
                  className="flex-1 border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Set Rest Day
                </Button>

                <Button
                  variant="outline"
                  onClick={() => handleStatusChange("failed")}
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
