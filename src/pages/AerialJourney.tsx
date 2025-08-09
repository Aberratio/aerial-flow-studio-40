import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Star,
  Trophy,
  Target,
  Zap,
  Crown,
  Award,
  Medal,
  TreePine,
  Users,
  Activity,
  Eye,
  EyeOff,
  Settings,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
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

const SPORT_OPTIONS = [
  {
    id: "hoop",
    name: "Aerial Hoop (Lyra)",
    icon: "🪩",
    description: "Graceful circular apparatus",
  },
  {
    id: "pole",
    name: "Pole Dancing",
    icon: "💃",
    description: "Dynamic vertical performance",
  },
  {
    id: "silks",
    name: "Aerial Silks",
    icon: "🎪",
    description: "Flowing fabric artistry",
  },
  {
    id: "hammock",
    name: "Aerial Hammock",
    icon: "🏺",
    description: "Gentle supported practice",
  },
  {
    id: "trapeze",
    name: "Flying Trapeze",
    icon: "🤸",
    description: "High-flying acrobatics",
  },
  {
    id: "straps",
    name: "Aerial Straps",
    icon: "💪",
    description: "Upper body strength focus",
  },
  {
    id: "general",
    name: "General Fitness",
    icon: "💪",
    description: "Just want to be strong and healthy",
  },
];

const EXPERIENCE_LEVELS = [
  { id: "beginner", name: "Beginner", description: "New to aerial arts" },
  {
    id: "intermediate",
    name: "Intermediate",
    description: "Some experience with basics",
  },
  {
    id: "advanced",
    name: "Advanced",
    description: "Confident with complex moves",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Teaching or performing level",
  },
];

const GOALS = [
  { id: "strength", name: "Build Strength", icon: "💪" },
  { id: "flexibility", name: "Improve Flexibility", icon: "🤸" },
  { id: "performance", name: "Performance Skills", icon: "🎭" },
  { id: "confidence", name: "Build Confidence", icon: "✨" },
  { id: "community", name: "Connect with Community", icon: "👥" },
  { id: "compete", name: "Competition Ready", icon: "🏆" },
];

