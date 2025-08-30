import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  ChevronLeft,
  Edit,
  Clock,
  Target,
  Lock,
  Bed,
  Star,
  Calendar,
  Trophy,
  Users,
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
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useChallengeAccess } from "@/hooks/useChallengeAccess";
import { useChallengeCalendar } from "@/hooks/useChallengeCalendar";
import { useIsMobile } from "@/hooks/use-mobile";
import ChallengePurchaseModal from "@/components/ChallengePurchaseModal";
import { format } from "date-fns";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level?: string;
  start_date: string;
  end_date: string;
  status: string;
  premium?: boolean;
  price_usd?: number;
  price_pln?: number;
  image_url?: string;
  type: string;
  created_by?: string;
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
  }>;
}

const ChallengePreview = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { canCreateChallenges, isAdmin } = useUserRole();
  const { hasPremiumAccess } = useSubscriptionStatus();
  const { userPurchases, refreshPurchases, checkChallengeAccess } = useChallengeAccess();
  const isMobile = useIsMobile();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [userParticipant, setUserParticipant] = useState<any>(null);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  // Use the challenge calendar hook
  const {
    calendarDays,
    isLoading: calendarLoading,
    generateCalendar,
    changeDayStatus,
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

      const startDate = userParticipant.user_started_at
        ? new Date(userParticipant.user_started_at)
        : new Date();

      if (!userParticipant.user_started_at) {
        await supabase
          .from("challenge_participants")
          .update({ user_started_at: startDate.toISOString() })
          .eq("challenge_id", challengeId)
          .eq("user_id", user?.id);
      }

      await generateCalendar(startDate);
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

      setChallenge({
        ...challengeData,
        training_days:
          challengeData.challenge_training_days?.sort(
            (a: any, b: any) => a.day_number - b.day_number
          ) || [],
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

    if (challenge?.premium) {
      const hasAccess = await checkChallengeAccess(challengeId);
      if (!hasAccess) {
        setIsPurchaseModalOpen(true);
        return;
      }
    }

    setIsJoining(true);
    try {
      const startDate = new Date();
      
      const { data, error } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: "active",
          user_started_at: startDate.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      setIsParticipant(true);
      setUserParticipant(data);

      await generateCalendar(startDate);

      toast({
        title: "Success",
        description: "You've joined the challenge and your training schedule is ready!",
      });

      setTimeout(() => {
        navigate(`/challenges/${challengeId}`);
      }, 500);
      
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

  const getCurrentTrainingDay = () => {
    if (!calendarDays.length) return null;

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

    // Find the first pending or failed day (next to train)
    const nextTrainingDay = accessibleDays.find(
      (d) => d!.calendarDay.status === "pending" || d!.calendarDay.status === "failed"
    );

    return nextTrainingDay || accessibleDays[accessibleDays.length - 1];
  };

  // Auto-scroll to current day
  useEffect(() => {
    if (!carouselApi || !challenge?.training_days || calendarLoading) return;

    const currentDay = getCurrentTrainingDay();
    if (!currentDay) return;

    // Find the index of the current day
    const currentDayIndex = challenge.training_days.findIndex(
      (td) => td.id === currentDay.trainingDay.id
    );

    if (currentDayIndex >= 0) {
      setTimeout(() => {
        carouselApi.scrollTo(currentDayIndex);
      }, 100);
    }
  }, [carouselApi, challenge?.training_days, calendarDays, calendarLoading]);

  const handleRestDay = async (calendarDay: any) => {
    try {
      await changeDayStatus(calendarDay.calendar_date, "rest");
      toast({
        title: "Rest Day Set",
        description: "You've marked today as a rest day. Train tomorrow!",
      });
    } catch (error) {
      console.error("Error setting rest day:", error);
      toast({
        title: "Error",
        description: "Failed to set rest day",
        variant: "destructive",
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/30";
      case "intermediate":
        return "bg-amber-500/20 text-amber-400 border-amber-500/30";
      case "advanced":
        return "bg-rose-500/20 text-rose-400 border-rose-500/30";
      default:
        return "bg-slate-500/20 text-slate-400 border-slate-500/30";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `0:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white/80 font-medium">Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Challenge not found</h2>
          <p className="text-slate-400 mb-6">The challenge you're looking for doesn't exist</p>
          <Button onClick={() => navigate("/challenges")} variant="outline">
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col overflow-y-auto md:fixed md:inset-0">
      {/* Header */}
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/30 via-primary/10 to-transparent backdrop-blur-xl"></div>
        <div className="relative z-10 p-4 md:p-6">
          {/* Navigation */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/challenges")}
              className="text-white hover:bg-white/10 backdrop-blur-sm"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            
            {/* Edit button for admins/creators */}
            {(isAdmin || challenge.created_by === user?.id) && (
              <Button
                variant="ghost"
                onClick={() => navigate(`/challenges/${challengeId}/edit`)}
                className="text-white hover:bg-white/10 backdrop-blur-sm"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Challenge Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              {challenge.premium && (
                <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-amber-950 border-0 font-bold">
                  ✨ Premium
                </Badge>
              )}
              {challenge.difficulty_level && (
                <Badge
                  variant="outline"
                  className={getDifficultyColor(challenge.difficulty_level)}
                >
                  {challenge.difficulty_level}
                </Badge>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-white mb-4 leading-tight">
              {challenge.title}
            </h1>

            {challenge.description && (
              <p className="text-lg text-white/80 max-w-2xl mx-auto leading-relaxed hidden sm:block">
                {challenge.description}
              </p>
            )}

            {/* Challenge Stats */}
            <div className="flex items-center justify-center gap-6 mt-6 text-sm text-white/70">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                <span>{challenge.training_days?.length || 0} days</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Daily workouts</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4" />
                <span>Full program</span>
              </div>
            </div>
          </div>

          {/* Join Button for non-participants */}
          {!isParticipant && (
            <div className="text-center">
              <Button
                onClick={joinChallenge}
                disabled={isJoining}
                className="bg-gradient-to-r from-primary to-primary-foreground hover:shadow-lg hover:shadow-primary/25 text-white px-8 py-4 text-lg font-bold rounded-2xl shadow-xl transition-all duration-300 hover:scale-105"
              >
                {isJoining ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Joining...
                  </>
                ) : (
                  <>
                    <Star className="w-5 h-5 mr-2" />
                    Join Challenge
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Training Days Slider */}
      {isParticipant && (
        <div className="flex-1 p-4 md:pl-2 md:pr-6 lg:p-8 overflow-hidden">
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-6 text-center">Your Training Journey</h2>
          
          {(() => {
            const allTrainingDays =
              challenge?.training_days
                ?.map((trainingDay) => {
                  const latestCalendarDay = calendarDays
                    .filter((cd) => cd.training_day_id === trainingDay.id)
                    .sort((a, b) => b.attempt_number - a.attempt_number)[0];

                  return {
                    calendarDay: latestCalendarDay || null,
                    trainingDay,
                  };
                })
                .sort(
                  (a, b) => a.trainingDay.day_number - b.trainingDay.day_number
                ) || [];

            if (!allTrainingDays.length) return null;

            return (
              <Carousel className="w-full h-full" setApi={setCarouselApi}>
                <CarouselContent className="-ml-2 md:-ml-4 lg:-ml-6 h-full">
                  {allTrainingDays.map((dayData, index) => {
                    const { calendarDay, trainingDay } = dayData;
                    const exercises = trainingDay.training_day_exercises || [];
                    const isCompleted = calendarDay?.status === "completed";
                    const isRestDay = trainingDay.is_rest_day;
                    const isUserRestDay = calendarDay?.status === "rest" && !trainingDay.is_rest_day;
                    const isAccessible = calendarDay?.is_accessible || false;
                    const isPending = calendarDay?.status === "pending" || calendarDay?.status === "failed";

                    const previousDayData = allTrainingDays[index - 1];
                    const isPreviousDayCompleted = index === 0 || previousDayData?.calendarDay?.status === "completed";
                    const isBlocked = !isPreviousDayCompleted && !isCompleted;

                    const isToday = calendarDay?.calendar_date === format(new Date(), "yyyy-MM-dd");
                    const isFailedOrRestToday = isToday && (calendarDay?.status === "failed" || calendarDay?.status === "rest");
                    
                    // Current day is the one that's accessible and pending/failed
                    const isCurrentDay = !isBlocked && isPending && isAccessible && !isFailedOrRestToday;

                    const totalDuration = trainingDay.duration_seconds || 0;

                    return (
                      <CarouselItem
                        key={trainingDay.id}
                        className="pl-2 md:pl-4 lg:pl-6 basis-full md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/5 h-full"
                      >
                        <Card
                          className={`glass-effect overflow-hidden h-full transition-all duration-300 backdrop-blur-md ${
                            isBlocked
                              ? "border-slate-600/50 opacity-60"
                              : isCompleted
                              ? "border-emerald-500/60 bg-emerald-500/5"
                              : isCurrentDay
                              ? "border-primary/80 ring-2 ring-primary/40 shadow-2xl shadow-primary/20 bg-primary/5"
                              : isPending && isAccessible
                              ? "border-purple-500/60 ring-1 ring-purple-500/30 bg-purple-500/5"
                              : "border-white/20"
                          }`}
                        >
                          {/* Header */}
                          <div
                            className={`relative h-24 flex items-center justify-between px-6 ${
                              isBlocked
                                ? "bg-gradient-to-r from-slate-600/40 to-slate-700/40"
                                : isCurrentDay
                                ? "bg-gradient-to-r from-primary/90 to-primary/70"
                                : isCompleted
                                ? "bg-gradient-to-r from-emerald-600/80 to-emerald-700/70"
                                : "bg-gradient-to-r from-purple-600/80 to-blue-600/80"
                            }`}
                          >
                            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm"></div>
                            <div className="relative z-10 flex items-center gap-3">
                              <div className="text-2xl">
                                {isBlocked
                                  ? "🔒"
                                  : isCompleted
                                  ? "✅"
                                  : isUserRestDay
                                  ? "🛌"
                                  : isRestDay
                                  ? "🌴"
                                  : isCurrentDay
                                  ? "⭐"
                                  : "💪"}
                              </div>
                              <div>
                                <h3
                                  className={`text-xl font-bold ${
                                    isBlocked ? "text-slate-300" : "text-white"
                                  }`}
                                >
                                  DAY {trainingDay.day_number}
                                  {calendarDay?.is_retry && " (RETRY)"}
                                </h3>
                                <div
                                  className={`text-sm ${
                                    isBlocked ? "text-slate-400" : "text-white/90"
                                  }`}
                                >
                                  {isBlocked
                                    ? "Complete previous day first"
                                    : trainingDay.title || (isRestDay ? "Rest Day" : "Training Day")}
                                </div>
                              </div>
                            </div>
                          </div>

                          <CardContent className="p-6 flex-1 flex flex-col">
                            {/* Duration and Exercise Count */}
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <Clock className="w-4 h-4" />
                                {isRestDay ? "Rest Day" : `${Math.ceil(totalDuration / 60)} mins`}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-white/70">
                                <Target className="w-4 h-4" />
                                {exercises.length} exercises
                              </div>
                            </div>

                            {/* Day Notes */}
                            {(calendarDay?.notes || trainingDay.description) && (
                              <div className="mb-6">
                                <p
                                  className={`text-sm ${
                                    isBlocked ? "text-slate-400" : "text-white/80"
                                  } bg-white/5 p-3 rounded-xl border border-white/10`}
                                >
                                  {calendarDay?.notes || trainingDay.description}
                                </p>
                              </div>
                            )}

                            {/* Exercise List */}
                            {!isRestDay && exercises.length > 0 && (
                              <div className="space-y-3 flex-1 mb-6">
                                {exercises.map((exercise, exerciseIndex) => (
                                  <div
                                    key={exercise.id}
                                    className="flex items-start justify-between p-4 bg-white/5 rounded-xl border border-white/10 backdrop-blur-sm"
                                  >
                                    <div className="flex-1 pr-4">
                                      <h4
                                        className={`font-semibold text-base mb-2 ${
                                          isBlocked ? "text-slate-300" : "text-white"
                                        }`}
                                      >
                                        {exercise.figure.name}
                                      </h4>
                                      {exercise.notes && (
                                        <p className="text-white/70 text-sm mb-3">
                                          {exercise.notes}
                                        </p>
                                      )}
                                      <div
                                        className={`text-sm font-medium ${
                                          isBlocked ? "text-slate-400" : "text-primary"
                                        }`}
                                      >
                                        {formatTime(exercise.hold_time_seconds || 30)}
                                        {exercise.sets && exercise.sets > 1 && ` × ${exercise.sets} sets`}
                                      </div>
                                    </div>

                                    {/* Exercise Image */}
                                    <div
                                      className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center ${
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
                                        <Target className="w-6 h-6 text-white/40" />
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Rest Day Content */}
                            {isRestDay && (
                              <div className="text-center py-12 flex-1">
                                <div className="text-6xl mb-4">🌴</div>
                                <h3 className="text-xl font-semibold text-white mb-2">Rest & Recovery</h3>
                                <p className="text-white/70">
                                  Take time to recover and prepare for tomorrow's training
                                </p>
                              </div>
                            )}

                            {/* Action Buttons */}
                            <div className="mt-auto pt-6 border-t border-white/10 space-y-3">
                              {isCurrentDay && !isRestDay && (
                                <div className="space-y-3">
                                  <Button
                                    onClick={() => navigate(`/challenge/${challengeId}/day/${calendarDay?.id}/timer`)}
                                    variant="primary"
                                    className="w-full py-4 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-[1.02]"
                                  >
                                    <Play className="w-5 h-5 mr-2" />
                                    Train Now
                                  </Button>
                                  <Button
                                    onClick={() => handleRestDay(calendarDay)}
                                    variant="outline"
                                    className="w-full border-amber-500/40 text-amber-400 hover:bg-amber-500/10 py-3 rounded-xl"
                                  >
                                    <Bed className="w-4 h-4 mr-2" />
                                    Rest Today
                                  </Button>
                                </div>
                              )}

                              {isCurrentDay && isRestDay && (
                                <Button
                                  onClick={() => handleRestDay(calendarDay)}
                                  className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/25 text-white py-4 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-[1.02]"
                                >
                                  <Bed className="w-4 h-4 mr-2" />
                                  Rest Day
                                </Button>
                              )}

                              {/* Status Indicator */}
                              <div className="text-center">
                                {isCompleted ? (
                                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    ✓ Completed
                                  </span>
                                ) : isUserRestDay ? (
                                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                                    🛌 Rest Day
                                  </span>
                                ) : isFailedOrRestToday ? (
                                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                    Try Tomorrow
                                  </span>
                                ) : isBlocked ? (
                                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-slate-500/20 text-slate-400 border border-slate-500/30">
                                    <Lock className="w-3 h-3 mr-2" />
                                    Locked
                                  </span>
                                ) : isCurrentDay ? (
                                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-primary/20 text-primary border border-primary/30">
                                    ⭐ Train Today
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    💪 Upcoming
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
                <CarouselPrevious className="text-white border-white/20 hover:bg-white/10 backdrop-blur-sm -left-4 md:-left-6 lg:-left-8" />
                <CarouselNext className="text-white border-white/20 hover:bg-white/10 backdrop-blur-sm -right-4 md:-right-6 lg:-right-8" />
              </Carousel>
            );
          })()}
        </div>
      )}

      {/* Purchase Modal */}
      <ChallengePurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        challenge={challenge}
        onPurchaseSuccess={() => {
          setIsPurchaseModalOpen(false);
          refreshPurchases();
          joinChallenge();
        }}
      />
    </div>
  );
};

export default ChallengePreview;