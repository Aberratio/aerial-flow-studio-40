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
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userParticipant, setUserParticipant] = useState<any>(null);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [isResettingProgress, setIsResettingProgress] = useState(false);

  useEffect(() => {
    if (challengeId) {
      fetchChallengeDetails();
      checkParticipation();
      loadProgress();
    }
  }, [challengeId]);

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

  const [failedDays, setFailedDays] = useState<Set<string>>(new Set());

  const loadProgress = async () => {
    if (!challengeId || !user?.id) return;

    try {
      // Load actual progress data from database, ordered by attempt_number to get latest attempts
      const { data: progressData, error: progressError } = await supabase
        .from("challenge_day_progress")
        .select(
          "training_day_id, exercises_completed, total_exercises, status, attempt_number, created_at"
        )
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .order("created_at", { ascending: false });

      if (!progressError && progressData) {
        const completed = new Set<string>();
        const failed = new Set<string>();

        // Create a map to store only the latest attempt for each training day
        const latestAttempts = new Map();
        progressData.forEach((progress) => {
          if (!latestAttempts.has(progress.training_day_id)) {
            latestAttempts.set(progress.training_day_id, progress);
          }
        });

        // Process only the latest attempts
        latestAttempts.forEach((progress) => {
          // Mark day as completed if status is completed or rest
          if (
            progress.status === "completed" ||
            progress.status === "rest" ||
            (progress.exercises_completed === progress.total_exercises &&
              progress.total_exercises > 0)
          ) {
            completed.add(progress.training_day_id);
          } else if (progress.status === "failed") {
            failed.add(progress.training_day_id);
          }
        });

        setCompletedDays(completed);
        setFailedDays(failed);
      }
    } catch (error) {
      console.error("Error loading progress:", error);
    }
  };

  const calculateDayEstimatedTime = (trainingDay: any) => {
    if (challenge?.type !== "timer" || !trainingDay.exercises) return null;

    let totalTime = 0;
    trainingDay.exercises.forEach((exercise: any) => {
      const holdTime = exercise.hold_time_seconds || 30;
      const restTime = exercise.rest_time_seconds || 15;
      const sets = exercise.sets || 1;
      totalTime += (holdTime + restTime) * sets;
    });

    const minutes = Math.ceil(totalTime / 60);
    return `~${minutes}min`;
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

  const startTodaysChallenge = async () => {
    if (!challengeId || !user?.id) return;

    try {
      // Get the next training day (could be failed day for retry or next in sequence)
      const { data: nextDayData, error } = await supabase.rpc(
        "get_next_training_day",
        {
          p_user_id: user.id,
          p_challenge_id: challengeId,
        }
      );

      if (error) throw error;

      if (nextDayData && nextDayData.length > 0) {
        const nextDay = nextDayData[0];
        if (nextDay.should_retry) {
          toast({
            title: "Retrying Failed Day",
            description: `You're retrying Day ${nextDay.next_day_number}. You can do it!`,
          });
        }
        navigate(`/challenge/${challengeId}/day/${nextDay.next_day_id}`);
      } else {
        // Fallback to first day if no next day found
        const firstDay = challenge?.training_days?.[0];
        if (firstDay) {
          navigate(`/challenge/${challengeId}/day/${firstDay.id}`);
        }
      }
    } catch (error) {
      console.error("Error getting next training day:", error);
      // Fallback to first day
      const firstDay = challenge?.training_days?.[0];
      if (firstDay) {
        navigate(`/challenge/${challengeId}/day/${firstDay.id}`);
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

  const generateCalendarDays = () => {
    if (!challenge?.training_days || !userParticipant?.user_started_at)
      return [];

    const startDate = parseISO(userParticipant.user_started_at);
    const days = [];
    let currentCalendarDay = 0;

    challenge.training_days
      .sort((a, b) => a.day_number - b.day_number)
      .forEach((trainingDay) => {
        const originalDayDate = addDays(startDate, currentCalendarDay);

        // Add the original training day
        days.push({
          date: originalDayDate,
          day: trainingDay.day_number,
          trainingDay,
          isToday:
            format(originalDayDate, "yyyy-MM-dd") ===
            format(new Date(), "yyyy-MM-dd"),
          isPast: originalDayDate < new Date(),
          isFailedRepetition: false,
        });

        currentCalendarDay++;

        // If this day is failed and not completed, add repetition days
        if (
          failedDays.has(trainingDay.id) &&
          !completedDays.has(trainingDay.id)
        ) {
          const repetitionDate = addDays(startDate, currentCalendarDay);

          days.push({
            date: repetitionDate,
            day: trainingDay.day_number,
            trainingDay,
            isToday:
              format(repetitionDate, "yyyy-MM-dd") ===
              format(new Date(), "yyyy-MM-dd"),
            isPast: repetitionDate < new Date(),
            isFailedRepetition: true,
          });

          currentCalendarDay++;
        }
      });

    return days;
  };

  const resetChallengeProgress = async () => {
    if (!challengeId || !user?.id) return;

    setIsResettingProgress(true);
    try {
      // Delete all progress for this challenge
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId);

      if (progressError) throw progressError;

      // Reset participant status and remove start date so user can set it again
      const { error: participantError } = await supabase
        .from("challenge_participants")
        .update({
          status: "active",
          user_started_at: null, // Clear the start date so user can set it again
          completed: false,
        })
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id);

      if (participantError) throw participantError;

      // Clear local state
      setCompletedDays(new Set());
      setFailedDays(new Set());

      // Reload data
      await checkParticipation();
      await loadProgress();

      toast({
        title: "Progress Reset",
        description: "Your challenge progress has been reset successfully!",
      });
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
    const calendarDays = generateCalendarDays();
    const dayInfo = calendarDays.find((day) => isSameDay(day.date, date));

    if (dayInfo) {
      return {
        trainingDay: dayInfo.trainingDay,
        // For failed repetitions, reset status - show as fresh attempt
        isCompleted: dayInfo.isFailedRepetition
          ? false
          : completedDays.has(dayInfo.trainingDay.id),
        isFailed: dayInfo.isFailedRepetition
          ? false
          : failedDays.has(dayInfo.trainingDay.id),
        isToday: isSameDay(date, new Date()),
        isPast: isBefore(date, new Date()),
        isFailedRepetition: dayInfo.isFailedRepetition,
        isAccessible:
          userParticipant &&
          (dayInfo.trainingDay.day_number === 1 ||
            (challenge.training_days &&
              challenge.training_days.find(
                (td) => td.day_number === dayInfo.trainingDay.day_number - 1
              ) &&
              completedDays.has(
                challenge.training_days.find(
                  (td) => td.day_number === dayInfo.trainingDay.day_number - 1
                )!.id
              )) ||
            completedDays.has(dayInfo.trainingDay.id) ||
            failedDays.has(dayInfo.trainingDay.id) || // Failed days are also accessible for retry
            dayInfo.isFailedRepetition), // Failed repetitions are always accessible
      };
    }
    return null;
  };

  const handleCalendarDayClick = (date: Date) => {
    const dayInfo = getCalendarDayInfo(date);
    if (dayInfo && dayInfo.isAccessible) {
      navigate(`/challenge/${challengeId}/day/${dayInfo.trainingDay.id}`);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
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

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
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
                  <Badge
                    variant="outline"
                    className="border-white/30 text-white/90 mb-2"
                  >
                    {challenge.type === "timer"
                      ? "Timer Challenge"
                      : "Manual Challenge"}
                  </Badge>
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
                    <Button
                      variant="primary"
                      onClick={startTodaysChallenge}
                      className="w-full sm:flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Today's Challenge
                    </Button>

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
                      {calculateDuration()}
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
                      {challenge.training_days?.length || 0}
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
                        {completedDays.size} of{" "}
                        {challenge.training_days?.length || 0}
                      </Badge>
                    </div>
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-muted-foreground mb-1">
                        <span>Days Completed</span>
                        <span>
                          {Math.round(
                            (completedDays.size /
                              (challenge.training_days?.length || 1)) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          (completedDays.size /
                            (challenge.training_days?.length || 1)) *
                          100
                        }
                        className="h-2"
                      />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {completedDays.size === 0
                        ? "Ready to start your journey!"
                        : completedDays.size === challenge.training_days?.length
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
                <h3 className="text-white font-semibold mb-4">Calendar View</h3>
                <div className="bg-white/5 rounded-lg p-6 border border-white/10">
                  <Calendar
                    mode="single"
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
                          isToday,
                          isAccessible,
                          isFailedRepetition,
                        } = dayInfo;

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
                                : isAccessible
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
                                {isCompleted
                                  ? "✅"
                                  : isFailed
                                  ? "❌"
                                  : trainingDay.is_rest_day
                                  ? "🌴"
                                  : "💪"}
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
                            {!isAccessible && !isCompleted && !isFailed && (
                              <div className="absolute bottom-1 right-1 text-xs">
                                🔒
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
                        isAfter(date, new Date())
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
