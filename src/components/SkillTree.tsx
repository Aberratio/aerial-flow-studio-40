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
  const [userLevel, setUserLevel] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSportLevelsAndProgress();
    fetchUserLevel();
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

  const fetchUserLevel = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_journeys')
        .select('experience_level')
        .eq('user_id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user level:', error);
        return;
      }

      if (data?.experience_level) {
        // Convert experience level to number (for simplicity, assume beginner=0, intermediate=1, advanced=2)
        const levelMap: Record<string, number> = {
          'beginner': 0,
          'intermediate': 1,
          'advanced': 2,
          'professional': 3
        };
        setUserLevel(levelMap[data.experience_level.toLowerCase()] || 0);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getFigureProgress = (figureId: string) => {
    return userProgress.find(p => p.figure_id === figureId);
  };

  const isLevelUnlocked = (levelNumber: number) => {
    return levelNumber <= userLevel;
  };

  const getLevelProgress = (level: SportLevel) => {
    if (level.figures.length === 0) return 0;
    
    const completedFigures = level.figures.filter(figure => {
      const progress = getFigureProgress(figure.id);
      return progress?.status === 'mastered' || progress?.status === 'learned';
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
          <div className="flex items-center space-x-4">
            <Badge className="bg-purple-500/20 text-purple-400">
              Your Level: {userLevel}
            </Badge>
            <p className="text-muted-foreground">
              Progress through levels by mastering figures
            </p>
          </div>
        </div>

        {/* Level Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {sportLevels.map((level) => {
            const isUnlocked = isLevelUnlocked(level.level_number);
            const progress = getLevelProgress(level);
            const figureCount = level.figures.length;
            
            return (
              <Card
                key={level.id}
                className={`glass-effect border-white/10 ${!isUnlocked ? 'opacity-50' : ''}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {isUnlocked ? (
                        <CheckCircle className="w-6 h-6 text-green-400" />
                      ) : (
                        <Lock className="w-6 h-6 text-muted-foreground" />
                      )}
                      <h3 className="text-xl font-bold text-white">{level.level_name}</h3>
                    </div>
                    {level.level_number === userLevel && <Crown className="w-6 h-6 text-yellow-400" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{figureCount} figures</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={isUnlocked ? progress : 0} className="h-2" />
                  </div>
                  
                  <div className="mt-3 text-xs text-muted-foreground">
                    Level {level.level_number}
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
              const isUnlocked = isLevelUnlocked(level.level_number);
              
              return (
                <Card key={level.id} className={`glass-effect border-white/10 ${!isUnlocked ? 'opacity-60' : ''}`}>
                  <CardHeader>
                    <CardTitle className="text-white flex items-center space-x-3">
                      {isUnlocked ? (
                        <CheckCircle className="w-5 h-5 text-green-400" />
                      ) : (
                        <Lock className="w-5 h-5 text-muted-foreground" />
                      )}
                      <span>{level.level_name} (Level {level.level_number})</span>
                      <Badge variant="secondary">{level.figures.length} figures</Badge>
                      {!isUnlocked && (
                        <Badge className="bg-red-500/20 text-red-400">
                          Locked - Complete previous level first
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
                          const isCompleted = progress?.status === 'mastered' || progress?.status === 'learned';
                          
                          return (
                            <Card
                              key={figure.id}
                              className={`transition-all duration-300 ${
                                isUnlocked
                                  ? isCompleted
                                    ? 'bg-green-500/10 border-green-400/50 hover:scale-105'
                                    : 'bg-white/5 border-white/10 hover:border-purple-400/50 hover:scale-105'
                                  : 'bg-gray-900/50 border-gray-700/50 cursor-not-allowed'
                              }`}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="font-semibold text-white text-sm">{figure.name}</h4>
                                  <div className="flex items-center space-x-1">
                                    {isUnlocked ? (
                                      isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-green-400" />
                                      ) : (
                                        <Circle className="w-4 h-4 text-muted-foreground" />
                                      )
                                    ) : (
                                      <Lock className="w-4 h-4 text-muted-foreground" />
                                    )}
                                  </div>
                                </div>
                                
                                {figure.description && (
                                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                                    {figure.description}
                                  </p>
                                )}
                                
                                {progress && (
                                  <Badge 
                                    className={`text-xs ${
                                      progress.status === 'mastered' ? 'bg-green-500/20 text-green-400' :
                                      progress.status === 'learned' ? 'bg-blue-500/20 text-blue-400' :
                                      progress.status === 'practicing' ? 'bg-yellow-500/20 text-yellow-400' :
                                      'bg-gray-500/20 text-gray-400'
                                    }`}
                                  >
                                    {progress.status}
                                  </Badge>
                                )}
                                
                                {!isUnlocked && (
                                  <div className="mt-2 text-center">
                                    <Lock className="w-6 h-6 mx-auto text-muted-foreground" />
                                    <p className="text-xs text-muted-foreground mt-1">Locked</p>
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