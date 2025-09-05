import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, BookOpen, Dumbbell, Users, Home, CheckCircle, ArrowRight, Target, Play, Library, Lock, Crown, Star, Calendar, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface DashboardStats {
  totalPoints: number;
  currentLevel: number;
  completedFigures: number;
  activeStreak: number;
  challengesCompleted: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  earned_at?: string;
}

interface SportCategory {
  id: string;
  key_name?: string;
  name: string;
  description?: string;
  icon?: string;
}

const QUICK_ACTIONS = [
  {
    id: 'aerial-journey',
    title: 'Skill Journey',
    description: 'Continue your progression',
    icon: Play,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    link: '/aerial-journey'
  },
  {
    id: 'challenges',
    title: 'Challenges',
    description: 'Join daily challenges',
    icon: Trophy,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    link: '/challenges'
  },
  {
    id: 'figure-of-day',
    title: 'Daily Figure',
    description: 'Today\'s featured move',
    icon: Target,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    link: '/figure-of-the-day'
  },
  {
    id: 'library',
    title: 'Library',
    description: 'Browse all exercises',
    icon: Library,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    link: '/library'
  }
];

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [userSports, setUserSports] = useState<string[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [availableSports, setAvailableSports] = useState<SportCategory[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalPoints: 0,
    currentLevel: 1,
    completedFigures: 0,
    activeStreak: 0,
    challengesCompleted: 0
  });
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchAvailableSports();
      fetchDashboardStats();
      fetchRecentAchievements();
    }
  }, [user]);

  const fetchDashboardStats = async () => {
    if (!user) return;
    
    try {
      // Fetch user progress stats
      const { data: progressData } = await supabase
        .from('figure_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('status', 'completed');

      const { data: challengeData } = await supabase
        .from('challenge_participants')
        .select('completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      // Calculate streak based on challenge calendar days
      const { data: calendarData } = await supabase
        .from('user_challenge_calendar_days')
        .select('calendar_date, status')
        .eq('user_id', user.id)
        .in('status', ['completed', 'rest'])
        .order('calendar_date', { ascending: false });

      let activeStreak = 0;
      if (calendarData && calendarData.length > 0) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        // Group by date and check if user had any progress that day
        const progressByDate = new Map();
        calendarData.forEach(item => {
          const date = item.calendar_date;
          if (!progressByDate.has(date)) {
            progressByDate.set(date, true);
          }
        });

        // Sort dates and calculate consecutive streak from today backwards
        const sortedDates = Array.from(progressByDate.keys()).sort().reverse();
        
        // Check if user has progress today or yesterday (to account for timezone)
        const todayStr = today.toISOString().split('T')[0];
        const yesterdayStr = new Date(today.getTime() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        let startIndex = -1;
        if (sortedDates.includes(todayStr)) {
          startIndex = sortedDates.indexOf(todayStr);
        } else if (sortedDates.includes(yesterdayStr)) {
          startIndex = sortedDates.indexOf(yesterdayStr);
        }

        if (startIndex >= 0) {
          // Count consecutive days backwards from the start date
          for (let i = startIndex; i < sortedDates.length; i++) {
            const currentDate = new Date(sortedDates[i]);
            const expectedDate = new Date(today.getTime() - (i - startIndex) * 24 * 60 * 60 * 1000);
            expectedDate.setHours(0, 0, 0, 0);
            
            if (currentDate.getTime() === expectedDate.getTime()) {
              activeStreak++;
            } else {
              break;
            }
          }
        }
      }

      const completedFigures = progressData?.length || 0;
      const challengesCompleted = challengeData?.length || 0;
      const totalPoints = completedFigures * 10 + challengesCompleted * 50;
      const currentLevel = Math.floor(totalPoints / 100) + 1;

      setDashboardStats({
        totalPoints,
        currentLevel,
        completedFigures,
        activeStreak,
        challengesCompleted
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const fetchRecentAchievements = async () => {
    if (!user) return;
    
    try {
      const { data } = await supabase
        .from('user_achievements')
        .select(`
          earned_at,
          achievements (
            id,
            name,
            description,
            icon
          )
        `)
        .eq('user_id', user.id)
        .order('earned_at', { ascending: false })
        .limit(3);

      const achievements = data?.map(item => ({
        id: item.achievements?.id || '',
        name: item.achievements?.name || '',
        description: item.achievements?.description || '',
        icon: item.achievements?.icon || '🏆',
        earned_at: item.earned_at
      })) || [];

      setRecentAchievements(achievements);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const fetchAvailableSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sport_categories')
        .select('id, key_name, name, description, icon')
        .eq('is_published', true)
        .order('name');
      
      if (error) throw error;
      setAvailableSports(data || []);
    } catch (error) {
      console.error('Error fetching available sports:', error);
    }
  };

  const getSportIcon = (sport: SportCategory) => {
    if (sport.icon) return sport.icon;
    
    const iconMap: Record<string, string> = {
      'hoop': '🪩',
      'pole': '💃',
      'core': '💪'
    };
    return iconMap[sport.key_name] || '🏃';
  };

  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('sports')
        .eq('id', user.id)
        .single();
      
      if (error) throw error;
      const sports = data?.sports || [];
      setUserSports(sports);
      setSelectedSports(sports);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSportToggle = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(s => s !== sportId) 
        : [...prev, sportId]
    );
  };

  const saveSports = async () => {
    if (!user) return;
    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ sports: selectedSports })
        .eq('id', user.id);
      
      if (error) throw error;
      setUserSports(selectedSports);
      toast({
        title: "Success",
        description: "Your sports preferences have been saved!"
      });
    } catch (error) {
      console.error('Error saving sports:', error);
      toast({
        title: "Error",
        description: "Failed to save sports preferences",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show sport selection if user has no sports selected
  if (userSports.length === 0 && availableSports.length > 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent mb-4">
              Welcome to IguanaFlow! 🎭
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Let's start your aerial journey
            </p>
            <p className="text-muted-foreground">Choose the sports you want to master:</p>
          </div>

          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white text-center">
                Choose Your Sports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {availableSports.map(sport => (
                  <Card 
                    key={sport.id} 
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedSports.includes(sport.id) 
                        ? 'ring-2 ring-purple-400 bg-purple-500/10' 
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                    onClick={() => handleSportToggle(sport.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{getSportIcon(sport)}</div>
                      <div className="mb-2">
                        <Checkbox 
                          checked={selectedSports.includes(sport.id)} 
                          className="pointer-events-none" 
                        />
                      </div>
                      <h3 className="font-semibold text-lg text-white">{sport.name}</h3>
                      {sport.description && (
                        <p className="text-sm text-muted-foreground mt-1">{sport.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {availableSports.length > 0 && (
                <div className="flex justify-center">
                  <Button 
                    onClick={saveSports} 
                    disabled={saving || selectedSports.length === 0} 
                    className="px-8 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                  >
                    {saving ? 'Saving...' : 'Start My Journey'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main dashboard
  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Welcome back! 👋
          </h1>
          <p className="text-muted-foreground">
            Ready to continue your aerial journey?
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect border-white/10">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center mx-auto mb-2 text-black font-bold">
                {dashboardStats.currentLevel}
              </div>
              <p className="text-sm text-muted-foreground">Level</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/10">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white">{dashboardStats.totalPoints}</p>
              <p className="text-sm text-muted-foreground">Points</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/10">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white">{dashboardStats.completedFigures}</p>
              <p className="text-sm text-muted-foreground">Figures</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-white/10">
            <CardContent className="p-4 text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-400 to-pink-400 flex items-center justify-center mx-auto mb-2">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <p className="text-lg font-bold text-white">{dashboardStats.activeStreak}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ArrowRight className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {QUICK_ACTIONS.map(action => {
                const Icon = action.icon;
                return (
                  <Link key={action.id} to={action.link}>
                    <Card className="glass-effect border-white/10 hover:scale-105 transition-all duration-200 cursor-pointer group">
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 rounded-full ${action.bgColor} flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                          <Icon className={`w-6 h-6 ${action.color}`} />
                        </div>
                        <h3 className="font-semibold text-white text-sm mb-1">
                          {action.title}
                        </h3>
                        <p className="text-xs text-muted-foreground">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Recent Achievements */}
        {recentAchievements.length > 0 && (
          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                Recent Achievements
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentAchievements.map(achievement => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-white">{achievement.name}</h4>
                      <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    </div>
                    <Badge className="bg-yellow-500/20 text-yellow-400">
                      New!
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Selected Sports */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Your Sports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
              {userSports.map(sportId => {
                const sport = availableSports.find(s => s.id === sportId);
                return (
                  <Badge key={sportId} variant="secondary" className="bg-purple-500/20 text-purple-400 flex items-center gap-2 px-3 py-2">
                    {sport?.icon && <span className="text-lg">{sport.icon}</span>}
                    {sport?.name || sportId}
                  </Badge>
                );
              })}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setUserSports([])} 
              className="border-white/20 text-white hover:bg-white/10"
            >
              Change Sports
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;