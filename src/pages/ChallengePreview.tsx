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
    exercises?: Array<{
      id: string;
      figure: {
        name: string;
        difficulty_level: string;
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
            training_day_exercises (
              id, sets, reps, hold_time_seconds, rest_time_seconds,
              figure:figures (
                name, difficulty_level
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
      .filter(day => day.is_accessible)
      .map(cd => {
        const td = challenge?.training_days?.find(t => t.id === cd.training_day_id);
        return td ? { calendarDay: cd, trainingDay: td } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.trainingDay.day_number - b!.trainingDay.day_number);

    if (!accessibleDays.length) return null;

    // Find the last day that's either pending, failed, or the last completed day
    let currentTrainingDay = null;

    // First, look for failed days (they need to be retried)
    const failedDays = accessibleDays.filter(d => d!.calendarDay.status === "failed");
    if (failedDays.length > 0) {
      // Return the first failed day (earliest one to retry)
      currentTrainingDay = failedDays[0];
    } else {
      // Look for pending days
      const pendingDays = accessibleDays.filter(d => d!.calendarDay.status === "pending");
      if (pendingDays.length > 0) {
        // Return the first pending day
        currentTrainingDay = pendingDays[0];
      } else {
        // If no pending or failed days, show the last completed day
        const completedDays = accessibleDays.filter(d => d!.calendarDay.status === "completed");
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
      .map(cd => {
        const td = challenge?.training_days?.find(t => t.id === cd.training_day_id);
        return td ? { calendarDay: cd, trainingDay: td } : null;
      })
      .filter(Boolean)
      .sort((a, b) => a!.trainingDay.day_number - b!.trainingDay.day_number);

    const currentIndex = allDays.findIndex(d => d!.calendarDay.id === currentDay.calendarDay.id);
    
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
        const firstCalendarDay = calendarDays.find(cd => cd.training_day_id === firstDay.id);
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
        {/* Challenge Name Header */}
        <div className="mb-6">
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

          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2">
              {challenge.title}
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {challenge.description}
            </p>
          </div>
        </div>

        {/* Training Days Horizontal Slider */}
        {isParticipant && (() => {
          const upcomingDays = getUpcomingTrainingDays(5);
          if (!upcomingDays.length) return null;

          const formatTime = (seconds: number) => {
            const mins = Math.floor(seconds / 60);
            const secs = seconds % 60;
            return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `0:${secs.toString().padStart(2, '0')}`;
          };

          return (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Your Training Schedule</h2>
              
              {/* Desktop: Horizontal scroll */}
              <div className="hidden md:block">
                <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-track-white/10 scrollbar-thumb-white/30">
                  {upcomingDays.map((dayData, index) => {
                    const { calendarDay, trainingDay } = dayData!;
                    const exercises = trainingDay.exercises || [];
                    const isCurrentDay = index === 0;
                    const isCompleted = calendarDay.status === "completed";
                    const isFailed = calendarDay.status === "failed";
                    const isRestDay = trainingDay.is_rest_day;
                    const isAccessible = calendarDay.is_accessible;

                    const totalDuration = exercises.reduce((total, exercise) => {
                      const exerciseTime = (exercise.sets || 1) * (exercise.hold_time_seconds || 30);
                      return total + exerciseTime;
                    }, 0);

                    return (
                      <Card 
                        key={calendarDay.id} 
                        className={`glass-effect border-white/10 overflow-hidden min-w-[300px] max-w-[320px] flex-shrink-0 ${
                          isCurrentDay ? 'ring-2 ring-purple-500/50' : ''
                        } ${!isAccessible ? 'opacity-60' : ''} ${isAccessible ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
                        onClick={() => isAccessible && navigate(`/challenge/${challengeId}/day/${calendarDay.id}`)}
                      >
                        {/* Header */}
                        <div className="relative h-20 bg-gradient-to-r from-purple-600/80 to-blue-600/80 flex items-center justify-between px-4">
                          <div className="absolute inset-0 bg-black/20"></div>
                          <div className="relative z-10 flex items-center gap-3">
                            <div className="text-xl">
                              {isCompleted ? "✅" : isFailed ? "❌" : isRestDay ? "🌴" : "💪"}
                            </div>
                            <div>
                              <h3 className="text-lg font-bold text-white">
                                {challenge.difficulty_level?.toUpperCase()}-DAY {trainingDay.day_number}
                              </h3>
                              <div className="flex items-center gap-3 text-xs text-white/90">
                                <div className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {isRestDay ? "Rest" : `${Math.ceil(totalDuration / 60)}min`}
                                </div>
                                <div className="flex items-center gap-1">
                                  <List className="w-3 h-3" />
                                  {exercises.length} exercises
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {isCurrentDay && (
                            <div className="relative z-10">
                              <Badge className="bg-white/20 text-white border-white/30 text-xs">
                                CURRENT
                              </Badge>
                            </div>
                          )}
                        </div>

                        <CardContent className="p-0">
                          {/* Exercise List */}
                          {!isRestDay && exercises.length > 0 && (
                            <div className="space-y-0 max-h-48 overflow-y-auto">
                              {exercises.slice(0, 4).map((exercise, exerciseIndex) => (
                                <div 
                                  key={exercise.id}
                                  className="flex items-center justify-between p-3 border-b border-white/10 last:border-b-0"
                                >
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-white text-sm truncate">
                                      {exercise.figure.name.toUpperCase()}
                                    </h4>
                                    <div className="text-lg font-bold text-purple-400">
                                      {formatTime(exercise.hold_time_seconds || 30)}
                                    </div>
                                  </div>
                                  
                                  <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center ml-2 flex-shrink-0">
                                    <div className="w-6 h-6 bg-purple-500/30 rounded"></div>
                                  </div>
                                </div>
                              ))}
                              
                              {exercises.length > 4 && (
                                <div className="p-2 text-center">
                                  <span className="text-xs text-muted-foreground">
                                    +{exercises.length - 4} more
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Rest Day Content */}
                          {isRestDay && (
                            <div className="p-6 text-center">
                              <div className="text-3xl mb-2">🌴</div>
                              <h4 className="text-sm font-semibold text-white">Rest Day</h4>
                              <p className="text-xs text-muted-foreground">Recovery time</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Mobile: Vertical stack */}
              <div className="md:hidden space-y-4">
                {upcomingDays.slice(0, 3).map((dayData, index) => {
                  const { calendarDay, trainingDay } = dayData!;
                  const exercises = trainingDay.exercises || [];
                  const isCurrentDay = index === 0;
                  const isCompleted = calendarDay.status === "completed";
                  const isFailed = calendarDay.status === "failed";
                  const isRestDay = trainingDay.is_rest_day;
                  const isAccessible = calendarDay.is_accessible;

                  const totalDuration = exercises.reduce((total, exercise) => {
                    const exerciseTime = (exercise.sets || 1) * (exercise.hold_time_seconds || 30);
                    return total + exerciseTime;
                  }, 0);

                  return (
                    <Card 
                      key={calendarDay.id} 
                      className={`glass-effect border-white/10 overflow-hidden ${
                        isCurrentDay ? 'ring-2 ring-purple-500/50' : ''
                      } ${!isAccessible ? 'opacity-60' : ''}`}
                      onClick={() => isAccessible && navigate(`/challenge/${challengeId}/day/${calendarDay.id}`)}
                    >
                      {/* Header */}
                      <div className="relative h-24 bg-gradient-to-r from-purple-600/80 to-blue-600/80 flex items-center justify-between px-6">
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="relative z-10 flex items-center gap-3">
                          <div className="text-2xl">
                            {isCompleted ? "✅" : isFailed ? "❌" : isRestDay ? "🌴" : "💪"}
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              {challenge.difficulty_level?.toUpperCase()}-DAY {trainingDay.day_number}
                              {calendarDay.is_retry && " (RETRY)"}
                            </h3>
                            <div className="flex items-center gap-4 text-sm text-white/90">
                              <div className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {isRestDay ? "Rest Day" : `${Math.ceil(totalDuration / 60)} mins`}
                              </div>
                              <div className="flex items-center gap-1">
                                <List className="w-4 h-4" />
                                {exercises.length} workouts
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {isCurrentDay && (
                          <div className="relative z-10">
                            <Badge className="bg-white/20 text-white border-white/30">
                              CURRENT
                            </Badge>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-0">
                        {/* Exercise List */}
                        {!isRestDay && exercises.length > 0 && (
                          <div className="space-y-0">
                            {exercises.slice(0, isCurrentDay ? exercises.length : 3).map((exercise, exerciseIndex) => (
                              <div 
                                key={exercise.id}
                                className="flex items-center justify-between p-4 border-b border-white/10 last:border-b-0 hover:bg-white/5 transition-colors"
                              >
                                <div className="flex-1">
                                  <h4 className="font-semibold text-white text-sm mb-1">
                                    {exercise.figure.name.toUpperCase()}
                                  </h4>
                                  <div className="text-lg font-bold text-purple-400">
                                    {formatTime(exercise.hold_time_seconds || 30)}
                                  </div>
                                  {exercise.sets && exercise.sets > 1 && (
                                    <div className="text-xs text-muted-foreground">
                                      {exercise.sets} sets
                                    </div>
                                  )}
                                </div>
                                
                                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-blue-500/20 rounded-lg flex items-center justify-center">
                                  <div className="w-8 h-8 bg-purple-500/30 rounded"></div>
                                </div>
                              </div>
                            ))}
                            
                            {!isCurrentDay && exercises.length > 3 && (
                              <div className="p-4 text-center">
                                <span className="text-sm text-muted-foreground">
                                  +{exercises.length - 3} more exercises
                                </span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Rest Day Content */}
                        {isRestDay && (
                          <div className="p-8 text-center">
                            <div className="text-4xl mb-3">🌴</div>
                            <h4 className="text-lg font-semibold text-white mb-2">Rest Day</h4>
                            <p className="text-muted-foreground text-sm">
                              Take time to recover and prepare for tomorrow
                            </p>
                          </div>
                        )}

                        {/* Action Button for current day on mobile */}
                        {isCurrentDay && isAccessible && (
                          <div className="p-4">
                            {!isCompleted && !isRestDay && (
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startTodaysChallenge();
                                }}
                                className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white h-12 text-lg font-semibold"
                              >
                                START
                              </Button>
                            )}

                            {isRestDay && calendarDay.status === "pending" && (
                              <Button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/challenge/${challengeId}/day/${calendarDay.id}`);
                                }}
                                className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white h-12 text-lg font-semibold"
                              >
                                MARK AS RESTED
                              </Button>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          );
        })()}

        {/* Challenge Details Section */}
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
              </div>

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
                                      <Badge
                                        className={
                                          isCompleted
                                            ? "bg-emerald-500/20 text-emerald-400"
                                            : isFailed
                                            ? "bg-red-500/20 text-red-400"
                                            : isRest
                                            ? "bg-green-500/20 text-green-400"
                                            : "bg-blue-500/20 text-blue-400"
                                        }
                                      >
                                        {isCompleted
                                          ? "Completed"
                                          : isFailed
                                          ? "Failed"
                                          : isRest
                                          ? "Rest"
                                          : "Training"}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground">
                                      {format(
                                        new Date(calendarDay.calendar_date),
                                        "MMM d, yyyy"
                                      )}
                                    </p>
                                    {trainingDay.title && (
                                      <p className="text-sm text-white">
                                        {trainingDay.title}
                                      </p>
                                    )}
                                    {trainingDay.exercises &&
                                      trainingDay.exercises.length > 0 && (
                                        <p className="text-xs text-muted-foreground">
                                          {trainingDay.exercises.length}{" "}
                                          exercises
                                        </p>
                                      )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>
                ) : (
                  /* Desktop calendar view */
                  <div className="space-y-4">
                    {/* Month navigation */}
                    {hasMultipleMonths() && (
                      <div className="flex items-center justify-between">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={navigateToPreviousMonth}
                          disabled={!canNavigateToPreviousMonth()}
                          className="text-white hover:bg-white/10"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous Month
                        </Button>
                        <h4 className="text-white font-medium">
                          {format(currentCalendarMonth, "MMMM yyyy")}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={navigateToNextMonth}
                          disabled={!canNavigateToNextMonth()}
                          className="text-white hover:bg-white/10"
                        >
                          Next Month
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    )}

                    {/* Only show calendar if current month has training days */}
                    {hasTrainingDaysInMonth(currentCalendarMonth) && (
                      <Calendar
                        mode="single"
                        month={currentCalendarMonth}
                        onMonthChange={setCurrentCalendarMonth}
                        className="rounded-md border border-white/10 bg-card/50 pointer-events-auto"
                        classNames={{
                          months:
                            "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                          month: "space-y-4",
                          caption:
                            "flex justify-center pt-1 relative items-center",
                          caption_label: "text-sm font-medium text-white",
                          nav: "space-x-1 flex items-center",
                          nav_button:
                            "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
                          nav_button_previous: "absolute left-1",
                          nav_button_next: "absolute right-1",
                          table: "w-full border-collapse space-y-1",
                          head_row: "flex",
                          head_cell:
                            "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
                          row: "flex w-full mt-2",
                          cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                          day: "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-white/10 rounded-md text-white",
                          day_range_end: "day-range-end",
                          day_selected:
                            "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
                          day_today:
                            "bg-accent text-accent-foreground ring-1 ring-purple-500",
                          day_outside:
                            "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
                          day_disabled:
                            "text-muted-foreground opacity-50 cursor-not-allowed",
                          day_range_middle:
                            "aria-selected:bg-accent aria-selected:text-accent-foreground",
                          day_hidden: "invisible",
                        }}
                        components={{
                          DayContent: ({ date }) => {
                            const dayInfo = getCalendarDayInfo(date);
                            const dayNumber = date.getDate();

                            if (!dayInfo) {
                              return <span className="text-gray-500">{dayNumber}</span>;
                            }

                            const {
                              isCompleted,
                              isFailed,
                              isRest,
                              isToday,
                              isAccessible,
                              trainingDay,
                            } = dayInfo;

                            const isLocked = isDayLocked(
                              trainingDay.day_number,
                              calendarDays
                            );

                            return (
                              <div
                                className={`relative w-full h-full flex items-center justify-center text-xs font-medium cursor-pointer ${
                                  isCompleted
                                    ? "bg-emerald-500/30 text-emerald-300 border border-emerald-400/50"
                                    : isFailed
                                    ? "bg-red-500/30 text-red-300 border border-red-400/50"
                                    : isRest
                                    ? "bg-green-500/30 text-green-300 border border-green-400/50"
                                    : isToday
                                    ? "bg-purple-500/30 text-purple-300 border border-purple-400/50 ring-1 ring-purple-400"
                                    : isAccessible && !isLocked
                                    ? "bg-blue-500/20 text-blue-300 border border-blue-400/30 hover:bg-blue-500/30"
                                    : "bg-white/5 text-gray-400 border border-gray-600/30 opacity-60"
                                } rounded-md transition-all`}
                                onClick={() =>
                                  isAccessible &&
                                  !isLocked &&
                                  handleCalendarDayClick(date)
                                }
                              >
                                <span>{dayNumber}</span>
                                {(isCompleted || isFailed || isRest) && (
                                  <div className="absolute -top-1 -right-1 text-xs">
                                    {isCompleted ? "✅" : isFailed ? "❌" : "🌴"}
                                  </div>
                                )}
                                {isLocked && (
                                  <div className="absolute -top-1 -right-1 text-xs">
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
                            isDayLocked(dayInfo.trainingDay.day_number, calendarDays)
                          );
                        }}
                      />
                    )}

                    {/* Legend */}
                    <div className="flex flex-wrap gap-4 text-xs text-muted-foreground justify-center">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-emerald-500/30 border border-emerald-400/50 rounded"></div>
                        <span>Completed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-red-500/30 border border-red-400/50 rounded"></div>
                        <span>Failed</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-green-500/30 border border-green-400/50 rounded"></div>
                        <span>Rest Day</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-purple-500/30 border border-purple-400/50 rounded"></div>
                        <span>Today</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-blue-500/20 border border-blue-400/30 rounded"></div>
                        <span>Available</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-white/5 border border-gray-600/30 rounded"></div>
                        <span>Locked</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Achievements Section */}
            {challenge.achievements && challenge.achievements.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-4">
                  Challenge Achievements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {challenge.achievements.map((achievement) => (
                    <Card
                      key={achievement.id}
                      className="glass-effect border-white/10"
                    >
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl mb-2">{achievement.icon}</div>
                        <h4 className="font-medium text-white text-sm mb-1">
                          {achievement.name}
                        </h4>
                        <div className="text-xs text-purple-400">
                          {achievement.points} points
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ChallengePreview;