import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useTrainingTimer } from '@/hooks/useTrainingTimer';

interface RestScreenProps {
  restSeconds: number;
  nextExerciseName: string;
  nextExerciseImage?: string;
  onComplete: () => void;
  onSkip: () => void;
}

export const RestScreen = ({
  restSeconds,
  nextExerciseName,
  nextExerciseImage,
  onComplete,
  onSkip,
}: RestScreenProps) => {
  const { timeRemaining, isRunning, start } = useTrainingTimer({
    initialSeconds: restSeconds,
    onComplete,
    autoStart: false,
  });

  useEffect(() => {
    start();
  }, []);

  const progress = ((restSeconds - timeRemaining) / restSeconds) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 glass-effect">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="text-6xl">🧘</div>
          <h1 className="text-4xl font-bold gradient-text">Odpoczynek</h1>
        </div>

        <div className="space-y-4">
          <div className="text-8xl font-bold text-primary tabular-nums">
            {timeRemaining}s
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="glass-effect-intense p-6 rounded-lg space-y-3">
          <p className="text-sm text-muted-foreground">⏭️ Następne:</p>
          {nextExerciseImage && (
            <img 
              src={nextExerciseImage} 
              alt={nextExerciseName}
              className="w-full h-40 object-cover rounded-lg"
            />
          )}
          <h3 className="text-xl font-semibold">{nextExerciseName}</h3>
        </div>

        <Button 
          onClick={onSkip}
          variant="outline"
          size="lg"
          className="w-full"
        >
          Pomiń odpoczynek
        </Button>
      </div>
    </div>
  );
};
