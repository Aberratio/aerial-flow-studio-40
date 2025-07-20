import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Trophy, Users, Clock, Play, ChevronLeft, CalendarDays, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, addDays } from 'date-fns';

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level?: string;
  start_date: string;
  end_date: string;
  status: string;
  image_url?: string;
  type: string;
  achievements?: Array<{
    id: string;
    name: string;
    points: number;
    icon: string;
  }>;
  training_days?: Array<{
    id: string;
    day_date: string;
    title: string;
    description: string;
    is_rest_day?: boolean;
    exercises?: Array<{
      id: string;
      figure: {
        name: string;
        difficulty_level: string;
      };
      sets?: number;
      reps?: number;
      hold_time_seconds?: number;
      rest_time_seconds?: number;
    }>;
  }>;
  participants_count?: number;
}

const ChallengePreview = () => {
  const { challengeId } = useParams<{ challengeId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [isParticipant, setIsParticipant] = useState(false);
  const [completedDays, setCompletedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (challengeId) {
      fetchChallengeDetails();
      checkParticipation();
      loadProgress();
    }
  }, [challengeId]);

  const fetchChallengeDetails = async () => {
    if (!challengeId) return;
    
    setIsLoading(true);
    try {
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_achievements (
            achievement:achievements (
              id, name, points, icon
            )
          ),
          challenge_training_days (
            id, day_date, title, description, is_rest_day,
            training_day_exercises (
              id, sets, reps, hold_time_seconds, rest_time_seconds,
              figure:figures (
                name, difficulty_level
              )
            )
          )
        `)
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      const { count: participantsCount } = await supabase
        .from('challenge_participants')
        .select('*', { count: 'exact', head: true })
        .eq('challenge_id', challengeId);

      setChallenge({
        ...challengeData,
        achievements: challengeData.challenge_achievements?.map((ca: any) => ca.achievement) || [],
        training_days: challengeData.challenge_training_days?.sort((a: any, b: any) => 
          new Date(a.day_date).getTime() - new Date(b.day_date).getTime()
        ) || [],
        participants_count: participantsCount || 0
      });
    } catch (error) {
      console.error('Error fetching challenge details:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge details",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const checkParticipation = async () => {
    if (!challengeId || !user?.id) return;

    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setIsParticipant(true);
      }
    } catch (error) {
      // User is not a participant
    }
  };

  const loadProgress = async () => {
    if (!challengeId || !user?.id) return;

    try {
      // For now, simulate some completed days - this would be replaced with actual progress tracking
      const completed = new Set<string>();
      // You can implement actual progress loading here
      setCompletedDays(completed);
    } catch (error) {
      console.error('Error loading progress:', error);
    }
  };

  const calculateDayEstimatedTime = (trainingDay: any) => {
    if (challenge?.type !== 'timer' || !trainingDay.exercises) return null;
    
    let totalTime = 0;
    trainingDay.exercises.forEach((exercise: any) => {
      const holdTime = exercise.hold_time_seconds || 30;
      const restTime = exercise.rest_time_seconds || 15;
      const sets = exercise.sets || 1;
      totalTime += (holdTime + restTime) * sets;
    });
    
    const minutes = Math.ceil(totalTime / 60);
    return `~${minutes}min`;
  };

  const joinChallenge = async () => {
    if (!challengeId || !user?.id || isParticipant) return;

    setIsJoining(true);
    try {
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: 'active'
        });

      if (error) throw error;

      setIsParticipant(true);
      setChallenge(prev => prev ? {
        ...prev,
        participants_count: (prev.participants_count || 0) + 1
      } : null);

      toast({
        title: "Success",
        description: "You've joined the challenge!",
      });
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: "Error",
        description: "Failed to join challenge",
        variant: "destructive"
      });
    } finally {
      setIsJoining(false);
    }
  };

  const startFirstDay = () => {
    if (!challenge?.training_days?.[0]) return;
    
    const firstDay = challenge.training_days[0];
    navigate(`/challenge/${challengeId}/day/${firstDay.id}`);
  };

  const calculateDuration = () => {
    if (!challenge) return '';
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const generateCalendarDays = () => {
    if (!challenge?.training_days) return [];
    
    const startDate = parseISO(challenge.start_date);
    const days = [];
    
    for (let i = 0; i < challenge.training_days.length; i++) {
      const dayDate = addDays(startDate, i);
      const trainingDay = challenge.training_days[i];
      
      days.push({
        date: dayDate,
        day: i + 1,
        trainingDay,
        isToday: format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isPast: dayDate < new Date()
      });
    }
    
    return days;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Challenge not found</h2>
          <Button onClick={() => navigate('/challenges')} variant="outline">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 text-white">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/challenges')}
            className="text-white hover:bg-white/10 mb-4"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Back to Challenges
          </Button>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Challenge Hero */}
            <div className="space-y-6">
              <div className="relative h-64 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                {challenge.image_url ? (
                  <img 
                    src={challenge.image_url} 
                    alt={challenge.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Trophy className="w-16 h-16 text-white/20" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-4 left-4">
                  <Badge variant="outline" className="border-white/30 text-white/90 mb-2">
                    {challenge.type === 'timer' ? 'Timer Challenge' : 'Manual Challenge'}
                  </Badge>
                  <h1 className="text-3xl font-bold text-white">{challenge.title}</h1>
                </div>
              </div>
              
              <p className="text-muted-foreground text-lg leading-relaxed">
                {challenge.description}
              </p>
              
              {/* Action Button */}
              <div className="flex gap-4">
                {!isParticipant ? (
                  <Button 
                    onClick={joinChallenge}
                    disabled={isJoining}
                    className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    {isJoining ? 'Joining...' : 'Join Challenge'}
                  </Button>
                ) : (
                  <Button 
                    onClick={startFirstDay}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Training
                  </Button>
                )}
              </div>
            </div>
            
            {/* Challenge Stats */}
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-4 text-center">
                    <Clock className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="text-xl font-bold text-white">{calculateDuration()}</div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-4 text-center">
                    <Users className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">Participants</div>
                    <div className="text-xl font-bold text-white">{challenge.participants_count?.toLocaleString() || '0'}</div>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-4 text-center">
                    <Target className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">Difficulty</div>
                    <Badge className={getDifficultyColor(challenge.difficulty_level || 'intermediate')}>
                      {challenge.difficulty_level?.charAt(0).toUpperCase() + challenge.difficulty_level?.slice(1) || 'Intermediate'}
                    </Badge>
                  </CardContent>
                </Card>
                
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-4 text-center">
                    <CalendarDays className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                    <div className="text-sm text-muted-foreground">Training Days</div>
                    <div className="text-xl font-bold text-white">{challenge.training_days?.length || 0}</div>
                  </CardContent>
                </Card>
              </div>
              
              {/* Challenge Rules */}
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">Challenge Rules</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-muted-foreground">Complete training sessions in order</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-muted-foreground">Follow rest days as scheduled</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-muted-foreground">
                      {challenge.type === 'timer' ? 'Follow timer instructions carefully' : 'Track your progress manually'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                    <span className="text-muted-foreground">Earn achievements by completing milestones</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Challenge Training Schedule */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Challenge Training Schedule
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {challenge.training_days?.map((trainingDay, index) => {
              const dayDate = addDays(parseISO(challenge.start_date), index);
              const isCompleted = completedDays.has(trainingDay.id);
              const isToday = format(dayDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const isPast = dayDate < new Date();
              const isAccessible = isParticipant && (index === 0 || completedDays.has(challenge.training_days[index - 1]?.id));
              const estimatedTime = calculateDayEstimatedTime(trainingDay);
              
              return (
                <div
                  key={trainingDay.id}
                  className={`
                    relative p-6 rounded-lg border transition-all cursor-pointer group
                    ${isCompleted 
                      ? 'border-green-500/50 bg-green-500/10' 
                      : isToday 
                        ? 'border-purple-500/50 bg-purple-500/10' 
                        : isAccessible
                          ? 'border-white/20 bg-white/5 hover:bg-white/10 hover:border-white/30'
                          : 'border-gray-600/30 bg-gray-500/5 opacity-60'
                    }
                  `}
                  onClick={isAccessible ? () => navigate(`/challenge/${challengeId}/day/${trainingDay.id}`) : undefined}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {/* Day Number Circle */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg relative
                        ${isCompleted 
                          ? 'bg-green-500 text-white' 
                          : isToday 
                            ? 'bg-purple-500 text-white' 
                            : isAccessible
                              ? 'bg-white/10 text-white border-2 border-white/20'
                              : 'bg-gray-500/20 text-gray-400 border-2 border-gray-500/20'
                        }
                      `}>
                        {isCompleted ? (
                          <Trophy className="w-5 h-5" />
                        ) : trainingDay.is_rest_day ? (
                          '☀️'
                        ) : (
                          index + 1
                        )}
                        {isToday && !isCompleted && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-purple-400 rounded-full animate-pulse"></div>
                        )}
                      </div>
                      
                      {/* Day Info */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className={`font-semibold ${isAccessible ? 'text-white' : 'text-gray-400'}`}>
                            {trainingDay.title || `Day ${index + 1}`}
                          </h3>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className={`text-xs py-0 px-2 ${
                                trainingDay.is_rest_day 
                                  ? 'border-blue-500/30 text-blue-400' 
                                  : 'border-green-500/30 text-green-400'
                              }`}
                            >
                              {trainingDay.is_rest_day ? 'Rest Day' : 'Training'}
                            </Badge>
                            {challenge.type === 'timer' && estimatedTime && !trainingDay.is_rest_day && (
                              <Badge variant="outline" className="text-xs py-0 px-2 border-purple-500/30 text-purple-400">
                                <Clock className="w-3 h-3 mr-1" />
                                {estimatedTime}
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className={`text-sm ${isAccessible ? 'text-muted-foreground' : 'text-gray-500'}`}>
                          {format(dayDate, 'EEEE, MMMM d')} • 
                          {trainingDay.is_rest_day 
                            ? ' Recovery and stretching'
                            : ` ${trainingDay.exercises?.length || 0} exercises`
                          }
                        </p>
                        {trainingDay.description && (
                          <p className={`text-xs mt-1 ${isAccessible ? 'text-gray-300' : 'text-gray-500'}`}>
                            {trainingDay.description}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    {/* Status Indicators */}
                    <div className="flex items-center gap-2">
                      {isCompleted && (
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <Trophy className="w-4 h-4" />
                          <span>Completed</span>
                        </div>
                      )}
                      {isToday && !isCompleted && isParticipant && (
                        <div className="flex items-center gap-1 text-purple-400 text-sm">
                          <Play className="w-4 h-4" />
                          <span>Start Now</span>
                        </div>
                      )}
                      {!isAccessible && isParticipant && (
                        <div className="text-gray-500 text-sm">
                          Locked
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress Bar for Training Days */}
                  {!trainingDay.is_rest_day && trainingDay.exercises && trainingDay.exercises.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-white/10">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Exercises</span>
                        <span>{isCompleted ? trainingDay.exercises.length : 0} of {trainingDay.exercises.length}</span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            isCompleted ? 'bg-green-500' : 'bg-gray-600'
                          }`}
                          style={{ width: isCompleted ? '100%' : '0%' }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </CardContent>
        </Card>
        
        {/* Achievements */}
        {challenge.achievements && challenge.achievements.length > 0 && (
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Challenge Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {challenge.achievements.map((achievement) => (
                  <Card key={achievement.id} className="glass-effect border-white/10">
                    <CardContent className="p-4 flex items-center gap-3">
                      <span className="text-2xl">{achievement.icon}</span>
                      <div>
                        <div className="font-medium text-white">{achievement.name}</div>
                        <div className="text-sm text-purple-400">{achievement.points} points</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default ChallengePreview;