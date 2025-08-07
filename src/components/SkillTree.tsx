import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ArrowLeft, Lock, CheckCircle, Circle, Star, Crown } from "lucide-react";
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

interface UserProgress {
  figure_id: string;
  status: string;
}

interface SkillTreeProps {
  sportCategory: string;
  sportName: string;
  onBack: () => void;
}

const LEVEL_ORDER = ['Beginner', 'Intermediate', 'Advanced'];
const LEVEL_COLORS = {
  'Beginner': 'from-green-500/20 to-emerald-500/20 border-green-400',
  'Intermediate': 'from-yellow-500/20 to-orange-500/20 border-yellow-400',
  'Advanced': 'from-red-500/20 to-pink-500/20 border-red-400'
};

const SkillTree = ({ sportCategory, sportName, onBack }: SkillTreeProps) => {
  const { user } = useAuth();
  const [figures, setFigures] = useState<Figure[]>([]);
  const [userProgress, setUserProgress] = useState<UserProgress[]>([]);
  const [userLevel, setUserLevel] = useState<string>('Beginner');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFiguresAndProgress();
    fetchUserLevel();
  }, [sportCategory, user]);

  const fetchFiguresAndProgress = async () => {
    if (!user) return;

    try {
      // Fetch figures for this sport category
      const { data: figuresData, error: figuresError } = await supabase
        .from('figures')
        .select('id, name, description, difficulty_level, image_url, category')
        .eq('category', sportCategory)
        .order('difficulty_level', { ascending: true })
        .order('name', { ascending: true });

      if (figuresError) throw figuresError;

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from('figure_progress')
        .select('figure_id, status')
        .eq('user_id', user.id);

      if (progressError) throw progressError;

      setFigures(figuresData || []);
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
        // Convert to proper case
        const level = data.experience_level.charAt(0).toUpperCase() + data.experience_level.slice(1).toLowerCase();
        setUserLevel(level);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const getFigureProgress = (figureId: string) => {
    return userProgress.find(p => p.figure_id === figureId);
  };

  const isLevelUnlocked = (level: string) => {
    const currentLevelIndex = LEVEL_ORDER.indexOf(userLevel);
    const levelIndex = LEVEL_ORDER.indexOf(level);
    return levelIndex <= currentLevelIndex;
  };

  const getFiguresByLevel = (level: string) => {
    return figures.filter(f => f.difficulty_level === level);
  };

  const getLevelProgress = (level: string) => {
    const levelFigures = getFiguresByLevel(level);
    if (levelFigures.length === 0) return 0;
    
    const completedFigures = levelFigures.filter(figure => {
      const progress = getFigureProgress(figure.id);
      return progress?.status === 'mastered' || progress?.status === 'learned';
    });
    
    return Math.round((completedFigures.length / levelFigures.length) * 100);
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
          {LEVEL_ORDER.map((level, index) => {
            const isUnlocked = isLevelUnlocked(level);
            const progress = getLevelProgress(level);
            const figureCount = getFiguresByLevel(level).length;
            
            return (
              <Card
                key={level}
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
                      <h3 className="text-xl font-bold text-white">{level}</h3>
                    </div>
                    {level === userLevel && <Crown className="w-6 h-6 text-yellow-400" />}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{figureCount} figures</span>
                      <span className="text-muted-foreground">{progress}%</span>
                    </div>
                    <Progress value={isUnlocked ? progress : 0} className="h-2" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Skill Tree by Levels */}
        <div className="space-y-8">
          {LEVEL_ORDER.map((level) => {
            const levelFigures = getFiguresByLevel(level);
            const isUnlocked = isLevelUnlocked(level);
            
            if (levelFigures.length === 0) return null;

            return (
              <Card key={level} className={`glass-effect border-white/10 ${!isUnlocked ? 'opacity-60' : ''}`}>
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-3">
                    {isUnlocked ? (
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    ) : (
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    )}
                    <span>{level} Level</span>
                    <Badge variant="secondary">{levelFigures.length} figures</Badge>
                    {!isUnlocked && (
                      <Badge className="bg-red-500/20 text-red-400">
                        Locked - Master {LEVEL_ORDER[LEVEL_ORDER.indexOf(level) - 1] || 'previous'} level first
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {levelFigures.map((figure) => {
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
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SkillTree;