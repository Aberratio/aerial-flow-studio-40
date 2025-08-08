import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Lock, CheckCircle, Circle, Crown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const [sportLevels, setSportLevels] = useState<SportLevel[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userPoints, setUserPoints] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSportLevelsAndProgress();
    fetchUserPoints();
  }, [sportCategory, user]);

  const fetchSportLevelsAndProgress = async () => {
    if (!user) return;

    try {
      // Fetch sport levels with their figures
      const { data: levelsData, error: levelsError } = await supabase
        .from('sport_levels')
        .select(`
          id,
          sport_category,
          level_number,
          level_name,
          point_limit,
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
        .order('level_number', { ascending: true });

      if (levelsError) throw levelsError;

      // Format the data to include figures directly in each level
      const formattedLevels = levelsData?.map(level => ({
        id: level.id,
        sport_category: level.sport_category,
        level_number: level.level_number,
        level_name: level.level_name,
        point_limit: level.point_limit,
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
      const { data, error } = await supabase
        .from('user_journeys')
        .select('total_points')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user points:', error);
        return;
      }

      setUserPoints(data?.total_points || 0);
    } catch (error) {
      console.error('Error:', error);
    }
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
              Complete figures to earn points and unlock new levels
            </p>
          </div>
          <Card className="glass-effect border-white/10 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Your Progress in {sportName}</span>
              <span className="text-white font-semibold">{userPoints} total points earned</span>
            </div>
          </Card>
        </div>

        {/* Level Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {sportLevels.map((level) => {
            const isUnlocked = isLevelUnlocked(level);
            const progress = getLevelProgress(level);
            const figureCount = level.figures.length;
            const pointsNeeded = getPointsForNextLevel(level);
            
            return (
              <Card
                key={level.id}
                className={`glass-effect border-white/10 transition-all duration-300 ${
                  isUnlocked 
                    ? 'border-green-400/30 bg-green-500/5' 
                    : 'opacity-70 border-red-400/30 bg-red-500/5'
                }`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {isUnlocked ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <Lock className="w-6 h-6 text-red-400" />
                      )}
                      <h3 className="text-lg font-bold text-white">{level.level_name}</h3>
                    </div>
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
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{figureCount} figures</span>
                      <span className="text-muted-foreground">{progress}% complete</span>
                    </div>
                    <Progress value={isUnlocked ? progress : 0} className="h-2" />
                    
                    {!isUnlocked && level.point_limit > 0 && (
                      <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <Lock className="w-4 h-4 text-red-400" />
                          <span className="text-red-400 font-medium">
                            Need {level.point_limit - userPoints} more points
                          </span>
                        </div>
                        <p className="text-xs text-red-300 mt-1">
                          Complete figures in unlocked levels to earn points
                        </p>
                      </div>
                    )}

                    {isUnlocked && (
                      <div className="bg-green-500/10 border border-green-400/20 rounded-lg p-3">
                        <div className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="w-4 h-4 text-green-400" />
                          <span className="text-green-400 font-medium">Unlocked!</span>
                        </div>
                        <p className="text-xs text-green-300 mt-1">
                          You can practice and complete all figures in this level
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    Level {level.level_number} • {level.point_limit} points required
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
              const pointsNeeded = level.point_limit - userPoints;
              
              return (
                <Card key={level.id} className={`glass-effect border-white/10 ${!isUnlocked ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center flex-wrap gap-3">
                      {isUnlocked ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-red-400" />
                      )}
                      <span>{level.level_name} (Level {level.level_number})</span>
                      <Badge variant="secondary">{level.figures.length} figures</Badge>
                      <Badge 
                        className={`${
                          isUnlocked 
                            ? 'bg-green-500/20 text-green-400' 
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {level.point_limit} points required
                      </Badge>
                      {!isUnlocked && pointsNeeded > 0 && (
                        <Badge className="bg-orange-500/20 text-orange-400">
                          Need {pointsNeeded} more points
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {level.figures.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">
                        No figures assigned to this level yet.
                      </p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
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
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-white text-sm">{figure.name}</h4>
                                  <div className="flex items-center space-x-1">
                                    {canPractice ? (
                                      isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground" />
                                      )
                                    ) : (
                                      <Lock className="w-4 h-4 text-red-400" />
                                    )}
                                  </div>
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
                                
                                {!canPractice && (
                                  <div className="mt-2 text-center bg-red-500/10 border border-red-400/20 rounded p-2">
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
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default SkillTree;