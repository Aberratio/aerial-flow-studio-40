import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Play,
  Clock,
  Trophy,
  CheckCircle,
  Star,
  Volume2,
  VolumeX,
  Edit2,
  Pause,
  X,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
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
  const { challengeId, dayId } = useParams();
  const navigate = useNavigate();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [trainingDay, setTrainingDay] = useState<TrainingDay | null>(null);
  const [dayNumber, setDayNumber] = useState<number>(0);
  const [totalDays, setTotalDays] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [participationStatus, setParticipationStatus] =
    useState<string>("active");
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null
  );
  const [showTimer, setShowTimer] = useState(false);
  const [allDays, setAllDays] = useState<TrainingDayBasic[]>([]);
  const { user } = useAuth();
  const { canCreateChallenges } = useUserRole();
  const { toast } = useToast();
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

      // Fetch user's participation status
      if (user) {
        const { data: participationData } = await supabase
          .from("challenge_participants")
          .select("status")
          .eq("challenge_id", challengeId)
          .eq("user_id", user.id)
          .single();
        if (participationData) {
          setParticipationStatus(participationData.status);
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
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner":
        return "bg-green-500/20 text-green-400";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400";
      case "advanced":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };
  const handleStartDay = () => {
    if (!trainingDay || trainingDay.exercises.length === 0) return;
    if (challenge?.type === "timer") {
      setShowTimer(true);
    } else {
      setIsExerciseModalOpen(true);
    }
  };
  const handleExerciseClick = (exercise: Exercise) => {
    console.log("Exercise clicked:", exercise.figure.name, exercise.figure.id);
    setSelectedExercise(exercise);
    navigate(`/exercise/${exercise.figure.id}`);
  };
  const canEditChallenge = () => {
    return (
      canCreateChallenges &&
      challenge &&
      (user?.id === challenge.created_by || user?.role === "admin")
    );
  };
  const handleStatusChange = async (newStatus: string) => {
    if (!user || !challengeId) return;
    try {
      const { error } = await supabase
        .from("challenge_participants")
        .update({
          status: newStatus,
        })
        .eq("challenge_id", challengeId)
        .eq("user_id", user.id);
      if (error) throw error;
      setParticipationStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Challenge status changed to ${newStatus}`,
      });
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive",
      });
    }
  };
  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading challenge day...</div>
      </div>
    );
  }
  if (!challenge || !trainingDay) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl mb-4">Challenge day not found</h2>
          <Button onClick={() => navigate("/challenges")} variant="outline">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }
  const calculateDuration = () => {
    if (!trainingDay.exercises.length) return "No duration set";
    let totalMinutes = 0;
    trainingDay.exercises.forEach((exercise) => {
      if (exercise.sets && exercise.hold_time_seconds) {
        totalMinutes += (exercise.sets * exercise.hold_time_seconds) / 60;
      }
      if (exercise.rest_time_seconds && exercise.sets && exercise.sets > 1) {
        totalMinutes += ((exercise.sets - 1) * exercise.rest_time_seconds) / 60;
      }
    });
    return totalMinutes > 0
      ? `~${Math.ceil(totalMinutes)} minutes`
      : "30-45 minutes";
  };
  const handleTimerComplete = async () => {
    if (!user) return;

    try {
      // Save day progress when timer completes
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .upsert({
          user_id: user.id,
          challenge_id: challengeId!,
          training_day_id: dayId!,
          exercises_completed: trainingDay!.exercises.length,
          total_exercises: trainingDay!.exercises.length,
          completed_at: new Date().toISOString(),
          status: 'completed',
          scheduled_date: new Date().toISOString(),
        });

      if (progressError) throw progressError;

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

    setShowTimer(false);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate(`/challenges/${challengeId}`)}
              className="mr-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Challenge
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Day {dayNumber}</h1>
              <p className="text-muted-foreground">{challenge.title}</p>
            </div>
          </div>

          {canEditChallenge() && (
            <Button
              variant="outline"
              onClick={() => navigate(`/challenges/${challengeId}/edit`)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Challenge
            </Button>
          )}
        </div>

        {/* Day Timeline */}
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
            <Progress
              value={(dayNumber / totalDays) * 100}
              className="h-1 mt-4"
            />
          </CardContent>
        </Card>

        {/* Day Overview */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-2xl mb-2">
                  {trainingDay.title}
                </CardTitle>
                <p className="text-muted-foreground mb-4">
                  {trainingDay.description}
                </p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                      Day {dayNumber} of {totalDays}
                    </Badge>
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {calculateDuration()}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Trophy className="w-4 h-4 mr-1" />
                      {trainingDay.exercises.length} exercises
                    </div>
                  </div>

                  {/* Status Selector */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      Status:
                    </span>
                    <Select
                      value={participationStatus}
                      onValueChange={handleStatusChange}
                    >
                      <SelectTrigger className="w-32 h-8 border-white/20 bg-black/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {isAudioEnabled ? (
                  <Volume2 className="w-4 h-4" />
                ) : (
                  <VolumeX className="w-4 h-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trainingDay.exercises.map((exercise, index) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="border-white/20 text-white/70"
                >
                  {exercise.figure.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exercises or Rest Day Content */}
        {trainingDay.is_rest_day ? (
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
        ) : (
          <Card className="glass-effect border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white">Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingDay.exercises.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No exercises added to this training day yet.</p>
                  </div>
                ) : (
                  trainingDay.exercises.map((exercise, index) => (
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
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        <div className="space-y-4">
          {/* Primary Action Button */}
          <div className="flex space-x-3">
            {!trainingDay.is_rest_day ? (
              <Button
                onClick={handleStartDay}
                disabled={trainingDay.exercises.length === 0}
                className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 disabled:opacity-50"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Day {dayNumber}
              </Button>
            ) : (
              <Button
                onClick={async () => {
                  if (!user) return;
                  try {
                    // Mark rest day as completed
                    const { error: progressError } = await supabase
                      .from("challenge_day_progress")
                      .upsert({
                        user_id: user.id,
                        challenge_id: challengeId!,
                        training_day_id: dayId!,
                        exercises_completed: 0,
                        total_exercises: 0,
                        completed_at: new Date().toISOString(),
                        status: 'rest',
                        scheduled_date: new Date().toISOString(),
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
                      console.error("Error creating activity:", activityError);

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

          {/* Additional Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={async () => {
                if (!user) return;
                try {
                  const { error } = await supabase
                    .from("challenge_day_progress")
                    .upsert({
                      user_id: user.id,
                      challenge_id: challengeId!,
                      training_day_id: dayId!,
                      exercises_completed: 0,
                      total_exercises: trainingDay.exercises.length,
                      status: 'rest',
                      scheduled_date: new Date().toISOString(),
                      notes: 'User set additional rest day',
                    });

                  if (error) throw error;

                  toast({
                    title: "Rest Day Set",
                    description: "Today has been marked as a rest day. Take time to recover!",
                  });

                  window.location.reload();
                } catch (error) {
                  console.error("Error setting rest day:", error);
                  toast({
                    title: "Error",
                    description: "Failed to set rest day. Please try again.",
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
                  const { error } = await supabase
                    .from("challenge_day_progress")
                    .upsert({
                      user_id: user.id,
                      challenge_id: challengeId!,
                      training_day_id: dayId!,
                      exercises_completed: 0,
                      total_exercises: trainingDay.exercises.length,
                      status: 'failed',
                      scheduled_date: new Date().toISOString(),
                      notes: 'User marked day as failed - needs retry',
                    });

                  if (error) throw error;

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
              }}
              className="flex-1 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Mark as Failed
            </Button>
          </div>
        </div>

        {/* Timer Mode */}
        {showTimer && trainingDay && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full">
              <Button
                variant="ghost"
                onClick={() => setShowTimer(false)}
                className="absolute -top-12 right-0 text-white hover:bg-white/10"
              >
                ✕ Close Timer
              </Button>
              <ChallengeTimer
                exercises={trainingDay.exercises}
                isAudioEnabled={isAudioEnabled}
                onComplete={handleTimerComplete}
              />
            </div>
          </div>
        )}

        {/* Exercise Modal */}
        {trainingDay && (
          <ChallengeExerciseModal
            isOpen={isExerciseModalOpen}
            onClose={() => setIsExerciseModalOpen(false)}
            challengeId={challengeId!}
            dayId={dayId!}
            dayNumber={dayNumber}
            exercises={trainingDay.exercises}
          />
        )}
      </div>
    </div>
  );
};
export default ChallengeDayOverview;
