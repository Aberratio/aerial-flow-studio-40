import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  Zap, 
  Heart,
  Loader2,
  CheckCircle,
  Circle,
  Timer,
  Hand,
  Play,
  Pause,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useSpeech } from '@/hooks/useSpeech';

interface TrainingSession {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: string;
  playlist: string;
  thumbnail_url: string;
  published: boolean;
  warmup_exercises: any;
  figures: any;
  stretching_exercises: any;
  type: string;
  created_at: string;
  user_id: string;
}

interface Exercise {
  id?: string;
  name: string;
  reps?: number;
  sets?: number;
  hold_time_seconds?: number;
  notes?: string;
  order_index?: number;
  completion_mode?: 'time' | 'completion';
}

interface TimerSegment {
  type: "exercise" | "rest";
  exerciseIndex: number;
  setIndex: number;
  duration: number;
  exerciseName: string;
  exerciseNotes?: string;
}

const TrainingExerciseSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<'warmup' | 'figures' | 'stretching'>('warmup');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Timer-specific states
  const [segments, setSegments] = useState<TimerSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [audioMode, setAudioMode] = useState<"sound" | "no_sound" | "minimal_sound">(() => {
    const saved = localStorage.getItem("trainingTimerAudioMode");
    return (saved as "sound" | "no_sound" | "minimal_sound") || "minimal_sound";
  });
  const [hasAnnouncedSegment, setHasAnnouncedSegment] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isPreparingToStart, setIsPreparingToStart] = useState(false);
  const [preparationTime, setPreparationTime] = useState(10);
  const [exerciseImages, setExerciseImages] = useState<Record<string, string>>({});

  const { speak } = useSpeech(audioMode === "sound");

  // Fetch session data from database
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        navigate('/training');
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching session:', error);
          throw error;
        }

        if (!data) {
          toast({
            title: "Session Not Found",
            description: "The training session you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/training');
          return;
        }

        // Check if user has access to this session
        if (!data.published && data.user_id !== user?.id && !isAdmin) {
          toast({
            title: "Access Denied",
            description: "This training session is not published or you don't have access to it.",
            variant: "destructive",
          });
          navigate('/training');
          return;
        }

        setSession({
          ...data,
          warmup_exercises: data.warmup_exercises || [],
          figures: data.figures || [],
          stretching_exercises: data.stretching_exercises || []
        });

        // If it's a timer session, generate timer segments
        if (data.type === 'timer') {
          generateTimerSegments(data);
        }
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Error",
          description: "Failed to load training session.",
          variant: "destructive",
        });
        navigate('/training');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, user?.id, isAdmin, navigate, toast]);

  // Fetch exercise images from figures library
  useEffect(() => {
    const fetchExerciseImages = async () => {
      if (!session) return;
      
      const exerciseNames = new Set<string>();
      
      // Collect all exercise names from all sections
      const allExercises = [
        ...(Array.isArray(session.warmup_exercises) ? session.warmup_exercises : []),
        ...(Array.isArray(session.figures) ? session.figures : []),
        ...(Array.isArray(session.stretching_exercises) ? session.stretching_exercises : [])
      ];
      
      allExercises.forEach(exercise => {
        if (exercise.name) {
          exerciseNames.add(exercise.name);
        }
      });

      if (exerciseNames.size === 0) return;

      // Fetch figure images for all exercise names
      const { data: figures, error } = await supabase
        .from('figures')
        .select('name, image_url')
        .in('name', Array.from(exerciseNames));

      if (error) {
        console.error('Error fetching exercise images:', error);
        return;
      }

      const imageMap: Record<string, string> = {};
      figures?.forEach(figure => {
        if (figure.image_url) {
          imageMap[figure.name] = figure.image_url;
        }
      });

      setExerciseImages(imageMap);
    };

    fetchExerciseImages();
  }, [session]);

  // Timer functions
  const playBeep = (type: "countdown" | "transition" | "ready" = "countdown") => {
    if (audioMode !== "minimal_sound") return;
    
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === "countdown") {
      oscillator.frequency.value = 1000;
    } else if (type === "transition") {
      oscillator.frequency.value = 800;
    } else {
      oscillator.frequency.value = 600;
    }
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const generateTimerSegments = (sessionData: TrainingSession) => {
    const timerSegments: TimerSegment[] = [];
    let exerciseIndex = 0;

    // Process all exercise sections
    const allSections = [
      { exercises: sessionData.warmup_exercises, name: 'warmup' },
      { exercises: sessionData.figures, name: 'figures' },
      { exercises: sessionData.stretching_exercises, name: 'stretching' }
    ];

    allSections.forEach(section => {
      if (Array.isArray(section.exercises)) {
        section.exercises.forEach((exercise: any) => {
          const exerciseName = typeof exercise === 'string' ? exercise : exercise.name;
          const sets = exercise.sets || 1;
          const holdTime = exercise.hold_time_seconds || 30;
          const restTime = exercise.rest_time_seconds || 15;
          const isCompletionMode = exercise.completion_mode === 'completion' || exercise.hold_time_seconds === 0;

          // Skip timer segments for completion mode exercises
          if (isCompletionMode) {
            return;
          }

          for (let setIndex = 0; setIndex < sets; setIndex++) {
            // Exercise segment
            timerSegments.push({
              type: "exercise",
              exerciseIndex,
              setIndex,
              duration: holdTime,
              exerciseName: sets > 1 ? `${exerciseName} (Set ${setIndex + 1}/${sets})` : exerciseName,
              exerciseNotes: exercise.notes
            });

            // Rest segment (except for last set of last exercise)
            if (setIndex < sets - 1 || exerciseIndex < allSections.reduce((total, s) => total + (Array.isArray(s.exercises) ? s.exercises.length : 0), 0) - 1) {
              timerSegments.push({
                type: "rest",
                exerciseIndex,
                setIndex,
                duration: restTime,
                exerciseName: "Rest"
              });
            }
          }
          exerciseIndex++;
        });
      }
    });

    setSegments(timerSegments);
    if (timerSegments.length > 0) {
      setTimeRemaining(timerSegments[0].duration);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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

  // Timer effects
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isPreparingToStart && preparationTime > 0) {
      interval = setInterval(() => {
        setPreparationTime(prev => {
          if (audioMode === "sound") {
            if (prev > 2 && prev < 7) {
              speak((prev - 1).toString());
            } else if (prev === 2) {
              speak("1... Begin!");
            }
          } else if (audioMode === "minimal_sound") {
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
  }, [isPreparingToStart, preparationTime, audioMode, speak]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && !isPreparingToStart && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (audioMode === "sound" && prev <= 7 && prev > 1) {
            speak((prev - 2).toString());
          }
          
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
  }, [isRunning, isPreparingToStart, timeRemaining, currentSegmentIndex, segments, audioMode]);

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
  }, [currentSegmentIndex, isRunning, hasAnnouncedSegment, segments, audioMode, speak]);

  useEffect(() => {
    setHasAnnouncedSegment(false);
  }, [currentSegmentIndex]);

  const handleSegmentComplete = () => {
    const currentSegment = segments[currentSegmentIndex];

    if (currentSegmentIndex >= segments.length - 1) {
      setIsCompleted(true);
      setIsRunning(false);
      if (audioMode === "sound") {
        speak("Training completed! Great job!");
      }
      return;
    }

    const nextIndex = currentSegmentIndex + 1;
    const nextSegment = segments[nextIndex];

    setCurrentSegmentIndex(nextIndex);
    setTimeRemaining(nextSegment.duration);
  };

  const handlePlayPause = () => {
    if (isPreparingToStart) {
      setIsPreparingToStart(false);
      setPreparationTime(10);
    } else {
      setIsRunning(!isRunning);
    }
  };

  const handleSkip = () => {
    if (currentSegmentIndex < segments.length - 1) {
      handleSegmentComplete();
    }
  };

  const toggleAudioMode = () => {
    const modes: ("sound" | "no_sound" | "minimal_sound")[] = ["minimal_sound", "sound", "no_sound"];
    const currentIndex = modes.indexOf(audioMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setAudioMode(nextMode);
    localStorage.setItem("trainingTimerAudioMode", nextMode);
  };


  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSectionExercises = (): Exercise[] => {
    if (!session) return [];
    
    switch (currentSection) {
      case 'warmup':
        return Array.isArray(session.warmup_exercises) ? session.warmup_exercises : [];
      case 'figures':
        return Array.isArray(session.figures) ? session.figures : [];
      case 'stretching':
        return Array.isArray(session.stretching_exercises) ? session.stretching_exercises : [];
      default:
        return [];
    }
  };

  const getSectionIcon = () => {
    switch (currentSection) {
      case 'warmup':
        return <Zap className="w-5 h-5" />;
      case 'figures':
        return <Target className="w-5 h-5" />;
      case 'stretching':
        return <Heart className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getSectionColor = () => {
    switch (currentSection) {
      case 'warmup':
        return 'bg-yellow-500';
      case 'figures':
        return 'bg-purple-500';
      case 'stretching':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'warmup':
        return 'Warm-up Exercises';
      case 'figures':
        return 'Training Figures';
      case 'stretching':
        return 'Stretching Exercises';
      default:
        return '';
    }
  };

  const handleExerciseComplete = (exerciseKey: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseKey)) {
        newSet.delete(exerciseKey);
      } else {
        newSet.add(exerciseKey);
      }
      return newSet;
    });
  };

  const moveToNextSection = () => {
    if (currentSection === 'warmup') {
      setCurrentSection('figures');
      setCurrentExerciseIndex(0);
    } else if (currentSection === 'figures') {
      setCurrentSection('stretching');
      setCurrentExerciseIndex(0);
    }
  };

  const moveToPreviousSection = () => {
    if (currentSection === 'stretching') {
      setCurrentSection('figures');
      setCurrentExerciseIndex(0);
    } else if (currentSection === 'figures') {
      setCurrentSection('warmup');
      setCurrentExerciseIndex(0);
    }
  };

  const handleFinishSession = () => {
    toast({
      title: "Training Complete!",
      description: "Great job! You've completed your training session.",
    });
    navigate(`/training/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading training session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  // Timer Mode UI
  if (session.type === 'timer') {
    const currentSegment = segments[currentSegmentIndex];
    const totalSegments = segments.length;
    const progress = totalSegments > 0 ? ((currentSegmentIndex + 1) / totalSegments) * 100 : 0;

    const ProgressBar = ({ className }: { className?: string }) => (
      <div className={`space-y-2 ${className || ''}`}>
        <div className="flex justify-between text-sm text-white/70">
          <span>Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between text-xs text-white/60">
          <span>Segment {currentSegmentIndex + 1} of {totalSegments}</span>
        </div>
      </div>
    );

    const NextUp = ({ className }: { className?: string }) => {
      const nextSegment = segments[currentSegmentIndex + 1];
      if (!nextSegment) return null;

      return (
        <Card className={`glass-effect border-white/10 ${className || ''}`}>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-white mb-3">Next Up</h3>
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                nextSegment.type === "exercise" ? "bg-blue-500/20" : "bg-green-500/20"
              }`}>
                {nextSegment.type === "exercise" ? (
                  <Target className="w-5 h-5 text-blue-400" />
                ) : (
                  <Clock className="w-5 h-5 text-green-400" />
                )}
              </div>
              <div className="flex-1">
                <div className="text-white font-medium">
                  {nextSegment.exerciseName}
                </div>
                <div className="text-sm text-white/60">
                  {formatTimeNatural(nextSegment.duration)}
                </div>
                {nextSegment.type === "exercise" && nextSegment.exerciseNotes && (
                  <div className="text-xs text-primary/80 mt-1 bg-primary/10 rounded px-2 py-1 border border-primary/20">
                    {nextSegment.exerciseNotes}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    };

    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10">
        <div>
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => navigate(`/training/${sessionId}`)}
                className="text-white hover:bg-white/10 gap-2"
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden sm:inline">Back to Session</span>
                <span className="sm:hidden">Back</span>
              </Button>

              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center gap-2 text-sm text-white/70">
                  <span>{currentSegmentIndex + 1} / {totalSegments}</span>
                </div>

                <Button
                  variant="ghost"
                  onClick={toggleAudioMode}
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
          </div>
        </div>

        <div className="container mx-auto px-4 py-1 max-w-4xl">
          <ProgressBar className="hidden sm:block mb-8" />
          {isCompleted ? (
            /* Completion Screen */
            <div className="text-center py-12">
              <Card className="glass-effect border-white/10">
                <CardContent className="py-12">
                  <div className="space-y-6">
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                    <div>
                      <h2 className="text-3xl font-bold text-white mb-2">Training Complete!</h2>
                      <p className="text-white/70">Congratulations! You've completed your training session.</p>
                    </div>
                    <Button
                      onClick={handleFinishSession}
                      className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Finish Session
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : currentSegment ? (
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2">
                <Card className="glass-effect border-white/10 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="relative">
                      <div className="aspect-square max-w-2xl mx-auto bg-gray-900/50 rounded-lg overflow-hidden">
                        {currentSegment.type === "rest" ? (
                          <div className="w-full h-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                            <Hand className="w-32 h-32 md:w-40 md:h-40 text-green-400" />
                          </div>
                         ) : (
                           <div className="w-full h-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center">
                             {exerciseImages[currentSegment.exerciseName] ? (
                               <img 
                                 src={exerciseImages[currentSegment.exerciseName]} 
                                 alt={currentSegment.exerciseName}
                                 className="w-full h-full object-cover"
                               />
                             ) : (
                               <span className="text-6xl md:text-8xl">🏃‍♂️</span>
                             )}
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
                          {currentSegment.type === "exercise" ? "Exercise" : "Rest Period"}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-4 sm:p-6 text-center bg-gradient-to-t from-black/30 to-transparent">
                      <h2 className="text-xl sm:text-2xl md:text-4xl font-bold text-white mb-2 sm:mb-4">
                        {currentSegment.exerciseName}
                      </h2>

                      {currentSegment.type === "exercise" && currentSegment.exerciseNotes && (
                        <div className="mb-3 sm:mb-4 px-2">
                          <p className="text-sm sm:text-base text-primary/90 bg-primary/10 rounded-lg p-2 sm:p-3 border border-primary/20">
                            {currentSegment.exerciseNotes}
                          </p>
                        </div>
                      )}

                      <div className="relative mb-4 sm:mb-6">
                        {isPreparingToStart ? (
                          <div className="flex flex-col items-center">
                            <div className="text-lg sm:text-xl text-white/70 mb-2">Get Ready!</div>
                            <div className="text-6xl sm:text-7xl md:text-9xl font-mono font-bold text-yellow-400 mb-2 animate-pulse">
                              {preparationTime}
                            </div>
                            <div className="text-sm sm:text-base text-white/60">Training starts in...</div>
                          </div>
                        ) : (
                          <div className="text-4xl sm:text-5xl md:text-8xl font-mono font-bold text-primary mb-2">
                            {formatTime(timeRemaining)}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-row justify-center gap-4">
                        <Button onClick={handlePlayPause} size="lg" className="bg-primary hover:bg-primary/80">
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
                          <Button onClick={handleSkip} variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
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
                    <h3 className="text-lg font-semibold text-white mb-3">Current</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Type:</span>
                        <span className="text-white">
                          {currentSegment.type === "exercise" ? "Exercise" : "Rest"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Duration:</span>
                        <span className="text-white">{formatTimeNatural(currentSegment.duration)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Segment:</span>
                        <span className="text-white font-medium">
                          {currentSegmentIndex + 1} of {totalSegments}
                        </span>
                      </div>
                      {currentSegment.type === "exercise" && currentSegment.exerciseNotes && (
                        <div className="pt-3 border-t border-white/10">
                          <div className="text-white/70 text-xs mb-1">Notes:</div>
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
                    <h3 className="text-lg font-semibold text-white mb-3">Stats</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/70">Total Segments:</span>
                        <span className="text-white">{totalSegments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Exercise Segments:</span>
                        <span className="text-white">
                          {segments.filter((s) => s.type === "exercise").length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/70">Completed:</span>
                        <span className="text-white">
                          {currentSegmentIndex} / {totalSegments}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          ) : (
            /* Start Screen */
            <Card className="glass-effect border-white/10 text-center">
              <CardContent className="py-12">
                <div className="space-y-6">
                  <Timer className="w-16 h-16 text-primary mx-auto" />
                  <div>
                    <h2 className="text-3xl font-bold text-white mb-2">Ready to Start?</h2>
                    <p className="text-white/70">Your timer-based training session is ready to begin</p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsPreparingToStart(true);
                      setPreparationTime(10);
                    }}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Training
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  // Manual Mode UI (existing implementation)
  const currentExercises = getSectionExercises();
  const currentExercise = currentExercises[currentExerciseIndex];
  const isLastSection = currentSection === 'stretching';
  const isLastExercise = currentExerciseIndex === currentExercises.length - 1;
  const canMoveNext = currentExerciseIndex < currentExercises.length - 1;
  const canMovePrevious = currentExerciseIndex > 0 || currentSection !== 'warmup';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/training/${sessionId}`)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{session.title}</h1>
                <Badge className={`${getDifficultyColor(session.difficulty_level)} text-white`}>
                  {session.difficulty_level}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  <Hand className="w-3 h-3 mr-1" />
                  Manual Mode
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Section Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {(['warmup', 'figures', 'stretching'] as const).map((section) => (
              <div key={section} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentSection === section 
                    ? getSectionColor() 
                    : completedExercises.size > 0 && section === 'warmup' 
                      ? 'bg-green-500' 
                      : 'bg-white/10'
                }`}>
                  {section === 'warmup' && <Zap className="w-4 h-4" />}
                  {section === 'figures' && <Target className="w-4 h-4" />}
                  {section === 'stretching' && <Heart className="w-4 h-4" />}
                </div>
                <span className={`font-medium capitalize ${
                  currentSection === section ? 'text-white' : 'text-white/60'
                }`}>
                  {section === 'warmup' ? 'Warm-up' : section === 'figures' ? 'Training' : 'Stretching'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Exercise */}
        {currentExercise && (
          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${getSectionColor()} flex items-center justify-center mr-3`}>
                    {getSectionIcon()}
                  </div>
                  {getSectionTitle()}
                </div>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  {currentExerciseIndex + 1} of {currentExercises.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold text-white">
                  {typeof currentExercise === 'string' ? currentExercise : currentExercise.name}
                </h2>
                
                {typeof currentExercise === 'object' && (
                  <div className="flex justify-center space-x-8 text-white/80">
                    {currentExercise.sets && (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentExercise.sets}</div>
                        <div className="text-sm">Sets</div>
                      </div>
                    )}
                    {currentExercise.reps && (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentExercise.reps}</div>
                        <div className="text-sm">Reps</div>
                      </div>
                    )}
                    {currentExercise.completion_mode === 'completion' || currentExercise.hold_time_seconds === 0 ? (
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-400 flex items-center justify-center">
                          <CheckCircle className="w-6 h-6 mr-1" />
                          Completion
                        </div>
                        <div className="text-sm">Mode</div>
                      </div>
                    ) : currentExercise.hold_time_seconds && (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentExercise.hold_time_seconds}s</div>
                        <div className="text-sm">Hold</div>
                      </div>
                    )}
                  </div>
                )}
                
                {typeof currentExercise === 'object' && currentExercise.notes && (
                  <p className="text-white/70 italic">{currentExercise.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise List */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Exercise Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentExercises.map((exercise, index) => {
                const exerciseKey = `${currentSection}-${index}`;
                const isCompleted = completedExercises.has(exerciseKey);
                const isCurrent = index === currentExerciseIndex;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isCurrent 
                        ? 'bg-white/20 border-l-4 border-primary' 
                        : isCompleted 
                          ? 'bg-green-500/20' 
                          : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setCurrentExerciseIndex(index)}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExerciseComplete(exerciseKey);
                        }}
                        className="mr-3"
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/40" />
                        )}
                      </button>
                      <span className={`font-medium ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/70'
                      }`}>
                        {typeof exercise === 'string' ? exercise : exercise.name}
                      </span>
                    </div>
                    {typeof exercise === 'object' && (
                      <div className="flex items-center space-x-4 text-xs text-white/60">
                        {exercise.sets && <span>{exercise.sets} sets</span>}
                        {exercise.reps && <span>{exercise.reps} reps</span>}
                        {exercise.completion_mode === 'completion' || exercise.hold_time_seconds === 0 ? (
                          <span className="text-green-400 flex items-center">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completion
                          </span>
                        ) : exercise.hold_time_seconds && (
                          <span>{exercise.hold_time_seconds}s hold</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (canMovePrevious) {
                if (currentExerciseIndex > 0) {
                  setCurrentExerciseIndex(currentExerciseIndex - 1);
                } else {
                  moveToPreviousSection();
                }
              }
            }}
            disabled={!canMovePrevious}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-4">
            {currentExercises.length > 0 && (
              <span className="text-white/60 text-sm">
                Exercise {currentExerciseIndex + 1} of {currentExercises.length}
              </span>
            )}
          </div>

          {isLastSection && isLastExercise ? (
            <Button
              onClick={handleFinishSession}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
            >
              Finish Session
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (canMoveNext) {
                  setCurrentExerciseIndex(currentExerciseIndex + 1);
                } else {
                  moveToNextSection();
                }
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              Next
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingExerciseSession;