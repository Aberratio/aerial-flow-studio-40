import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Trophy, CheckCircle, Star, Volume2, VolumeX, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';

interface Exercise {
  id: string;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  video_url?: string;
  audio_url?: string;
  notes?: string;
  figure: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
    instructions?: string;
    image_url?: string;
  };
}

interface TrainingDay {
  id: string;
  day_date: string;
  title: string;
  description: string;
  exercises: Exercise[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
}

const ChallengeDayOverview = () => {
  const { challengeId, dayId } = useParams();
  const navigate = useNavigate();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [trainingDay, setTrainingDay] = useState<TrainingDay | null>(null);
  const [dayNumber, setDayNumber] = useState<number>(0);
  const [totalDays, setTotalDays] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { canCreateChallenges } = useUserRole();

  useEffect(() => {
    if (challengeId && dayId) {
      fetchChallengeAndDay();
    }
  }, [challengeId, dayId]);

  const fetchChallengeAndDay = async () => {
    try {
      setIsLoading(true);

      // Fetch challenge details
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select('*')
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;
      setChallenge(challengeData);

      // Fetch all training days for this challenge to determine day number
      const { data: allDays, error: allDaysError } = await supabase
        .from('challenge_training_days')
        .select('id, day_date')
        .eq('challenge_id', challengeId)
        .order('day_date');

      if (allDaysError) throw allDaysError;
      
      setTotalDays(allDays?.length || 0);
      const currentDayIndex = allDays?.findIndex(day => day.id === dayId) || 0;
      setDayNumber(currentDayIndex + 1);

      // Fetch specific training day with exercises
      const { data: dayData, error: dayError } = await supabase
        .from('challenge_training_days')
        .select(`
          *,
          training_day_exercises (
            *,
            figure:figures (
              id, name, difficulty_level, category, instructions, image_url
            )
          )
        `)
        .eq('id', dayId)
        .single();

      if (dayError) throw dayError;

      setTrainingDay({
        ...dayData,
        exercises: dayData.training_day_exercises?.map((ex: any) => ({
          id: ex.id,
          sets: ex.sets,
          reps: ex.reps,
          hold_time_seconds: ex.hold_time_seconds,
          rest_time_seconds: ex.rest_time_seconds,
          video_url: ex.video_url,
          audio_url: ex.audio_url,
          notes: ex.notes,
          figure: ex.figure
        })) || []
      });

    } catch (error) {
      console.error('Error fetching challenge day:', error);
      navigate('/challenges');
    } finally {
      setIsLoading(false);
    }
  };

  const getExerciseIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'warmup': return '🔥';
      case 'strength': return '💪';
      case 'flexibility': return '🤸';
      case 'flow': return '💫';
      case 'cooldown': return '🌿';
      default: return '📋';
    }
  };

  const getExerciseColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-400';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleStartDay = () => {
    if (!trainingDay || !challenge) return;
    
    navigate('/training-session', { 
      state: { 
        type: 'challenge-day',
        challengeId,
        dayId,
        exercises: trainingDay.exercises,
        title: trainingDay.title,
        challengeTitle: challenge.title
      }
    });
  };

  const canEditChallenge = () => {
    return canCreateChallenges && challenge && (
      user?.id === challenge.created_by || 
      user?.role === 'admin'
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading challenge day...</div>
      </div>
    );
  }

  if (!challenge || !trainingDay) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl mb-4">Challenge day not found</h2>
          <Button onClick={() => navigate('/challenges')} variant="outline">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const calculateDuration = () => {
    if (!trainingDay.exercises.length) return 'No duration set';
    
    let totalMinutes = 0;
    trainingDay.exercises.forEach(exercise => {
      if (exercise.sets && exercise.hold_time_seconds) {
        totalMinutes += (exercise.sets * exercise.hold_time_seconds) / 60;
      }
      if (exercise.rest_time_seconds && exercise.sets && exercise.sets > 1) {
        totalMinutes += ((exercise.sets - 1) * exercise.rest_time_seconds) / 60;
      }
    });
    
    return totalMinutes > 0 ? `~${Math.ceil(totalMinutes)} minutes` : '30-45 minutes';
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/challenges')}
              className="mr-4 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Challenges
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Day {dayNumber}</h1>
              <p className="text-muted-foreground">{challenge.title}</p>
            </div>
          </div>
          
          {canEditChallenge() && (
            <Button
              variant="outline"
              onClick={() => navigate(`/challenges/${challengeId}/edit`)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <Edit2 className="w-4 h-4 mr-2" />
              Edit Challenge
            </Button>
          )}
        </div>

        {/* Day Overview */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-2xl mb-2">{trainingDay.title}</CardTitle>
                <p className="text-muted-foreground mb-4">{trainingDay.description}</p>
                <div className="flex items-center space-x-4">
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                    Day {dayNumber} of {totalDays}
                  </Badge>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {calculateDuration()}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Trophy className="w-4 h-4 mr-1" />
                    {trainingDay.exercises.length} exercises
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {trainingDay.exercises.map((exercise, index) => (
                <Badge key={index} variant="outline" className="border-white/20 text-white/70">
                  {exercise.figure.name}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {trainingDay.exercises.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No exercises added to this training day yet.</p>
                </div>
              ) : (
                trainingDay.exercises.map((exercise, index) => (
                  <div 
                    key={exercise.id}
                    className="p-4 rounded-lg border bg-white/5 border-white/10"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                        {exercise.figure.image_url ? (
                          <img 
                            src={exercise.figure.image_url} 
                            alt={exercise.figure.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-2xl">{getExerciseIcon(exercise.figure.category)}</span>
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="text-white font-semibold flex items-center">
                            <span className="text-lg mr-2">{getExerciseIcon(exercise.figure.category)}</span>
                            {exercise.figure.name}
                          </h3>
                          <Badge className={getDifficultyColor(exercise.figure.difficulty_level)}>
                            {exercise.figure.difficulty_level}
                          </Badge>
                        </div>
                        
                        {exercise.figure.instructions && (
                          <p className="text-muted-foreground text-sm mb-2">{exercise.figure.instructions}</p>
                        )}

                        {/* Exercise Parameters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-2">
                          {exercise.sets && (
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-purple-400 rounded-full" />
                              <span>{exercise.sets} sets</span>
                            </div>
                          )}
                          {exercise.reps && (
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-blue-400 rounded-full" />
                              <span>{exercise.reps} reps</span>
                            </div>
                          )}
                          {exercise.hold_time_seconds && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-green-400" />
                              <span>{exercise.hold_time_seconds}s hold</span>
                            </div>
                          )}
                          {exercise.rest_time_seconds && (
                            <div className="flex items-center gap-1">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                              <span>{exercise.rest_time_seconds}s rest</span>
                            </div>
                          )}
                        </div>

                        {/* Media and Notes */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {exercise.video_url && (
                            <Badge variant="outline" className="text-xs">
                              <Play className="w-3 h-3 mr-1" />
                              Video
                            </Badge>
                          )}
                          {exercise.audio_url && (
                            <Badge variant="outline" className="text-xs">
                              <Volume2 className="w-3 h-3 mr-1" />
                              Audio
                            </Badge>
                          )}
                        </div>
                        
                        {exercise.notes && (
                          <div className="bg-white/5 rounded-lg p-3">
                            <div className="flex items-center text-purple-400 text-sm mb-1">
                              <Star className="w-3 h-3 mr-1" />
                              Notes
                            </div>
                            <p className="text-white text-sm">{exercise.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            onClick={handleStartDay}
            disabled={trainingDay.exercises.length === 0}
            className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 disabled:opacity-50"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Day {dayNumber}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/challenges')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Back to Challenge
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDayOverview;