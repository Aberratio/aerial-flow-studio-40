import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Trophy, CheckCircle, Star, Volume2, VolumeX, Edit2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import ChallengeExerciseModal from '@/components/ChallengeExerciseModal';
import ChallengeTimer from '@/components/ChallengeTimer';

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
  type?: string;
}

const ChallengeDayOverview = () => {
  const { challengeId, dayId } = useParams();
  const navigate = useNavigate();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [trainingDay, setTrainingDay] = useState<TrainingDay | null>(null);
  const [dayNumber, setDayNumber] = useState<number>(0);
  const [totalDays, setTotalDays] = useState<number>(0);
  const [allTrainingDays, setAllTrainingDays] = useState<any[]>([]);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [participationStatus, setParticipationStatus] = useState<string>('active');
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [showTimer, setShowTimer] = useState(false);
  const { user } = useAuth();
  const { canCreateChallenges } = useUserRole();
  const { toast } = useToast();

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

      // Fetch user's participation status
      if (user) {
        const { data: participationData } = await supabase
          .from('challenge_participants')
          .select('status')
          .eq('challenge_id', challengeId)
          .eq('user_id', user.id)
          .single();
        
        if (participationData) {
          setParticipationStatus(participationData.status);
        }
      }

      // Fetch all training days for this challenge to determine day number
      const { data: allDays, error: allDaysError } = await supabase
        .from('challenge_training_days')
        .select(`
          id, 
          day_date, 
          title, 
          is_rest_day,
          training_day_exercises (
            id,
            figure:figures (name)
          )
        `)
        .eq('challenge_id', challengeId)
        .order('day_date');

      if (allDaysError) throw allDaysError;
      
      setAllTrainingDays(allDays || []);
      setTotalDays(allDays?.length || 0);
      const currentDayIndex = allDays?.findIndex(day => day.id === dayId) || 0;
      setDayNumber(currentDayIndex + 1);

      // Load progress for all days
      if (user) {
        // For now, simulate some progress - this would be replaced with actual progress tracking
        const completed = new Set<string>();
        // You can implement actual progress loading here based on user completion data
        setCompletedDays(completed);
      }

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
    if (!trainingDay || trainingDay.exercises.length === 0) return;
    
    if (challenge?.type === 'timer') {
      setShowTimer(true);
    } else {
      setIsExerciseModalOpen(true);
    }
  };

  const handleExerciseClick = (exercise: Exercise) => {
    console.log('Exercise clicked:', exercise.figure.name, exercise.figure.id);
    setSelectedExercise(exercise);
    navigate(`/exercise/${exercise.figure.id}`);
  };

  const canEditChallenge = () => {
    return canCreateChallenges && challenge && (
      user?.id === challenge.created_by || 
      user?.role === 'admin'
    );
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!user || !challengeId) return;
    
    try {
      const { error } = await supabase
        .from('challenge_participants')
        .update({ status: newStatus })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);
      
      if (error) throw error;
      
      setParticipationStatus(newStatus);
      toast({
        title: "Status Updated",
        description: `Challenge status changed to ${newStatus}`
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update status. Please try again.",
        variant: "destructive"
      });
    }
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

  const handleTimerComplete = () => {
    setShowTimer(false);
    toast({
      title: "Workout Complete!",
      description: "Great job completing your training session!",
    });
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

        {/* Challenge Timeline */}
        <div className="mb-6">
          <div className="flex flex-col space-y-4">
            {/* Timeline for larger screens */}
            <div className="hidden md:block">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                {allTrainingDays.map((day, index) => {
                  const isCurrentDay = day.id === dayId;
                  const isCompleted = completedDays.has(day.id);
                  const isPast = index < dayNumber - 1;
                  const isAccessible = index <= dayNumber - 1;
                  
                  return (
                    <div key={day.id} className="flex items-center flex-shrink-0">
                      <div 
                        className={`
                          relative w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-all
                          ${isCurrentDay 
                            ? 'bg-purple-500 text-white ring-4 ring-purple-500/30' 
                            : isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isAccessible
                                ? 'bg-white/20 text-white border-2 border-white/40 hover:bg-white/30'
                                : 'bg-gray-500/20 text-gray-400 border-2 border-gray-500/20'
                          }
                        `}
                        onClick={() => isAccessible && navigate(`/challenge/${challengeId}/day/${day.id}`)}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : day.is_rest_day ? (
                          '🛌'
                        ) : (
                          index + 1
                        )}
                        {isCurrentDay && (
                          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      
                      {/* Connection line */}
                      {index < allTrainingDays.length - 1 && (
                        <div className={`
                          w-8 h-0.5 mx-1
                          ${isPast || isCompleted ? 'bg-green-400' : 'bg-gray-600'}
                        `} />
                      )}
                    </div>
                  );
                })}
              </div>
              
              {/* Day labels */}
              <div className="flex items-center space-x-2 mt-2 overflow-x-auto">
                {allTrainingDays.map((day, index) => (
                  <div key={`label-${day.id}`} className="flex items-center flex-shrink-0">
                    <div className="w-10 text-center">
                      <div className="text-xs text-muted-foreground truncate">
                        {day.is_rest_day ? 'Rest' : `Day ${index + 1}`}
                      </div>
                    </div>
                    {index < allTrainingDays.length - 1 && <div className="w-8" />}
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile timeline */}
            <div className="md:hidden">
              <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-semibold">Challenge Progress</h3>
                  <Badge className="bg-purple-500/20 text-purple-400">
                    {dayNumber} of {totalDays}
                  </Badge>
                </div>
                
                <div className="mb-3">
                  <div className="flex justify-between text-sm text-muted-foreground mb-1">
                    <span>Overall Progress</span>
                    <span>{Math.round((completedDays.size / totalDays) * 100)}%</span>
                  </div>
                  <Progress value={(completedDays.size / totalDays) * 100} className="h-2" />
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {allTrainingDays.slice(0, 10).map((day, index) => {
                    const isCurrentDay = day.id === dayId;
                    const isCompleted = completedDays.has(day.id);
                    const isAccessible = index <= dayNumber - 1;
                    
                    return (
                      <div
                        key={day.id}
                        className={`
                          aspect-square rounded-lg flex items-center justify-center text-xs font-medium cursor-pointer transition-all
                          ${isCurrentDay 
                            ? 'bg-purple-500 text-white' 
                            : isCompleted 
                              ? 'bg-green-500 text-white' 
                              : isAccessible
                                ? 'bg-white/20 text-white'
                                : 'bg-gray-500/20 text-gray-400'
                          }
                        `}
                        onClick={() => isAccessible && navigate(`/challenge/${challengeId}/day/${day.id}`)}
                      >
                        {isCompleted ? '✓' : day.is_rest_day ? '💤' : index + 1}
                      </div>
                    );
                  })}
                  {allTrainingDays.length > 10 && (
                    <div className="aspect-square rounded-lg flex items-center justify-center text-xs font-medium bg-white/10 text-white">
                      +{allTrainingDays.length - 10}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Day Overview */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-2xl mb-2">{trainingDay.title}</CardTitle>
                <p className="text-muted-foreground mb-4">{trainingDay.description}</p>
                <div className="flex items-center justify-between">
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
                  
                  {/* Status Selector */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">Status:</span>
                    <Select value={participationStatus} onValueChange={handleStatusChange}>
                      <SelectTrigger className="w-32 h-8 border-white/20 bg-black/20">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                      </SelectContent>
                    </Select>
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
                    className="p-4 rounded-lg border bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => handleExerciseClick(exercise)}
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
            className="disabled:opacity-50"
            variant="primary"
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

        {/* Timer Mode */}
        {showTimer && trainingDay && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="relative max-w-2xl w-full">
              <Button
                variant="ghost"
                onClick={() => setShowTimer(false)}
                className="absolute -top-12 right-0 text-white hover:bg-white/10"
              >
                ✕ Close Timer
              </Button>
              <ChallengeTimer 
                exercises={trainingDay.exercises}
                isAudioEnabled={isAudioEnabled}
                onComplete={handleTimerComplete}
              />
            </div>
          </div>
        )}

        {/* Exercise Modal */}
        {trainingDay && (
          <ChallengeExerciseModal
            isOpen={isExerciseModalOpen}
            onClose={() => setIsExerciseModalOpen(false)}
            challengeId={challengeId!}
            dayId={dayId!}
            dayNumber={dayNumber}
            exercises={trainingDay.exercises}
          />
        )}
      </div>
    </div>
  );
};

export default ChallengeDayOverview;