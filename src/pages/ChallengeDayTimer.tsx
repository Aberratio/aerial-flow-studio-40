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
import { useWakeLock } from "@/hooks/useWakeLock";
import { format } from "date-fns";

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
  const [audioMode, setAudioMode] = useState<"sound" | "no_sound" | "minimal_sound">(() => {
    const saved = localStorage.getItem("challengeTimerAudioMode");
    return (saved as "sound" | "no_sound" | "minimal_sound") || "minimal_sound";
  });
  const [hasAnnouncedSegment, setHasAnnouncedSegment] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trainingDayId, setTrainingDayId] = useState<string>("");
  const [isPreparingToStart, setIsPreparingToStart] = useState(false);
  const [preparationTime, setPreparationTime] = useState(10);
  const [isRestDay, setIsRestDay] = useState(false);
  const [trainingDayData, setTrainingDayData] = useState<any>(null);

  const { speak } = useSpeech(audioMode === "sound");
  const { isSupported: isWakeLockSupported, requestWakeLock, releaseWakeLock } = useWakeLock();

  // Create optimistic beeping sound for minimal mode
  const playBeep = (type: "countdown" | "transition" | "ready" = "countdown") => {
    if (audioMode !== "minimal_sound") return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different contexts
    if (type === "countdown") {
      oscillator.frequency.value = 1000; // Higher pitched for countdown
    } else if (type === "transition") {
      oscillator.frequency.value = 800; // Medium pitch for transitions
    } else if (type === "ready") {
      oscillator.frequency.value = 1200; // Highest pitch for get ready
    }
    
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  useEffect(() => {
    const fetchExercises = async () => {
      if (!dayId || !user?.id) return;

      try {
        setIsLoading(true);

        // Get training day directly since dayId is the training day ID
        const { data: trainingDayData, error: trainingDayError } = await supabase
          .from("challenge_training_days")
          .select("*")
          .eq("id", dayId)
          .single();

        if (trainingDayError) throw trainingDayError;
        setTrainingDayId(dayId);
        setTrainingDayData(trainingDayData);

        // Check if user is participant of this challenge
        const { data: participant, error: participantError } = await supabase
          .from('challenge_participants')
          .select('*')
          .eq('user_id', user.id)
          .eq('challenge_id', challengeId)
          .single();

        if (participantError) throw participantError;
        
        if (!participant) {
          toast({
            title: "Not Available",
            description: "You need to join this challenge first.",
          });
          navigate(`/challenges/${challengeId}`);
          return;
        }

        const { data: exercisesData, error: exercisesError } =
          await supabase
            .from("training_day_exercises")
            .select(
              `
              *,
              figure:figures (
                id, name, image_url
              )
            `
            )
            .eq("training_day_id", dayId)
            .order('order_index');

        if (exercisesError) throw exercisesError;

        const formattedExercises =
          exercisesData?.map((exercise: any) => ({
            id: exercise.id,
            sets: exercise.sets || 1,
            reps: exercise.reps,
            hold_time_seconds: exercise.hold_time_seconds || 30,
            rest_time_seconds: exercise.rest_time_seconds || 15,
            notes: exercise.notes,
            figure: exercise.figure,
          })) || [];

        setExercises(formattedExercises);
        setIsRestDay(formattedExercises.length === 0);
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
          if (audioMode === "sound") {
            if (prev > 2 && prev < 7) {
              speak((prev - 1).toString());
            } else if (prev === 2) {
              speak("1... Begin!");
            }
          } else if (audioMode === "minimal_sound") {
            // Beep during countdown for get ready phase
            if (prev <= 5 && prev > 0) {
              playBeep("ready");
            }
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
          // Voice countdown for full sound mode
          if (audioMode === "sound" && prev <= 7 && prev > 1) {
            speak((prev - 2).toString());
          }
          
          // Beeping for minimal sound mode
          if (audioMode === "minimal_sound" && currentSegmentIndex < segments.length && prev <= 5 && prev > 0) {
            const currentSegment = segments[currentSegmentIndex];
            if (currentSegment?.type === "exercise") {
              playBeep("countdown");
            } else if (currentSegment?.type === "rest") {
              playBeep("transition");
            }
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

    if (!hasAnnouncedSegment && audioMode === "sound") {
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
      if (audioMode === "sound") {
        speak("Trening ukończony! Świetna robota!");
      }
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
      // Release wake lock when workout is completed
      releaseWakeLock();
      
      // Complete the challenge day using new progress system
      const { data: trainingDay, error: trainingDayError } = await supabase
        .from('challenge_training_days')
        .select('day_number')
        .eq('id', dayId)
        .single();
      
      if (trainingDayError) throw trainingDayError;
      
      // Insert progress record
      const { error: progressError } = await supabase
        .from('challenge_day_progress')
        .upsert({
          user_id: user.id,
          challenge_id: challengeId,
          training_day_id: dayId,
          status: 'completed',
          changed_status_at: new Date().toISOString(),
          exercises_completed: exercises.length,
          total_exercises: exercises.length
        });
      
      if (progressError) throw progressError;
      
      // Update participant status to completed if needed
      const { error: participantError } = await supabase
        .from('challenge_participants')
        .update({
          status: 'active'
        })
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId);
      
      if (participantError) console.error('Error updating participant:', participantError);
      toast({
        title: "Trening ukończony!",
        description:
          "Świetna robota! Dzień treningowy został oznaczony jako ukończony.",
      });
      navigate(`/challenges/${challengeId}`);
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
    if (!isRunning && !isPreparingToStart) {
      // Only show preparation phase for exercises, not rest periods
      const currentSegment = segments[currentSegmentIndex];
      const shouldPrepare = currentSegment?.type === "exercise" && timeRemaining === currentSegment?.duration;
      
      if (shouldPrepare) {
        setIsPreparingToStart(true);
        setPreparationTime(10);
        if (audioMode === "sound") {
          speak("Get ready!");
        }
        // Request wake lock when starting the timer
        requestWakeLock();
      } else {
        // Resume directly without preparation for rest or paused exercises
        setIsRunning(true);
        requestWakeLock();
      }
    } else if (isPreparingToStart) {
      setIsPreparingToStart(false);
      setPreparationTime(10);
      // Release wake lock when canceling
      releaseWakeLock();
    } else {
      setIsRunning(!isRunning);
      if (!isRunning) {
        // Request wake lock when resuming
        requestWakeLock();
      } else {
        // Release wake lock when pausing
        releaseWakeLock();
      }
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
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center overflow-y-auto md:fixed md:inset-0">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center overflow-y-auto md:fixed md:inset-0">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            No exercises found
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 text-white flex flex-col overflow-y-auto">
      <div className="flex-1 flex flex-col container mx-auto px-4 py-6 max-w-4xl lg:max-w-6xl md:py-6 md:max-w-3xl xl:max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 flex-shrink-0">
          <div></div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
              <span>
                {currentSegmentIndex + 1} z {segments.length}
              </span>
            </div>


            <Button
              variant="ghost"
              onClick={() => {
                const modes: Array<"sound" | "no_sound" | "minimal_sound"> = ["minimal_sound", "sound", "no_sound"];
                const currentIndex = modes.indexOf(audioMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                setAudioMode(nextMode);
                localStorage.setItem("challengeTimerAudioMode", nextMode);
              }}
              className={`text-white hover:bg-white/10 transition-all ${
                audioMode === "sound" ? "bg-primary/20 text-primary" : 
                audioMode === "minimal_sound" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/5"
              }`}
              title={
                audioMode === "sound" ? "Full sound mode" :
                audioMode === "minimal_sound" ? "Minimal sound mode (beeps only)" :
                "No sound mode"
              }
            >
              {audioMode === "sound" ? (
                <Volume2 className="w-5 h-5" />
              ) : audioMode === "minimal_sound" ? (
                <div className="w-5 h-5 flex items-center justify-center">
                  <div className="w-3 h-3 bg-current rounded-full animate-pulse"></div>
                </div>
              ) : (
                <VolumeX className="w-5 h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Progress Bar - Desktop */}
        <div className="mb-4 flex-shrink-0 hidden md:block">
          <div className="text-sm text-white/70 mb-2 font-medium">
            {currentSegmentIndex + 1} z {segments.length}
          </div>
          <div className="relative">
            <Progress value={calculateProgress()} className="w-full h-2 bg-white/10 rounded-full overflow-hidden" />
            <div 
              className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* Current Exercise/Rest Display */}
        <Card className="glass-effect border-white/10 mb-6 flex-1 flex flex-col bg-gradient-to-b from-white/5 to-transparent max-h-[60vh] md:max-h-none overflow-visible">
          <CardContent className="p-3 md:p-6 text-center flex-1 flex flex-col justify-center relative overflow-visible">
            {getCurrentSegment() && (
              <>
                {getCurrentSegment().type === "exercise" ? (
                  <>
                    {/* Exercise Image - Maximum Size */}
                    <div className="mb-2 md:mb-4 flex-1 flex items-center justify-center max-h-[40vh] md:max-h-none">
                      {getCurrentSegment().exerciseImage ? (
                        <div className="relative w-full max-w-md mx-auto">
                          <img
                            src={getCurrentSegment().exerciseImage}
                            alt={getCurrentSegment().exerciseName}
                            className="w-full aspect-square object-cover rounded-3xl shadow-2xl ring-1 ring-white/20"
                          />
                          {/* Subtle overlay for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-3xl pointer-events-none"></div>
                        </div>
                      ) : (
                        <div className="w-full max-w-md mx-auto aspect-square bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-3xl flex items-center justify-center shadow-2xl ring-1 ring-white/20">
                          <div className="text-8xl md:text-9xl opacity-60">🏃‍♂️</div>
                        </div>
                      )}
                    </div>

                    {/* Progress Bar - Mobile (after exercise image) */}
                    <div className="mt-1 mb-4 flex-shrink-0 block md:hidden">
                      <div className="relative">
                        <Progress value={calculateProgress()} className="w-full h-2 bg-white/10 rounded-full overflow-hidden" />
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress()}%` }}
                        />
                      </div>
                    </div>

                    {/* Exercise Title */}
                    <h2 className="text-xl md:text-2xl font-bold text-white mb-2 leading-tight px-4">
                      {getCurrentSegment().exerciseName}
                    </h2>

                    {/* Exercise Notes */}
                    {getCurrentSegment().exerciseNotes && (
                      <div className="mb-3 px-4">
                        <p className="text-white/80 text-sm md:text-base bg-white/10 px-3 py-2 rounded-xl border border-white/20 backdrop-blur-sm">
                          {getCurrentSegment().exerciseNotes}
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Rest Display - Ultra compact version */}
                    <div className="mb-1 flex items-center justify-center px-4">
                      <div className="w-24 h-24 md:w-28 md:h-28 bg-gradient-to-br from-blue-500/30 via-green-500/20 to-blue-600/30 rounded-xl flex items-center justify-center shadow-lg ring-1 ring-blue-400/30 backdrop-blur-sm">
                        <Hand className="w-12 h-12 md:w-14 md:h-14 text-blue-300" />
                      </div>
                    </div>

                    {/* Progress Bar - Mobile (after rest image) */}
                    <div className="mb-1 flex-shrink-0 block md:hidden">
                      <div className="relative">
                        <Progress value={calculateProgress()} className="w-full h-2 bg-white/10 rounded-full overflow-hidden" />
                        <div 
                          className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300"
                          style={{ width: `${calculateProgress()}%` }}
                        />
                      </div>
                    </div>

                    <h2 className="text-base md:text-lg font-bold text-blue-300 mb-0">
                      Odpoczynek
                    </h2>
                  </>
                )}

                {/* Timer Display */}
                <div className="text-3xl md:text-4xl font-mono font-bold mt-2 mb-2 bg-gradient-to-r from-white via-primary-foreground to-white bg-clip-text text-transparent drop-shadow-lg">
                  {isPreparingToStart
                    ? formatTime(preparationTime)
                    : formatTime(timeRemaining)}
                </div>

                {/* Get Ready Message */}
                {isPreparingToStart && (
                  <div className="text-base md:text-lg font-semibold text-yellow-300 mb-1 animate-pulse">
                    🚀 Przygotuj się!
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Controls */}
        <div className="flex flex-col gap-3 items-center justify-center mb-4 flex-shrink-0">
          {(isRunning || isPreparingToStart) ? (
            <div className="flex flex-row md:flex-col gap-3 w-full items-center">
              <Button
                onClick={handlePlayPause}
                size="lg"
                variant="primary"
                className="flex-1 md:w-full md:max-w-xs px-4 md:px-8 py-4 md:py-6 text-lg md:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl hover:scale-105"
              >
                <Pause className="w-5 h-5 md:w-7 md:h-7 mr-2 md:mr-3" />
                {isPreparingToStart ? "Anuluj" : "Pauza"}
              </Button>
              
              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
                className="flex-1 md:w-full md:max-w-xs px-4 md:px-6 py-4 text-lg md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-2xl"
              >
            Pomiń
              </Button>
            </div>
          ) : (
            <Button
              onClick={handlePlayPause}
              size="lg"
              variant="primary"
              className="w-full max-w-xs px-8 py-6 text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-2xl hover:scale-105"
            >
              <Play className="w-7 h-7 mr-3" />
              Start
            </Button>
          )}
        </div>

        {/* Next Up Section */}
        {getNextSegment() && (
          <Card className="glass-effect border-white/10 flex-shrink-0 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md">
            <CardContent className="p-4">
              <h3 className="text-base font-semibold text-white mb-3 flex items-center">
                <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse"></span>
                Następne
              </h3>
              <div className="flex items-center space-x-4">
                {getNextSegment().type === "exercise" &&
                getNextSegment().exerciseImage ? (
                  <div className="relative">
                    <img
                      src={getNextSegment().exerciseImage}
                      alt={getNextSegment().exerciseName}
                      className="w-14 h-14 object-cover rounded-2xl ring-1 ring-white/30 shadow-lg"
                    />
                  </div>
                ) : getNextSegment().type === "rest" ? (
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500/30 to-green-500/30 rounded-2xl flex items-center justify-center ring-1 ring-blue-400/30 shadow-lg backdrop-blur-sm">
                    <Hand className="w-7 h-7 text-blue-300" />
                  </div>
                ) : (
                  <div className="w-14 h-14 bg-gradient-to-br from-white/10 to-white/5 rounded-2xl flex items-center justify-center ring-1 ring-white/20 shadow-lg backdrop-blur-sm">
                    <span className="text-2xl opacity-70">🏃‍♂️</span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-base truncate">
                    {getNextSegment().exerciseName}
                  </div>
                  <div className="text-sm text-white/70 font-medium">
                    {formatTime(getNextSegment().duration)}
                  </div>
                  {getNextSegment().type === "exercise" &&
                    getNextSegment().exerciseNotes && (
                      <div className="text-xs text-primary mt-1 bg-primary/10 rounded-lg px-2 py-1 border border-primary/20 backdrop-blur-sm truncate">
                        {getNextSegment().exerciseNotes}
                      </div>
                    )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Completion Dialog */}
      <Dialog open={isCompleted} onOpenChange={setIsCompleted}>
        <DialogContent className="glass-effect border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Trening ukończony! 🎉</DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Świetna robota! Co chcesz teraz zrobić?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col sm:flex-row gap-3 mt-6">
            <Button
              onClick={handleWorkoutComplete}
              className="flex-1"
              variant="default"
            >
              Oznacz jako ukończone
            </Button>
            <Button
              onClick={() => {
                setIsCompleted(false);
                setCurrentSegmentIndex(0);
                setTimeRemaining(segments[0]?.duration || 0);
                setIsRunning(false);
                setIsPreparingToStart(false);
                setPreparationTime(10);
              }}
              variant="outline"
              className="flex-1"
            >
              Rozpocznij od nowa
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default ChallengeDayTimer;