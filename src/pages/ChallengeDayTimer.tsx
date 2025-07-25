import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Hand, Volume2, VolumeX, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChallengeCalendar } from "@/hooks/useChallengeCalendar";
import { useSpeech } from "@/hooks/useSpeech";

interface Exercise {
  id: string;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  figure: {
    id: string;
    name: string;
    image_url?: string;
  };
}

interface TimerSegment {
  type: "exercise" | "rest";
  exerciseIndex: number;
  setIndex: number;
  duration: number;
  exerciseName: string;
  exerciseImage?: string;
}

const ChallengeDayTimer = () => {
  const { challengeId, dayId } = useParams<{
    challengeId: string;
    dayId: string;
  }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { changeDayStatus, getCalendarDayByTrainingDay } = useChallengeCalendar(
    challengeId || ""
  );

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [segments, setSegments] = useState<TimerSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(() => {
    const saved = localStorage.getItem("challengeTimerVoice");
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [hasAnnouncedSegment, setHasAnnouncedSegment] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trainingDayId, setTrainingDayId] = useState<string>("");

  const { speak } = useSpeech(isAudioEnabled);

  // Fetch exercises data
  useEffect(() => {
    const fetchExercises = async () => {
      if (!dayId || !user?.id) return;

      try {
        setIsLoading(true);

        // Get user challenge calendar day to find training day ID
        const { data: calendarDay, error: calendarError } = await supabase
          .from("user_challenge_calendar_days")
          .select("training_day_id")
          .eq("id", dayId)
          .eq("user_id", user.id)
          .single();

        if (calendarError) throw calendarError;
        setTrainingDayId(calendarDay.training_day_id);

        // Fetch training day exercises
        const { data: trainingDayData, error: trainingDayError } =
          await supabase
            .from("challenge_training_days")
            .select(
              `
            training_day_exercises (
              *,
              figure:figures (
                id, name, image_url
              )
            )
          `
            )
            .eq("id", calendarDay.training_day_id)
            .single();

        if (trainingDayError) throw trainingDayError;

        const exercisesData =
          trainingDayData.training_day_exercises?.map((exercise: any) => ({
            id: exercise.id,
            sets: exercise.sets || 1,
            reps: exercise.reps,
            hold_time_seconds: exercise.hold_time_seconds || 30,
            rest_time_seconds: exercise.rest_time_seconds || 15,
            figure: exercise.figure,
          })) || [];

        setExercises(exercisesData);
      } catch (error) {
        console.error("Error fetching exercises:", error);
        toast({
          title: "Error",
          description: "Failed to load exercises",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchExercises();
  }, [dayId, user?.id]);

  // Generate timer segments from exercises
  useEffect(() => {
    if (exercises.length === 0) return;

    const newSegments: TimerSegment[] = [];

    exercises.forEach((exercise, exerciseIndex) => {
      const sets = exercise.sets || 1;

      for (let setIndex = 0; setIndex < sets; setIndex++) {
        // Add exercise segment
        newSegments.push({
          type: "exercise",
          exerciseIndex,
          setIndex,
          duration: exercise.hold_time_seconds || 30,
          exerciseName: exercise.figure.name,
          exerciseImage: exercise.figure.image_url,
        });

        // Add rest segment (except after the last set of the last exercise)
        if (
          !(exerciseIndex === exercises.length - 1 && setIndex === sets - 1)
        ) {
          newSegments.push({
            type: "rest",
            exerciseIndex,
            setIndex,
            duration: exercise.rest_time_seconds || 15,
            exerciseName: "Rest",
          });
        }
      }
    });

    setSegments(newSegments);
    if (newSegments.length > 0) {
      setTimeRemaining(newSegments[0].duration);
    }
  }, [exercises]);

  // Timer logic with synchronized countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          // Speak countdown BEFORE decrementing to fix synchronization
          if (prev <= 7 && prev > 1) {
            speak((prev - 2).toString());
          }

          if (prev <= 1) {
            handleSegmentComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining, currentSegmentIndex, segments]);

  // Announce segment changes
  useEffect(() => {
    if (!isRunning || !segments[currentSegmentIndex]) return;

    const currentSegment = segments[currentSegmentIndex];

    if (!hasAnnouncedSegment) {
      setHasAnnouncedSegment(true);

      if (currentSegment.type === "exercise") {
        const duration = formatTimeNatural(currentSegment.duration);
        speak(`${currentSegment.exerciseName}, ${duration}`);
      } else {
        const duration = formatTimeNatural(currentSegment.duration);
        speak(`Rest time, ${duration}`);
      }
    }
  }, [currentSegmentIndex, isRunning, hasAnnouncedSegment, segments]);

  // Reset announcement flags when segment changes
  useEffect(() => {
    setHasAnnouncedSegment(false);
  }, [currentSegmentIndex]);

  // Format time in natural language
  const formatTimeNatural = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs} seconds`;
    } else if (mins === 1 && secs === 0) {
      return "1 minute";
    } else if (mins === 1) {
      return `1 minute and ${secs} seconds`;
    } else if (secs === 0) {
      return `${mins} minutes`;
    } else {
      return `${mins} minutes and ${secs} seconds`;
    }
  };

  const handleSegmentComplete = () => {
    const currentSegment = segments[currentSegmentIndex];

    if (currentSegmentIndex >= segments.length - 1) {
      // Timer completed
      setIsCompleted(true);
      setIsRunning(false);
      speak("Workout completed! Great job!");
      handleWorkoutComplete();
      return;
    }

    // Move to next segment
    const nextIndex = currentSegmentIndex + 1;
    const nextSegment = segments[nextIndex];

    setCurrentSegmentIndex(nextIndex);
    setTimeRemaining(nextSegment.duration);
  };

  const handleWorkoutComplete = async () => {
    if (!user || !challengeId || !trainingDayId) return;

    try {
      const calendarDay = getCalendarDayByTrainingDay(trainingDayId);
      if (calendarDay) {
        await changeDayStatus(calendarDay.calendar_date, "completed");
        toast({
          title: "Workout Completed!",
          description:
            "Great job! This training day has been marked as completed.",
        });
        navigate(`/challenges/${challengeId}`);
      }
    } catch (error) {
      console.error("Error completing workout:", error);
      toast({
        title: "Error",
        description: "Failed to mark workout as completed",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleSkip = () => {
    handleSegmentComplete();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const calculateProgress = (): number => {
    if (segments.length === 0) return 0;
    const totalDuration = segments.reduce(
      (sum, segment) => sum + segment.duration,
      0
    );
    const completedDuration = segments
      .slice(0, currentSegmentIndex)
      .reduce((sum, segment) => sum + segment.duration, 0);
    const currentSegmentProgress = segments[currentSegmentIndex]
      ? segments[currentSegmentIndex].duration - timeRemaining
      : 0;
    return ((completedDuration + currentSegmentProgress) / totalDuration) * 100;
  };

  const getCurrentSegment = () => segments[currentSegmentIndex];
  const getNextSegment = () => segments[currentSegmentIndex + 1];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            No exercises found
          </h2>
          <Button
            onClick={() => navigate(`/challenge/${challengeId}/day/${dayId}`)}
            variant="outline"
          >
            Back to Day Overview
          </Button>
        </div>
      </div>
    );
  }

  const currentSegment = getCurrentSegment();
  const nextSegment = getNextSegment();

  const ProgressBar = ({ className }: { className: string }) => {
    return (
      <div className={`my-2 ${className}`}>
        <div className="flex justify-between items-center mb-3">
          <h1 className="text-xl font-semibold text-white">Workout Session</h1>
          <span className="text-sm text-white/60">
            {Math.round(calculateProgress())}% Complete
          </span>
        </div>
        <div className="relative">
          <Progress value={calculateProgress()} className="h-3 bg-white/10" />
          <div
            className="absolute inset-0 bg-gradient-to-r from-primary/50 to-primary rounded-full opacity-30"
            style={{ width: `${calculateProgress()}%` }}
          />
        </div>
      </div>
    );
  };

  const NextUp = ({ className }: { className: string }) => {
    return (
      <div className={`${className}`}>
        {/* Next Up */}
        {nextSegment && (
          <Card className="glass-effect border-white/10">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-white mb-3">Up Next</h3>
              <div className="flex items-center space-x-3">
                {nextSegment.type === "exercise" &&
                nextSegment.exerciseImage ? (
                  <img
                    src={nextSegment.exerciseImage}
                    alt={nextSegment.exerciseName}
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                ) : nextSegment.type === "rest" ? (
                  <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                    <Hand className="w-6 h-6 text-green-400" />
                  </div>
                ) : (
                  <div className="w-12 h-12 bg-gray-500/20 rounded-lg flex items-center justify-center">
                    <span className="text-xl">🏃‍♂️</span>
                  </div>
                )}
                <div className="flex-1">
                  <div className="font-medium text-white">
                    {nextSegment.exerciseName}
                  </div>
                  <div className="text-sm text-white/60">
                    {formatTimeNatural(nextSegment.duration)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900">
      {/* Modern Header */}
      <div>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate(`/challenge/${challengeId}/day/${dayId}`)}
              className="text-white hover:bg-white/10 gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Overview</span>
              <span className="sm:hidden">Back</span>
            </Button>

            <div className="flex items-center gap-3">
              {/* Progress indicator */}
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
                <span>
                  {currentSegmentIndex + 1} / {segments.length}
                </span>
              </div>

              {/* Voice toggle */}
              <Button
                variant="ghost"
                onClick={() => {
                  const newValue = !isAudioEnabled;
                  setIsAudioEnabled(newValue);
                  localStorage.setItem(
                    "challengeTimerVoice",
                    JSON.stringify(newValue)
                  );
                }}
                className={`text-white hover:bg-white/10 transition-all ${
                  isAudioEnabled ? "bg-primary/20 text-primary" : "bg-white/5"
                }`}
              >
                {isAudioEnabled ? (
                  <Volume2 className="w-5 h-5" />
                ) : (
                  <VolumeX className="w-5 h-5" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-1 max-w-4xl">
        <ProgressBar className="hidden sm:block mb-8" />
        {currentSegment && (
          <div className="grid lg:grid-cols-3 gap-4">
            {/* Main Exercise Display */}
            <div className="lg:col-span-2">
              <Card className="glass-effect border-white/10 overflow-hidden">
                <CardContent className="p-0">
                  {/* Exercise Image - Very Large */}
                  <div className="relative">
                    <div className="aspect-square max-w-2xl mx-auto">
                      {currentSegment.type === "exercise" &&
                      currentSegment.exerciseImage ? (
                        <img
                          src={currentSegment.exerciseImage}
                          alt={currentSegment.exerciseName}
                          className="w-full h-full object-cover"
                        />
                      ) : currentSegment.type === "rest" ? (
                        <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                          <Hand className="w-32 h-32 md:w-40 md:h-40 text-green-400" />
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                          <span className="text-6xl md:text-8xl">🏃‍♂️</span>
                        </div>
                      )}
                    </div>

                    {/* Overlay with exercise type */}
                    <div className="absolute top-4 left-4">
                      <Badge
                        className={`text-sm font-medium ${
                          currentSegment.type === "exercise"
                            ? "bg-blue-500/90 text-white border-0"
                            : "bg-green-500/90 text-white border-0"
                        }`}
                      >
                        {currentSegment.type === "exercise"
                          ? "Exercise"
                          : "Rest Period"}
                      </Badge>
                    </div>
                  </div>

                  {/* Exercise Info */}
                  <div className="p-6 text-center bg-gradient-to-t from-black/30 to-transparent">
                    <h2 className="text-2xl md:text-4xl font-bold text-white mb-4">
                      {currentSegment.exerciseName}
                    </h2>

                    {/* Large Timer Display */}
                    <div className="relative mb-4 sm:mb-6">
                      <div className="text-5xl sm:text-6xl md:text-8xl font-mono font-bold text-primary mb-2">
                        {formatTime(timeRemaining)}
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-row justify-center gap-4">
                      <Button
                        onClick={handlePlayPause}
                        size="lg"
                        variant="primary"
                      >
                        {isRunning ? (
                          <>
                            <Pause className="w-6 h-6 mr-3" />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-6 h-6 mr-3" />
                            Start
                          </>
                        )}
                      </Button>

                      {!isCompleted && (
                        <Button
                          onClick={handleSkip}
                          variant="outline"
                          size="lg"
                        >
                          Skip
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <NextUp className="block sm:hidden" />
            <ProgressBar className="block sm:hidden" />

            {/* Sidebar Info */}
            <div className="space-y-4">
              {/* Current Exercise Details */}
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Current
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Type:</span>
                      <span className="text-white">
                        {currentSegment.type === "exercise"
                          ? "Exercise"
                          : "Rest"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Duration:</span>
                      <span className="text-white">
                        {formatTimeNatural(currentSegment.duration)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Exercise:</span>
                      <span className="text-white font-medium">
                        {currentSegment.exerciseIndex + 1} of {exercises.length}
                      </span>
                    </div>
                    {currentSegment.type === "exercise" && (
                      <div className="flex justify-between">
                        <span className="text-white/70">Set:</span>
                        <span className="text-white">
                          {currentSegment.setIndex + 1} of{" "}
                          {exercises[currentSegment.exerciseIndex]?.sets || 1}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <NextUp className="hidden sm:block" />

              {/* Workout Stats */}
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-3">
                    Stats
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Exercises:</span>
                      <span className="text-white">{exercises.length}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Total Sets:</span>
                      <span className="text-white">
                        {segments.filter((s) => s.type === "exercise").length}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/70">Completed:</span>
                      <span className="text-white">
                        {currentSegmentIndex} / {segments.length}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Completion Modal */}
        {isCompleted && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <Card className="glass-effect border-white/10 max-w-md w-full">
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <span className="text-4xl">🎉</span>
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">
                  Workout Complete!
                </h2>
                <p className="text-white/70 mb-6 text-lg">
                  Fantastic work! You've successfully completed this training
                  session.
                </p>
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <div className="text-sm text-white/60 mb-1">
                    Session Stats
                  </div>
                  <div className="text-white font-semibold">
                    {exercises.length} exercises completed
                  </div>
                </div>
                <Button
                  onClick={() => navigate(`/challenges/${challengeId}`)}
                  className="bg-primary hover:bg-primary/90 text-white font-semibold px-8 py-3 text-lg w-full"
                >
                  Continue to Challenge
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDayTimer;
