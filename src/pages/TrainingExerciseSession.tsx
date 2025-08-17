import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Clock, 
  Target, 
  Zap, 
  Heart,
  Loader2,
  CheckCircle,
  Circle,
  Timer,
  Hand
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrainingSession {
  id: string;
  title: string;
  description: string;
  duration_minutes: number;
  difficulty_level: string;
  playlist: string;
  thumbnail_url: string;
  published: boolean;
  warmup_exercises: any;
  figures: any;
  stretching_exercises: any;
  type: string;
  created_at: string;
  user_id: string;
}

interface Exercise {
  id?: string;
  name: string;
  reps?: number;
  sets?: number;
  hold_time_seconds?: number;
  notes?: string;
  order_index?: number;
}

const TrainingExerciseSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentSection, setCurrentSection] = useState<'warmup' | 'figures' | 'stretching'>('warmup');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());

  // Fetch session data from database
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        navigate('/training');
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) {
          console.error('Error fetching session:', error);
          throw error;
        }

        if (!data) {
          toast({
            title: "Session Not Found",
            description: "The training session you're looking for doesn't exist.",
            variant: "destructive",
          });
          navigate('/training');
          return;
        }

        // Check if user has access to this session
        if (!data.published && data.user_id !== user?.id && !isAdmin) {
          toast({
            title: "Access Denied",
            description: "This training session is not published or you don't have access to it.",
            variant: "destructive",
          });
          navigate('/training');
          return;
        }

        setSession({
          ...data,
          warmup_exercises: data.warmup_exercises || [],
          figures: data.figures || [],
          stretching_exercises: data.stretching_exercises || []
        });
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Error",
          description: "Failed to load training session.",
          variant: "destructive",
        });
        navigate('/training');
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [sessionId, user?.id, isAdmin, navigate, toast]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getSectionExercises = (): Exercise[] => {
    if (!session) return [];
    
    switch (currentSection) {
      case 'warmup':
        return Array.isArray(session.warmup_exercises) ? session.warmup_exercises : [];
      case 'figures':
        return Array.isArray(session.figures) ? session.figures : [];
      case 'stretching':
        return Array.isArray(session.stretching_exercises) ? session.stretching_exercises : [];
      default:
        return [];
    }
  };

  const getSectionIcon = () => {
    switch (currentSection) {
      case 'warmup':
        return <Zap className="w-5 h-5" />;
      case 'figures':
        return <Target className="w-5 h-5" />;
      case 'stretching':
        return <Heart className="w-5 h-5" />;
      default:
        return <Target className="w-5 h-5" />;
    }
  };

  const getSectionColor = () => {
    switch (currentSection) {
      case 'warmup':
        return 'bg-yellow-500';
      case 'figures':
        return 'bg-purple-500';
      case 'stretching':
        return 'bg-pink-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSectionTitle = () => {
    switch (currentSection) {
      case 'warmup':
        return 'Warm-up Exercises';
      case 'figures':
        return 'Training Figures';
      case 'stretching':
        return 'Stretching Exercises';
      default:
        return '';
    }
  };

  const handleExerciseComplete = (exerciseKey: string) => {
    setCompletedExercises(prev => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseKey)) {
        newSet.delete(exerciseKey);
      } else {
        newSet.add(exerciseKey);
      }
      return newSet;
    });
  };

  const moveToNextSection = () => {
    if (currentSection === 'warmup') {
      setCurrentSection('figures');
      setCurrentExerciseIndex(0);
    } else if (currentSection === 'figures') {
      setCurrentSection('stretching');
      setCurrentExerciseIndex(0);
    }
  };

  const moveToPreviousSection = () => {
    if (currentSection === 'stretching') {
      setCurrentSection('figures');
      setCurrentExerciseIndex(0);
    } else if (currentSection === 'figures') {
      setCurrentSection('warmup');
      setCurrentExerciseIndex(0);
    }
  };

  const handleFinishSession = () => {
    toast({
      title: "Training Complete!",
      description: "Great job! You've completed your training session.",
    });
    navigate(`/training/${sessionId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading training session...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const currentExercises = getSectionExercises();
  const currentExercise = currentExercises[currentExerciseIndex];
  const isLastSection = currentSection === 'stretching';
  const isLastExercise = currentExerciseIndex === currentExercises.length - 1;
  const canMoveNext = currentExerciseIndex < currentExercises.length - 1;
  const canMovePrevious = currentExerciseIndex > 0 || currentSection !== 'warmup';

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate(`/training/${sessionId}`)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-2xl font-bold text-white">{session.title}</h1>
                <Badge className={`${getDifficultyColor(session.difficulty_level)} text-white`}>
                  {session.difficulty_level}
                </Badge>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  {session.type === 'timer' ? (
                    <><Timer className="w-3 h-3 mr-1" />Timer Mode</>
                  ) : (
                    <><Hand className="w-3 h-3 mr-1" />Manual Mode</>
                  )}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Section Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-center space-x-8">
            {(['warmup', 'figures', 'stretching'] as const).map((section) => (
              <div key={section} className="flex items-center space-x-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  currentSection === section 
                    ? getSectionColor() 
                    : completedExercises.size > 0 && section === 'warmup' 
                      ? 'bg-green-500' 
                      : 'bg-white/10'
                }`}>
                  {section === 'warmup' && <Zap className="w-4 h-4" />}
                  {section === 'figures' && <Target className="w-4 h-4" />}
                  {section === 'stretching' && <Heart className="w-4 h-4" />}
                </div>
                <span className={`font-medium capitalize ${
                  currentSection === section ? 'text-white' : 'text-white/60'
                }`}>
                  {section === 'warmup' ? 'Warm-up' : section === 'figures' ? 'Training' : 'Stretching'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current Exercise */}
        {currentExercise && (
          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${getSectionColor()} flex items-center justify-center mr-3`}>
                    {getSectionIcon()}
                  </div>
                  {getSectionTitle()}
                </div>
                <Badge variant="outline" className="border-white/20 text-white/70">
                  {currentExerciseIndex + 1} of {currentExercises.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center space-y-6">
                <h2 className="text-3xl font-bold text-white">
                  {typeof currentExercise === 'string' ? currentExercise : currentExercise.name}
                </h2>
                
                {typeof currentExercise === 'object' && (
                  <div className="flex justify-center space-x-8 text-white/80">
                    {currentExercise.sets && (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentExercise.sets}</div>
                        <div className="text-sm">Sets</div>
                      </div>
                    )}
                    {currentExercise.reps && (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentExercise.reps}</div>
                        <div className="text-sm">Reps</div>
                      </div>
                    )}
                    {currentExercise.hold_time_seconds && (
                      <div className="text-center">
                        <div className="text-2xl font-bold">{currentExercise.hold_time_seconds}s</div>
                        <div className="text-sm">Hold</div>
                      </div>
                    )}
                  </div>
                )}
                
                {typeof currentExercise === 'object' && currentExercise.notes && (
                  <p className="text-white/70 italic">{currentExercise.notes}</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Exercise List */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Exercise Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {currentExercises.map((exercise, index) => {
                const exerciseKey = `${currentSection}-${index}`;
                const isCompleted = completedExercises.has(exerciseKey);
                const isCurrent = index === currentExerciseIndex;
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                      isCurrent 
                        ? 'bg-white/20 border-l-4 border-primary' 
                        : isCompleted 
                          ? 'bg-green-500/20' 
                          : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => setCurrentExerciseIndex(index)}
                  >
                    <div className="flex items-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExerciseComplete(exerciseKey);
                        }}
                        className="mr-3"
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-white/40" />
                        )}
                      </button>
                      <span className={`font-medium ${
                        isCurrent ? 'text-white' : isCompleted ? 'text-green-400' : 'text-white/70'
                      }`}>
                        {typeof exercise === 'string' ? exercise : exercise.name}
                      </span>
                    </div>
                    {typeof exercise === 'object' && (
                      <div className="flex items-center space-x-4 text-xs text-white/60">
                        {exercise.sets && <span>{exercise.sets} sets</span>}
                        {exercise.reps && <span>{exercise.reps} reps</span>}
                        {exercise.hold_time_seconds && <span>{exercise.hold_time_seconds}s</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => {
              if (canMovePrevious) {
                if (currentExerciseIndex > 0) {
                  setCurrentExerciseIndex(currentExerciseIndex - 1);
                } else {
                  moveToPreviousSection();
                }
              }
            }}
            disabled={!canMovePrevious}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex items-center space-x-4">
            {currentExercises.length > 0 && (
              <span className="text-white/60 text-sm">
                Exercise {currentExerciseIndex + 1} of {currentExercises.length}
              </span>
            )}
          </div>

          {isLastSection && isLastExercise ? (
            <Button
              onClick={handleFinishSession}
              className="bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:from-green-600 hover:to-emerald-600"
            >
              Finish Session
              <CheckCircle className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => {
                if (canMoveNext) {
                  setCurrentExerciseIndex(currentExerciseIndex + 1);
                } else {
                  moveToNextSection();
                }
              }}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              Next
              <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingExerciseSession;