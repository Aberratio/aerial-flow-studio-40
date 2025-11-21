import { useEffect, useRef } from 'react';
import type { TimerConfig, TimerState } from '@/types/timer';

export const useTimerAudio = (config: TimerConfig, state: TimerState) => {
  const audioContextRef = useRef<AudioContext>();
  const lastPhaseRef = useRef<string>(state.phase);

  // Initialize Web Audio API
  useEffect(() => {
    if (config.enableSound && !audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return () => {
      audioContextRef.current?.close();
    };
  }, [config.enableSound]);

  // Beep sound generator
  const playBeep = (frequency: number, duration: number) => {
    if (!config.enableSound || !audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime((config.beepVolume / 100) * 0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start();
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  };

  // Countdown beeps
  useEffect(() => {
    if (!state.isRunning || state.isPaused) return;
    
    if (state.timeRemaining <= config.countdownBeeps && state.timeRemaining > 0) {
      if (state.timeRemaining === 1) {
        playBeep(1200, 0.3); // Higher pitch for last second
      } else {
        playBeep(800, 0.15);
      }
    }
  }, [state.timeRemaining, state.isRunning, state.isPaused, config.countdownBeeps]);

  // Phase change sounds
  useEffect(() => {
    if (lastPhaseRef.current !== state.phase && state.isRunning) {
      lastPhaseRef.current = state.phase;
      
      switch (state.phase) {
        case 'work':
          playBeep(1000, 0.5);
          break;
        case 'rest':
          playBeep(500, 0.5);
          break;
        case 'set-rest':
          playBeep(700, 0.5);
          break;
        case 'finished':
          playBeep(1500, 0.3);
          setTimeout(() => playBeep(1500, 0.3), 300);
          setTimeout(() => playBeep(1500, 0.3), 600);
          break;
      }
    }
  }, [state.phase, state.isRunning]);
};
