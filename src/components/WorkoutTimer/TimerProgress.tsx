import { Progress } from '@/components/ui/progress';
import type { TimerState, TimerConfig } from '@/types/timer';

interface TimerProgressProps {
  state: TimerState;
  config: TimerConfig;
}

export const TimerProgress = ({ state, config }: TimerProgressProps) => {
  const totalRounds = config.rounds * config.sets;
  const completedRounds = (state.currentSet - 1) * config.rounds + (state.currentRound - 1);
  const progressPercentage = state.phase === 'finished' ? 100 : (completedRounds / totalRounds) * 100;

  const getNextPhaseText = () => {
    if (state.phase === 'finished') return null;
    
    switch (state.phase) {
      case 'prepare':
        return `Następnie: PRACA (${config.workDuration}s)`;
      case 'work':
        if (state.currentRound < config.rounds) {
          return `Następnie: ODPOCZYNEK (${config.restDuration}s)`;
        } else if (state.currentSet < config.sets) {
          return `Następnie: PRZERWA MIĘDZY SERIAMI (${config.restBetweenSets}s)`;
        } else {
          return 'Ostatnia runda!';
        }
      case 'rest':
        return `Następnie: PRACA (${config.workDuration}s)`;
      case 'set-rest':
        return `Następnie: PRACA (${config.workDuration}s)`;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 my-6">
      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress value={progressPercentage} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{Math.round(progressPercentage)}% ukończone</span>
          <span>{completedRounds}/{totalRounds} rund</span>
        </div>
      </div>

      {/* Current Status */}
      <div className="text-center space-y-1">
        <p className="text-lg font-semibold text-foreground">
          Runda {state.currentRound}/{config.rounds} • Seria {state.currentSet}/{config.sets}
        </p>
        {getNextPhaseText() && (
          <p className="text-sm text-muted-foreground">
            {getNextPhaseText()}
          </p>
        )}
      </div>
    </div>
  );
};
