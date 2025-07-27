import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft, Hand, Volume2, VolumeX, Play, Pause, MoreHorizontal, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  notes?: string;
  figure: {
    id: string;
    name: string;
    difficulty_level?: string;
    category?: string;
    instructions?: string;
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
  exerciseNotes?: string;
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
  const [isPreparingToStart, setIsPreparingToStart] = useState(false);
  const [preparationTime, setPreparationTime] = useState(10);
  const [showActionDialog, setShowActionDialog] = useState(false);
  const [actionType, setActionType] = useState<"failed" | "rest" | null>(null);

  const { speak } = useSpeech(isAudioEnabled);

  useEffect(() => {
    const fetchExercises = async () => {
      if (!dayId || !user?.id) return;

      try {
        setIsLoading(true);

        const { data: calendarDay, error: calendarError } = await supabase
          .from("user_challenge_calendar_days")
          .select("training_day_id")
          .eq("id", dayId)
          .eq("user_id", user.id)
          .single();

        if (calendarError) throw calendarError;
        setTrainingDayId(calendarDay.training_day_id);

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
            notes: exercise.notes,
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

  useEffect(() => {
    if (exercises.length === 0) return;

    const newSegments: TimerSegment[] = [];

    exercises.forEach((exercise, exerciseIndex) => {
      const sets = exercise.sets || 1;

      for (let setIndex = 0; setIndex < sets; setIndex++) {
        newSegments.push({
          type: "exercise",
          exerciseIndex,
          setIndex,
          duration: exercise.hold_time_seconds || 30,
          exerciseName: exercise.figure.name,
          exerciseImage: exercise.figure.image_url,
          exerciseNotes: exercise.notes,
        });

        if (!(exerciseIndex === exercises.length - 1 && setIndex === sets - 1)) {
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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPreparingToStart && preparationTime > 0) {
      interval = setInterval(() => {
        setPreparationTime((prev) => {
          if (prev > 2 && prev < 7) {
            speak((prev - 1).toString());
          } else if (prev === 2) {
            speak("1... Begin!");
          }

          if (prev <= 1) {
            setIsPreparingToStart(false);
            setIsRunning(true);
            setPreparationTime(10);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isPreparingToStart, preparationTime]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPreparingToStart && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
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
  }, [
    isRunning,
    isPreparingToStart,
    timeRemaining,
    currentSegmentIndex,
    segments,
  ]);

  useEffect(() => {
    if (!isRunning || !segments[currentSegmentIndex]) return;

    const currentSegment = segments[currentSegmentIndex];

    if (!hasAnnouncedSegment) {
      setHasAnnouncedSegment(true);

      if (currentSegment.type === "exercise") {
        const duration = formatTimeNatural(currentSegment.duration);
        const notes = currentSegment.exerciseNotes
          ? `, ${currentSegment.exerciseNotes}`
          : "";
        speak(`${currentSegment.exerciseName}, ${duration}${notes}`);
      } else {
        const duration = formatTimeNatural(currentSegment.duration);
        speak(`Rest time, ${duration}`);
      }
    }
  }, [currentSegmentIndex, isRunning, hasAnnouncedSegment, segments]);

  useEffect(() => {
    setHasAnnouncedSegment(false);
  }, [currentSegmentIndex]);

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
      setIsCompleted(true);
      setIsRunning(false);
      speak("Workout completed! Great job!");
      return;
    }

    const nextIndex = currentSegmentIndex + 1;
    const nextSegment = segments[nextIndex];

    setCurrentSegmentIndex(nextIndex);
    setTimeRemaining(nextSegment.duration);
  };

  const handleWorkoutComplete = async () => {
    if (!user || !challengeId || !dayId) return;

    try {
      const calendarDay = getCalendarDayByTrainingDay(dayId);
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

  const handleWorkoutFailed = async () => {
    if (!user || !challengeId || !dayId) return;

    try {
      const calendarDay = getCalendarDayByTrainingDay(dayId);
      if (calendarDay) {
        await changeDayStatus(calendarDay.calendar_date, "failed");
        toast({
          title: "Workout Failed!",
          description:
            "This training day has been marked as failed. Don't worry, you can try again next day!",
        });
        navigate(`/challenges/${challengeId}`);
      }
    } catch (error) {
      console.error("Error failing workout:", error);
      toast({
        title: "Error",
        description: "Failed to mark workout as failed",
        variant: "destructive",
      });
    }
  };

  const handleActionClick = (action: "failed" | "rest") => {
    setActionType(action);
    setShowActionDialog(true);
  };

  const handleActionConfirm = async () => {
    if (!actionType || !user || !challengeId || !dayId) return;

    try {
      const calendarDay = getCalendarDayByTrainingDay(dayId);
      if (calendarDay) {
        await changeDayStatus(calendarDay.calendar_date, actionType);
        toast({
          title: actionType === "failed" ? "Day Marked as Failed" : "Day Marked as Rest",
          description: actionType === "failed" 
            ? "This training day has been marked as failed. You can retry tomorrow!"
            : "This training day has been marked as a rest day.",
        });
        navigate(`/challenges/${challengeId}`);
      }
    } catch (error) {
      console.error(`Error marking day as ${actionType}:`, error);
      toast({
        title: "Error",
        description: `Failed to mark day as ${actionType}`,
        variant: "destructive",
      });
    } finally {
      setShowActionDialog(false);
      setActionType(null);
    }
  };

  const handlePlayPause = () => {
    if (!isRunning && !isPreparingToStart) {
      setIsPreparingToStart(true);
      setPreparationTime(10);
      speak("Get ready!");
    } else if (isPreparingToStart) {
      setIsPreparingToStart(false);
      setPreparationTime(10);
    } else {
      setIsRunning(!isRunning);
    }
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
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
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
                  {nextSegment.type === "exercise" &&
                    nextSegment.exerciseNotes && (
                      <div className="text-xs text-primary/80 mt-1 bg-primary/10 rounded px-2 py-1 border border-primary/20">
                        {nextSegment.exerciseNotes}
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10">
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
              <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
                <span>
                  {currentSegmentIndex + 1} / {segments.length}
                </span>
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    className="text-white hover:bg-white/10"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="glass-effect border-white/10 bg-black/90"
                >
                  <DropdownMenuItem 
                    onClick={() => handleActionClick("failed")}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                  >
                    Mark as Failed
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => handleActionClick("rest")}
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
                  >
                    Mark as Rest Day
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

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
            <div className="lg:col-span-2">
              <Card className="glass-effect border-white/10 overflow-hidden">
                <CardContent className="p-0">
                  <div className="relative">
                    <div className="aspect-square max-w-2xl mx-auto bg-gray-900/50 rounded-lg overflow-hidden">
                      {currentSegment.type === "exercise" &&
                      currentSegment.exerciseImage ? (
                        <img
                          src={currentSegment.exerciseImage}
                          alt={currentSegment.exerciseName}
                          className="w-full h-full object-contain"
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

                  <div className="p-4 sm:p-6 text-center bg-gradient-to-t from-black/30 to-transparent">
                    <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
                      {currentSegment.exerciseName}
                    </h2>

                    {currentSegment.type === "exercise" &&
                      currentSegment.exerciseNotes && (
                        <div className="mb-3 sm:mb-4 px-2">
                          <p className="text-sm sm:text-base text-primary/90 bg-primary/10 rounded-lg p-2 sm:p-3 border border-primary/20">
                            {currentSegment.exerciseNotes}
                          </p>
                        </div>
                      )}

                    <div className="relative mb-4 sm:mb-6">
                      {isPreparingToStart ? (
                        <div className="flex flex-col items-center">
                          <div className="text-lg sm:text-xl text-white/70 mb-2">
                            Get Ready!
                          </div>
                          <div className="text-6xl sm:text-7xl md:text-9xl font-mono font-bold text-yellow-400 mb-2 animate-pulse">
                            {preparationTime}
                          </div>
                          <div className="text-sm sm:text-base text-white/60">
                            Workout starts in...
                          </div>
                        </div>
                      ) : (
                        <div className="text-4xl sm:text-5xl md:text-8xl font-mono font-bold text-primary mb-2">
                          {formatTime(timeRemaining)}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-row justify-center gap-4">
                      <Button
                        onClick={handlePlayPause}
                        size="lg"
                        variant="primary"
                      >
                        {isPreparingToStart ? (
                          <>
                            <Pause className="w-6 h-6 mr-3" />
                            Cancel
                          </>
                        ) : isRunning ? (
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

            <div className="space-y-4">
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
                    {currentSegment.type === "exercise" &&
                      currentSegment.exerciseNotes && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="text-white/70 text-xs mb-1">
                            Notes:
                          </div>
                          <div className="text-white text-xs bg-primary/10 rounded p-2 border border-primary/20">
                            {currentSegment.exerciseNotes}
                          </div>
                        </div>
                      )}
                  </div>
                </CardContent>
              </Card>

              <NextUp className="hidden sm:block" />

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

        <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
          <DialogContent className="glass-effect border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-yellow-500" />
                {actionType === "failed" ? "Mark Day as Failed" : "Mark Day as Rest"}
              </DialogTitle>
              <DialogDescription className="text-white/70">
                {actionType === "failed" ? (
                  <>
                    Are you sure you want to mark this day as failed? This will:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Record this training day as incomplete</li>
                      <li>Allow you to retry this day tomorrow</li>
                      <li>Not affect your overall challenge progress negatively</li>
                    </ul>
                  </>
                ) : (
                  <>
                    Are you sure you want to mark this day as a rest day? This will:
                    <ul className="list-disc list-inside mt-2 space-y-1">
                      <li>Convert this training day to a rest day</li>
                      <li>Mark it as completed without exercises</li>
                      <li>Allow you to continue to the next day</li>
                    </ul>
                  </>
                )}
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowActionDialog(false)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleActionConfirm}
                className={`flex-1 ${
                  actionType === "failed"
                    ? "bg-red-600 hover:bg-red-700"
                    : "bg-blue-600 hover:bg-blue-700"
                } text-white`}
              >
                {actionType === "failed" ? "Mark as Failed" : "Mark as Rest"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

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
                  How did your workout go?
                </p>
                <div className="bg-white/10 rounded-lg p-4 mb-6">
                  <div className="text-sm text-white/60 mb-1">
                    Session Stats
                  </div>
                  <div className="text-white font-semibold">
                    {exercises.length} exercises completed
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <Button
                    onClick={handleWorkoutComplete}
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold w-full py-3 text-lg"
                  >
                    ✅ Completed Successfully
                  </Button>
                  <Button
                    onClick={handleWorkoutFailed}
                    variant="outline"
                    className="border-red-500/50 text-red-400 hover:bg-red-500/10 w-full py-3 text-lg"
                  >
                    ❌ Could Not Complete
                  </Button>
                </div>

                <div className="space-y-2 pt-4 border-t border-white/10">
                  <p className="text-sm text-white/60 mb-3">
                    Or continue without marking status:
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        navigate(`/challenge/${challengeId}/day/${dayId}`)
                      }
                      variant="ghost"
                      className="text-white/70 hover:text-white hover:bg-white/10 flex-1"
                    >
                      Back to Day
                    </Button>
                    <Button
                      onClick={() => setIsCompleted(false)}
                      variant="ghost"
                      className="text-white/70 hover:text-white hover:bg-white/10 flex-1"
                    >
                      Retry Timer
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengeDayTimer;
