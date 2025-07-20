import React, { useState, useEffect, useCallback } from 'react';
import { Play, Pause, SkipForward, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Exercise {
  id: string;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  figure: {
    name: string;
  };
}

interface ChallengeTimerProps {
  exercises: Exercise[];
  isAudioEnabled: boolean;
  onComplete: () => void;
}

interface TimerSegment {
  type: 'exercise' | 'rest';
  exerciseIndex: number;
  setIndex: number;
  duration: number;
  exerciseName: string;
}

const ChallengeTimer = ({ exercises, isAudioEnabled, onComplete }: ChallengeTimerProps) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [segments, setSegments] = useState<TimerSegment[]>([]);

  // Generate timer segments from exercises
  useEffect(() => {
    const newSegments: TimerSegment[] = [];
    
    exercises.forEach((exercise, exerciseIndex) => {
      const sets = exercise.sets || 1;
      const holdTime = exercise.hold_time_seconds || 30;
      const restTime = exercise.rest_time_seconds || 15;
      
      for (let setIndex = 0; setIndex < sets; setIndex++) {
        // Add exercise segment
        newSegments.push({
          type: 'exercise',
          exerciseIndex,
          setIndex,
          duration: holdTime,
          exerciseName: exercise.figure.name
        });
        
        // Add rest segment (except after the last set of the last exercise)
        if (!(exerciseIndex === exercises.length - 1 && setIndex === sets - 1)) {
          newSegments.push({
            type: 'rest',
            exerciseIndex,
            setIndex,
            duration: restTime,
            exerciseName: exercise.figure.name
          });
        }
      }
    });
    
    setSegments(newSegments);
    if (newSegments.length > 0) {
      setTimeRemaining(newSegments[0].duration);
    }
  }, [exercises]);

  // Timer countdown
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    
    if (isRunning && timeRemaining > 0) {
      intervalId = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Move to next segment or complete
            if (currentSegmentIndex < segments.length - 1) {
              const nextIndex = currentSegmentIndex + 1;
              setCurrentSegmentIndex(nextIndex);
              return segments[nextIndex].duration;
            } else {
              // Timer complete
              setIsRunning(false);
              onComplete();
              return 0;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    
    return () => clearInterval(intervalId);
  }, [isRunning, timeRemaining, currentSegmentIndex, segments, onComplete]);

  const handlePlayPause = () => {
    setIsRunning(!isRunning);
  };

  const handleSkip = () => {
    if (currentSegmentIndex < segments.length - 1) {
      const nextIndex = currentSegmentIndex + 1;
      setCurrentSegmentIndex(nextIndex);
      setTimeRemaining(segments[nextIndex].duration);
    } else {
      onComplete();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const calculateProgress = () => {
    if (segments.length === 0) return 0;
    const totalSegments = segments.length;
    const completedSegments = currentSegmentIndex;
    const currentProgress = segments[currentSegmentIndex] 
      ? (segments[currentSegmentIndex].duration - timeRemaining) / segments[currentSegmentIndex].duration
      : 0;
    
    return ((completedSegments + currentProgress) / totalSegments) * 100;
  };

  const getTotalDuration = () => {
    return segments.reduce((total, segment) => total + segment.duration, 0);
  };

  const currentSegment = segments[currentSegmentIndex];

  if (!currentSegment) {
    return (
      <Card className="glass-effect border-white/10">
        <CardContent className="p-6 text-center">
          <div className="text-white">No exercises with timing data available for timer mode.</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Timer className="w-5 h-5" />
          Challenge Timer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Current Exercise Info */}
        <div className="text-center">
          <div className="text-sm text-muted-foreground mb-1">
            {currentSegment.type === 'exercise' ? 'Exercise' : 'Rest'}
          </div>
          <h3 className="text-xl font-bold text-white mb-2">
            {currentSegment.exerciseName}
          </h3>
          {currentSegment.type === 'exercise' && (
            <div className="text-sm text-muted-foreground">
              Set {currentSegment.setIndex + 1}
            </div>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center">
          <div className="text-6xl font-mono font-bold text-white mb-4">
            {formatTime(timeRemaining)}
          </div>
          <div className={`text-sm px-3 py-1 rounded-full inline-block ${
            currentSegment.type === 'exercise' 
              ? 'bg-green-500/20 text-green-400' 
              : 'bg-yellow-500/20 text-yellow-400'
          }`}>
            {currentSegment.type === 'exercise' ? 'HOLD' : 'REST'}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Progress</span>
            <span>
              {currentSegmentIndex + 1} of {segments.length} segments
            </span>
          </div>
          <Progress value={calculateProgress()} className="h-2" />
        </div>

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <Button
            onClick={handlePlayPause}
            className="flex items-center gap-2"
            size="lg"
          >
            {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            {isRunning ? 'Pause' : 'Start'}
          </Button>
          <Button
            onClick={handleSkip}
            variant="outline"
            className="flex items-center gap-2"
            size="lg"
          >
            <SkipForward className="w-5 h-5" />
            Skip
          </Button>
        </div>

        {/* Session Info */}
        <div className="text-center text-sm text-muted-foreground border-t pt-4">
          <div>Total Duration: {formatTime(getTotalDuration())}</div>
          <div>{exercises.length} exercises • {segments.filter(s => s.type === 'exercise').length} total sets</div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChallengeTimer;