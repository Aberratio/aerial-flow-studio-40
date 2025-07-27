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
  ChevronRight,
  List,
  Lock,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  CarouselApi,
} from "@/components/ui/carousel";
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
import { useChallengeCalendar } from "@/hooks/useChallengeCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import { isDayLocked } from "@/lib/utils";
import {
  format,
  parseISO,
  addDays,
  startOfMonth,
  endOfMonth,
  isAfter,
  addMonths,
  subMonths,
  isBefore,
  isSameMonth,
} from "date-fns";
import { useIsTablet } from "@/hooks/use-tablet";

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
  created_by?: string;
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
    duration_seconds?: number;
    training_day_exercises?: Array<{
      id: string;
      figure: {
        id?: string;
        name?: string;
        difficulty_level?: string;
        category?: string;
        instructions?: string;
        image_url?: string;
      };
      sets?: number;
      reps?: number;
      notes?: string;
      hold_time_seconds?: number;
      rest_time_seconds?: number;
    }>;
    exercises?: Array<{
      id: string;
      figure: {
        id?: string;
        name?: string;
        difficulty_level?: string;
        category?: string;
        instructions?: string;
        image_url?: string;
      };
      sets?: number;
      reps?: number;
      hold_time_seconds?: number;
      rest_time_seconds?: number;
    }>;
  }>;
  participants_count?: number;
}

