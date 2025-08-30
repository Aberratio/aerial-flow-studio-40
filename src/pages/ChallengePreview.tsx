import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Play,
  ChevronLeft,
  Edit,
  Clock,
  Target,
  Lock,
} from "lucide-react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
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

  // Use the challenge calendar hook
  const {
    calendarDays,
    isLoading: calendarLoading,
    generateCalendar,
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0
      ? `${mins}:${secs.toString().padStart(2, "0")}`
      : `0:${secs.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white">Challenge not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-900/50 via-purple-800/30 to-blue-900/50"></div>
        <div className="relative z-10 p-6">
          {/* Back Button */}
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/challenges")}
              className="text-white hover:bg-white/20"
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Back to Challenges
            </Button>
            
            {/* Edit button for admins/creators */}
            {(isAdmin || challenge.created_by === user?.id) && (
              <Button
                variant="ghost"
                onClick={() => navigate(`/challenges/${challengeId}/edit`)}
                className="text-white hover:bg-white/20"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>

          {/* Challenge Info */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              {challenge.premium && (
                <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
                  Premium
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

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white text-center mb-4">
              {challenge.title}
            </h1>

            <p className="text-lg text-white/80 max-w-2xl mx-auto">
              {challenge.description}
            </p>
          </div>

          {/* Join/Start Button */}
          {!isParticipant ? (
            <div className="text-center">
              <Button
                onClick={joinChallenge}
                disabled={isJoining}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-lg"
              >
                {isJoining ? "Joining..." : "Join Challenge"}
              </Button>
            </div>
          ) : null}
        </div>
      </div>

      {/* Training Days Slider */}
      {isParticipant && (
        <div className="p-6">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Your Training Schedule</h2>
          
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
              <Carousel className="w-full">
                <CarouselContent className="-ml-2 md:-ml-4">
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
                    const isReadyToStart = !isBlocked && isPending && isAccessible && !isFailedOrRestToday;

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
                            !isFailedOrRestToday &&
                            calendarDay &&
                            isAccessible &&
                            (isPending
                              ? navigate(`/challenge/${challengeId}/day/${calendarDay.id}/timer`)
                              : navigate(`/challenge/${challengeId}/day/${calendarDay.id}`))
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
                                  : isUserRestDay
                                  ? "🛌"
                                  : isRestDay
                                  ? "🌴"
                                  : isReadyToStart
                                  ? "⭐"
                                  : "💪"}
                              </div>
                              <div>
                                <h3
                                  className={`text-lg font-bold ${
                                    isBlocked ? "text-muted-foreground" : "text-white"
                                  }`}
                                >
                                  DAY {trainingDay.day_number}
                                  {calendarDay?.is_retry && " (RETRY)"}
                                </h3>
                                <div
                                  className={`text-sm ${
                                    isBlocked ? "text-muted-foreground/70" : "text-white/90"
                                  }`}
                                >
                                  {isBlocked
                                    ? "Complete previous day first"
                                    : trainingDay.title || (isRestDay ? "Rest Day" : "Training Day")}
                                </div>
                              </div>
                            </div>
                          </div>

                          <CardContent className="p-4 flex-1">
                            {/* Duration and Exercise Count */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-4 h-4" />
                                {isRestDay ? "Rest Day" : `${Math.ceil(totalDuration / 60)} mins`}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Target className="w-4 h-4" />
                                {exercises.length} exercises
                              </div>
                            </div>

                            {/* Day Notes */}
                            {(calendarDay?.notes || trainingDay.description) && (
                              <div className="mb-4">
                                <p
                                  className={`text-sm ${
                                    isBlocked ? "text-muted-foreground/70" : "text-muted-foreground"
                                  }`}
                                >
                                  {calendarDay?.notes || trainingDay.description}
                                </p>
                              </div>
                            )}

                            {/* Exercise List - Show ALL exercises */}
                            {!isRestDay && exercises.length > 0 && (
                              <div className="space-y-2 mt-4">
                                {exercises.map((exercise, exerciseIndex) => (
                                  <div
                                    key={exercise.id}
                                    className="flex items-start justify-between p-2 bg-white/5 rounded border border-white/10"
                                  >
                                    <div className="flex-1 pt-2 pl-2">
                                      <h4
                                        className={`font-medium text-sm ${
                                          isBlocked ? "text-muted-foreground" : "text-white"
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
                                          isBlocked ? "text-muted-foreground/70" : "text-purple-400"
                                        }`}
                                      >
                                        {formatTime(exercise.hold_time_seconds || 30)}
                                        {exercise.sets && exercise.sets > 1 && ` × ${exercise.sets}`}
                                      </div>
                                    </div>

                                    {/* Exercise preview */}
                                    <div
                                      className={`w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center ${
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
                              </div>
                            )}

                            {/* Rest Day Content */}
                            {isRestDay && (
                              <div className="text-center py-6">
                                <div className="text-4xl mb-2">🌴</div>
                                <p className="text-muted-foreground text-sm">
                                  Take time to recover and prepare for tomorrow
                                </p>
                              </div>
                            )}

                            {/* Action Button */}
                            <div className="mt-4 pt-3 border-t border-white/10 space-y-3">
                              {isReadyToStart && (
                                <Button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/challenge/${challengeId}/day/${calendarDay?.id}/timer`);
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
                                ) : isUserRestDay ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-500/20 text-orange-400 border border-orange-500/30">
                                    🛌 Rest Day
                                  </span>
                                ) : isFailedOrRestToday ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                    Try Tomorrow
                                  </span>
                                ) : isBlocked ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-muted/20 text-muted-foreground border border-muted/30">
                                    <Lock className="w-3 h-3 mr-1" />
                                    Locked
                                  </span>
                                ) : isReadyToStart ? (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                                    ⭐ Train Today
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                    💪 Ready
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
                <CarouselPrevious className="text-white border-white/20 hover:bg-white/10" />
                <CarouselNext className="text-white border-white/20 hover:bg-white/10" />
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