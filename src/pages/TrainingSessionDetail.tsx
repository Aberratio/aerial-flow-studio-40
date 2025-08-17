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
              {exerciseArray.length} exercises
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exerciseArray.map((exercise: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center">
                  <span className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center text-xs text-white mr-3">
                    {index + 1}
                  </span>
                  <span className="text-white font-medium">
                    {typeof exercise === 'string' ? exercise : exercise.name}
                  </span>
                </div>
                {typeof exercise === 'object' && (
                  <div className="flex items-center space-x-4 text-xs text-white/60">
                    <span>{exercise.sets} sets</span>
                    <span>{exercise.reps} reps</span>
                    <span>{exercise.hold_time_seconds}s hold</span>
                  </div>
                )}
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
          <p className="text-muted-foreground">Loading training session...</p>
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
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/training')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold text-white">{session.title}</h1>
                <Badge className={`${getDifficultyColor(session.difficulty_level)} text-white`}>
                  {session.difficulty_level}
                </Badge>
                {!session.published && (
                  <Badge className="bg-orange-500/20 text-orange-400">
                    Draft
                  </Badge>
                )}
              </div>
              <p className="text-muted-foreground">{session.description}</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {(user?.id === session.user_id || isAdmin) && (
              <Button
                variant="outline"
                onClick={handleEditSession}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Session
              </Button>
            )}
            <Button
              onClick={handleStartTraining}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Training
            </Button>
          </div>
        </div>

        {/* Session Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            {/* Session Image */}
            <div className="relative mb-6">
              <img
                src={session.thumbnail_url || "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=800&h=400&fit=crop"}
                alt={session.title}
                className="w-full h-64 object-cover rounded-lg"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent rounded-lg" />
              <div className="absolute bottom-4 left-4 right-4">
                <div className="flex items-center justify-between text-white">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      <span className="text-sm">{session.duration_minutes} min</span>
                    </div>
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      <span className="text-sm">{totalExercises} exercises</span>
                    </div>
                  </div>
                  {session.playlist && (
                    <div className="flex items-center">
                      <Music className="w-4 h-4 mr-1" />
                      <span className="text-sm">{session.playlist}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Exercise Sections */}
            <div className="space-y-6">
              {renderExerciseList(
                session.warmup_exercises, 
                "Warm-up Exercises", 
                <Zap className="w-4 h-4" />, 
                "bg-yellow-500"
              )}
              
              {renderExerciseList(
                session.figures, 
                "Training Figures", 
                <Target className="w-4 h-4" />, 
                "bg-purple-500"
              )}
              
              {renderExerciseList(
                session.stretching_exercises, 
                "Stretching Exercises", 
                <Heart className="w-4 h-4" />, 
                "bg-pink-500"
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Session Overview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground">Duration</span>
                  </div>
                  <span className="text-white font-medium">{session.duration_minutes} min</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-muted-foreground">Total Exercises</span>
                  </div>
                  <span className="text-white font-medium">{totalExercises}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Star className="w-4 h-4 text-yellow-400" />
                    <span className="text-muted-foreground">Difficulty</span>
                  </div>
                  <span className="text-white font-medium">{session.difficulty_level}</span>
                </div>

                {session.playlist && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Music className="w-4 h-4 text-green-400" />
                      <span className="text-muted-foreground">Playlist</span>
                    </div>
                    <span className="text-white font-medium text-sm">{session.playlist}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="glass-effect border-white/10">
              <CardContent className="p-4 space-y-3">
                <Button
                  onClick={handleStartTraining}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Training Session
                </Button>
                
                {(user?.id === session.user_id || isAdmin) && (
                  <Button
                    variant="outline"
                    onClick={handleEditSession}
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Session
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  onClick={() => navigate('/training')}
                  className="w-full border-white/20 text-white hover:bg-white/10"
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