import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useTrainingTimer } from '@/hooks/useTrainingTimer';
import { useWakeLock } from '@/hooks/useWakeLock';
import { RestScreen } from '@/components/RestScreen';
import { ArrowLeft, Play, Pause, SkipForward, Check } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface TrainingExercise {
  id: string;
  figure_id: string;
  order_index: number;
  completion_mode: 'time' | 'completion';
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  notes?: string;
  figures: {
    id: string;
    name: string;
    description?: string;
    image_url?: string;
  };
}

type Phase = 'hold' | 'rest' | 'completed';

export default function TrainingLibrarySession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { requestWakeLock, releaseWakeLock } = useWakeLock();

  // Training data
  const [training, setTraining] = useState<any>(null);
  const [exercises, setExercises] = useState<TrainingExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Session state
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [currentRep, setCurrentRep] = useState(1);
  const [phase, setPhase] = useState<Phase>('hold');
  const [completionCount, setCompletionCount] = useState(0);
  const [showRestScreen, setShowRestScreen] = useState(false);

  // VIDEO type states
  const [videoCompleted, setVideoCompleted] = useState(false);

  // Auto-save ref
  const autoSaveInterval = useRef<NodeJS.Timeout>();

  const currentExercise = exercises[currentExerciseIndex];
  const isTimeMode = currentExercise?.completion_mode === 'time';

  // Calculate timer duration
  const getTimerDuration = () => {
    if (!currentExercise || !isTimeMode) return 0;
    
    if (phase === 'hold') {
      return currentExercise.hold_time_seconds || 30;
    } else if (phase === 'rest') {
      return currentExercise.rest_time_seconds || 10;
    }
    return 0;
  };

  const { timeRemaining, isRunning, start, pause, skip } = useTrainingTimer({
    initialSeconds: getTimerDuration(),
    onComplete: handleTimerComplete,
    autoStart: true,
  });

  useEffect(() => {
    fetchTrainingData();
    requestWakeLock();

    return () => {
      releaseWakeLock();
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, []);

  // Auto-save progress every 30 seconds
  useEffect(() => {
    if (!user || !id) return;

    autoSaveInterval.current = setInterval(() => {
      saveProgress('in_progress');
    }, 30000);

    return () => {
      if (autoSaveInterval.current) {
        clearInterval(autoSaveInterval.current);
      }
    };
  }, [user, id, currentExerciseIndex, currentSet, currentRep, completionCount]);

  async function fetchTrainingData() {
    try {
      const { data: trainingData, error: trainingError } = await supabase
        .from('training_library')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (trainingError) throw trainingError;
      if (!trainingData) {
        toast({
          title: "Błąd",
          description: "Nie znaleziono treningu",
          variant: "destructive",
        });
        navigate('/training/library');
        return;
      }

      setTraining(trainingData);

      // Fetch exercises only for figure_set type
      if (trainingData.training_type === 'figure_set') {
        const { data: exercisesData, error: exercisesError } = await supabase
          .from('training_library_exercises')
          .select(`
            *,
            figures (
              id,
              name,
              description,
              image_url
            )
          `)
          .eq('training_id', id)
          .order('order_index');

        if (exercisesError) throw exercisesError;
        setExercises((exercisesData || []) as TrainingExercise[]);
      }
    } catch (error) {
      console.error('Error fetching training:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować treningu",
        variant: "destructive",
      });
      navigate('/training/library');
    } finally {
      setIsLoading(false);
    }
  }

  function handleTimerComplete() {
    playBeep();

    if (phase === 'hold') {
      setPhase('rest');
    } else if (phase === 'rest') {
      // After rest, check if we need next rep or set
      if (currentRep < (currentExercise.reps || 1)) {
        setCurrentRep(prev => prev + 1);
        setPhase('hold');
      } else if (currentSet < (currentExercise.sets || 1)) {
        setCurrentSet(prev => prev + 1);
        setCurrentRep(1);
        setPhase('hold');
      } else {
        // Exercise complete, move to next
        moveToNextExercise();
      }
    }
  }

  function playBeep() {
    try {
      const audioCtx = new AudioContext();
      const oscillator = audioCtx.createOscillator();
      oscillator.connect(audioCtx.destination);
      oscillator.frequency.value = 800;
      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.2);
    } catch (error) {
      console.warn('Audio not supported:', error);
    }
  }

  function handleCompletionDone() {
    const targetCompletions = currentExercise.reps || 1;
    const newCount = completionCount + 1;
    setCompletionCount(newCount);

    if (newCount >= targetCompletions) {
      moveToNextExercise();
    }
  }

  function moveToNextExercise() {
    if (currentExerciseIndex < exercises.length - 1) {
      // Show rest screen before next exercise
      setShowRestScreen(true);
    } else {
      completeTraining();
    }
  }

  function handleRestComplete() {
    setShowRestScreen(false);
    setCurrentExerciseIndex(prev => prev + 1);
    setCurrentSet(1);
    setCurrentRep(1);
    setPhase('hold');
    setCompletionCount(0);
  }

  async function saveProgress(status: 'in_progress' | 'completed') {
    if (!user || !id) return;

    try {
      await supabase
        .from('user_training_progress')
        .upsert({
          user_id: user.id,
          training_id: id,
          status,
          current_exercise_index: currentExerciseIndex,
          completed_exercises: JSON.stringify({
            index: currentExerciseIndex,
            set: currentSet,
            rep: currentRep,
            completionCount,
          }),
          last_activity_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error saving progress:', error);
    }
  }

  async function completeTraining() {
    await saveProgress('completed');

    // Increment completions count
    if (training) {
      await supabase
        .from('training_library')
        .update({ completions_count: (training.completions_count || 0) + 1 })
        .eq('id', id);
    }

    toast({
      title: "Gratulacje!",
      description: "Ukończyłeś trening!",
    });

    navigate('/training/library');
  }

  const calculateOverallProgress = () => {
    if (!exercises.length) return 0;
    const totalExercises = exercises.length;
    const completedExercises = currentExerciseIndex;
    
    let currentProgress = 0;
    if (currentExercise && isTimeMode) {
      const totalSets = currentExercise.sets || 1;
      currentProgress = ((currentSet - 1) + (currentRep / (currentExercise.reps || 1))) / totalSets;
    }
    
    return ((completedExercises + currentProgress) / totalExercises) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-xl text-muted-foreground">Ładowanie treningu...</p>
      </div>
    );
  }

  // VIDEO type rendering
  if (training?.training_type === 'video') {
    return (
      <div className="min-h-screen p-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/training/library/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Powrót
        </Button>

        <Card className="max-w-4xl mx-auto glass-effect p-6 space-y-6">
          <h1 className="text-2xl font-bold gradient-text">{training.title}</h1>
          
          {training.video_url && (
            <div className="aspect-video bg-black rounded-lg overflow-hidden">
              <video
                src={training.video_url}
                controls
                className="w-full h-full"
                onEnded={() => setVideoCompleted(true)}
              />
            </div>
          )}

          <div className="flex gap-3">
            <Button
              onClick={completeTraining}
              disabled={!videoCompleted}
              className="flex-1"
              size="lg"
            >
              <Check className="w-5 h-5 mr-2" />
              {videoCompleted ? 'Zakończ trening' : 'Obejrzyj do końca'}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // COMPLEX type - simplified: just redirect to sub-trainings
  if (training?.training_type === 'complex') {
    return (
      <div className="min-h-screen p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <Button
            variant="ghost"
            onClick={() => navigate(`/training/library/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>

          <Card className="glass-effect p-8 text-center">
            <h1 className="text-3xl font-bold gradient-text mb-4">{training.title}</h1>
            <p className="text-muted-foreground mb-6">
              Trening kompleksowy - wróć do szczegółów treningu aby zobaczyć wszystkie części.
            </p>
            <Button onClick={() => navigate(`/training/library/${id}`)}>
              Zobacz szczegóły
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // Rest screen between exercises
  if (showRestScreen && exercises[currentExerciseIndex + 1]) {
    const nextExercise = exercises[currentExerciseIndex + 1];
    return (
      <RestScreen
        restSeconds={currentExercise?.rest_time_seconds || 30}
        nextExerciseName={nextExercise.figures.name}
        nextExerciseImage={nextExercise.figures.image_url}
        onComplete={handleRestComplete}
        onSkip={handleRestComplete}
      />
    );
  }

  // FIGURE_SET type - main training session
  if (!currentExercise) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold gradient-text mb-4">Gratulacje!</h2>
          <p className="text-muted-foreground mb-6">Ukończyłeś wszystkie ćwiczenia!</p>
          <Button onClick={completeTraining} size="lg">
            <Check className="w-5 h-5 mr-2" />
            Zakończ trening
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            onClick={() => navigate(`/training/library/${id}`)}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Powrót
          </Button>
          <Badge variant="outline">
            Ćwiczenie {currentExerciseIndex + 1}/{exercises.length}
          </Badge>
        </div>

        {/* Overall Progress */}
        <Card className="glass-effect p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Postęp całkowity</span>
              <span className="font-semibold">{Math.round(calculateOverallProgress())}%</span>
            </div>
            <Progress value={calculateOverallProgress()} className="h-2" />
          </div>
        </Card>

        {/* Exercise Info */}
        <Card className="glass-effect p-6 space-y-6">
          {currentExercise.figures.image_url && (
            <div className="aspect-video rounded-lg overflow-hidden bg-muted">
              <img
                src={currentExercise.figures.image_url}
                alt={currentExercise.figures.name}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold gradient-text">{currentExercise.figures.name}</h2>
            {currentExercise.figures.description && (
              <p className="text-muted-foreground">{currentExercise.figures.description}</p>
            )}
          </div>

          {/* Time Mode Display */}
          {isTimeMode && (
            <div className="text-center space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">
                  Seria {currentSet}/{currentExercise.sets} • Powtórzenie {currentRep}/{currentExercise.reps}
                </div>
                <Badge variant={phase === 'hold' ? 'default' : 'secondary'} className="text-lg px-4 py-2">
                  {phase === 'hold' ? '⏱️ Przytrzymaj' : '😮‍💨 Odpoczynek'}
                </Badge>
              </div>

              <div className="text-8xl font-bold text-primary tabular-nums">
                {timeRemaining}s
              </div>

              <Progress 
                value={((getTimerDuration() - timeRemaining) / getTimerDuration()) * 100} 
                className="h-3"
              />
            </div>
          )}

          {/* Completion Mode Display */}
          {!isTimeMode && (
            <div className="text-center space-y-6">
              <div className="text-6xl font-bold text-primary">
                {completionCount}/{currentExercise.reps || 1}
              </div>
              <p className="text-xl text-muted-foreground">wykonań ukończonych</p>
            </div>
          )}

          {/* Notes */}
          {currentExercise.notes && (
            <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
              <p className="text-sm text-muted-foreground italic">{currentExercise.notes}</p>
            </div>
          )}

          {/* Controls */}
          <div className="flex gap-3">
            {isTimeMode ? (
              <>
                <Button
                  variant="outline"
                  onClick={isRunning ? pause : start}
                  className="flex-1"
                  size="lg"
                >
                  {isRunning ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                  {isRunning ? 'Pauza' : 'Start'}
                </Button>
                <Button
                  variant="outline"
                  onClick={skip}
                  size="lg"
                >
                  <SkipForward className="w-5 h-5" />
                </Button>
              </>
            ) : (
              <Button
                onClick={handleCompletionDone}
                className="flex-1"
                size="lg"
              >
                <Check className="w-5 h-5 mr-2" />
                Zrobione
              </Button>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
