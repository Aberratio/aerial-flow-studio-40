import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { X, Pause, Play, SkipForward, Check } from 'lucide-react';
import { useTrainingTimer } from '@/hooks/useTrainingTimer';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface TrainingExercise {
  id: string;
  figure_id: string;
  order_index: number;
  completion_mode: 'time' | 'completion';
  sets: number;
  reps: number;
  hold_time_seconds: number;
  rest_time_seconds: number;
  target_completions: number | null;
  notes: string | null;
  figures: {
    name: string;
    image_url: string | null;
  };
}

type Phase = 'hold' | 'rest' | 'completed';

const TrainingLibrarySession = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [exercises, setExercises] = useState<TrainingExercise[]>([]);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [phase, setPhase] = useState<Phase>('hold');
  const [completionCount, setCompletionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const currentExercise = exercises[currentExerciseIndex];
  const isTimeMode = currentExercise?.completion_mode === 'time';
  const isCompletionMode = currentExercise?.completion_mode === 'completion';

  const initialTime =
    phase === 'hold'
      ? currentExercise?.hold_time_seconds || 30
      : currentExercise?.rest_time_seconds || 30;

  const { timeRemaining, isRunning, start, pause, skip } = useTrainingTimer({
    initialSeconds: initialTime,
    onComplete: handleTimerComplete,
    autoStart: true,
  });

  useEffect(() => {
    if (id) {
      fetchExercises();
    }
  }, [id]);

  async function fetchExercises() {
    try {
      const { data, error } = await supabase
        .from('training_library_exercises')
        .select(`
          *,
          figures (
            name,
            image_url
          )
        `)
        .eq('training_id', id)
        .order('order_index');

      if (error) throw error;
      setExercises((data || []) as TrainingExercise[]);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast.error('Nie udało się załadować ćwiczeń');
      navigate('/training/library');
    } finally {
      setIsLoading(false);
    }
  }

  function handleTimerComplete() {
    if (phase === 'hold') {
      // Play sound here (optional)
      if (currentRep < currentExercise.reps) {
        setPhase('rest');
      } else if (currentSet < currentExercise.sets) {
        setCurrentSet((prev) => prev + 1);
        setCurrentRep(1);
        setPhase('rest');
      } else {
        moveToNextExercise();
      }
    } else if (phase === 'rest') {
      if (currentRep < currentExercise.reps) {
        setCurrentRep((prev) => prev + 1);
        setPhase('hold');
      } else {
        setPhase('hold');
      }
    }
  }

  function handleCompletionDone() {
    const newCount = completionCount + 1;
    setCompletionCount(newCount);

    if (newCount >= (currentExercise.target_completions || 1)) {
      moveToNextExercise();
    }
  }

  function moveToNextExercise() {
    if (currentExerciseIndex < exercises.length - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
      setCurrentSet(1);
      setCurrentRep(1);
      setCompletionCount(0);
      setPhase('hold');
    } else {
      completeTraining();
    }
  }

  async function completeTraining() {
    setPhase('completed');
    if (user) {
      try {
        await supabase
          .from('user_training_progress')
          .upsert({
            user_id: user.id,
            training_id: id!,
            status: 'completed',
            completed_at: new Date().toISOString(),
          });
        
        toast.success('🎉 Gratulacje! Ukończyłeś trening!');
      } catch (error) {
        console.error('Error saving progress:', error);
      }
    }
  }

  const handleExit = () => {
    if (confirm('Czy na pewno chcesz zakończyć trening?')) {
      navigate('/training/library');
    }
  };

  const overallProgress = exercises.length > 0
    ? ((currentExerciseIndex / exercises.length) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-purple-950/10 flex items-center justify-center">
        <div className="text-xl text-foreground">Ładowanie...</div>
      </div>
    );
  }

  if (phase === 'completed') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-purple-950/10 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🎉</div>
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Gratulacje!
          </h1>
          <p className="text-muted-foreground mb-8">
            Ukończyłeś wszystkie ćwiczenia
          </p>
          <div className="space-y-3">
            <Button
              onClick={() => navigate(`/training/library/${id}`)}
              variant="outline"
              className="w-full"
            >
              Powrót do szczegółów
            </Button>
            <Button
              onClick={() => navigate('/training/library')}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600"
            >
              🏠 Biblioteka treningów
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentExercise) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-purple-950/10">
      {/* Header */}
      <div className="bg-background-elevated border-b border-white/10 p-4">
        <div className="container mx-auto max-w-2xl flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={handleExit}>
            <X className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <div className="font-semibold text-foreground">
              {currentExercise.figures.name}
            </div>
            <div className="text-sm text-muted-foreground">
              {currentExerciseIndex + 1} / {exercises.length}
            </div>
          </div>
          <div className="w-10" />
        </div>
        <Progress value={overallProgress} className="mt-4" />
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-2xl p-4 space-y-6">
        {/* Exercise Image */}
        <div className="aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10">
          {currentExercise.figures.image_url && (
            <img
              src={currentExercise.figures.image_url}
              alt={currentExercise.figures.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Timer / Completion Mode */}
        {isTimeMode && (
          <div className="text-center space-y-4">
            <div className="text-7xl font-bold text-foreground">
              {Math.floor(timeRemaining / 60)}:{(timeRemaining % 60).toString().padStart(2, '0')}
            </div>
            <div className="text-xl text-muted-foreground">
              {phase === 'hold' ? `⏱ ${currentExercise.hold_time_seconds} sekund` : '🧘 Odpoczynek'}
            </div>
            <Progress value={(timeRemaining / initialTime) * 100} className="h-2" />
            <div className="text-lg text-muted-foreground">
              Set {currentSet} z {currentExercise.sets} | Rep {currentRep} z {currentExercise.reps}
            </div>
          </div>
        )}

        {isCompletionMode && (
          <div className="text-center space-y-4">
            <div className="text-4xl font-bold text-foreground">
              ✅ ZALICZ {currentExercise.target_completions} RAZY
            </div>
            <div className="text-3xl text-muted-foreground">
              {completionCount} / {currentExercise.target_completions}
            </div>
            <Progress
              value={(completionCount / (currentExercise.target_completions || 1)) * 100}
              className="h-3"
            />
          </div>
        )}

        {/* Notes */}
        {currentExercise.notes && (
          <div className="p-4 rounded-lg bg-background-elevated border border-white/10">
            <div className="text-sm text-muted-foreground">📝 {currentExercise.notes}</div>
          </div>
        )}

        {/* Controls */}
        <div className="flex gap-3">
          {isTimeMode && (
            <>
              <Button
                variant="outline"
                size="lg"
                className="flex-1"
                onClick={isRunning ? pause : start}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </Button>
              <Button variant="outline" size="lg" className="flex-1" onClick={skip}>
                <SkipForward className="w-5 h-5 mr-2" />
                Pomiń
              </Button>
            </>
          )}

          {isCompletionMode && (
            <>
              <Button
                size="lg"
                className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                onClick={handleCompletionDone}
              >
                <Check className="w-5 h-5 mr-2" />
                GOTOWE
              </Button>
              <Button variant="outline" size="lg" onClick={moveToNextExercise}>
                <SkipForward className="w-5 h-5" />
              </Button>
            </>
          )}
        </div>

        {/* Next Exercise Preview */}
        {currentExerciseIndex < exercises.length - 1 && (
          <div className="text-center text-sm text-muted-foreground">
            ⏭️ Następne: {exercises[currentExerciseIndex + 1].figures.name}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingLibrarySession;
