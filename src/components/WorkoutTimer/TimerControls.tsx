import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, SkipForward } from 'lucide-react';
import type { TimerState } from '@/types/timer';

interface TimerControlsProps {
  state: TimerState;
  onStart: () => void;
  onPause: () => void;
  onResume: () => void;
  onReset: () => void;
  onSkip: () => void;
}

export const TimerControls = ({ 
  state, 
  onStart, 
  onPause, 
  onResume, 
  onReset, 
  onSkip 
}: TimerControlsProps) => {
  return (
    <div className="flex justify-center items-center gap-3 sm:gap-4 my-6 sm:my-8">
      {/* Reset Button */}
      <Button
        onClick={onReset}
        variant="outline"
        size="lg"
        className="border-border/50 hover:bg-white/10"
      >
        <RotateCcw className="w-5 h-5" />
      </Button>

      {/* Play/Pause Button */}
      {!state.isRunning || state.isPaused ? (
        <Button
          onClick={state.isRunning && state.isPaused ? onResume : onStart}
          variant="default"
          size="lg"
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full"
        >
          <Play className="w-7 h-7 sm:w-9 sm:h-9" />
        </Button>
      ) : (
        <Button
          onClick={onPause}
          variant="default"
          size="lg"
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-full"
        >
          <Pause className="w-7 h-7 sm:w-9 sm:h-9" />
        </Button>
      )}

      {/* Skip Button */}
      <Button
        onClick={onSkip}
        variant="outline"
        size="lg"
        className="border-border/50 hover:bg-white/10"
        disabled={state.phase === 'finished'}
      >
        <SkipForward className="w-5 h-5" />
      </Button>
    </div>
  );
};
