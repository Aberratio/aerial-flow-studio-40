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

  // Get today's or next available training day
  const getTodaysTrainingDay = () => {
    if (!calendarDays.length) return null;
    
    // First, look for today's day
    const today = format(new Date(), "yyyy-MM-dd");
    const todaysDay = calendarDays.find(day => day.calendar_date === today && day.status === 'pending');
    
    if (todaysDay) {
      const trainingDay = challenge?.training_days?.find(td => td.id === todaysDay.training_day_id);
      return trainingDay ? { ...todaysDay, trainingDay } : null;
    }
    
    // If no today's day, get the first accessible pending day
    const nextDay = calendarDays.find(day => day.status === 'pending' && day.is_accessible);
    if (nextDay) {
      const trainingDay = challenge?.training_days?.find(td => td.id === nextDay.training_day_id);
      return trainingDay ? { ...nextDay, trainingDay } : null;
    }
    
    return null;
  };

  // Get surrounding days for slider
  const getAdjacentDays = (currentDay: any) => {
    if (!currentDay || !calendarDays.length) return { prev: null, next: null };
    
    const currentIndex = calendarDays.findIndex(day => day.id === currentDay.id);
    const prev = currentIndex > 0 ? calendarDays[currentIndex - 1] : null;
    const next = currentIndex < calendarDays.length - 1 ? calendarDays[currentIndex + 1] : null;
    
    return {
      prev: prev ? {
        ...prev,
        trainingDay: challenge?.training_days?.find(td => td.id === prev.training_day_id)
      } : null,
      next: next ? {
        ...next,
        trainingDay: challenge?.training_days?.find(td => td.id === next.training_day_id)
      } : null
    };
  };

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

  const todaysTraining = getTodaysTrainingDay();
  const adjacentDays = todaysTraining ? getAdjacentDays(todaysTraining) : { prev: null, next: null };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
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

          <h1 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            {challenge.title}
          </h1>
        </div>

        {/* Today's Training - Hero Section */}
        {isParticipant && todaysTraining ? (
          <Card className="glass-effect border-white/10 mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-gradient-to-r from-purple-600/20 to-blue-600/20 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center">
                      {todaysTraining.trainingDay?.is_rest_day ? (
                        <div className="text-2xl">🌴</div>
                      ) : (
                        <Play className="w-6 h-6 text-purple-400" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">
                        {todaysTraining.is_today ? "Today's Training" : "Next Training"}
                      </h2>
                      <p className="text-purple-200">
                        Day {todaysTraining.trainingDay?.day_number} - {todaysTraining.trainingDay?.title}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                    {format(new Date(todaysTraining.calendar_date), "MMM dd")}
                  </Badge>
                </div>

                <p className="text-white/90 mb-6">
                  {todaysTraining.trainingDay?.description || "Get ready for today's challenge!"}
                </p>

                {/* Exercise Preview */}
                {!todaysTraining.trainingDay?.is_rest_day && todaysTraining.trainingDay?.exercises && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-white mb-3">Today's Exercises</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {todaysTraining.trainingDay.exercises.slice(0, 4).map((exercise, index) => (
                        <div
                          key={exercise.id}
                          className="bg-white/10 rounded-lg p-3 text-center"
                        >
                          <div className="text-sm font-medium text-white mb-1">
                            {exercise.figure.name}
                          </div>
                          <div className="text-xs text-purple-200">
                            {exercise.sets}x{exercise.reps || exercise.hold_time_seconds + "s"}
                          </div>
                        </div>
                      ))}
                      {todaysTraining.trainingDay.exercises.length > 4 && (
                        <div className="bg-white/10 rounded-lg p-3 text-center flex items-center justify-center">
                          <span className="text-sm text-white">
                            +{todaysTraining.trainingDay.exercises.length - 4} more
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Day Navigation Slider */}
                <div className="flex items-center justify-between mb-6">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjacentDays.prev && handleCalendarDayClick(new Date(adjacentDays.prev.calendar_date))}
                    disabled={!adjacentDays.prev}
                    className="text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    {adjacentDays.prev ? `Day ${adjacentDays.prev.trainingDay?.day_number}` : ""}
                  </Button>

                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      Day {todaysTraining.trainingDay?.day_number} of {challenge.training_days?.length}
                    </div>
                    <div className="text-sm text-purple-200">
                      {todaysTraining.trainingDay?.is_rest_day ? "Rest Day" : "Training Day"}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => adjacentDays.next && handleCalendarDayClick(new Date(adjacentDays.next.calendar_date))}
                    disabled={!adjacentDays.next}
                    className="text-white hover:bg-white/10 disabled:opacity-50"
                  >
                    {adjacentDays.next ? `Day ${adjacentDays.next.trainingDay?.day_number}` : ""}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>

                {/* Start Training Button */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => handleCalendarDayClick(new Date(todaysTraining.calendar_date))}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white flex-1"
                    size="lg"
                  >
                    {todaysTraining.trainingDay?.is_rest_day ? (
                      <>
                        <div className="text-lg mr-2">🌴</div>
                        Mark Rest Day Complete
                      </>
                    ) : (
                      <>
                        <Play className="w-5 h-5 mr-2" />
                        Start Training
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : !isParticipant ? (
          /* Join Challenge CTA */
          <Card className="glass-effect border-white/10 mb-8">
            <CardContent className="p-6 text-center">
              <div className="mb-4">
                <Trophy className="w-16 h-16 text-purple-400 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Ready to Start?</h2>
                <p className="text-muted-foreground">
                  Join this challenge and begin your fitness journey today!
                </p>
              </div>
              <Button
                onClick={joinChallenge}
                disabled={isJoining}
                className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                size="lg"
              >
                {isJoining ? "Joining..." : "Join Challenge"}
              </Button>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Description */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">About This Challenge</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  {challenge.description}
                </p>
              </CardContent>
            </Card>

            {/* Progress for Participants */}
            {isParticipant && (
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center justify-between">
                    Your Progress
                    <Badge className="bg-purple-500/20 text-purple-400">
                      {getCompletedDays().length} of {challenge.training_days?.length || 0}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm text-muted-foreground mb-2">
                      <span>Days Completed</span>
                      <span>
                        {Math.round(
                          (getCompletedDays().length / (challenge.training_days?.length || 1)) * 100
                        )}%
                      </span>
                    </div>
                    <Progress
                      value={(getCompletedDays().length / (challenge.training_days?.length || 1)) * 100}
                      className="h-3"
                    />
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {getCompletedDays().length === 0
                      ? "Ready to start your journey!"
                      : getCompletedDays().length === challenge.training_days?.length
                      ? "🎉 Challenge completed! Amazing work!"
                      : "Keep going, you're doing great!"}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Calendar View */}
            {isParticipant && (
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <CalendarIcon className="w-5 h-5" />
                    Training Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-sm text-muted-foreground py-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  <Calendar
                    mode="single"
                    className="rounded-md border-0"
                    components={{
                      DayContent: ({ date }) => {
                        const dayInfo = getCalendarDayInfo(date);
                        return (
                          <div className="relative w-full h-full flex items-center justify-center">
                            <span className={dayInfo ? "font-medium" : ""}>
                              {format(date, "d")}
                            </span>
                            {dayInfo && (
                              <div className="absolute inset-0 rounded-md flex items-center justify-center">
                                {dayInfo.isCompleted ? (
                                  <div className="w-2 h-2 bg-green-400 rounded-full absolute bottom-1" />
                                ) : dayInfo.isFailed ? (
                                  <div className="w-2 h-2 bg-red-400 rounded-full absolute bottom-1" />
                                ) : dayInfo.isToday ? (
                                  <div className="w-2 h-2 bg-purple-400 rounded-full absolute bottom-1" />
                                ) : null}
                              </div>
                            )}
                          </div>
                        );
                      },
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Challenge Stats */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Challenge Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Total Days</span>
                  <span className="text-white font-medium">{challenge.training_days?.length || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Training Days</span>
                  <span className="text-white font-medium">
                    {challenge.training_days?.filter(day => !day.is_rest_day).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Rest Days</span>
                  <span className="text-white font-medium">
                    {challenge.training_days?.filter(day => day.is_rest_day).length || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Participants</span>
                  <span className="text-white font-medium">{challenge.participants_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Difficulty</span>
                  <Badge className={getDifficultyColor(challenge.difficulty_level || "intermediate")}>
                    {challenge.difficulty_level?.charAt(0).toUpperCase() + challenge.difficulty_level?.slice(1) || "Intermediate"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Challenge Rules */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Challenge Rules</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground text-sm">
                    Complete training sessions in order
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground text-sm">
                    Follow rest days as scheduled
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground text-sm">
                    {challenge.type === "timer"
                      ? "Follow timer instructions carefully"
                      : "Track your progress manually"}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-muted-foreground text-sm">
                    Earn achievements by completing milestones
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            {isParticipant && (
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50"
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
                          This action will permanently delete all your progress for this challenge. 
                          You will start from day 1 again and lose all completed day records. 
                          This action cannot be undone.
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
                          {isResettingProgress ? "Resetting..." : "Reset Progress"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengePreview;