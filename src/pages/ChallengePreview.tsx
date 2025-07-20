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

  useEffect(() => {
    if (challengeId) {
      fetchChallengeDetails();
      checkParticipation();
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
        
        {/* Challenge Calendar */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Training Schedule
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-3">
              {calendarDays.map((day, index) => (
                <div
                  key={index}
                  className={`
                    relative p-3 rounded-lg border transition-all
                    ${day.isToday 
                      ? 'border-purple-500 bg-purple-500/20' 
                      : day.isPast 
                        ? 'border-gray-600 bg-gray-500/10' 
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }
                  `}
                >
                  <div className="text-center">
                    <div className="text-xs text-muted-foreground mb-1">
                      {format(day.date, 'EEE')}
                    </div>
                    <div className="text-sm font-semibold text-white mb-2">
                      {format(day.date, 'd')}
                    </div>
                    <div className="text-xs">
                      {day.trainingDay.is_rest_day ? (
                        <Badge variant="outline" className="text-xs py-0 px-2 border-blue-500/30 text-blue-400">
                          Rest
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs py-0 px-2 border-green-500/30 text-green-400">
                          Day {day.day}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {day.isToday && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full"></div>
                  )}
                </div>
              ))}
            </div>
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