const ACHIEVEMENT_BADGES = [
  {
    id: "first_week",
    name: "First Week",
    icon: "🌟",
    description: "Completed your first week",
  },
  {
    id: "consistency",
    name: "Consistency King",
    icon: "👑",
    description: "7 day training streak",
  },
  {
    id: "strength_warrior",
    name: "Strength Warrior",
    icon: "⚔️",
    description: "Completed 50 strength exercises",
  },
  {
    id: "flexibility_master",
    name: "Flexibility Master",
    icon: "🧘",
    description: "Mastered 10 flexibility moves",
  },
  {
    id: "social_butterfly",
    name: "Social Butterfly",
    icon: "🦋",
    description: "Connected with 5 aerial friends",
  },
];

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
  const { hasPremiumAccess } = useSubscriptionStatus();
  const [currentStep, setCurrentStep] = useState(0); // Start with main view
  const [userJourney, setUserJourney] = useState<UserJourney | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableSports, setAvailableSports] = useState<SportCategory[]>([]);
  const [selectedSkillTreeSport, setSelectedSkillTreeSport] = useState<{
    category: string;
    name: string;
  } | null>(null);
  const [showLevelManager, setShowLevelManager] = useState(false);
  const [showSportManager, setShowSportManager] = useState(false);

  // Form state
  const [selectedSport, setSelectedSport] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("");
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);

  useEffect(() => {
    checkExistingJourney();
    fetchAvailableSports();
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

          // Calculate user points for this specific sport category
          let userPoints = 0;
          if (user) {
            // Get all completed figures in this category
            const { data: progressData } = await supabase
              .from("figure_progress")
              .select(
                `
                status,
                figures!inner(
                  id,
                  category,
                  level_figures!inner(
                    sport_levels!inner(level_number)
                  )
                )
              `
              )
              .eq("user_id", user.id)
              .eq("status", "completed")
              .eq("figures.category", category.key_name);

            if (progressData) {
              userPoints = progressData.reduce((total, progress) => {
                // Get the level number for this figure
                const levelNumber =
                  progress.figures?.level_figures?.[0]?.sport_levels
                    ?.level_number || 1;
                return total + 1 * levelNumber; // 1 point × level number
              }, 0);
            }
          }

          const unlockedLevels =
            levelsData?.filter((level) => userPoints >= level.point_limit)
              .length || 0;

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

  const checkExistingJourney = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("user_journeys")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) {
        console.error("Error fetching journey:", error);
        return;
      }

      if (data) {
        setUserJourney(data);
        // Don't automatically go to dashboard, stay on main view
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSportSelect = (sportId: string) => {
    setSelectedSport(sportId);
    setCurrentStep(2);
  };

  const handleSkillTreeView = (category: string, name: string) => {
    setSelectedSkillTreeSport({ category, name });
  };

  // Filter sports based on user role
  const filteredSports = isAdmin
    ? availableSports // Admins see all sports
    : availableSports.filter((sport) => sport.is_published); // Regular users see only published sports

  const handleLevelSelect = (levelId: string) => {
    setSelectedLevel(levelId);
    setCurrentStep(3);
  };

  const handleGoalToggle = (goalId: string) => {
    setSelectedGoals((prev) =>
      prev.includes(goalId)
        ? prev.filter((g) => g !== goalId)
        : [...prev, goalId]
    );
  };

  const handleFinishSetup = async () => {
    if (!user || selectedGoals.length === 0) return;

    try {
      const { data, error } = await supabase
        .from("user_journeys")
        .insert({
          user_id: user.id,
          sport_type: selectedSport,
          experience_level: selectedLevel,
          goals: selectedGoals,
          current_streak: 0,
          total_points: 0,
          badges_earned: [],
        })
        .select()
        .single();

      if (error) throw error;

      setUserJourney(data);
      setCurrentStep(4);
      toast.success("Welcome to your Aerial Journey! 🎉");
    } catch (error) {
      console.error("Error creating journey:", error);
      toast.error("Failed to create your journey");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

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

  // Main View - Sports Overview
  if (currentStep === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
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

          {/* Action Cards */}
          {isAdmin && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="glass-effect border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:scale-105">
                <CardContent className="p-6 text-center">
                  <TreePine className="w-12 h-12 mx-auto mb-4 text-green-400" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Explore Skill Trees
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    View all sports and their progression paths
                  </p>
                </CardContent>
              </Card>

              <Card
                className="glass-effect border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => setCurrentStep(1)}
              >
                <CardContent className="p-6 text-center">
                  <Users className="w-12 h-12 mx-auto mb-4 text-blue-400" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Setup Journey
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Personalize your aerial training experience
                  </p>
                </CardContent>
              </Card>

              <Card
                className="glass-effect border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                onClick={() => setShowLevelManager(true)}
              >
                <CardContent className="p-6 text-center">
                  <Crown className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                  <h3 className="text-xl font-bold text-white mb-2">
                    Manage Levels
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    Admin: Create and manage sport levels
                  </p>
                </CardContent>
              </Card>

              {userJourney && (
                <Card
                  className="glass-effect border-white/10 hover:border-purple-400/50 transition-all duration-300 hover:scale-105 cursor-pointer"
                  onClick={() => setCurrentStep(4)}
                >
                  <CardContent className="p-6 text-center">
                    <Activity className="w-12 h-12 mx-auto mb-4 text-purple-400" />
                    <h3 className="text-xl font-bold text-white mb-2">
                      My Dashboard
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      View your progress and achievements
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Available Sports */}
          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center">
                    <TreePine className="w-5 h-5 mr-2" />
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
                      : "No sports are currently published. Check back later!"}
                  </p>
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
                              className="w-full bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-400/30 hover:from-purple-500/30 hover:to-pink-500/30 text-white"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSkillTreeView(
                                  sport.key_name,
                                  displayName
                                );
                              }}
                              disabled={!sport.is_published && !isAdmin}
                            >
                              <TreePine className="w-4 h-4 mr-2" />
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
  }

  // Welcome Step
  if (currentStep === 1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(0)}
            className="mb-6 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main View
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Aerial Journey
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Transform your aerial training into an exciting adventure
            </p>
          </div>

          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">
                Choose Your Aerial Discipline
              </CardTitle>
              <p className="text-muted-foreground">
                What type of aerial training are you passionate about?
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SPORT_OPTIONS.map((sport) => (
                  <Card
                    key={sport.id}
                    className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white/5 border-white/10 hover:border-purple-400/50"
                    onClick={() => handleSportSelect(sport.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-4xl mb-3">{sport.icon}</div>
                      <h3 className="font-semibold text-white mb-2">
                        {sport.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {sport.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Experience Level Step
  if (currentStep === 2) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(1)}
            className="mb-6 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="glass-effect border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">
                What's Your Experience Level?
              </CardTitle>
              <p className="text-muted-foreground">
                Help us customize your journey to your current skill level
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {EXPERIENCE_LEVELS.map((level) => (
                  <Card
                    key={level.id}
                    className="cursor-pointer hover:scale-105 transition-all duration-300 bg-white/5 border-white/10 hover:border-purple-400/50"
                    onClick={() => handleLevelSelect(level.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <h3 className="font-semibold text-white mb-2">
                        {level.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {level.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Goals Selection Step
  if (currentStep === 3) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(2)}
            className="mb-6 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Card className="glass-effect border-white/10">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl text-white">
                What Are Your Goals?
              </CardTitle>
              <p className="text-muted-foreground">
                Select all that apply to personalize your experience
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {GOALS.map((goal) => (
                  <Card
                    key={goal.id}
                    className={`cursor-pointer transition-all duration-300 ${
                      selectedGoals.includes(goal.id)
                        ? "bg-purple-500/20 border-purple-400 scale-105"
                        : "bg-white/5 border-white/10 hover:border-purple-400/50"
                    }`}
                    onClick={() => handleGoalToggle(goal.id)}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="text-3xl mb-2">{goal.icon}</div>
                      <h3 className="font-semibold text-white">{goal.name}</h3>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="text-center">
                <Button
                  onClick={handleFinishSetup}
                  disabled={selectedGoals.length === 0}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-8 py-3"
                >
                  Start My Journey ✨
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Journey Dashboard
  if (currentStep === 4 && userJourney) {
    const selectedSportInfo = SPORT_OPTIONS.find(
      (s) => s.id === userJourney.sport_type
    );
    const selectedLevelInfo = EXPERIENCE_LEVELS.find(
      (l) => l.id === userJourney.experience_level
    );

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900/20 via-pink-900/20 to-blue-900/20 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => setCurrentStep(0)}
            className="mb-6 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Main View
          </Button>

          <div className="mb-8">
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
              Your Aerial Journey
            </h1>
            <p className="text-muted-foreground">
              {selectedSportInfo?.name} • {selectedLevelInfo?.name}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="glass-effect border-white/10">
              <CardContent className="p-6 text-center">
                <Zap className="w-8 h-8 mx-auto mb-3 text-yellow-400" />
                <h3 className="text-2xl font-bold text-white">
                  {userJourney.current_streak}
                </h3>
                <p className="text-muted-foreground">Day Streak</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardContent className="p-6 text-center">
                <Star className="w-8 h-8 mx-auto mb-3 text-purple-400" />
                <h3 className="text-2xl font-bold text-white">
                  {userJourney.total_points}
                </h3>
                <p className="text-muted-foreground">Total Points</p>
              </CardContent>
            </Card>

            <Card className="glass-effect border-white/10">
              <CardContent className="p-6 text-center">
                <Award className="w-8 h-8 mx-auto mb-3 text-green-400" />
                <h3 className="text-2xl font-bold text-white">
                  {userJourney.badges_earned.length}
                </h3>
                <p className="text-muted-foreground">Badges Earned</p>
              </CardContent>
            </Card>
          </div>

          {/* Achievement Badges */}
          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Trophy className="w-5 h-5 mr-2" />
                Achievement Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {ACHIEVEMENT_BADGES.map((badge) => {
                  const isEarned = userJourney.badges_earned.includes(badge.id);
                  return (
                    <div
                      key={badge.id}
                      className={`text-center p-4 rounded-lg border transition-all ${
                        isEarned
                          ? "bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-yellow-400/50"
                          : "bg-white/5 border-white/10 opacity-50"
                      }`}
                    >
                      <div className="text-3xl mb-2">{badge.icon}</div>
                      <h4 className="font-semibold text-white text-sm mb-1">
                        {badge.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {badge.description}
                      </p>
                      {isEarned && (
                        <Badge className="mt-2 bg-yellow-500/20 text-yellow-400">
                          Earned!
                        </Badge>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Goals Progress */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <Target className="w-5 h-5 mr-2" />
                Your Goals Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userJourney.goals.map((goalId) => {
                  const goal = GOALS.find((g) => g.id === goalId);
                  if (!goal) return null;

                  // Mock progress for demo
                  const progress = Math.floor(Math.random() * 100);

                  return (
                    <div key={goalId} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span>{goal.icon}</span>
                          <span className="text-white font-medium">
                            {goal.name}
                          </span>
                        </div>
                        <span className="text-muted-foreground text-sm">
                          {progress}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default AerialJourney;
