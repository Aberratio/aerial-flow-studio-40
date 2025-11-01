import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Hand,
  Volume2,
  VolumeX,
  Play,
  Pause,
  Maximize,
  Minimize,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useChallengeCalendar } from "@/hooks/useChallengeCalendar";
import { useSpeech } from "@/hooks/useSpeech";
import { useWakeLock } from "@/hooks/useWakeLock";

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
  const [audioMode, setAudioMode] = useState<
    "sound" | "no_sound" | "minimal_sound"
  >(() => {
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
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { speak } = useSpeech(audioMode === "sound");
  const {
    isSupported: isWakeLockSupported,
    requestWakeLock,
    releaseWakeLock,
  } = useWakeLock();

  // Create optimistic beeping sound for minimal mode
  const playBeep = (
    type: "countdown" | "transition" | "ready" = "countdown"
  ) => {
    if (audioMode !== "minimal_sound") return;

    const audioContext = new (window.AudioContext ||
      (window as any).webkitAudioContext)();
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

    oscillator.type = "sine";

    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioContext.currentTime + 0.2
    );

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.2);
  };

  useEffect(() => {
    const fetchExercises = async () => {
      if (!dayId || !user?.id) return;

      try {
        setIsLoading(true);

        // Get training day directly since dayId is the training day ID
        const { data: trainingDayData, error: trainingDayError } =
          await supabase
            .from("challenge_training_days")
            .select("*")
            .eq("id", dayId)
            .single();

        if (trainingDayError) throw trainingDayError;
        setTrainingDayId(dayId);
        setTrainingDayData(trainingDayData);

        // Check if user is participant of this challenge
        const { data: participant, error: participantError } = await supabase
          .from("challenge_participants")
          .select("*")
          .eq("user_id", user.id)
          .eq("challenge_id", challengeId)
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

        const { data: exercisesData, error: exercisesError } = await supabase
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
          .order("order_index");

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

        if (
          !(exerciseIndex === exercises.length - 1 && setIndex === sets - 1)
        ) {
          newSegments.push({
            type: "rest",
            exerciseIndex,
            setIndex,
            duration: exercise.rest_time_seconds || 15,
            exerciseName: "Przerwa",
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
              speak("1... Rozpocznij!");
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
          if (
            audioMode === "minimal_sound" &&
            currentSegmentIndex < segments.length &&
            prev <= 5 &&
            prev > 0
          ) {
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
        speak(`Przerwa, ${duration}`);
      }
    }
  }, [currentSegmentIndex, isRunning, hasAnnouncedSegment, segments]);

  useEffect(() => {
    setHasAnnouncedSegment(false);
  }, [currentSegmentIndex]);

  // Fullscreen API handling
  useEffect(() => {
    interface DocumentWithFullscreen extends Document {
      webkitFullscreenElement?: Element | null;
      mozFullScreenElement?: Element | null;
      msFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
      mozCancelFullScreen?: () => Promise<void>;
      msExitFullscreen?: () => Promise<void>;
    }

    interface ElementWithFullscreen extends HTMLElement {
      webkitRequestFullscreen?: () => Promise<void>;
      mozRequestFullScreen?: () => Promise<void>;
      msRequestFullscreen?: () => Promise<void>;
    }

    const doc = document as DocumentWithFullscreen;
    const handleFullscreenChange = () => {
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          doc.webkitFullscreenElement ||
          doc.mozFullScreenElement ||
          doc.msFullscreenElement
        )
      );
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener(
        "webkitfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "mozfullscreenchange",
        handleFullscreenChange
      );
      document.removeEventListener(
        "MSFullscreenChange",
        handleFullscreenChange
      );
    };
  }, []);

  const toggleFullscreen = async () => {
    try {
      interface DocumentWithFullscreen extends Document {
        webkitFullscreenElement?: Element | null;
        mozFullScreenElement?: Element | null;
        msFullscreenElement?: Element | null;
        webkitExitFullscreen?: () => Promise<void>;
        mozCancelFullScreen?: () => Promise<void>;
        msExitFullscreen?: () => Promise<void>;
      }

      interface ElementWithFullscreen extends HTMLElement {
        webkitRequestFullscreen?: () => Promise<void>;
        mozRequestFullScreen?: () => Promise<void>;
        msRequestFullscreen?: () => Promise<void>;
      }

      const doc = document as DocumentWithFullscreen;
      const element = document.documentElement as ElementWithFullscreen;

      if (
        !document.fullscreenElement &&
        !doc.webkitFullscreenElement &&
        !doc.mozFullScreenElement &&
        !doc.msFullscreenElement
      ) {
        // Enter fullscreen
        if (element.requestFullscreen) {
          await element.requestFullscreen();
        } else if (element.webkitRequestFullscreen) {
          await element.webkitRequestFullscreen();
        } else if (element.mozRequestFullScreen) {
          await element.mozRequestFullScreen();
        } else if (element.msRequestFullscreen) {
          await element.msRequestFullscreen();
        }
      } else {
        // Exit fullscreen
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (doc.webkitExitFullscreen) {
          await doc.webkitExitFullscreen();
        } else if (doc.mozCancelFullScreen) {
          await doc.mozCancelFullScreen();
        } else if (doc.msExitFullscreen) {
          await doc.msExitFullscreen();
        }
      }
    } catch (error) {
      console.error("Error toggling fullscreen:", error);
    }
  };

  const formatTimeNatural = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;

    if (mins === 0) {
      return `${secs} sekund`;
    } else if (mins === 1 && secs === 0) {
      return "1 minuta";
    } else if (mins === 1) {
      return `1 minuta i ${secs} sekund`;
    } else if (secs === 0) {
      return `${mins} minut`;
    } else {
      return `${mins} minut i ${secs} sekund`;
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
        .from("challenge_training_days")
        .select("day_number")
        .eq("id", dayId)
        .single();

      if (trainingDayError) throw trainingDayError;

      // Insert progress record
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .upsert({
          user_id: user.id,
          challenge_id: challengeId,
          training_day_id: dayId,
          status: "completed",
          changed_status_at: new Date().toISOString(),
          exercises_completed: exercises.length,
          total_exercises: exercises.length,
        });

      if (progressError) throw progressError;

      // Update participant status to completed if needed
      const { error: participantError } = await supabase
        .from("challenge_participants")
        .update({
          status: "active",
        })
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId);

      if (participantError)
        console.error("Error updating participant:", participantError);
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
        description: "Nie udało się oznaczyć treningu jako ukończony",
        variant: "destructive",
      });
    }
  };

  const handlePlayPause = () => {
    if (!isRunning && !isPreparingToStart) {
      // Only show preparation phase for exercises, not rest periods
      const currentSegment = segments[currentSegmentIndex];
      const shouldPrepare =
        currentSegment?.type === "exercise" &&
        timeRemaining === currentSegment?.duration;

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

  // Get next exercise (skip rest periods)
  const getNextExercise = () => {
    for (let i = currentSegmentIndex + 1; i < segments.length; i++) {
      if (segments[i].type === "exercise") {
        return segments[i];
      }
    }
    return null;
  };

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
            Nie znaleziono ćwiczeń
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen bg-gradient-to-tr from-black to-purple-950/10 text-white flex flex-col ${
        isFullscreen ? "fixed inset-0 overflow-hidden" : "overflow-y-auto"
      }`}
    >
      {/* Hide AppLayout elements when in fullscreen */}
      {isFullscreen && (
        <style>{`
          header,
          nav[class*="BottomNavigation"],
          [class*="TopHeader"] {
            display: none !important;
          }
          main {
            padding-top: 0 !important;
            padding-bottom: 0 !important;
          }
        `}</style>
      )}
      <div
        className={`flex-1 flex flex-col container mx-auto px-2 sm:px-4 pt-16 sm:pt-20 md:pt-6 py-2 sm:py-3 md:py-6 max-w-4xl lg:max-w-6xl md:max-w-3xl xl:max-w-4xl min-h-0 ${
          isFullscreen ? "h-screen pt-2" : ""
        }`}
      >
        {/* Header with controls - positioned to be visible below TopHeader */}
        <div className="flex items-center justify-between mb-1 sm:mb-2 md:mb-6 flex-shrink-0 relative z-50">
          <div></div>

          <div className="flex items-center gap-2 sm:gap-3 relative z-50">
            <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
              <span>
                {currentSegmentIndex + 1} z {segments.length}
              </span>
            </div>

            <Button
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-white/10 transition-all bg-white/5 min-w-[44px] min-h-[44px] relative z-50"
              title={isFullscreen ? "Wyjdź z pełnego ekranu" : "Pełny ekran"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : (
                <Maximize className="w-5 h-5 sm:w-6 sm:h-6" />
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={() => {
                const modes: Array<"sound" | "no_sound" | "minimal_sound"> = [
                  "minimal_sound",
                  "sound",
                  "no_sound",
                ];
                const currentIndex = modes.indexOf(audioMode);
                const nextMode = modes[(currentIndex + 1) % modes.length];
                setAudioMode(nextMode);
                localStorage.setItem("challengeTimerAudioMode", nextMode);
              }}
              className={`text-white hover:bg-white/10 transition-all min-w-[44px] min-h-[44px] relative z-50 ${
                audioMode === "sound"
                  ? "bg-primary/20 text-primary"
                  : audioMode === "minimal_sound"
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-white/5"
              }`}
              title={
                audioMode === "sound"
                  ? "Tryb dźwięku: Pełny dźwięk - słyszysz pełne komunikaty głosowe"
                  : audioMode === "minimal_sound"
                  ? "Tryb dźwięku: Minimalny dźwięk - słyszysz tylko sygnały dźwiękowe"
                  : "Tryb dźwięku: Wyciszony - brak dźwięków"
              }
            >
              {audioMode === "sound" ? (
                <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />
              ) : audioMode === "minimal_sound" ? (
                <div className="w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                  <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 bg-current rounded-full animate-pulse"></div>
                </div>
              ) : (
                <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" />
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
            <Progress
              value={calculateProgress()}
              className="w-full h-2 bg-white/10 rounded-full overflow-hidden"
            />
            <div
              className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300"
              style={{ width: `${calculateProgress()}%` }}
            />
          </div>
        </div>

        {/* Progress Bar - Mobile (after exercise image) */}
        {getCurrentSegment() && (
          <div
            className={`mt-2 ${
              getCurrentSegment()?.type === "rest" ? "mb-4" : "mb-[100px]"
            } flex-shrink-0 block md:hidden`}
          >
            <div className="relative">
              <Progress
                value={calculateProgress()}
                className="w-full h-1.5 sm:h-2 bg-white/10 rounded-full overflow-hidden"
              />
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-300"
                style={{ width: `${calculateProgress()}%` }}
              />
            </div>
          </div>
        )}

        {/* Current Exercise/Rest Display */}
        <Card
          className={`glass-effect border-white/10 mb-1 sm:mb-2 md:mb-6 flex-shrink-0 flex flex-col bg-gradient-to-b from-white/5 to-transparent ${
            isFullscreen ? "max-h-[calc(100vh-380px)]" : "max-h-[45vh]"
          } md:max-h-none overflow-visible min-h-0 relative z-0`}
        >
          <CardContent className="p-2 sm:p-3 md:p-6 text-center flex flex-col justify-start relative overflow-visible min-h-0 z-0">
            {getCurrentSegment() && (
              <>
                {getCurrentSegment().type === "exercise" ? (
                  <>
                    {/* Exercise Image - Optimized for mobile, smaller to fit everything */}
                    <div
                      className={`mb-1 sm:mb-2 md:mb-4 flex-shrink-0 flex items-center justify-center relative z-0 ${
                        isFullscreen ? "max-h-[22vh]" : "max-h-[22vh]"
                      } md:max-h-none`}
                    >
                      {getCurrentSegment().exerciseImage ? (
                        <div className="relative w-full max-w-md mx-auto z-0">
                          <img
                            src={getCurrentSegment().exerciseImage}
                            alt={getCurrentSegment().exerciseName}
                            className="w-full aspect-square object-cover rounded-2xl sm:rounded-3xl shadow-2xl ring-1 ring-white/20 relative z-0"
                          />
                          {/* Subtle overlay for better text readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent rounded-2xl sm:rounded-3xl pointer-events-none z-0"></div>
                        </div>
                      ) : (
                        <div className="w-full max-w-md mx-auto aspect-square bg-gradient-to-br from-primary/20 via-primary/10 to-transparent rounded-2xl sm:rounded-3xl flex items-center justify-center shadow-2xl ring-1 ring-white/20 relative z-0">
                          <div className="text-6xl sm:text-8xl md:text-9xl opacity-60">
                            🏃‍♂️
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    {/* Rest Display - Improved layout with next exercise preview */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-2 sm:mb-3">
                      <div className="w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 bg-gradient-to-br from-blue-500/30 via-green-500/20 to-blue-600/30 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg ring-1 ring-blue-400/30 backdrop-blur-sm flex-shrink-0">
                        <Hand className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-blue-300" />
                      </div>
                    </div>

                    <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-blue-300 mb-0 relative z-10">
                      Odpoczynek
                    </h2>
                  </>
                )}

                {/* Timer Display - With better contrast for visibility on white backgrounds */}
                <div className="relative mt-1 sm:mt-2 mb-1 sm:mb-2">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold bg-gradient-to-r from-white via-primary-foreground to-white bg-clip-text text-transparent drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] [text-shadow:_2px_2px_4px_rgba(0,0,0,0.8)]">
                    {isPreparingToStart
                      ? formatTime(preparationTime)
                      : formatTime(timeRemaining)}
                  </div>
                  {/* Dark backdrop blur for better contrast */}
                  <div className="absolute inset-0 -inset-x-2 -inset-y-1 bg-black/40 backdrop-blur-sm rounded-lg -z-10"></div>
                </div>

                {isPreparingToStart ? (
                  <div className="relative bg-black rounded-lg p-2 text-sm sm:text-base md:text-lg font-semibold text-yellow-300 mb-0.5 sm:mb-1">
                    🚀 Przygotuj się!
                  </div>
                ) : getCurrentSegment()?.type === "exercise" ? (
                  <div className="relative bg-black rounded-lg p-2 text-sm sm:text-base md:text-lg font-semibold text-yellow-300 mb-0.5 sm:mb-1 mt-[50px]">
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-white mb-2 sm:mb-3 leading-tight px-2 sm:px-4 z-10">
                      {getCurrentSegment().exerciseName}
                    </h2>

                    {/* Exercise Notes */}
                    {getCurrentSegment().exerciseNotes && (
                      <div className="mb-2 sm:mb-3 px-2 sm:px-4 bg-black/40">
                        <p className="text-white/80 text-xs sm:text-sm md:text-base px-2 sm:px-3 py-1 sm:py-2 rounded-lg sm:rounded-xl border border-white/20 bg-black">
                          {getCurrentSegment().exerciseNotes}
                        </p>
                      </div>
                    )}
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </Card>

        {/* Next Up Section - Always show next exercise, not rest */}
        {getNextExercise() && (
          <Card className="glass-effect border-white/10 flex-shrink-0 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-md mt-2 mx-2">
            <CardContent className="p-2 sm:p-3 md:p-4">
              <h3 className="text-xs sm:text-sm md:text-base font-semibold text-white mb-1.5 sm:mb-2 md:mb-3 flex items-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full mr-1.5 sm:mr-2 animate-pulse"></span>
                Następne ćwiczenie
              </h3>
              <div className="flex items-center space-x-2 sm:space-x-3 md:space-x-4">
                {getNextExercise().exerciseImage ? (
                  <div className="relative flex-shrink-0">
                    <img
                      src={getNextExercise().exerciseImage}
                      alt={getNextExercise().exerciseName}
                      className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 object-cover rounded-lg sm:rounded-xl md:rounded-2xl ring-1 ring-white/30 shadow-lg"
                    />
                  </div>
                ) : (
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-gradient-to-br from-white/10 to-white/5 rounded-lg sm:rounded-xl md:rounded-2xl flex items-center justify-center ring-1 ring-white/20 shadow-lg backdrop-blur-sm flex-shrink-0">
                    <span className="text-base sm:text-xl md:text-2xl opacity-70">
                      🏃‍♂️
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-xs sm:text-sm md:text-base truncate">
                    {getNextExercise().exerciseName}
                  </div>
                  <div className="text-xs sm:text-sm text-white/70 font-medium">
                    {formatTime(getNextExercise().duration)}
                  </div>
                  {getNextExercise().exerciseNotes && (
                    <div className="text-[10px] sm:text-xs text-primary mt-0.5 sm:mt-1 bg-primary/10 rounded sm:rounded-lg px-1.5 sm:px-2 py-0.5 sm:py-1 border border-primary/20 backdrop-blur-sm truncate">
                      {getNextExercise().exerciseNotes}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Controls */}
        <div className="mt-4 flex flex-col gap-2 sm:gap-3 items-center justify-center mb-2 sm:mb-3 md:mb-4 flex-shrink-0">
          {isRunning || isPreparingToStart ? (
            <div className="flex flex-row md:flex-col gap-2 sm:gap-3 w-full items-center">
              <Button
                onClick={handlePlayPause}
                size="lg"
                variant="primary"
                className="flex-1 md:w-full md:max-w-xs px-3 sm:px-4 md:px-8 py-2.5 sm:py-3 md:py-6 text-base sm:text-lg md:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-xl sm:rounded-2xl hover:scale-105"
              >
                <Pause className="w-4 h-4 sm:w-5 sm:h-5 md:w-7 md:h-7 mr-1.5 sm:mr-2 md:mr-3" />
                {isPreparingToStart ? "Anuluj" : "Pauza"}
              </Button>

              <Button
                onClick={handleSkip}
                variant="outline"
                size="lg"
                className="flex-1 md:w-full md:max-w-xs px-3 sm:px-4 md:px-6 py-2.5 sm:py-3 md:py-4 text-sm sm:text-base md:text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl sm:rounded-2xl"
              >
                Pomiń
              </Button>
            </div>
          ) : (
            <Button
              onClick={handlePlayPause}
              size="lg"
              variant="primary"
              className="w-full max-w-xs px-6 sm:px-8 py-4 sm:py-5 md:py-6 text-lg sm:text-xl font-bold shadow-2xl hover:shadow-3xl transition-all duration-300 rounded-xl sm:rounded-2xl hover:scale-105"
            >
              <Play className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 mr-2 sm:mr-3" />
              Start
            </Button>
          )}
        </div>
      </div>

      {/* Completion Dialog */}
      <Dialog open={isCompleted} onOpenChange={setIsCompleted}>
        <DialogContent className="glass-effect border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              Trening ukończony! 🎉
            </DialogTitle>
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
