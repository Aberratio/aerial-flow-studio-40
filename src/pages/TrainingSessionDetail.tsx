import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Play, 
  Clock, 
  Music, 
  Target, 
  Zap, 
  Heart, 
  Edit,
  Loader2,
  Star,
  BookOpen
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { TrainingSessionPage } from '@/components/TrainingSessionPage';

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
  created_at: string;
  user_id: string;
  completed?: boolean;
  date_scheduled?: string;
  updated_at?: string;
}

const TrainingSessionDetail = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const { toast } = useToast();
  
  const [session, setSession] = useState<TrainingSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTrainingSession, setShowTrainingSession] = useState(false);

  // Fetch session data from database
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        navigate('/training');
        return;
      }

      try {
        setLoading(true);
        
        // First fetch the basic session data
        const { data: sessionData, error: sessionError } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (sessionError) {
          console.error('Error fetching session:', sessionError);
          throw sessionError;
        }

        if (!sessionData) {
          toast({
            title: "Nie znaleziono sesji",
            description: "Sesja treningowa, której szukasz, nie istnieje.",
            variant: "destructive",
          });
          navigate('/training');
          return;
        }

        // Check if user has access to this session
        if (!sessionData.published && sessionData.user_id !== user?.id && !isAdmin) {
          toast({
            title: "Brak dostępu",
            description: "Ta sesja treningowa nie jest opublikowana lub nie masz do niej dostępu.",
            variant: "destructive",
          });
          navigate('/training');
          return;
        }

        // Process exercises to include figure data with images
        const processExercises = async (exercises: any) => {
          if (!exercises) return [];
          
          // Handle different data types
          let exerciseArray: any[] = [];
          if (Array.isArray(exercises)) {
            exerciseArray = exercises;
          } else if (typeof exercises === 'string') {
            try {
              exerciseArray = JSON.parse(exercises);
            } catch {
              return [];
            }
          } else {
            return [];
          }
          
          const processedExercises = await Promise.all(
            exerciseArray.map(async (exercise) => {
              if (typeof exercise === 'string') {
                return exercise;
              }
              
              if (exercise.figure_id) {
                const { data: figureData } = await supabase
                  .from('figures')
                  .select('id, name, image_url')
                  .eq('id', exercise.figure_id)
                  .single();
                
                return {
                  ...exercise,
                  figure: figureData
                };
              }
              
              return exercise;
            })
          );
          
          return processedExercises;
        };

        // Process all exercise arrays
        const [warmupExercises, figureExercises, stretchingExercises] = await Promise.all([
          processExercises(sessionData.warmup_exercises),
          processExercises(sessionData.figures),
          processExercises(sessionData.stretching_exercises)
        ]);

        setSession({
          ...sessionData,
          warmup_exercises: warmupExercises,
          figures: figureExercises,
          stretching_exercises: stretchingExercises
        });
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Błąd",
          description: "Nie udało się załadować sesji treningowej.",
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

  const handleStartTraining = () => {
    if (session) {
      navigate(`/training/${session.id}/session`);
    }
  };

  const handleEditSession = () => {
    if (session) {
      navigate(`/training/${session.id}/edit`);
    }
  };

  const renderExerciseList = (exercises: any, title: string, icon: React.ReactNode, iconColor: string) => {
    const exerciseArray = Array.isArray(exercises) ? exercises : [];
    if (exerciseArray.length === 0) return null;

    return (
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-white flex items-center">
            <div className={`w-8 h-8 rounded-full ${iconColor} flex items-center justify-center mr-3`}>
              {icon}
            </div>
            {title}
            <Badge variant="outline" className="ml-auto text-white/70 border-white/20">
              {exerciseArray.length} ćwiczeń
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2 sm:gap-3">
            {exerciseArray.map((exercise: any, index: number) => (
              <div key={index} className="flex items-center p-2 sm:p-3 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                  <span className="w-5 h-5 sm:w-6 sm:h-6 bg-white/10 rounded-full flex items-center justify-center text-xs text-white shrink-0">
                    {index + 1}
                  </span>
                  
                  {/* Exercise Image */}
                  {exercise.figure?.image_url && (
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-md overflow-hidden shrink-0">
                      <img
                        src={exercise.figure.image_url}
                        alt={exercise.figure.name || 'Exercise'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-medium text-xs sm:text-sm truncate">
                      {typeof exercise === 'string' ? exercise : exercise.figure?.name || exercise.name || 'Exercise'}
                    </div>
                    {typeof exercise === 'object' && exercise.sets && (
                      <div className="text-xs text-white/60 truncate">
                        {exercise.sets} serie × {exercise.reps} powt.
                        {exercise.hold_time_seconds && exercise.hold_time_seconds > 0 && ` (${exercise.hold_time_seconds}s)`}
                        {(exercise.completion_mode === 'completion' || exercise.hold_time_seconds === 0) && ' (Na wykonania)'}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  if (showTrainingSession && session) {
    return (
      <TrainingSessionPage
        session={session}
        onClose={() => setShowTrainingSession(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Ładowanie sesji treningowej...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const totalExercises = (Array.isArray(session.warmup_exercises) ? session.warmup_exercises.length : 0) + 
                        (Array.isArray(session.figures) ? session.figures.length : 0) + 
                        (Array.isArray(session.stretching_exercises) ? session.stretching_exercises.length : 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 space-y-4 sm:space-y-0">
          <div className="flex items-start space-x-3 sm:space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/training')}
              className="border-white/20 text-white hover:bg-white/10 shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="min-w-0 flex-1">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white break-words">{session.title}</h1>
                <div className="flex items-center space-x-2">
                  <Badge className={`${getDifficultyColor(session.difficulty_level)} text-white text-xs`}>
                    {session.difficulty_level}
                  </Badge>
                  {!session.published && (
                    <Badge className="bg-orange-500/20 text-orange-400 text-xs">
                      Wersja robocza
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-muted-foreground text-sm sm:text-base">{session.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 sm:space-x-3 self-end sm:self-auto">
            {(user?.id === session.user_id || isAdmin) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditSession}
                className="border-white/20 text-white hover:bg-white/10 text-xs sm:text-sm"
              >
                <Edit className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                <span className="hidden sm:inline">Edytuj sesję</span>
                <span className="sm:hidden">Edytuj</span>
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleStartTraining}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 text-xs sm:text-sm"
            >
              <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
              <span className="hidden sm:inline">Rozpocznij trening</span>
              <span className="sm:hidden">Start</span>
            </Button>
          </div>
        </div>

        {/* Session Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="lg:col-span-2">
            {/* Session Image */}
            <div className="relative mb-4 sm:mb-6">
              <img
                src={session.thumbnail_url || "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=800&h=400&fit=crop"}
                alt={session.title}
                className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg" />
              <div className="absolute bottom-3 sm:bottom-4 left-3 sm:left-4 right-3 sm:right-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between text-white space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className="flex items-center">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="text-xs sm:text-sm">{session.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="text-xs sm:text-sm">{totalExercises} ćwiczeń</span>
                    </div>
                  </div>
                  {session.playlist && (
                    <div className="flex items-center">
                      <Music className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                      <span className="text-xs sm:text-sm truncate">{session.playlist}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exercise Sections */}
            <div className="space-y-4 sm:space-y-6">
              {renderExerciseList(
                session.warmup_exercises, 
                "Ćwiczenia rozgrzewkowe", 
                <Zap className="w-4 h-4" />, 
                "bg-yellow-500"
              )}
              
              {renderExerciseList(
                session.figures, 
                "Figury treningowe", 
                <Target className="w-4 h-4" />, 
                "bg-purple-500"
              )}
              
              {renderExerciseList(
                session.stretching_exercises, 
                "Rozciąganie", 
                <Heart className="w-4 h-4" />, 
                "bg-pink-500"
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Quick Stats */}
            <Card className="glass-effect border-white/10">
              <CardHeader className="pb-3 sm:pb-4">
                <CardTitle className="text-white text-lg">Podsumowanie sesji</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground text-sm">Czas trwania</span>
                  </div>
                  <span className="text-white font-medium text-sm">{session.duration_minutes} min</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-muted-foreground text-sm">Łącznie ćwiczeń</span>
                  </div>
                  <span className="text-white font-medium text-sm">{totalExercises}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-muted-foreground text-sm">Trudność</span>
                  </div>
                  <span className="text-white font-medium text-sm">{session.difficulty_level}</span>
                </div>

                {session.playlist && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Music className="w-4 h-4 text-green-400" />
                      <span className="text-muted-foreground text-sm">Playlista</span>
                    </div>
                    <span className="text-white font-medium text-sm truncate max-w-32">{session.playlist}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="glass-effect border-white/10">
              <CardContent className="p-3 sm:p-4 space-y-3">
                <Button
                  onClick={handleStartTraining}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 text-sm sm:text-base"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Rozpocznij sesję treningową
                </Button>
                
                {(user?.id === session.user_id || isAdmin) && (
                  <Button
                    variant="outline"
                    onClick={handleEditSession}
                    className="w-full border-white/20 text-white hover:bg-white/10 text-sm sm:text-base"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edytuj sesję
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/training')}
                  className="w-full border-white/20 text-white hover:bg-white/10 text-sm sm:text-base"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  Browse All Sessions
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingSessionDetail;