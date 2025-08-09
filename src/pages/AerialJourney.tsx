import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, TreePine, Eye, EyeOff, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SkillTree from "@/components/SkillTree";
import SportLevelManager from "@/components/SportLevelManager";
import SportCategoryManager from "@/components/SportCategoryManager";

interface UserJourney {
  id: string;
  user_id: string;
  sport_type: string;
  experience_level: string;
  goals: string[];
  created_at: string;
  updated_at: string;
  current_streak: number;
  total_points: number;
  badges_earned: string[];
}
interface SportCategory {
  id: string;
  key_name?: string;
  name: string;
  description?: string;
  icon?: string;
  image_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  count?: number;
  userPoints?: number;
  totalLevels?: number;
  unlockedLevels?: number;
}

const AerialJourney = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [availableSports, setAvailableSports] = useState<SportCategory[]>([]);
  const [userSelectedSports, setUserSelectedSports] = useState<string[]>([]);
  const [selectedSkillTreeSport, setSelectedSkillTreeSport] = useState<{
    category: string;
    name: string;
  } | null>(null);
  const [showLevelManager, setShowLevelManager] = useState(false);
  const [showSportManager, setShowSportManager] = useState(false);

  useEffect(() => {
    fetchAvailableSports();
    fetchUserProfile();
  }, [user, navigate]);

  const fetchAvailableSports = async () => {
    try {
      // Fetch sport categories from the new table
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("sport_categories")
        .select("*")
        .order("name");

      if (categoriesError) throw categoriesError;

      // For each sport category, get figure counts and level information
      const sportsArray = await Promise.all(
        (categoriesData || []).map(async (category) => {
          // Count figures in this category
          const { data: figuresData } = await supabase
            .from("figures")
            .select("id")
            .eq("category", category.key_name);

          const count = figuresData?.length || 0;

          // Get levels for this category
          const { data: levelsData } = await supabase
            .from("sport_levels")
            .select("id, level_number, point_limit")
            .eq("sport_category", category.key_name)
            .order("level_number", { ascending: true });

          const totalLevels = levelsData?.length || 0;

          // Calculate user points for this specific sport category using the same logic as SkillTree
          let userPoints = 0;
          let unlockedLevels = 0;

          if (user && levelsData && levelsData.length > 0) {
            // Get all completed figures for this sport category with their level information
            const { data: progressData } = await supabase
              .from("figure_progress")
              .select(
                `
                status,
                figure_id,
                figures!inner(
                  id,
                  category,
                  level_figures!inner(
                    level_id
                  )
                )
              `
              )
              .eq("user_id", user.id)
              .eq("status", "completed")
              .eq("figures.category", category.key_name);

            // Calculate points iteratively, level by level (same as SkillTree)
            for (const level of levelsData) {
              // Check if this level is unlocked based on current calculated points
              if (userPoints >= level.point_limit) {
                unlockedLevels++;

                // Count points from completed figures in this unlocked level
                const levelFigures =
                  progressData?.filter((progress) => {
                    const levelId =
                      progress.figures?.level_figures?.[0]?.level_id;
                    return levelId === level.id;
                  }) || [];

                // Add points for each completed figure in this level
                levelFigures.forEach(() => {
                  userPoints += 1 * level.level_number; // 1 point × level number
                });
              }
            }
          }

          return {
            ...category,
            count,
            userPoints,
            totalLevels,
            unlockedLevels,
          } as SportCategory;
        })
      );

      setAvailableSports(sportsArray);
    } catch (error) {
      console.error("Error fetching sports:", error);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("sports")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserSelectedSports(data?.sports || []);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

  const handlePublishToggle = async (
    sportId: string,
    currentStatus: boolean
  ) => {
    try {
      const { error } = await supabase
        .from("sport_categories")
        .update({ is_published: !currentStatus })
        .eq("id", sportId);

      if (error) throw error;

      // Update local state
      setAvailableSports((prev) =>
        prev.map((sport) =>
          sport.id === sportId
            ? { ...sport, is_published: !currentStatus }
            : sport
        )
      );

      toast.success(
        `Sport ${!currentStatus ? "published" : "unpublished"} successfully`
      );
    } catch (error) {
      console.error("Error updating sport status:", error);
      toast.error("Failed to update sport status");
    }
  };

  const handleSkillTreeView = (category: string, name: string) => {
    setSelectedSkillTreeSport({ category, name });
  };

  // Filter sports based on user role and selected sports
  const filteredSports = isAdmin
    ? availableSports // Admins see all sports
    : availableSports.filter((sport) => {
        // Regular users see only published sports that they have selected in their profile
        const isPublished = sport.is_published;
        const isUserSport = userSelectedSports.includes(sport.id);
        return isPublished && isUserSport;
      });

  // Show level manager if selected
  if (showLevelManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <SportLevelManager onClose={() => setShowLevelManager(false)} />
        </div>
      </div>
    );
  }

  // Show sport category manager if selected
  if (showSportManager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <SportCategoryManager onClose={() => setShowSportManager(false)} />
        </div>
      </div>
    );
  }

  // Show skill tree if sport is selected
  if (selectedSkillTreeSport) {
    return (
      <SkillTree
        sportCategory={selectedSkillTreeSport.category}
        sportName={selectedSkillTreeSport.name}
        onBack={() => setSelectedSkillTreeSport(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        <Button
          variant="ghost"
          onClick={() => navigate("/home")}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Aerial Journey
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Master aerial skills through gamified progression
          </p>
        </div>

        {/* Available Sports */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-white flex items-center mb-2">
                  Explore Skill Trees by Sport
                  {isAdmin && (
                    <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                      Admin View
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-muted-foreground">
                  {isAdmin
                    ? "All sports (published and draft). Use switches to publish/unpublish sports."
                    : "Click on any sport to see its complete skill tree and your progression"}
                </p>
              </div>
              {isAdmin && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowSportManager(true)}
                    className="border-green-400/30 text-green-400 hover:bg-green-400/10"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Sports
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowLevelManager(true)}
                    className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Manage Levels
                  </Button>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredSports.length === 0 ? (
              <div className="text-center py-12">
                <TreePine className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  No Sports Available
                </h3>
                <p className="text-muted-foreground">
                  {isAdmin
                    ? "No sport categories have been created yet. Use the Manage Sports button to add some."
                    : userSelectedSports.length === 0
                    ? "You haven't selected any sports yet. Please go to your profile and choose the sports you want to train in."
                    : "No sports from your selection are currently published. Check back later!"}
                </p>
                {!isAdmin && userSelectedSports.length === 0 && (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/home")}
                    className="mt-4 border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                  >
                    Go to Home Page
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSports.map((sport) => {
                  const displayName = sport.name;
                  const icon = sport.icon;
                  const hasLevels = (sport.totalLevels || 0) > 0;
                  const progressPercentage = hasLevels
                    ? Math.round(
                        ((sport.unlockedLevels || 0) /
                          (sport.totalLevels || 1)) *
                          100
                      )
                    : 0;

                  return (
                    <Card
                      key={sport.id}
                      className={`relative cursor-pointer hover:scale-105 transition-all duration-300 ${
                        sport.is_published
                          ? "bg-white/5 border-white/10 hover:border-purple-400/50"
                          : "bg-orange-500/5 border-orange-400/20 hover:border-orange-400/50"
                      }`}
                      onClick={() =>
                        handleSkillTreeView(sport.key_name, displayName)
                      }
                    >
                      <CardContent className="p-6">
                        {/* Admin Controls */}
                        {isAdmin && (
                          <div className="absolute top-3 right-3 flex items-center space-x-2">
                            <div className="flex items-center space-x-1 bg-black/50 rounded-lg px-2 py-1">
                              {sport.is_published ? (
                                <Eye className="w-3 h-3 text-green-400" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-orange-400" />
                              )}
                              <Switch
                                checked={sport.is_published}
                                onCheckedChange={() =>
                                  handlePublishToggle(
                                    sport.id,
                                    sport.is_published
                                  )
                                }
                                onClick={(e) => e.stopPropagation()}
                                className="scale-75"
                              />
                            </div>
                          </div>
                        )}

                        {/* Status Badge */}
                        {isAdmin && (
                          <div className="mb-3">
                            <Badge
                              className={`text-xs ${
                                sport.is_published
                                  ? "bg-green-500/20 text-green-400 border-green-400/30"
                                  : "bg-orange-500/20 text-orange-400 border-orange-400/30"
                              }`}
                            >
                              {sport.is_published ? "Published" : "Draft"}
                            </Badge>
                          </div>
                        )}

                        <div className="text-center mb-4">
                          <div className="text-4xl mb-3">{icon}</div>
                          <h3 className="font-semibold text-white text-lg mb-2">
                            {displayName}
                          </h3>
                          {sport.description && (
                            <p className="text-sm text-muted-foreground">
                              {sport.description}
                            </p>
                          )}
                        </div>

                        <div className="space-y-3">
                          {/* Points Display */}
                          {user && (
                            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-400/20 rounded-lg p-3">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-yellow-400 font-medium">
                                  Your Points
                                </span>
                                <Badge className="bg-yellow-500/20 text-yellow-400">
                                  💰 {sport.userPoints || 0}
                                </Badge>
                              </div>
                            </div>
                          )}

                          {/* Level Progress */}
                          {hasLevels && user && (
                            <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-400/20 rounded-lg p-3">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-purple-400 font-medium">
                                  Level Progress
                                </span>
                                <span className="text-xs text-purple-300">
                                  {sport.unlockedLevels}/{sport.totalLevels}{" "}
                                  unlocked
                                </span>
                              </div>
                              <Progress
                                value={progressPercentage}
                                className="h-2"
                              />
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">
                              Available Figures
                            </span>
                            <Badge variant="secondary">
                              {sport.count || 0}
                            </Badge>
                          </div>

                          {hasLevels && (
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">
                                Skill Levels
                              </span>
                              <Badge variant="outline">
                                {sport.totalLevels}
                              </Badge>
                            </div>
                          )}

                          <Button
                            variant="primary"
                            className="w-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSkillTreeView(sport.key_name, displayName);
                            }}
                            disabled={!sport.is_published && !isAdmin}
                          >
                            {sport.is_published || isAdmin
                              ? "View Skill Tree"
                              : "Coming Soon"}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AerialJourney;
