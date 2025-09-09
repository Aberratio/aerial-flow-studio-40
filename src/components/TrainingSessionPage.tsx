import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Clock,
  Users,
  Music,
  Target,
  Zap,
  Heart,
  Play,
  Pause,
  X,
  Check,
  Volume2,
  VolumeX,
  Trophy,
  Star,
  CheckCircle,
  Timer,
  SkipForward
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SessionExercise {
  id: string;
  name: string;
  sets: number;
  reps: number;
  hold_time_seconds: number;
  notes: string;
  order_index: number;
  completion_mode?: 'time' | 'completion';
}

interface TrainingSessionPageProps {
  session: {
    id?: string;
    title?: string;
    description?: string;
    duration_minutes?: number;
    instructor?: string;
    playlist?: string;
    warmup_exercises?: SessionExercise[];
    figures?: SessionExercise[];
    stretching_exercises?: SessionExercise[];
    exercises?: SessionExercise[]; // fallback for challenge sessions
  };
  onClose: () => void;
}

export const TrainingSessionPage: React.FC<TrainingSessionPageProps> = ({
  session,
  onClose,
}) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [exerciseTimer, setExerciseTimer] = useState(0);
  const [progress, setProgress] = useState(0);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // Build phases from actual session data
  const phases = [
    {
      name: "Warm-up",
      icon: Zap,
      color: "text-yellow-500",
      exercises: session?.warmup_exercises || [],
    },
    {
      name: "Training",
      icon: Target,
      color: "text-purple-500",
      exercises: session?.figures || session?.exercises || [],
    },
    {
      name: "Stretching",
      icon: Heart,
      color: "text-pink-500",
      exercises: session?.stretching_exercises || [],
    },
  ].filter(phase => phase.exercises.length > 0); // Only include phases with exercises

  const currentPhaseData = phases[currentPhase];
  const currentExerciseData = currentPhaseData?.exercises[currentExercise];
  const isCompletionMode = currentExerciseData?.completion_mode === 'completion' || currentExerciseData?.hold_time_seconds === 0;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && !isCompletionMode) {
      interval = setInterval(() => {
        setExerciseTimer((prev) => {
          const newTime = prev + 1;
          const targetTime = currentExerciseData?.hold_time_seconds || 30;
          
          if (newTime >= targetTime) {
            // Auto-advance when timer reaches target
            if (currentRep < (currentExerciseData?.reps || 1)) {
              setCurrentRep(prev => prev + 1);
              return 0; // Reset exercise timer for next rep
            } else if (currentSet < (currentExerciseData?.sets || 1)) {
              setCurrentSet(prev => prev + 1);
              setCurrentRep(1);
              return 0; // Reset for next set
            } else {
              nextExercise();
              return 0;
            }
          }
          return newTime;
        });
        setTimer((prev) => prev + 1);
      }, 1000);
    } else if (isPlaying && isCompletionMode) {
      interval = setInterval(() => {
        setTimer((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, isCompletionMode, currentRep, currentSet, currentExerciseData]);

  useEffect(() => {
    const sessionDuration = session?.duration_minutes || 45;
    const totalDuration = sessionDuration * 60;
    const currentProgress = (timer / totalDuration) * 100;
    setProgress(Math.min(currentProgress, 100));
  }, [timer, session]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const nextExercise = () => {
    if (currentExercise < (currentPhaseData?.exercises?.length || 0) - 1) {
      setCurrentExercise((prev) => prev + 1);
      setCurrentSet(1);
      setCurrentRep(1);
      setExerciseTimer(0);
    } else if (currentPhase < phases.length - 1) {
      setCurrentPhase((prev) => prev + 1);
      setCurrentExercise(0);
      setCurrentSet(1);
      setCurrentRep(1);
      setExerciseTimer(0);
    } else {
      setIsCompleted(true);
      setIsPlaying(false);
      setShowCompletionModal(true);
    }
  };

  const prevExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise((prev) => prev - 1);
      setCurrentSet(1);
      setCurrentRep(1);
      setExerciseTimer(0);
    } else if (currentPhase > 0) {
      setCurrentPhase((prev) => prev - 1);
      const prevPhaseExercises = phases[currentPhase - 1].exercises;
      setCurrentExercise(prevPhaseExercises.length - 1);
      setCurrentSet(1);
      setCurrentRep(1);
      setExerciseTimer(0);
    }
  };

  const completeCurrentExercise = () => {
    if (currentRep < (currentExerciseData?.reps || 1)) {
      setCurrentRep(prev => prev + 1);
    } else if (currentSet < (currentExerciseData?.sets || 1)) {
      setCurrentSet(prev => prev + 1);
      setCurrentRep(1);
    } else {
      nextExercise();
    }
  };

  const CurrentPhaseIcon = currentPhaseData?.icon || Target;
  const currentInstruction = currentExerciseData?.notes || `Perform ${currentExerciseData?.name || 'exercise'} with proper form and control.`;

  const playAudioInstruction = () => {
    if (audioEnabled && "speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(currentInstruction);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      speechSynthesis.speak(utterance);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {session?.title || "Training Session"}
            </h1>
            <p className="text-muted-foreground">
              with {session?.instructor || "Professional Trainer"}
            </p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Bar */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CurrentPhaseIcon
                  className={`w-6 h-6 ${currentPhaseData?.color || 'text-purple-500'}`}
                />
                <span className="text-white font-semibold">
                  {currentPhaseData?.name || 'Training'}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-white">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTime(timer)}
                </div>
                <Badge variant="outline" className="text-white border-white/20">
                  {currentExercise + 1} / {currentPhaseData?.exercises?.length || 0}
                </Badge>
                <Badge variant="outline" className="text-white border-white/20">
                  Set {currentSet} / {currentExerciseData?.sets || 1}
                </Badge>
                <Badge variant="outline" className="text-white border-white/20">
                  Rep {currentRep} / {currentExerciseData?.reps || 1}
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Current Exercise with Timer/Completion */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Exercise Info */}
              <div className="space-y-4">
                <div className="bg-white/5 p-6 rounded-lg border border-white/10">
                  <CurrentPhaseIcon
                    className={`w-12 h-12 mb-4 ${currentPhaseData?.color || 'text-purple-500'}`}
                  />
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {currentExerciseData?.name || 'Exercise'}
                  </h2>
                  <p className="text-muted-foreground mb-4">
                    {currentInstruction}
                  </p>
                  
                  {/* Exercise Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="bg-white/5 p-3 rounded">
                      <div className="text-primary font-semibold">Sets</div>
                      <div className="text-white text-xl">{currentExerciseData?.sets || 1}</div>
                    </div>
                    <div className="bg-white/5 p-3 rounded">
                      <div className="text-primary font-semibold">Reps</div>
                      <div className="text-white text-xl">{currentExerciseData?.reps || 1}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center justify-between">
                  <Button
                    onClick={playAudioInstruction}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {audioEnabled ? (
                      <Volume2 className="w-4 h-4 mr-2" />
                    ) : (
                      <VolumeX className="w-4 h-4 mr-2" />
                    )}
                    Play Instructions
                  </Button>
                  <Button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-white"
                  >
                    {audioEnabled ? (
                      <Volume2 className="w-4 h-4" />
                    ) : (
                      <VolumeX className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              {/* Timer/Completion Section */}
              <div className="flex flex-col justify-center text-center">
                {isCompletionMode ? (
                  <div className="space-y-6">
                    <div className="bg-green-500/10 border border-green-500/30 p-8 rounded-lg">
                      <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        Completion Mode
                      </h3>
                      <p className="text-muted-foreground mb-4">
                        Complete this exercise at your own pace, then click "Done" to continue.
                      </p>
                      <Button
                        onClick={completeCurrentExercise}
                        className="bg-green-500 hover:bg-green-600 text-white"
                        size="lg"
                      >
                        <Check className="w-5 h-5 mr-2" />
                        Done
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-blue-500/10 border border-blue-500/30 p-8 rounded-lg">
                      <Timer className="w-16 h-16 mx-auto mb-4 text-blue-400" />
                      <h3 className="text-xl font-bold text-white mb-2">
                        Timer Mode
                      </h3>
                      <div className="text-4xl font-mono text-white mb-2">
                        {formatTime(exerciseTimer)}
                      </div>
                      <div className="text-sm text-muted-foreground mb-4">
                        Hold for {currentExerciseData?.hold_time_seconds || 30} seconds
                      </div>
                      <Progress 
                        value={(exerciseTimer / (currentExerciseData?.hold_time_seconds || 30)) * 100} 
                        className="h-3 mb-4" 
                      />
                      <Button
                        onClick={completeCurrentExercise}
                        variant="outline"
                        className="border-blue-500/50 text-blue-400 hover:bg-blue-500/10"
                      >
                        <SkipForward className="w-4 h-4 mr-2" />
                        Skip
                      </Button>
                    </div>
                  </div>
                )}

                {/* Control Buttons */}
                <div className="flex justify-center space-x-4 mt-6">
                  <Button
                    onClick={prevExercise}
                    variant="outline"
                    disabled={currentPhase === 0 && currentExercise === 0}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    disabled={isCompletionMode}
                  >
                    {isPlaying ? (
                      <Pause className="w-4 h-4 mr-2" />
                    ) : (
                      <Play className="w-4 h-4 mr-2" />
                    )}
                    {isPlaying ? "Pause" : "Start"}
                  </Button>
                  <Button
                    onClick={nextExercise}
                    variant="outline"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {currentPhase === phases.length - 1 &&
                    currentExercise === (currentPhaseData?.exercises?.length || 0) - 1
                      ? "Finish"
                      : "Next"}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Phase Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {phases.map((phase, index) => (
            <Card
              key={index}
              className={`glass-effect border-white/10 ${
                index === currentPhase ? "ring-2 ring-purple-500" : ""
              }`}
            >
              <CardContent className="p-4 text-center">
                <phase.icon className={`w-8 h-8 mx-auto mb-2 ${phase.color}`} />
                <h3 className="font-semibold text-white mb-1">{phase.name}</h3>
                <p className="text-muted-foreground text-sm">
                  {phase.exercises?.length || 0} exercises
                </p>
                <div className="mt-2">
                  {index < currentPhase ? (
                    <Check className="w-4 h-4 mx-auto text-green-500" />
                  ) : index === currentPhase ? (
                    <div className="w-4 h-4 mx-auto bg-purple-500 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 mx-auto bg-gray-500 rounded-full" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Music Player */}
        <Card className="glass-effect border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Music className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-white">Now Playing</h3>
                  <p className="text-muted-foreground">
                    {session?.playlist || "Ambient Training Music"}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Music
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Completion Modal */}
        <Dialog
          open={showCompletionModal}
          onOpenChange={setShowCompletionModal}
        >
          <DialogContent className="glass-effect border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                Congratulations!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-2 mb-4">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-white">
                Training Complete!
              </h3>
              <p className="text-muted-foreground">
                You've successfully completed the{" "}
                {session?.title || "training session"}. Your dedication and hard
                work are paying off!
              </p>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white font-semibold">Session Summary:</p>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p>Duration: {formatTime(timer)}</p>
                  <p>
                    Exercises Completed:{" "}
                    {phases.reduce(
                      (total, phase) => total + (phase.exercises?.length || 0),
                      0
                    )}
                  </p>
                  <p>Phases: {phases.length}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg">
                <p className="text-white font-semibold mb-2">
                  ✨ Motivational Message
                </p>
                <p className="text-sm text-muted-foreground">
                  "Every expert was once a beginner. Every pro was once an
                  amateur. Keep pushing your limits and celebrating your
                  progress. You're stronger than you think!"
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={() => {
                    setShowCompletionModal(false);
                    onClose();
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowCompletionModal(false);
                    // Reset session for replay
                    setCurrentPhase(0);
                    setCurrentExercise(0);
                    setCurrentSet(1);
                    setCurrentRep(1);
                    setTimer(0);
                    setExerciseTimer(0);
                    setProgress(0);
                    setIsCompleted(false);
                    setIsPlaying(false);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  Train Again
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};