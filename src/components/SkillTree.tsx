import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Lock, CheckCircle, Circle, Crown, Eye, ExternalLink, EyeOff, Bookmark, AlertCircle, CircleMinus, Trophy } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FigurePreviewModal } from "@/components/FigurePreviewModal";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";

interface Figure {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  image_url: string | null;
  category: string;
}

interface SportLevel {
  id: string;
  sport_category: string;
  level_number: number;
  level_name: string;
  point_limit: number;
  figures: Figure[];
  challenge_id?: string;
  challenges?: Challenge;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  status: string;
  premium: boolean;
}

interface UserProgress {
  figure_id: string;
  status: string;
}

interface SkillTreeProps {
  sportCategory: string;
  sportName: string;
  onBack: () => void;
}

const SkillTree = ({ sportCategory, sportName, onBack }: SkillTreeProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPremiumAccess } = useSubscriptionStatus();
  const [sportLevels, setSportLevels] = useState<SportLevel[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [selectedFigure, setSelectedFigure] = useState<Figure | null>(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);
  const [showAllLevels, setShowAllLevels] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [joiningChallenge, setJoiningChallenge] = useState<string | null>(null);
  const [userChallengeParticipations, setUserChallengeParticipations] = useState<{[challengeId: string]: boolean}>({});

  useEffect(() => {
    fetchSportLevelsAndProgress();
    fetchUserPoints();
    fetchUserChallengeParticipations();
  }, [sportCategory, user]);

  const fetchSportLevelsAndProgress = async () => {
    if (!user) return;

    try {
      // Fetch sport levels with their figures and challenges
      const { data: levelsData, error: levelsError } = await supabase
        .from('sport_levels')
        .select(`
          id,
          sport_category,
          level_number,
          level_name,
          point_limit,
          challenge_id,
          challenges (
            id,
            title,
            description,
            difficulty_level,
            status,
            premium
          ),
          level_figures (
            figure_id,
            order_index,
            figures (
              id,
              name,
              description,
              difficulty_level,
              image_url,
              category
            )
          )
        `)
        .eq('sport_category', sportCategory)
        .eq('status', 'published')
        .order('level_number', { ascending: true });

      if (levelsError) throw levelsError;

      // Format the data to include figures and challenges directly in each level
      const formattedLevels = levelsData?.map(level => ({
        id: level.id,
        sport_category: level.sport_category,
        level_number: level.level_number,
        level_name: level.level_name,
        point_limit: level.point_limit,
        challenge_id: level.challenge_id,
        challenges: level.challenges,
        figures: level.level_figures
          ?.sort((a, b) => a.order_index - b.order_index)
          ?.map(lf => lf.figures)
          ?.filter(Boolean) || []
      })) || [];

      setSportLevels(formattedLevels);

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('figure_progress')
        .select('figure_id, status')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      setUserProgress(progressData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    if (!user) return;

    try {
      // Get all sport levels for this category, ordered by level number
      const { data: levelsData } = await supabase
        .from('sport_levels')
        .select('id, level_number, point_limit')
        .eq('sport_category', sportCategory)
        .eq('status', 'published')
        .order('level_number', { ascending: true });

      if (!levelsData) {
        setUserPoints(0);
        return;
      }

      // Get all completed figures for this sport category with their level information
      const { data: progressData } = await supabase
        .from('figure_progress')
        .select(`
          status,
          figure_id,
          figures!inner(
            id,
            category,
            level_figures!inner(
              level_id
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .eq('figures.category', sportCategory);

      let calculatedPoints = 0;
      
      // Calculate points iteratively, level by level
      // Start with level 1 (point_limit 0) and work our way up
      for (const level of levelsData) {
        // Check if this level is unlocked based on current calculated points
        if (calculatedPoints >= level.point_limit) {
          // Count points from completed figures in this unlocked level
          const levelFigures = progressData?.filter(progress => {
            const levelId = progress.figures?.level_figures?.[0]?.level_id;
            return levelId === level.id;
          }) || [];
          
          // Add points for each completed figure in this level
          levelFigures.forEach(() => {
            calculatedPoints += 1 * level.level_number; // 1 point × level number
          });
        }
      }

      setUserPoints(calculatedPoints);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchUserChallengeParticipations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('challenge_id')
        .eq('user_id', user.id);

      if (error) throw error;

      const participations: {[challengeId: string]: boolean} = {};
      data?.forEach(participant => {
        participations[participant.challenge_id] = true;
      });
      
      setUserChallengeParticipations(participations);
    } catch (error) {
      console.error('Error fetching challenge participations:', error);
    }
  };

  const handleFigureClick = (figure: Figure, canPractice: boolean) => {
    if (canPractice && canAccessFigure(figure)) {
      setSelectedFigure(figure);
      setIsPreviewModalOpen(true);
    } else if (canPractice && !canAccessFigure(figure)) {
      toast({
        title: "Premium Required",
        description: "This exercise requires a premium subscription to access.",
        variant: "destructive",
      });
    }
  };

  const handleClosePreviewModal = () => {
    setIsPreviewModalOpen(false);
    setSelectedFigure(null);
    // Refresh progress data
    fetchSportLevelsAndProgress();
  };

  const getFigureProgress = (figureId: string) => {
    return userProgress.find(p => p.figure_id === figureId);
  };

  const isLevelUnlocked = (level: SportLevel) => {
    return userPoints >= level.point_limit;
  };

  const getPointsForNextLevel = (currentLevel: SportLevel) => {
    const nextLevel = sportLevels.find(l => l.level_number === currentLevel.level_number + 1);
    return nextLevel ? nextLevel.point_limit - userPoints : 0;
  };

  const getLevelProgress = (level: SportLevel) => {
    if (level.figures.length === 0) return 0;
    
    const completedFigures = level.figures.filter(figure => {
      const progress = getFigureProgress(figure.id);
      return progress?.status === 'completed';
    });
    
    return Math.round((completedFigures.length / level.figures.length) * 100);
  };

  // Update figure progress status
  const updateFigureStatus = async (figureId: string, status: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (!user) return;

    // Check if figure requires premium access
    const figure = sportLevels.flatMap(level => level.figures).find(f => f.id === figureId);
    if (figure && !canAccessFigure(figure)) {
      toast({
        title: "Premium Required",
        description: "This exercise requires a premium subscription to track progress.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      setUpdatingStatus(figureId);

      const { data, error } = await supabase
        .from('figure_progress')
        .upsert(
          {
            user_id: user.id,
            figure_id: figureId,
            status: status,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: 'user_id,figure_id',
          }
        )
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      setUserProgress(prev => {
        const existing = prev.find(p => p.figure_id === figureId);
        if (existing) {
          return prev.map(p => p.figure_id === figureId ? { ...p, status } : p);
        } else {
          return [...prev, { figure_id: figureId, status }];
        }
      });

      // Refresh user points
      await fetchUserPoints();

      toast({
        title: "Status updated!",
        description: `Exercise marked as ${status.replace("_", " ")}.`,
      });
    } catch (error) {
      console.error('Error updating figure status:', error);
      toast({
        title: "Error",
        description: "Failed to update exercise status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  // Check if figure requires premium access
  const requiresPremiumAccess = (figure: Figure) => {
    // Check if figure is marked as premium (you might need to add this field to the Figure interface and database)
    // For now, checking if it's a premium feature based on category or other criteria
    return figure.difficulty_level === 'Expert' || figure.difficulty_level === 'Advanced';
  };

  const canAccessFigure = (figure: Figure) => {
    if (!requiresPremiumAccess(figure)) return true;
    return hasPremiumAccess;
  };

  // Join challenge function
  const joinChallenge = async (challengeId: string) => {
    if (!user) return;
    
    setJoiningChallenge(challengeId);
    
    try {
      // Check if user is already participating
      const { data: existingParticipant } = await supabase
        .from('challenge_participants')
        .select('id')
        .eq('user_id', user.id)
        .eq('challenge_id', challengeId)
        .single();

      if (existingParticipant) {
        toast({
          title: "Already joined!",
          description: "You're already participating in this challenge.",
        });
        return;
      }

      // Join the challenge
      const { error } = await supabase
        .from('challenge_participants')
        .insert({
          user_id: user.id,
          challenge_id: challengeId,
          status: 'active',
          joined_at: new Date().toISOString(),
          user_started_at: new Date().toISOString()
        });

      if (error) throw error;

      // Generate calendar for the challenge
      await supabase.rpc('generate_user_challenge_calendar', {
        p_user_id: user.id,
        p_challenge_id: challengeId,
        p_start_date: new Date().toISOString().split('T')[0]
      });

      toast({
        title: "Challenge joined!",
        description: "You've successfully joined the challenge. Good luck!",
      });
      
      // Update local state
      setUserChallengeParticipations(prev => ({
        ...prev,
        [challengeId]: true
      }));
      
      // Navigate to challenge page
      navigate(`/challenges/${challengeId}`);
    } catch (error) {
      console.error('Error joining challenge:', error);
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoiningChallenge(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Sports
        </Button>

        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
            {sportName} Skill Tree
          </h1>
          <div className="flex items-center flex-wrap gap-4 mb-4">
            <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-400/30 px-4 py-2 text-lg">
              💰 {userPoints} Points
            </Badge>
            <p className="text-muted-foreground">
              Complete figures to earn 1 point × level number
            </p>
          </div>
          
          {/* Toggle for showing all levels */}
          <Card className="glass-effect border-white/10 p-3 md:p-4 mb-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center space-x-3">
                <span className="text-white font-medium text-sm md:text-base">Show All Levels</span>
                <Switch
                  checked={showAllLevels}
                  onCheckedChange={setShowAllLevels}
                  className="data-[state=checked]:bg-purple-500 scale-90 md:scale-100"
                />
              </div>
              <div className="flex items-center space-x-2 text-xs md:text-sm text-muted-foreground">
                {showAllLevels ? <Eye className="w-3 h-3 md:w-4 md:h-4" /> : <EyeOff className="w-3 h-3 md:w-4 md:h-4" />}
                <span className="hidden sm:inline">{showAllLevels ? 'Showing all levels' : 'Showing unlocked levels only'}</span>
                <span className="sm:hidden">{showAllLevels ? 'All levels' : 'Unlocked only'}</span>
              </div>
            </div>
          </Card>
          
          <Card className="glass-effect border-white/10 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Progress in {sportName}</span>
              <span className="text-white font-semibold">{userPoints} total points earned</span>
            </div>
          </Card>
        </div>


        {/* Skill Tree by Levels */}
        <div className="space-y-8">
          {sportLevels.length === 0 ? (
            <Card className="glass-effect border-white/10">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground text-lg">
                  No levels have been created for {sportName} yet.
                </p>
                <p className="text-muted-foreground text-sm mt-2">
                  Please contact an administrator to set up the skill progression for this sport.
                </p>
              </CardContent>
            </Card>
          ) : (
            sportLevels.map((level) => {
              const isUnlocked = isLevelUnlocked(level);
              const isCompleted = getLevelProgress(level) === 100;
              const pointsNeeded = level.point_limit - userPoints;
              
              return (
                <Card key={level.id} className={`glass-effect border-white/10 transition-all duration-300 ${
                  isUnlocked 
                    ? 'border-green-400/30 bg-green-500/5' 
                    : 'opacity-70 border-red-400/30 bg-red-500/5'
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {isUnlocked ? (
                          <CheckCircle className="w-6 h-6 text-green-400" />
                        ) : (
                          <Lock className="w-6 h-6 text-red-400" />
                        )}
                        <CardTitle className="text-white text-xl">{level.level_name}</CardTitle>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">{level.figures.length} figures</Badge>
                        <Badge 
                          className={`${
                            isUnlocked 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}
                        >
                          {level.point_limit} pts
                        </Badge>
                      </div>
                    </div>
                    
                    {/* Progress info integrated into level card */}
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Level {level.level_number} Progress</span>
                        <span className="text-muted-foreground">{getLevelProgress(level)}% complete</span>
                      </div>
                      <Progress value={isUnlocked ? getLevelProgress(level) : 0} className="h-2" />
                      
                      {!isUnlocked && level.point_limit > 0 && (
                        <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <Lock className="w-4 h-4 text-red-400" />
                            <span className="text-red-400 font-medium">
                              Need {level.point_limit - userPoints} more points to unlock
                            </span>
                          </div>
                          <p className="text-xs text-red-300 mt-1">
                            Complete figures in unlocked levels (1 point × level number)
                          </p>
                        </div>
                      )}

                      {isUnlocked && (
                        <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            <span className="text-green-400 font-medium">Level Unlocked!</span>
                          </div>
                          <p className="text-xs text-green-300 mt-1">
                            Complete figures to earn {level.level_number} points each
                          </p>
                        </div>
                      )}

                      {/* Challenge Section */}
                      {level.challenges && (
                        <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20 rounded-lg p-3 md:p-4 mt-4">
                          <div className="flex flex-col md:flex-row md:items-start gap-3 md:gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <Trophy className="w-4 h-4 md:w-5 md:h-5 text-yellow-400" />
                                <h4 className="font-semibold text-white text-sm md:text-base">Challenge Available</h4>
                                {level.challenges.premium && (
                                  <Badge className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 text-yellow-400 border border-yellow-400/30 text-xs">
                                    <Crown className="w-3 h-3 mr-1" />
                                    Premium
                                  </Badge>
                                )}
                              </div>
                              <h5 className="text-base md:text-lg font-bold text-purple-300 mb-1">{level.challenges.title}</h5>
                              <p className="text-xs md:text-sm text-muted-foreground mb-3 line-clamp-2">
                                {level.challenges.description}
                              </p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="border-purple-400/50 text-purple-300 text-xs">
                                  {level.challenges.difficulty_level}
                                </Badge>
                              </div>
                            </div>
                            <div className="flex flex-row md:flex-col gap-2 w-full md:w-auto">
                              {isUnlocked ? (
                                userChallengeParticipations[level.challenges!.id] ? (
                                  <div className="flex flex-col md:flex-col gap-2 w-full">
                                    <Button
                                      onClick={() => navigate(`/challenges/${level.challenges!.id}`)}
                                      variant="outline"
                                      className="border-green-400/50 text-green-400 hover:bg-green-400/10 text-xs md:text-sm px-3 py-2 h-auto"
                                    >
                                      <Eye className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                      <span className="hidden sm:inline">View Challenge</span>
                                      <span className="sm:hidden">View</span>
                                    </Button>
                                    <div className="text-xs text-green-400 text-center">
                                      Already participating
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() => joinChallenge(level.challenges!.id)}
                                    disabled={joiningChallenge === level.challenges!.id || (!hasPremiumAccess && level.challenges!.premium)}
                                    className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white text-xs md:text-sm px-3 py-2 h-auto"
                                  >
                                    {joiningChallenge === level.challenges!.id ? (
                                      <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white" />
                                    ) : (
                                      <>
                                        <Trophy className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                        <span className="hidden sm:inline">Join Challenge</span>
                                        <span className="sm:hidden">Join</span>
                                      </>
                                    )}
                                  </Button>
                                )
                              ) : (
                                <Button
                                  disabled
                                  variant="outline"
                                  className="border-gray-600 text-gray-400 text-xs md:text-sm px-3 py-2 h-auto"
                                >
                                  <Lock className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
                                  <span className="hidden sm:inline">Unlock Level</span>
                                  <span className="sm:hidden">Unlock</span>
                                </Button>
                              )}
                              {!hasPremiumAccess && level.challenges!.premium && (
                                <p className="text-xs text-yellow-400 text-center">
                                  Premium required
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  {(showAllLevels || (isUnlocked && !isCompleted)) && (
                    <CardContent>
                      {level.figures.length === 0 ? (
                        <p className="text-muted-foreground text-center py-8">
                          No figures assigned to this level yet.
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
                          {level.figures.map((figure) => {
                            const progress = getFigureProgress(figure.id);
                            const isCompleted = progress?.status === 'completed';
                            const canPractice = isUnlocked;
                            
                            return (
                              <Card
                                key={figure.id}
                                className={`transition-all duration-300 ${
                                  canPractice
                                    ? isCompleted
                                      ? 'bg-green-500/10 border-green-400/50 hover:scale-105 cursor-pointer'
                                      : 'bg-white/5 border-white/10 hover:border-purple-400/50 hover:scale-105 cursor-pointer'
                                    : 'bg-gray-900/50 border-gray-700/50 cursor-not-allowed'
                                }`}
                                title={!canPractice ? `Unlock this level with ${level.point_limit} points to practice this figure` : ''}
                                onClick={() => handleFigureClick(figure, canPractice && canAccessFigure(figure))}
                              >
                                <CardContent className="p-4">
                                  {/* Figure Image */}
                                  <div className="mb-3 relative">
                                    {figure.image_url ? (
                                      <div className="aspect-square rounded-lg overflow-hidden bg-gray-800">
                                        <img 
                                          src={figure.image_url} 
                                          alt={figure.name}
                                          className="w-full h-full object-cover"
                                          onError={(e) => {
                                            e.currentTarget.src = '/placeholder.svg';
                                          }}
                                        />
                                        {canPractice && (
                                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                                            <Eye className="w-6 h-6 text-white" />
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="aspect-square rounded-lg bg-gray-800 flex items-center justify-center">
                                        <span className="text-2xl">🤸</span>
                                      </div>
                                    )}
                                    
                                     {/* Status Badge Overlay */}
                                     <div className="absolute top-2 right-2">
                                       {canPractice && canAccessFigure(figure) ? (
                                         isCompleted ? (
                                           <div className="bg-green-500 rounded-full p-1">
                                             <CheckCircle className="w-4 h-4 text-white" />
                                           </div>
                                         ) : (
                                           <div className="bg-gray-600 rounded-full p-1">
                                             <Circle className="w-4 h-4 text-white" />
                                           </div>
                                         )
                                       ) : !canAccessFigure(figure) ? (
                                         <div className="bg-yellow-500 rounded-full p-1">
                                           <Crown className="w-4 h-4 text-white" />
                                         </div>
                                       ) : (
                                         <div className="bg-red-500 rounded-full p-1">
                                           <Lock className="w-4 h-4 text-white" />
                                         </div>
                                       )}
                                     </div>
                                  </div>

                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className="font-semibold text-white text-sm leading-tight">{figure.name}</h4>
                                  </div>
                                  
                                  {figure.description && (
                                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                      {figure.description}
                                    </p>
                                  )}
                                  
                                  <div className="flex items-center justify-between">
                                    {progress && (
                                      <Badge 
                                        className={`text-xs ${
                                          progress.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                                          progress.status === 'for_later' ? 'bg-blue-500/20 text-blue-400' :
                                          progress.status === 'failed' ? 'bg-red-500/20 text-red-400' :
                                          'bg-gray-500/20 text-gray-400'
                                        }`}
                                      >
                                        {progress.status === 'completed' ? '✅ Complete' :
                                         progress.status === 'for_later' ? '📝 For Later' :
                                         progress.status === 'failed' ? '❌ Failed' :
                                         progress.status}
                                      </Badge>
                                    )}
                                    
                                    {figure.difficulty_level && (
                                      <Badge variant="outline" className="text-xs">
                                        {figure.difficulty_level}
                                      </Badge>
                                    )}
                                   </div>

                                    {/* Completion Status Buttons - Show for unlocked levels and accessible figures */}
                                    {canPractice && canAccessFigure(figure) && (
                                      <div className="mt-3 space-y-2">
                                        {/* Quick Status Buttons */}
                                        <div className="flex gap-1">
                                          <Button
                                            size="sm"
                                            variant={progress?.status === 'completed' ? 'default' : 'outline'}
                                            className="flex-1 text-xs h-6 px-1"
                                            onClick={(e) => updateFigureStatus(figure.id, 'completed', e)}
                                            disabled={updatingStatus === figure.id}
                                          >
                                            <CheckCircle className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={progress?.status === 'for_later' ? 'default' : 'outline'}
                                            className="flex-1 text-xs h-6 px-1"
                                            onClick={(e) => updateFigureStatus(figure.id, 'for_later', e)}
                                            disabled={updatingStatus === figure.id}
                                          >
                                            <Bookmark className="w-3 h-3" />
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant={progress?.status === 'failed' ? 'default' : 'outline'}
                                            className="flex-1 text-xs h-6 px-1"
                                            onClick={(e) => updateFigureStatus(figure.id, 'failed', e)}
                                            disabled={updatingStatus === figure.id}
                                          >
                                            <AlertCircle className="w-3 h-3" />
                                          </Button>
                                        </div>
                                        
                                        {/* Action Buttons */}
                                        <div className="flex gap-2">
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="flex-1 text-xs h-8"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleFigureClick(figure, canPractice);
                                            }}
                                          >
                                            <Eye className="w-3 h-3 mr-1" />
                                            Preview
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="ghost"
                                            className="text-xs h-8 px-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              if (canAccessFigure(figure)) {
                                                navigate(`/exercise/${figure.id}`);
                                              } else {
                                                toast({
                                                  title: "Premium Required",
                                                  description: "This exercise requires a premium subscription to access.",
                                                  variant: "destructive",
                                                });
                                              }
                                            }}
                                          >
                                            <ExternalLink className="w-3 h-3" />
                                          </Button>
                                        </div>
                                      </div>
                                    )}

                                   {/* Premium Block for Free Users */}
                                   {canPractice && requiresPremiumAccess(figure) && !hasPremiumAccess && (
                                     <div className="mt-3 text-center bg-yellow-500/10 border border-yellow-400/20 rounded p-2">
                                       <Crown className="w-4 h-4 mx-auto text-yellow-400 mb-1" />
                                       <p className="text-xs text-yellow-400">
                                         Premium Required
                                       </p>
                                       <p className="text-xs text-yellow-300">
                                         Upgrade to access
                                       </p>
                                     </div>
                                   )}
                                   
                                   {!canPractice && (
                                     <div className="mt-3 text-center bg-red-500/10 border border-red-400/20 rounded p-2">
                                       <Lock className="w-4 h-4 mx-auto text-red-400 mb-1" />
                                       <p className="text-xs text-red-400">
                                         Need {level.point_limit} points
                                       </p>
                                       <p className="text-xs text-red-300">
                                         Preview only
                                       </p>
                                     </div>
                                   )}
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              );
            })
          )}
        </div>

        {/* Figure Preview Modal */}
        {selectedFigure && (
          <FigurePreviewModal
            figure={selectedFigure}
            isOpen={isPreviewModalOpen}
            onClose={handleClosePreviewModal}
          />
        )}
      </div>
    </div>
  );
};

export default SkillTree;