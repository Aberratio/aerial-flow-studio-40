import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { ArrowLeft, Settings } from 'lucide-react';
import { TimerDisplay } from '@/components/WorkoutTimer/TimerDisplay';
import { TimerControls } from '@/components/WorkoutTimer/TimerControls';
import { TimerProgress } from '@/components/WorkoutTimer/TimerProgress';
import { TimerPresets } from '@/components/WorkoutTimer/TimerPresets';
import { TimerConfiguration } from '@/components/WorkoutTimer/TimerConfiguration';
import { useWorkoutTimer } from '@/hooks/useWorkoutTimer';
import { useTimerAudio } from '@/hooks/useTimerAudio';
import { useWakeLock } from '@/hooks/useWakeLock';
import { DEFAULT_CONFIG, type TimerConfig } from '@/types/timer';

const WorkoutTimer = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<TimerConfig>(() => {
    const saved = localStorage.getItem('workout-timer-config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });
  const [showConfig, setShowConfig] = useState(false);

  const { state, start, pause, resume, reset, skip } = useWorkoutTimer(config);
  useTimerAudio(config, state);
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  // Manage wake lock based on timer state
  useEffect(() => {
    if (state.isRunning && !state.isPaused) {
      requestWakeLock();
    } else {
      releaseWakeLock();
    }
  }, [state.isRunning, state.isPaused, requestWakeLock, releaseWakeLock]);

  // Save config on change
  useEffect(() => {
    localStorage.setItem('workout-timer-config', JSON.stringify(config));
  }, [config]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (!state.isRunning || state.isPaused) {
          state.isRunning && state.isPaused ? resume() : start();
        } else {
          pause();
        }
      } else if (e.code === 'KeyR') {
        reset();
      } else if (e.code === 'KeyS') {
        skip();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [state, start, pause, resume, reset, skip]);

  const handleSaveConfig = (newConfig: TimerConfig) => {
    setConfig(newConfig);
    setShowConfig(false);
    if (state.isRunning) {
      reset();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 p-4 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6 sm:mb-8">
          <Button variant="ghost" onClick={() => navigate('/training')} className="hover:bg-white/10">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Wróć do treningów
          </Button>
          <Button 
            variant="ghost" 
            onClick={() => setShowConfig(true)}
            className="hover:bg-white/10"
            disabled={state.isRunning && !state.isPaused}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Main Timer Display */}
        <TimerDisplay state={state} config={config} />

        {/* Controls */}
        <TimerControls
          state={state}
          onStart={start}
          onPause={pause}
          onResume={resume}
          onReset={reset}
          onSkip={skip}
        />

        {/* Progress */}
        {state.phase !== 'prepare' && (
          <TimerProgress state={state} config={config} />
        )}

        {/* Quick Presets (only when not running) */}
        {!state.isRunning && (
          <TimerPresets onSelectPreset={setConfig} />
        )}

        {/* Keyboard Shortcuts Help */}
        {!state.isRunning && (
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <p>Skróty klawiszowe: <kbd className="px-2 py-1 bg-muted rounded">Spacja</kbd> Start/Pauza • <kbd className="px-2 py-1 bg-muted rounded">R</kbd> Reset • <kbd className="px-2 py-1 bg-muted rounded">S</kbd> Skip</p>
          </div>
        )}

        {/* Configuration Sheet */}
        <Sheet open={showConfig} onOpenChange={setShowConfig}>
          <SheetContent className="overflow-y-auto">
            <TimerConfiguration config={config} onSave={handleSaveConfig} />
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
};

export default WorkoutTimer;
