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
  type: 'exercise' | 'rest';
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
  const { changeDayStatus, getCalendarDayByTrainingDay } = useChallengeCalendar(challengeId || "");

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [segments, setSegments] = useState<TimerSegment[]>([]);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [trainingDayId, setTrainingDayId] = useState<string>("");

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
        const { data: trainingDayData, error: trainingDayError } = await supabase
          .from("challenge_training_days")
          .select(`
            training_day_exercises (
              *,
              figure:figures (
                id, name, image_url
              )
            )
          `)
          .eq("id", calendarDay.training_day_id)
          .single();

        if (trainingDayError) throw trainingDayError;

        const exercisesData = trainingDayData.training_day_exercises?.map((exercise: any) => ({
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
          type: 'exercise',
          exerciseIndex,
          setIndex,
          duration: exercise.hold_time_seconds || 30,
          exerciseName: exercise.figure.name,
          exerciseImage: exercise.figure.image_url,
        });

        // Add rest segment (except after the last set of the last exercise)
        if (!(exerciseIndex === exercises.length - 1 && setIndex === sets - 1)) {
          newSegments.push({
            type: 'rest',
            exerciseIndex,
            setIndex,
            duration: exercise.rest_time_seconds || 15,
            exerciseName: 'Rest',
          });
        }
      }
    });

    setSegments(newSegments);
    if (newSegments.length > 0) {
      setTimeRemaining(newSegments[0].duration);
    }
  }, [exercises]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            handleSegmentComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, timeRemaining]);

  // Voice announcements
  const speak = (text: string) => {
    if (!isAudioEnabled || !('speechSynthesis' in window)) return;
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.8;
    speechSynthesis.speak(utterance);
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
    
    // Voice announcement for next segment
    if (nextSegment.type === 'exercise') {
      speak(`Next exercise: ${nextSegment.exerciseName}`);
    } else {
      speak("Rest time");
    }
  };

  const handleWorkoutComplete = async () => {
    if (!user || !challengeId || !trainingDayId) return;

    try {
      const calendarDay = getCalendarDayByTrainingDay(trainingDayId);
      if (calendarDay) {
        await changeDayStatus(calendarDay.calendar_date, "completed");
        toast({
          title: "Workout Completed!",
          description: "Great job! This training day has been marked as completed.",
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
    if (!isRunning && currentSegmentIndex === 0 && timeRemaining === segments[0]?.duration) {
      speak(`Starting workout. First exercise: ${segments[0]?.exerciseName}`);
    }
  };

  const handleSkip = () => {
    handleSegmentComplete();
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = (): number => {
    if (segments.length === 0) return 0;
    const totalDuration = segments.reduce((sum, segment) => sum + segment.duration, 0);
    const completedDuration = segments.slice(0, currentSegmentIndex).reduce((sum, segment) => sum + segment.duration, 0);
    const currentSegmentProgress = segments[currentSegmentIndex] ? 
      (segments[currentSegmentIndex].duration - timeRemaining) : 0;
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
          <h2 className="text-2xl font-bold text-white mb-2">No exercises found</h2>
          <Button onClick={() => navigate(`/challenge/${challengeId}/day/${dayId}`)} variant="outline">
            Back to Day Overview
          </Button>
        </div>
      </div>
    );
  }

  const currentSegment = getCurrentSegment();
  const nextSegment = getNextSegment();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/challenge/${challengeId}/day/${dayId}`)}
            className="text-white hover:bg-white/10"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          
          <Button
            variant="ghost"
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="text-white hover:bg-white/10"
          >
            {isAudioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </Button>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-muted-foreground">Progress</span>
            <span className="text-sm text-muted-foreground">
              {currentSegmentIndex + 1} / {segments.length}
            </span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {/* Current Exercise Display */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-4 md:p-8 text-center">
            {currentSegment && (
              <>
                <Badge 
                  className={`mb-4 ${
                    currentSegment.type === 'exercise' 
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' 
                      : 'bg-green-500/20 text-green-400 border-green-500/30'
                  }`}
                >
                  {currentSegment.type === 'exercise' ? 'Exercise' : 'Rest'}
                </Badge>
                
                {/* Exercise Image - Responsive */}
                <div className="mb-6">
                  {currentSegment.type === 'exercise' && currentSegment.exerciseImage ? (
                    <img
                      src={currentSegment.exerciseImage}
                      alt={currentSegment.exerciseName}
                      className="w-48 h-48 md:w-64 md:h-64 object-cover rounded-lg mx-auto"
                    />
                  ) : currentSegment.type === 'rest' ? (
                    <div className="w-48 h-48 md:w-64 md:h-64 bg-green-500/20 rounded-lg mx-auto flex items-center justify-center">
                      <Hand className="w-24 h-24 md:w-32 md:h-32 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-48 h-48 md:w-64 md:h-64 bg-gray-500/20 rounded-lg mx-auto flex items-center justify-center">
                      <span className="text-3xl md:text-4xl">🏃‍♂️</span>
                    </div>
                  )}
                </div>

                <h2 className="text-xl md:text-3xl font-bold mb-4">{currentSegment.exerciseName}</h2>
                
                {/* Timer Display - Responsive */}
                <div className="text-4xl md:text-6xl font-mono font-bold mb-6 text-primary">
                  {formatTime(timeRemaining)}
                </div>

                {/* Controls - Responsive */}
                <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
                  <Button
                    onClick={handlePlayPause}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 w-full sm:w-auto"
                  >
                    {isRunning ? <Pause className="w-6 h-6 mr-2" /> : <Play className="w-6 h-6 mr-2" />}
                    {isRunning ? 'Pause' : 'Start'}
                  </Button>
                  
                  {!isCompleted && (
                    <Button
                      onClick={handleSkip}
                      variant="outline"
                      size="lg"
                      className="border-white/20 text-white hover:bg-white/10 w-full sm:w-auto"
                    >
                      Skip
                    </Button>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Next Exercise Preview */}
        {nextSegment && (
          <Card className="glass-effect border-white/10">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="text-sm text-muted-foreground font-medium">Up Next:</div>
                <div className="flex items-center space-x-3">
                  {nextSegment.type === 'exercise' && nextSegment.exerciseImage ? (
                    <img
                      src={nextSegment.exerciseImage}
                      alt={nextSegment.exerciseName}
                      className="w-12 h-12 object-cover rounded"
                    />
                  ) : nextSegment.type === 'rest' ? (
                    <div className="w-12 h-12 bg-green-500/20 rounded flex items-center justify-center">
                      <Hand className="w-6 h-6 text-green-400" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 bg-gray-500/20 rounded flex items-center justify-center">
                      <span className="text-lg">🏃‍♂️</span>
                    </div>
                  )}
                  <div>
                    <div className="font-medium">{nextSegment.exerciseName}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatTime(nextSegment.duration)}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Completion Modal Effect */}
        {isCompleted && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <Card className="glass-effect border-white/10 max-w-md mx-4">
              <CardContent className="p-8 text-center">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-bold mb-2">Workout Completed!</h2>
                <p className="text-muted-foreground mb-6">
                  Great job! You've successfully completed this training day.
                </p>
                <Button
                  onClick={() => navigate(`/challenges/${challengeId}`)}
                  className="bg-primary hover:bg-primary/90"
                >
                  Back to Challenge
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