import { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { cn } from '@/lib/utils';

interface FigureHoldTimerProps {
  holdTimeSeconds: number;
  onComplete?: () => void;
  className?: string;
}

type Phase = 'prepare' | 'hold' | 'completed';

export const FigureHoldTimer = ({
  holdTimeSeconds,
  onComplete,
  className,
}: FigureHoldTimerProps) => {
  const totalPrepareTime = 10;
  const totalHoldTime = holdTimeSeconds;

  const [phase, setPhase] = useState<Phase>('prepare');
  const [timeRemaining, setTimeRemaining] = useState(totalPrepareTime);
  const [isRunning, setIsRunning] = useState(false);
  const hasPlayedBeep = useRef(new Set<string>());
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const playBeep = (frequency: number = 800, duration: number = 0.15) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = frequency;
      gainNode.gain.setValueAtTime(0.15, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + duration);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  };

  const playDoubleBeep = () => {
    playBeep(1200);
    setTimeout(() => playBeep(1200), 200);
  };

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          const newTime = prev - 1;

          // Prepare phase beeps (at 7s, 8s, 9s remaining = 3s, 2s, 1s before hold starts)
          if (phase === 'prepare') {
            const beepKey = `prepare-${newTime}`;
            if (newTime === 3 && !hasPlayedBeep.current.has(beepKey)) {
              playBeep(600);
              hasPlayedBeep.current.add(beepKey);
            } else if (newTime === 2 && !hasPlayedBeep.current.has(beepKey)) {
              playBeep(700);
              hasPlayedBeep.current.add(beepKey);
            } else if (newTime === 1 && !hasPlayedBeep.current.has(beepKey)) {
              playBeep(800);
              hasPlayedBeep.current.add(beepKey);
            }
          }

          // Hold phase beeps (last 5 seconds)
          if (phase === 'hold') {
            const beepKey = `hold-${newTime}`;
            if (newTime <= 5 && newTime > 0 && !hasPlayedBeep.current.has(beepKey)) {
              playBeep(1000);
              hasPlayedBeep.current.add(beepKey);
            }
          }

          // Transition from prepare to hold
          if (newTime === 0 && phase === 'prepare') {
            setPhase('hold');
            setTimeRemaining(totalHoldTime);
            hasPlayedBeep.current.clear();
            return totalHoldTime;
          }

          // Complete
          if (newTime === 0 && phase === 'hold') {
            setIsRunning(false);
            setPhase('completed');
            playDoubleBeep();
            onComplete?.();
            return 0;
          }

          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, timeRemaining, phase, totalHoldTime, onComplete]);

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setPhase('prepare');
    setTimeRemaining(totalPrepareTime);
    hasPlayedBeep.current.clear();
  };

  const handleSkip = () => {
    if (phase === 'prepare') {
      setPhase('hold');
      setTimeRemaining(totalHoldTime);
      hasPlayedBeep.current.clear();
    } else if (phase === 'hold') {
      setIsRunning(false);
      setPhase('completed');
      setTimeRemaining(0);
      playDoubleBeep();
      onComplete?.();
    }
  };

  const progress =
    phase === 'prepare'
      ? ((totalPrepareTime - timeRemaining) / totalPrepareTime) * 100
      : ((totalHoldTime - timeRemaining) / totalHoldTime) * 100;

  const getProgressColor = () => {
    if (phase === 'prepare') return 'bg-green-500';
    if (phase === 'hold' && timeRemaining <= 5) return 'bg-red-500';
    return 'bg-gradient-to-r from-purple-500 to-pink-500';
  };

  const getProgressBgColor = () => {
    if (phase === 'prepare') return 'bg-green-900/30';
    if (phase === 'hold' && timeRemaining <= 5) return 'bg-red-900/30';
    return 'bg-purple-900/30';
  };

  if (phase === 'completed') {
    return (
      <Card className={cn('bg-gradient-to-br from-background to-purple-900/20 border-purple-400/30 shadow-lg shadow-purple-500/20', className)}>
        <CardContent className="p-4 sm:p-6">
          <div className="text-center">
            <div className="text-4xl mb-4">🎉</div>
            <div className="text-xl sm:text-2xl font-bold text-foreground mb-4">
              Świetna robota!
            </div>
            <Button onClick={handleReset} variant="outline" className="w-full">
              <RotateCcw className="w-4 h-4 mr-2" />
              Rozpocznij ponownie
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('bg-gradient-to-br from-background to-purple-900/20 border-purple-400/30 shadow-lg shadow-purple-500/20', className)}>
      <CardContent className="p-4 sm:p-6">
        {/* Phase Label */}
        <div className="text-center mb-4">
          <Badge variant="secondary" className="text-sm sm:text-base">
            {phase === 'prepare' ? '💪 Przygotowanie' : '🔥 Trzymaj pozycję!'}
          </Badge>
        </div>

        {/* Large Timer Display */}
        <div className="text-center mb-6">
          <div className="text-4xl sm:text-6xl md:text-8xl font-bold text-foreground tabular-nums">
            {timeRemaining}s
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6 relative">
          <div className={cn('h-2 sm:h-3 w-full rounded-full overflow-hidden', getProgressBgColor())}>
            <div
              className={cn('h-full transition-all duration-300', getProgressColor())}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap justify-center gap-2">
          <Button
            onClick={handleStartPause}
            size="sm"
            variant={isRunning ? 'secondary' : 'default'}
          >
            {isRunning ? (
              <>
                <Pause className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Pauza</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Start</span>
              </>
            )}
          </Button>
          <Button onClick={handleReset} size="sm" variant="outline">
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Reset</span>
          </Button>
          <Button onClick={handleSkip} size="sm" variant="outline">
            <SkipForward className="w-4 h-4" />
            <span className="hidden sm:inline ml-2">Pomiń</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
