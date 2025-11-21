import { useState, useEffect, useCallback } from 'react';
import type { TimerConfig, TimerState } from '@/types/timer';

const getInitialState = (config: TimerConfig): TimerState => ({
  phase: 'prepare',
  currentRound: 0,
  currentSet: 1,
  timeRemaining: config.prepareTime,
  isRunning: false,
  isPaused: false,
});

export const useWorkoutTimer = (config: TimerConfig) => {
  const [state, setState] = useState<TimerState>(() => getInitialState(config));

  const advancePhase = useCallback((current: TimerState, cfg: TimerConfig): TimerState => {
    switch (current.phase) {
      case 'prepare':
        return { ...current, phase: 'work', timeRemaining: cfg.workDuration, currentRound: 1 };
      
      case 'work':
        if (current.currentRound < cfg.rounds) {
          return { 
            ...current, 
            phase: 'rest', 
            timeRemaining: cfg.restDuration,
            currentRound: current.currentRound + 1 
          };
        } else if (current.currentSet < cfg.sets) {
          return {
            ...current,
            phase: 'set-rest',
            timeRemaining: cfg.restBetweenSets,
            currentRound: 1,
            currentSet: current.currentSet + 1,
          };
        } else {
          return { ...current, phase: 'finished', isRunning: false, timeRemaining: 0 };
        }
      
      case 'rest':
        return { ...current, phase: 'work', timeRemaining: cfg.workDuration };
      
      case 'set-rest':
        return { ...current, phase: 'work', timeRemaining: cfg.workDuration };
      
      case 'finished':
        return current;
      
      default:
        return current;
    }
  }, []);

  // Main timer logic
  useEffect(() => {
    if (!state.isRunning || state.isPaused) return;
    
    const interval = setInterval(() => {
      setState(prev => {
        if (prev.timeRemaining <= 1) {
          return advancePhase(prev, config);
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, state.isPaused, config, advancePhase]);

  const start = useCallback(() => {
    setState(s => ({ ...s, isRunning: true, isPaused: false }));
  }, []);

  const pause = useCallback(() => {
    setState(s => ({ ...s, isPaused: true }));
  }, []);

  const resume = useCallback(() => {
    setState(s => ({ ...s, isPaused: false }));
  }, []);

  const reset = useCallback(() => {
    setState(getInitialState(config));
  }, [config]);

  const skip = useCallback(() => {
    setState(s => advancePhase(s, config));
  }, [config, advancePhase]);

  return {
    state,
    start,
    pause,
    resume,
    reset,
    skip,
  };
};
