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
  Trash2,
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
  useChallengeCalendar,
  CalendarDay,
} from "@/hooks/useChallengeCalendar";
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

const ChallengePreviewRefactored = () => {
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
  const [isResettingProgress, setIsResettingProgress] = useState(false);

  // Use the new refactored challenge calendar hook
  const {
    calendarDays,
    nextAvailableDay,
    isLoading: calendarLoading,
    generateCalendar,
    changeDayStatus,
    canAccessDay,
    getCalendarDay,
    getCompletedDays,
    getFailedDays,
    getRestDays,
    getPendingDays,
    getTodayCalendarDay,
    loadCalendar,
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
      if (!isParticipant || !userParticipant || calendarDays.length > 0) return;
      
      // If user is a participant but has no calendar days, generate them
      console.log("Participant found but no calendar days, generating calendar...");
      
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
  }, [isParticipant, userParticipant, calendarDays.length, challengeId, user?.id, generateCalendar]);

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
    if (!challengeId || !user?.id) return;

    setIsJoining(true);
    try {
      // Set start date to today
      const startDate = new Date();
      const startDateString = startDate.toISOString().split("T")[0];

      const { error } = await supabase.from("challenge_participants").insert({
        challenge_id: challengeId,
        user_id: user.id,
        status: "active",
        user_started_at: startDate.toISOString(),
      });

      if (error) throw error;

      // Generate the calendar days for the user
      await generateCalendar(startDate);

      setIsParticipant(true);
      
      // Reload participation data
      await checkParticipation();
      
      // Force reload of calendar data
      await loadCalendar();

      toast({
        title: "Challenge Joined!",
        description: `You've successfully joined this challenge! Starting ${startDate.toLocaleDateString()}`,
      });
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const startTodaysChallenge = async () => {
    if (!nextAvailableDay) return;

    // Navigate to the training day
    navigate(
      `/challenge/${challengeId}/day/${nextAvailableDay.training_day_id}`
    );
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

      // Reload data
      await checkParticipation();
      await loadCalendar();

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

  // Calendar functionality using new hook
  const getCalendarDayInfo = (date: Date) => {
    const dateString = format(date, "yyyy-MM-dd");
    return getCalendarDay(dateString);
  };

  const handleCalendarDayClick = (date: Date) => {
    const dayInfo = getCalendarDayInfo(date);
    if (dayInfo && dayInfo.is_accessible) {
      navigate(`/challenge/${challengeId}/day/${dayInfo.training_day_id}`);
    }
  };

  const getCalendarStartMonth = () => {
    if (!userParticipant?.user_started_at) return new Date();
    return startOfMonth(parseISO(userParticipant.user_started_at));
  };

  const getCalendarEndMonth = () => {
    if (!challenge?.training_days) return new Date();
    const totalDays = challenge.training_days.length;
    const startDate = userParticipant?.user_started_at
      ? parseISO(userParticipant.user_started_at)
      : new Date();
    return endOfMonth(addDays(startDate, totalDays));
  };

  if (isLoading || calendarLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-white">Challenge not found</div>
      </div>
    );
  }

  const completedDaysCount = getCompletedDays().length;
  const failedDaysCount = getFailedDays().length;
  const restDaysCount = getRestDays().length;
  const totalDays = challenge.training_days?.length || 0;
  const progressPercentage =
    totalDays > 0 ? (completedDaysCount / totalDays) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/challenges")}
              className="text-white hover:bg-white/10"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
            <div className="h-6 w-px bg-white/20"></div>
            <h1 className="text-3xl font-bold text-white">{challenge.title}</h1>
          </div>

          {canCreateChallenges && (
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/edit-challenge/${challengeId}`)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Challenge</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this challenge? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={async () => {
                        // Handle delete logic
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Challenge Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Challenge Info Card */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-2xl mb-2">
                      {challenge.title}
                    </CardTitle>
                    <p className="text-muted-foreground mb-4">
                      {challenge.description}
                    </p>
                  </div>
                  {challenge.image_url && (
                    <img
                      src={challenge.image_url}
                      alt={challenge.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {challenge.training_days?.length || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Training Days
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {challenge.participants_count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Participants
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {calculateDuration()}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Duration
                    </div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">
                      {challenge.type === "timer" ? "Timer" : "Manual"}
                    </div>
                    <div className="text-sm text-muted-foreground">Type</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  <Badge
                    className={getDifficultyColor(
                      challenge.difficulty_level || ""
                    )}
                  >
                    {challenge.difficulty_level || "Intermediate"}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="border-white/20 text-white"
                  >
                    <Trophy className="w-3 h-3 mr-1" />
                    {challenge.achievements?.length || 0} Achievements
                  </Badge>
                </div>

                {/* Progress Section */}
                {isParticipant && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-white">
                        Your Progress
                      </h3>
                      <div className="text-sm text-muted-foreground">
                        {completedDaysCount} of {totalDays} days completed
                      </div>
                    </div>
                    <Progress value={progressPercentage} className="h-3" />
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold text-green-400">
                          {completedDaysCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Completed
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-red-400">
                          {failedDaysCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Failed
                        </div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-blue-400">
                          {restDaysCount}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Rest Days
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Training Days Preview */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <CalendarDays className="w-5 h-5 mr-2" />
                  Training Days
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {challenge.training_days?.map((day, index) => (
                    <div
                      key={day.id}
                      className="flex items-center justify-between p-4 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold">
                          {day.day_number}
                        </div>
                        <div>
                          <h4 className="text-white font-medium">
                            {day.title || `Day ${day.day_number}`}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {day.is_rest_day
                              ? "Rest Day"
                              : `${day.exercises?.length || 0} exercises`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {day.is_rest_day ? (
                          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                            🌴 Rest
                          </Badge>
                        ) : (
                          <>
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                              💪 Workout
                            </Badge>
                            {calculateDayEstimatedTime(day) && (
                              <Badge
                                variant="outline"
                                className="border-white/20 text-white"
                              >
                                <Clock className="w-3 h-3 mr-1" />
                                {calculateDayEstimatedTime(day)}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Challenge Card */}
            {!isParticipant ? (
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Join Challenge</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    Ready to start your fitness journey? Join this challenge and
                    track your progress!
                  </p>
                  <Button
                    onClick={joinChallenge}
                    disabled={isJoining}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {isJoining ? "Joining..." : "Join Challenge"}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Today's Challenge Card */}
                {nextAvailableDay && (
                  <Card className="glass-effect border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">
                        Today's Challenge
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center mb-4">
                        <div className="text-3xl font-bold text-white mb-2">
                          Day {nextAvailableDay.day_number}
                        </div>
                        <div className="text-muted-foreground">
                          {nextAvailableDay.is_rest_day
                            ? "Rest Day"
                            : `${nextAvailableDay.total_exercises} exercises`}
                        </div>
                        {nextAvailableDay.is_retry && (
                          <Badge className="mt-2 bg-orange-500/20 text-orange-400 border-orange-500/30">
                            🔄 Retry Attempt
                          </Badge>
                        )}
                      </div>
                      <Button
                        onClick={startTodaysChallenge}
                        className="w-full bg-green-600 hover:bg-green-700"
                      >
                        <Play className="w-4 h-4 mr-2" />
                        Start Today's Challenge
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Progress Reset Card */}
                <Card className="glass-effect border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white">
                      Challenge Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          disabled={isResettingProgress}
                          className="w-full border-red-500/20 text-red-400 hover:bg-red-500/10"
                        >
                          <RotateCcw className="w-4 h-4 mr-2" />
                          {isResettingProgress
                            ? "Resetting..."
                            : "Reset Progress"}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>
                            Reset Challenge Progress
                          </AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to reset your progress? This
                            will delete all your completed days and you'll need
                            to start over.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={resetChallengeProgress}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Reset Progress
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Calendar Card */}
            {isParticipant && userParticipant?.user_started_at && (
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <CalendarIcon className="w-5 h-5 mr-2" />
                    Challenge Calendar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Calendar
                    mode="single"
                    selected={undefined}
                    onSelect={handleCalendarDayClick}
                    className="rounded-md border-white/10"
                    classNames={{
                      months:
                        "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4",
                      caption: "flex justify-center pt-1 relative items-center",
                      caption_label: "text-sm font-medium text-white",
                      nav: "space-x-1 flex items-center",
                      nav_button:
                        "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-white",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell:
                        "text-muted-foreground rounded-md w-8 font-normal text-[0.8rem] text-white",
                      row: "flex w-full mt-2",
                      cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                      day: "h-8 w-8 p-0 font-normal aria-selected:opacity-100 text-white",
                      day_selected:
                        "bg-purple-600 text-white hover:bg-purple-600 hover:text-white focus:bg-purple-600 focus:text-white",
                      day_today: "bg-purple-500/20 text-purple-400",
                      day_outside: "text-muted-foreground opacity-50",
                      day_disabled: "text-muted-foreground opacity-50",
                      day_range_middle:
                        "aria-selected:bg-accent aria-selected:text-accent-foreground",
                      day_hidden: "invisible",
                    }}
                    components={{
                      DayContent: ({ date }) => {
                        const dayInfo = getCalendarDayInfo(date);
                        if (!dayInfo)
                          return (
                            <div className="h-8 w-8 flex items-center justify-center text-white/30">
                              -
                            </div>
                          );

                        const dayNumber = dayInfo.day_number;
                        const isCompleted = dayInfo.status === "completed";
                        const isFailed = dayInfo.status === "failed";
                        const isRest = dayInfo.is_rest_day;
                        const isToday = dayInfo.is_today;
                        const isAccessible = dayInfo.is_accessible;
                        const isRetry = dayInfo.is_retry;

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
                                : isRest
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
                                  : isRest
                                  ? "🌴"
                                  : isRetry
                                  ? "🔄"
                                  : "💪"}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    }}
                  />
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChallengePreviewRefactored;