const ChallengePreview = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { canCreateChallenges } = useUserRole();
  const isTablet = useIsTablet();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userParticipant, setUserParticipant] = useState<any>(null);
  const [isResettingProgress, setIsResettingProgress] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState<Date>(
    new Date()
  );
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Use the new refactored challenge calendar hook
  const {
    calendarDays,
    isLoading: calendarLoading,
    generateCalendar,
    getCompletedDays,
  } = useChallengeCalendar(challengeId || "");

  useEffect(() => {
    if (challengeId) {
      fetchChallengeDetails();
      checkParticipation();
    }
  }, [challengeId]);

  // Check if participant needs calendar generation
  useEffect(() => {
    const checkAndGenerateCalendar = async () => {
      if (
        calendarLoading ||
        !isParticipant ||
        !userParticipant ||
        calendarDays.length > 0
      )
        return;

      // Use today as start date if no start date is set
      const startDate = userParticipant.user_started_at
        ? new Date(userParticipant.user_started_at)
        : new Date();

      // Update participant with start date if not set
      if (!userParticipant.user_started_at) {
        await supabase
          .from("challenge_participants")
          .update({ user_started_at: startDate.toISOString() })
          .eq("challenge_id", challengeId)
          .eq("user_id", user?.id);
      }

      // Generate calendar
      await generateCalendar(startDate);

      // Reload participation data
      await checkParticipation();
    };

    checkAndGenerateCalendar();
  }, [
    isParticipant,
    userParticipant,
    calendarDays.length,
    challengeId,
    user?.id,
    generateCalendar,
  ]);

  const fetchChallengeDetails = async () => {
    if (!challengeId) return;

    setIsLoading(true);
    try {
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
            id, day_number, title, description, is_rest_day, 
            duration_seconds,
            training_day_exercises (
              id, sets, reps, hold_time_seconds, rest_time_seconds, notes,
              figure:figures (
                name, difficulty_level, instructions, image_url, category
              )
            )
          )
        `
        )
        .eq("id", challengeId)
        .single();

      if (challengeError) throw challengeError;

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
        training_days:
          challengeData.challenge_training_days?.sort(
            (a: any, b: any) => a.day_number - b.day_number
          ) || [],
        participants_count: participantsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching challenge details:", error);
      toast({
        title: "Error",
        description: "Failed to load challenge details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkParticipation = async () => {
    if (!challengeId || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("*")
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id)
        .single();

      if (!error && data) {
        setIsParticipant(true);
        setUserParticipant(data);
      }
    } catch (error) {
      // User is not a participant
    }
  };

  const joinChallenge = async () => {
    if (!challengeId || !user?.id || isParticipant) return;

    setIsJoining(true);
    try {
      const { data, error } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: "active",
          user_started_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setIsParticipant(true);
      setUserParticipant(data);
      setChallenge((prev) =>
        prev
          ? {
              ...prev,
              participants_count: (prev.participants_count || 0) + 1,
            }
          : null
      );

      toast({
        title: "Success",
        description: "You've joined the challenge!",
      });
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Error",
        description: "Failed to join challenge",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  // Get current training day (last unlocked/accessible training day)
  const getCurrentTrainingDay = () => {
    if (!calendarDays.length) return null;

    // Find the last unlocked training day (furthest accessible day)
    const accessibleDays = calendarDays
      .filter((day) => day.is_accessible)
      .map((cd) => {
        const td = challenge?.training_days?.find(
          (t) => t.id === cd.training_day_id
        );
        return td ? { calendarDay: cd, trainingDay: td } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.trainingDay.day_number - b!.trainingDay.day_number);

    if (!accessibleDays.length) return null;

    // Find the last day that's either pending, failed, or the last completed day
    let currentTrainingDay = null;

    // First, look for failed days (they need to be retried)
    const failedDays = accessibleDays.filter(
      (d) => d!.calendarDay.status === "failed"
    );
    if (failedDays.length > 0) {
      // Return the first failed day (earliest one to retry)
      currentTrainingDay = failedDays[0];
    } else {
      // Look for pending days
      const pendingDays = accessibleDays.filter(
        (d) => d!.calendarDay.status === "pending"
      );
      if (pendingDays.length > 0) {
        // Return the first pending day
        currentTrainingDay = pendingDays[0];
      } else {
        // If no pending or failed days, show the last completed day
        const completedDays = accessibleDays.filter(
          (d) => d!.calendarDay.status === "completed"
        );
        if (completedDays.length > 0) {
          currentTrainingDay = completedDays[completedDays.length - 1];
        }
      }
    }

    return currentTrainingDay || accessibleDays[0];
  };

  // Get upcoming training days for preview
  const getUpcomingTrainingDays = (count = 3) => {
    if (!calendarDays.length) return [];

    const currentDay = getCurrentTrainingDay();
    if (!currentDay) return [];

    const allDays = calendarDays
      .map((cd) => {
        const td = challenge?.training_days?.find(
          (t) => t.id === cd.training_day_id
        );
        return td ? { calendarDay: cd, trainingDay: td } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.trainingDay.day_number - b!.trainingDay.day_number);

    const currentIndex = allDays.findIndex(
      (d) => d!.calendarDay.id === currentDay.calendarDay.id
    );

    // Return current day + next days
    return allDays.slice(currentIndex, currentIndex + count);
  };

  const startTodaysChallenge = async () => {
    if (!challengeId || !user?.id) return;

    const currentDay = getCurrentTrainingDay();
    if (currentDay) {
      navigate(`/challenge/${challengeId}/day/${currentDay.calendarDay.id}`);
    } else {
      // Fallback to first day if no current day found
      const firstDay = challenge?.training_days?.[0];
      if (firstDay) {
        const firstCalendarDay = calendarDays.find(
          (cd) => cd.training_day_id === firstDay.id
        );
        if (firstCalendarDay) {
          navigate(`/challenge/${challengeId}/day/${firstCalendarDay.id}`);
        }
      }
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

  // Remove old calendar generation logic - now handled by the hook

  const resetChallengeProgress = async () => {
    if (!challengeId || !user?.id) return;

    setIsResettingProgress(true);
    try {
      // Delete all calendar days for this challenge
      const { error: calendarError } = await supabase
        .from("user_challenge_calendar_days")
        .delete()
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId);

      if (calendarError) throw calendarError;

      // Remove the participant record entirely
      const { error: participantError } = await supabase
        .from("challenge_participants")
        .delete()
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      toast({
        title: "Progress Reset",
        description: "Your challenge progress has been reset successfully!",
      });

      // Navigate to challenges page
      navigate("/challenges");
    } catch (error) {
      console.error("Error resetting progress:", error);
      toast({
        title: "Error",
        description: "Failed to reset challenge progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsResettingProgress(false);
    }
  };

  // Calendar functionality
  const getCalendarDayInfo = (date: Date) => {
    if (!challenge?.training_days || !userParticipant?.user_started_at)
      return null;

    // Check the generated calendar days instead of just training days
    const dateString = format(date, "yyyy-MM-dd");
    const dayInfo = calendarDays.find(
      (day) => day.calendar_date === dateString
    );

    if (dayInfo) {
      const trainingDay = challenge.training_days?.find(
        (td) => td.id === dayInfo.training_day_id
      );

      if (!trainingDay) return null;

      return {
        trainingDay,
        // For failed repetitions, reset status - show as fresh attempt
        isCompleted: dayInfo.status === "completed",
        isFailed: dayInfo.status === "failed",
        isRest: dayInfo.status === "rest",
        isToday: dayInfo.is_today,
        isPast: dayInfo.is_past,
        isFailedRepetition: dayInfo.is_retry,
        isAccessible: dayInfo.is_accessible,
        id: dayInfo.id,
      };
    }
    return null;
  };

  const handleCalendarDayClick = (date: Date) => {
    const dayInfo = getCalendarDayInfo(date);
    if (
      dayInfo &&
      dayInfo.isAccessible &&
      !isDayLocked(dayInfo.trainingDay.day_number, calendarDays)
    ) {
      navigate(`/challenge/${challengeId}/day/${dayInfo.id}`);
    }
  };

  const getCalendarStartMonth = () => {
    if (!userParticipant?.user_started_at) return new Date();
    return startOfMonth(parseISO(userParticipant.user_started_at));
  };

  const getCalendarEndMonth = () => {
    if (!challenge?.training_days || !userParticipant?.user_started_at)
      return new Date();

    const startDate = parseISO(userParticipant.user_started_at);
    const lastDay = challenge.training_days[challenge.training_days.length - 1];
    const lastDate = addDays(startDate, lastDay.day_number - 1);
    return endOfMonth(lastDate);
  };

  // Month navigation functions
  const hasMultipleMonths = () => {
    const startMonth = getCalendarStartMonth();
    const endMonth = getCalendarEndMonth();
    return !isSameMonth(startMonth, endMonth);
  };

  const canNavigateToPreviousMonth = () => {
    const startMonth = getCalendarStartMonth();
    return isAfter(currentCalendarMonth, startMonth);
  };

  const canNavigateToNextMonth = () => {
    const endMonth = getCalendarEndMonth();
    return isBefore(currentCalendarMonth, endMonth);
  };

  const navigateToPreviousMonth = () => {
    if (canNavigateToPreviousMonth()) {
      setCurrentCalendarMonth(subMonths(currentCalendarMonth, 1));
    }
  };

  const navigateToNextMonth = () => {
    if (canNavigateToNextMonth()) {
      setCurrentCalendarMonth(addMonths(currentCalendarMonth, 1));
    }
  };

  const hasTrainingDaysInMonth = (month: Date) => {
    return calendarDays.some((day) => {
      const dayDate = new Date(day.calendar_date);
      return isSameMonth(dayDate, month);
    });
  };

  // Set initial calendar month when user participation is loaded
  useEffect(() => {
    if (userParticipant?.user_started_at && calendarDays.length > 0) {
      const startMonth = getCalendarStartMonth();
      setCurrentCalendarMonth(startMonth);
    }
  }, [userParticipant?.user_started_at, calendarDays.length]);

  // Auto-scroll to ready-to-start day when carousel is ready (only on first render)
  useEffect(() => {
    if (
      carouselApi &&
      isParticipant &&
      challenge?.training_days &&
      calendarDays.length > 0
    ) {
      const allTrainingDays = challenge.training_days
        .map((trainingDay) => {
          const calendarDay = calendarDays.find(
            (cd) => cd.training_day_id === trainingDay.id
          );
          return calendarDay
            ? { calendarDay, trainingDay }
            : { calendarDay: null, trainingDay };
        })
        .sort((a, b) => a.trainingDay.day_number - b.trainingDay.day_number);

      // Find the ready-to-start day (today and pending/accessible)
      const readyDayIndex = allTrainingDays.findIndex((dayData, index) => {
        const { calendarDay } = dayData;
        const previousDayData = allTrainingDays[index - 1];
        const isPreviousDayCompleted =
          index === 0 || previousDayData?.calendarDay?.status === "completed";
        const isBlocked =
          !isPreviousDayCompleted && calendarDay?.status !== "completed";
        const isToday =
          calendarDay?.calendar_date === format(new Date(), "yyyy-MM-dd");
        const isAccessible = calendarDay?.is_accessible || false;
        const isPending = calendarDay?.status === "pending";

        return !isBlocked && isPending && isAccessible && isToday;
      });

      if (readyDayIndex >= 0) {
        carouselApi.scrollTo(readyDayIndex);
      }
    }
  }, [carouselApi, isParticipant, challenge?.training_days, calendarDays]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Challenge not found
          </h2>
          <Button onClick={() => navigate("/challenges")} variant="outline">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/challenges")}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>

            {canCreateChallenges &&
              (user?.role === "admin" ||
                challenge?.created_by === user?.id) && (
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

          {/* Challenge Name */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-8">
            {challenge.title}
          </h1>
        </div>

        {/* Training Days Slider */}
        {isParticipant &&
          (() => {
            const allTrainingDays =
              challenge?.training_days
                ?.map((trainingDay) => {
                  const calendarDay = calendarDays.find(
                    (cd) => cd.training_day_id === trainingDay.id
                  );
                  return calendarDay
                    ? { calendarDay, trainingDay }
                    : { calendarDay: null, trainingDay };
                })
                .sort(
                  (a, b) => a.trainingDay.day_number - b.trainingDay.day_number
                ) || [];

            if (!allTrainingDays.length) return null;

            return (
              <div className="mb-12">
                <Carousel className="w-full" setApi={setCarouselApi}>
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {allTrainingDays.map((dayData, index) => {
                      const { calendarDay, trainingDay } = dayData;
                      const exercises =
                        trainingDay.training_day_exercises || [];
                      const isCompleted = calendarDay?.status === "completed";
                      const isFailed = calendarDay?.status === "failed";
                      const isRestDay = trainingDay.is_rest_day;
                      const isAccessible = calendarDay?.is_accessible || false;
                      const isPending = calendarDay?.status === "pending";

                      // Check if previous day is completed (blocking mechanism)
                      const previousDayData = allTrainingDays[index - 1];
                      const isPreviousDayCompleted =
                        index === 0 ||
                        previousDayData?.calendarDay?.status === "completed";
                      const isBlocked = !isPreviousDayCompleted && !isCompleted;

                      // Check if this is today's training and ready to start
                      const isToday =
                        calendarDay?.calendar_date ===
                        format(new Date(), "yyyy-MM-dd");
                      const isReadyToStart =
                        !isBlocked && isPending && isAccessible && isToday;

                      // Calculate total duration
                      const formatTime = (seconds: number) => {
                        const mins = Math.floor(seconds / 60);
                        const secs = seconds % 60;
                        return mins > 0
                          ? `${mins}:${secs.toString().padStart(2, "0")}`
                          : `0:${secs.toString().padStart(2, "0")}`;
                      };

                      const totalDuration = trainingDay.duration_seconds || 0;

                      return (
                        <CarouselItem
                          key={trainingDay.id}
                          className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3"
                        >
                          <Card
                            className={`glass-effect overflow-hidden h-full transition-all duration-200 ${
                              isBlocked
                                ? "border-muted/30 opacity-50 cursor-not-allowed"
                                : isCompleted
                                ? "border-emerald-500/50"
                                : isFailed
                                ? "border-red-500/50"
                                : isReadyToStart
                                ? "border-primary/60 ring-2 ring-primary/30 shadow-lg shadow-primary/20"
                                : isPending && isAccessible
                                ? "border-purple-500/50 ring-1 ring-purple-500/30"
                                : "border-white/10"
                            } ${
                              !isBlocked && isAccessible && calendarDay
                                ? "cursor-pointer hover:bg-white/5"
                                : ""
                            }`}
                            onClick={() =>
                              !isBlocked &&
                              calendarDay &&
                              isAccessible &&
                              (isPending
                                ? navigate(
                                    `/challenge/${challengeId}/day/${calendarDay.id}/timer`
                                  )
                                : navigate(
                                    `/challenge/${challengeId}/day/${calendarDay.id}`
                                  ))
                            }
                          >
                            {/* Header */}
                            <div
                              className={`relative h-20 flex items-center justify-between px-4 ${
                                isBlocked
                                  ? "bg-gradient-to-r from-muted/40 to-muted/20"
                                  : isReadyToStart
                                  ? "bg-gradient-to-r from-primary/80 to-primary/60"
                                  : "bg-gradient-to-r from-purple-600/80 to-blue-600/80"
                              }`}
                            >
                              <div className="absolute inset-0 bg-black/20"></div>
                              <div className="relative z-10 flex items-center gap-2">
                                <div className="text-xl">
                                  {isBlocked
                                    ? "🔒"
                                    : isCompleted
                                    ? "✅"
                                    : isFailed
                                    ? "❌"
                                    : isRestDay
                                    ? "🌴"
                                    : isReadyToStart
                                    ? "⭐"
                                    : "💪"}
                                </div>
                                <div>
                                  <h3
                                    className={`text-lg font-bold ${
                                      isBlocked
                                        ? "text-muted-foreground"
                                        : "text-white"
                                    }`}
                                  >
                                    DAY {trainingDay.day_number}
                                    {calendarDay?.is_retry && " (RETRY)"}
                                  </h3>
                                  <div
                                    className={`text-sm ${
                                      isBlocked
                                        ? "text-muted-foreground/70"
                                        : "text-white/90"
                                    }`}
                                  >
                                    {isBlocked
                                      ? "Complete previous day first"
                                      : trainingDay.title ||
                                        (isRestDay
                                          ? "Rest Day"
                                          : "Training Day")}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <CardContent className="p-4 flex-1">
                              {/* Duration and Exercise Count */}
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4" />
                                  {isRestDay
                                    ? "Rest Day"
                                    : `${Math.ceil(totalDuration / 60)} mins`}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                  <List className="w-4 h-4" />
                                  {exercises.length} exercises
                                </div>
                              </div>

                              {/* Day Notes */}
                              {(calendarDay?.notes ||
                                trainingDay.description) && (
                                <div className="mb-4">
                                  <p
                                    className={`text-sm ${
                                      isBlocked
                                        ? "text-muted-foreground/70"
                                        : "text-muted-foreground"
                                    }`}
                                  >
                                    {calendarDay?.notes ||
                                      trainingDay.description}
                                  </p>
                                </div>
                              )}

                              {/* Exercise List (fallback for older design) */}
                              {!isRestDay && exercises.length > 0 && (
                                <div className="space-y-2 mt-4">
                                  {exercises
                                    .slice(0, 3)
                                    .map((exercise, exerciseIndex) => (
                                      <div
                                        key={exercise.id}
                                        className="flex items-center justify-between p-2 bg-white/5 rounded border border-white/10"
                                      >
                                        <div className="flex-1">
                                          <h4
                                            className={`font-medium text-sm ${
                                              isBlocked
                                                ? "text-muted-foreground"
                                                : "text-white"
                                            }`}
                                          >
                                            {exercise.figure.name}
                                          </h4>
                                          {exercise.notes && (
                                            <p className="text-muted-foreground text-sm mb-3">
                                              {exercise.notes}
                                            </p>
                                          )}
                                          <div
                                            className={`text-xs ${
                                              isBlocked
                                                ? "text-muted-foreground/70"
                                                : "text-purple-400"
                                            }`}
                                          >
                                            {formatTime(
                                              exercise.hold_time_seconds || 30
                                            )}
                                            {exercise.sets &&
                                              exercise.sets > 1 &&
                                              ` × ${exercise.sets}`}
                                          </div>
                                        </div>

                                        {/* Exercise preview - photo of the exercise */}
                                        <div
                                          className={`w-full sm:w-20 h-48 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ${
                                            isBlocked ? "opacity-50" : ""
                                          }`}
                                        >
                                          {exercise.figure?.image_url ? (
                                            <img
                                              src={exercise.figure.image_url}
                                              alt={exercise.figure.name}
                                              className="w-full h-full object-cover"
                                            />
                                          ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                              <Target className="w-4 h-4 text-muted-foreground" />
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}

                                  {exercises.length > 3 && (
                                    <div className="text-center py-2">
                                      <span
                                        className={`text-xs ${
                                          isBlocked
                                            ? "text-muted-foreground/70"
                                            : "text-muted-foreground"
                                        }`}
                                      >
                                        +{exercises.length - 3} more exercises
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Rest Day Content */}
                              {isRestDay && (
                                <div className="text-center py-6">
                                  <div className="text-4xl mb-2">🌴</div>
                                  <p className="text-muted-foreground text-sm">
                                    Take time to recover and prepare for
                                    tomorrow
                                  </p>
                                </div>
                              )}

                              {/* Status Badge and Action Button */}
                              <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                                {/* Start Workout Button for Ready Day */}
                                {isReadyToStart && (
                                  <Button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(
                                        `/challenge/${challengeId}/day/${calendarDay?.id}/timer`
                                      );
                                    }}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                                  >
                                    <Play className="w-4 h-4 mr-2" />
                                    Start Workout
                                  </Button>
                                )}

                                <div className="text-center">
                                  {isCompleted ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                      Completed ✓
                                    </span>
                                  ) : isFailed ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                      Failed - Retry
                                    </span>
                                  ) : isBlocked ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted/20 text-muted-foreground border border-muted/30">
                                      🔒 Locked
                                    </span>
                                  ) : isReadyToStart ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                                      ⭐ Train Today
                                    </span>
                                  ) : isPending && isAccessible ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                      Ready to Start
                                    </span>
                                  ) : isAccessible ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                      Available
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-500/20 text-gray-400 border border-gray-500/30">
                                      <Lock className="w-3 h-3 mr-1" />
                                      Locked
                                    </span>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </CarouselItem>
                      );
                    })}
                  </CarouselContent>
                  <CarouselPrevious className="hidden md:flex" />
                  <CarouselNext className="hidden md:flex" />
                </Carousel>
              </div>
            );
          })()}

        {/* Challenge Details */}
        <div className="mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Challenge Hero */}
            <div className="space-y-6">
              <div className="relative h-48 sm:h-56 lg:h-64 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                {challenge.image_url ? (
                  <img
                    src={challenge.image_url}
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="w-12 h-12 lg:w-16 lg:h-16 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <h1 className="text-2xl sm:text-3xl lg:text-3xl font-bold text-white line-clamp-2">
                    {challenge.title}
                  </h1>
                </div>
              </div>

              <p className="text-muted-foreground text-base lg:text-lg leading-relaxed line-clamp-4 lg:line-clamp-none">
                {challenge.description}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                {!isParticipant ? (
                  <Button
                    onClick={joinChallenge}
                    disabled={isJoining}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white w-full sm:flex-1"
                  >
                    {isJoining ? "Joining..." : "Join Challenge"}
                  </Button>
                ) : (
                  <>
                    {/* Reset Progress Button */}
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          Reset Progress
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="glass-effect border-white/10">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-400" />
                            Reset Challenge Progress
                          </AlertDialogTitle>
                          <AlertDialogDescription className="text-muted-foreground">
                            This action will permanently delete all your
                            progress for this challenge. You will start from day
                            1 again and lose all completed day records. This
                            action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={resetChallengeProgress}
                            disabled={isResettingProgress}
                            className="bg-red-600 hover:bg-red-700 text-white"
                          >
                            {isResettingProgress
                              ? "Resetting..."
                              : "Reset Progress"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>

            {/* Challenge Stats */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Duration
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      {challenge.training_days?.length || 0}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-white/10">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Participants
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      {challenge.participants_count?.toLocaleString() || "0"}
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-white/10">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <Target className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Difficulty
                    </div>
                    <Badge
                      className={`mt-1 ${getDifficultyColor(
                        challenge.difficulty_level || "intermediate"
                      )}`}
                    >
                      {challenge.difficulty_level?.charAt(0).toUpperCase() +
                        challenge.difficulty_level?.slice(1) || "Intermediate"}
                    </Badge>
                  </CardContent>
                </Card>

                <Card className="glass-effect border-white/10">
                  <CardContent className="p-3 sm:p-4 text-center">
                    <CalendarDays className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-xs sm:text-sm text-muted-foreground">
                      Training Days
                    </div>
                    <div className="text-lg sm:text-xl font-bold text-white">
                      {challenge.training_days?.filter(
                        (day) => !day.is_rest_day
                      ).length || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Progress Card for Participants */}
              {isParticipant && (
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-white font-semibold">
                        Your Progress
                      </h3>
                      <Badge className="bg-purple-500/20 text-purple-400">
                        {getCompletedDays().length} of{" "}
                        {challenge.training_days?.length || 0}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Days Completed</span>
                        <span>
                          {Math.round(
                            (getCompletedDays().length /
                              (challenge.training_days?.length || 1)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (getCompletedDays().length /
                            (challenge.training_days?.length || 1)) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {getCompletedDays().length === 0
                        ? "Ready to start your journey!"
                        : getCompletedDays().length ===
                          challenge.training_days?.length
                        ? "🎉 Challenge completed! Amazing work!"
                        : "Keep going, you're doing great!"}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Challenge Rules */}
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white text-lg">
                    Challenge Rules
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                    <span className="text-muted-foreground text-sm">
                      Complete training sessions in order
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                    <span className="text-muted-foreground text-sm">
                      Follow rest days as scheduled
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                    <span className="text-muted-foreground text-sm">
                      {challenge.type === "timer"
                        ? "Follow timer instructions carefully"
                        : "Track your progress manually"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full flex-shrink-0"></div>
                    <span className="text-muted-foreground text-sm">
                      Earn achievements by completing milestones
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Challenge Training Schedule */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Challenge Training Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Calendar View for Participants */}
            {isParticipant && userParticipant?.user_started_at && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-semibold">
                    {isTablet && "Your Training Schedule"}
                  </h3>
                </div>

                {isTablet ? (
                  /* Mobile-friendly list view */
                  <div className="space-y-3">
                    {calendarDays
                      .sort((a, b) => {
                        // Sort by day number from training day
                        const dayA =
                          challenge?.training_days?.find(
                            (td) => td.id === a.training_day_id
                          )?.day_number || 0;
                        const dayB =
                          challenge?.training_days?.find(
                            (td) => td.id === b.training_day_id
                          )?.day_number || 0;
                        return dayA - dayB;
                      })
                      .map((calendarDay) => {
                        const trainingDay = challenge?.training_days?.find(
                          (td) => td.id === calendarDay.training_day_id
                        );
                        if (!trainingDay) return null;

                        const isCompleted = calendarDay.status === "completed";
                        const isFailed = calendarDay.status === "failed";
                        const isToday = calendarDay.is_today;
                        const isAccessible = calendarDay.is_accessible;
                        const isRest = trainingDay.is_rest_day;
                        const isLocked = isDayLocked(
                          trainingDay.day_number,
                          calendarDays
                        );

                        return (
                          <Card
                            key={calendarDay.id}
                            className={`glass-effect border transition-all ${
                              isCompleted
                                ? "border-emerald-500/50 bg-emerald-500/10"
                                : isFailed
                                ? "border-red-500/50 bg-red-500/10"
                                : isToday
                                ? "border-purple-500/50 bg-purple-500/10 ring-1 ring-purple-500/30"
                                : isRest
                                ? "border-green-500/50 bg-green-500/10"
                                : isAccessible && !isLocked
                                ? "border-blue-500/50 bg-blue-500/10"
                                : "border-white/10 bg-white/5 opacity-60"
                            } ${
                              isAccessible && !isLocked
                                ? "cursor-pointer hover:bg-white/10"
                                : "cursor-not-allowed"
                            }`}
                            onClick={() =>
                              isAccessible &&
                              !isLocked &&
                              handleCalendarDayClick(
                                new Date(calendarDay.calendar_date)
                              )
                            }
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div className="text-2xl">
                                    {isCompleted ? (
                                      "✅"
                                    ) : isFailed ? (
                                      "❌"
                                    ) : isRest ? (
                                      "🌴"
                                    ) : isToday ? (
                                      "🎯"
                                    ) : isLocked ? (
                                      <Lock className="w-6 h-6 text-gray-400" />
                                    ) : (
                                      "💪"
                                    )}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-white">
                                        Day {trainingDay.day_number}
                                      </span>
                                      {calendarDay.is_retry && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-yellow-500/50 text-yellow-400"
                                        >
                                          🔄 Retry
                                        </Badge>
                                      )}
                                      {isToday && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-purple-500/50 text-purple-400"
                                        >
                                          Today
                                        </Badge>
                                      )}
                                    </div>
                                    <div className="text-sm text-muted-foreground">
                                      {format(
                                        new Date(calendarDay.calendar_date),
                                        "MMM d, yyyy"
                                      )}
                                    </div>
                                    {trainingDay.title && (
                                      <div className="text-sm text-white/70 mt-1">
                                        {trainingDay.title}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                  <Badge
                                    variant="outline"
                                    className={
                                      isCompleted
                                        ? "border-emerald-500/50 text-emerald-400"
                                        : isFailed
                                        ? "border-red-500/50 text-red-400"
                                        : isRest
                                        ? "border-green-500/50 text-green-400"
                                        : isToday
                                        ? "border-purple-500/50 text-purple-400"
                                        : isAccessible && !isLocked
                                        ? "border-blue-500/50 text-blue-400"
                                        : "border-gray-500/50 text-gray-400"
                                    }
                                  >
                                    {isCompleted
                                      ? "Completed"
                                      : isFailed
                                      ? "Failed"
                                      : isRest
                                      ? "Rest Day"
                                      : isToday
                                      ? "Today"
                                      : isAccessible && !isLocked
                                      ? "Ready"
                                      : "Locked"}
                                  </Badge>
                                  {isAccessible && !isLocked && (
                                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  {(isLocked ||
                                    (!isAccessible &&
                                      !isCompleted &&
                                      !isFailed)) && (
                                    <Lock className="w-4 h-4 text-gray-400" />
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  /* Desktop/tablet calendar view */
                  <div className="bg-white/5 rounded-lg border border-white/10 w-[690px] 2xl:w-[760px]">
                    {/* Month Navigation Header (only show if multiple months) */}
                    {hasMultipleMonths() && (
                      <div className="flex items-center justify-between p-4 border-b border-white/10">
                        <h4 className="text-white font-medium">
                          {format(currentCalendarMonth, "MMMM yyyy")}
                        </h4>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={navigateToPreviousMonth}
                            disabled={!canNavigateToPreviousMonth()}
                            className="text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed h-8 w-8 p-0"
                          >
                            <ChevronLeft className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={navigateToNextMonth}
                            disabled={!canNavigateToNextMonth()}
                            className="text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed h-8 w-8 p-0"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    <div className="p-2 2xl:p-6">
                      <Calendar
                        mode="single"
                        month={currentCalendarMonth}
                        onMonthChange={setCurrentCalendarMonth}
                        className="pointer-events-auto w-full [&_td]:!h-24 [&_th]:!h-12 [&_td]:!w-24 [&_tbody_td]:!p-1 [&_th]:!text-base [&_button]:!h-full [&_button]:!w-full [&_button]:!text-sm [&_button]:!flex [&_button]:!flex-col [&_button]:!items-start [&_button]:!justify-start [&_button]:!gap-1 [&_button]:!p-2"
                        components={{
                          DayContent: ({ date }) => {
                            const dayInfo = getCalendarDayInfo(date);
                            const dayNumber = date.getDate();

                            if (!dayInfo) {
                              return (
                                <span className="text-muted-foreground">
                                  {dayNumber}
                                </span>
                              );
                            }

                            const {
                              trainingDay,
                              isCompleted,
                              isFailed,
                              isRest,
                              isToday,
                              isAccessible,
                              isFailedRepetition,
                            } = dayInfo;

                            const isLocked = isDayLocked(
                              trainingDay.day_number,
                              calendarDays
                            );

                            return (
                              <div
                                className={`
                                relative w-full h-full rounded-lg border-2 transition-all cursor-pointer flex flex-col p-2
                                 ${
                                   isCompleted
                                     ? "bg-emerald-500 border-emerald-400 text-white shadow-lg"
                                     : isFailed
                                     ? "bg-red-500/30 border-red-500/50 text-red-400 hover:bg-red-500/40"
                                     : isToday
                                     ? "bg-purple-500 border-purple-400 text-white shadow-lg animate-pulse"
                                     : trainingDay.is_rest_day
                                     ? "bg-green-500/20 border-green-500/40 text-green-400 hover:bg-green-500/30"
                                     : isAccessible && !isLocked
                                     ? "bg-blue-500/20 border-blue-500/40 text-blue-400 hover:bg-blue-500/30"
                                     : "bg-gray-500/20 border-gray-500/30 text-gray-500 opacity-50 cursor-not-allowed"
                                 }
                              `}
                              >
                                <div className="absolute top-1 left-1 text-xs font-bold">
                                  {dayNumber}
                                </div>
                                <div className="flex-1 flex items-center justify-center">
                                  <div className="text-2xl">
                                    {isCompleted ? (
                                      "✅"
                                    ) : isFailed ? (
                                      "❌"
                                    ) : trainingDay.is_rest_day || isRest ? (
                                      "🌴"
                                    ) : isLocked ? (
                                      <Lock className="w-6 h-6 text-gray-400" />
                                    ) : (
                                      "💪"
                                    )}
                                  </div>
                                </div>
                                <div className="text-xs text-center leading-tight mt-auto">
                                  Day {trainingDay.day_number}
                                </div>
                                {isFailedRepetition && (
                                  <div className="absolute top-1 right-1 text-xs">
                                    🔄
                                  </div>
                                )}
                                {isCompleted && trainingDay.is_rest_day && (
                                  <div className="absolute top-1 right-1 text-xs">
                                    🌴
                                  </div>
                                )}
                                {(isLocked ||
                                  (!isAccessible &&
                                    !isCompleted &&
                                    !isFailed)) && (
                                  <div className="absolute bottom-1 right-1 text-xs">
                                    <Lock className="w-3 h-3 text-gray-400" />
                                  </div>
                                )}
                              </div>
                            );
                          },
                        }}
                        onDayClick={handleCalendarDayClick}
                        disabled={(date) => {
                          const dayInfo = getCalendarDayInfo(date);
                          return (
                            !dayInfo ||
                            !dayInfo.isAccessible ||
                            isAfter(date, new Date()) ||
                            isDayLocked(
                              dayInfo.trainingDay.day_number,
                              calendarDays
                            )
                          );
                        }}
                        fromMonth={getCalendarStartMonth()}
                        toMonth={getCalendarEndMonth()}
                      />

                      {/* Calendar Legend */}
                      <div className="mt-4 flex flex-wrap gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-blue-500/30 rounded border border-blue-500/50"></div>
                          <span className="text-blue-400">Training Day</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-green-500/30 rounded border border-green-500/50"></div>
                          <span className="text-green-400">Rest Day</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                          <span className="text-emerald-400">Completed</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-red-500/30 rounded border border-red-500/50"></div>
                          <span className="text-red-400">Failed (Retry)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-purple-500 rounded"></div>
                          <span className="text-purple-400">Today</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-gray-500/30 rounded border border-gray-500/50"></div>
                          <span className="text-gray-400">Locked/Future</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Achievements */}
        {challenge.achievements && challenge.achievements.length > 0 && (
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Challenge Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenge.achievements.map((achievement) => (
                  <Card
                    key={achievement.id}
                    className="glass-effect border-white/10"
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <div className="font-medium text-white">
                          {achievement.name}
                        </div>
                        <div className="text-sm text-purple-400">
                          {achievement.points} points
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChallengePreview;
