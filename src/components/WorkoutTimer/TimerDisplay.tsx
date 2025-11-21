import { Card, CardContent } from '@/components/ui/card';
import type { TimerState, TimerConfig } from '@/types/timer';

interface TimerDisplayProps {
  state: TimerState;
  config: TimerConfig;
}

export const TimerDisplay = ({ state, config }: TimerDisplayProps) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseColor = (phase: string) => {
    switch (phase) {
      case 'prepare': return 'from-yellow-500 to-orange-500';
      case 'work': return 'from-green-500 to-emerald-500';
      case 'rest': return 'from-blue-500 to-cyan-500';
      case 'set-rest': return 'from-purple-500 to-pink-500';
      case 'finished': return 'from-gray-700 to-slate-700';
      default: return 'from-gray-500 to-slate-500';
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'prepare': return 'PRZYGOTOWANIE';
      case 'work': return 'PRACA';
      case 'rest': return 'ODPOCZYNEK';
      case 'set-rest': return 'PRZERWA MIĘDZY SERIAMI';
      case 'finished': return 'UKOŃCZONO! 🎉';
      default: return phase.toUpperCase();
    }
  };

  return (
    <Card className={`
      border-2 border-white/20
      bg-gradient-to-br ${getPhaseColor(state.phase)}
      ${state.timeRemaining <= 3 && state.isRunning && !state.isPaused ? 'animate-pulse' : ''}
      transition-all duration-500
    `}>
      <CardContent className="p-8 sm:p-16 text-center">
        {/* Phase Label */}
        <h2 className="text-2xl sm:text-4xl font-bold text-white mb-4 sm:mb-8">
          {getPhaseLabel(state.phase)}
        </h2>
        
        {/* Time Display */}
        <div className="text-7xl sm:text-9xl md:text-[12rem] font-bold text-white tabular-nums leading-none">
          {formatTime(state.timeRemaining)}
        </div>
        
        {/* Exercise Name (if configured) */}
        {config.showExerciseName && config.exerciseName && (
          <p className="text-xl sm:text-2xl text-white/80 mt-4 sm:mt-8">
            {config.exerciseName}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
