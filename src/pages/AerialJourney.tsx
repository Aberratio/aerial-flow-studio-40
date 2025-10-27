import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Eye, EyeOff, Settings, BookOpen, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import SportSelectionModal from "@/components/SportSelectionModal";

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
  const [tempSelectedSports, setTempSelectedSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showSportSelectionModal, setShowSportSelectionModal] = useState(false);

  useEffect(() => {
    fetchAvailableSports();
    fetchUserProfile();
  }, [user, navigate]);

  // No need for auto-open modal - we'll show inline selection instead

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
    } finally {
      setLoading(false);
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
    if (isAdmin && isAdminMode) {
      navigate(`/aerial-journey/admin/${category}`);
    } else {
      navigate(`/aerial-journey/sport/${category}`);
    }
  };

  const handleSportSelectionSuccess = () => {
    fetchUserProfile();
    fetchAvailableSports();
  };

  // Filter sports based on user role and selected sports
  const filteredSports =
    isAdmin && isAdminMode
      ? availableSports // Admins in admin mode see all sports
      : availableSports.filter((sport) => {
          // Regular users or admins in user mode see only published sports that they have selected in their profile
          const isPublished = sport.is_published;
          const isUserSport = userSelectedSports.includes(sport.id);
          return isPublished && isUserSport;
        });

  // Remove conditional rendering for level manager, sport manager, and skill tree
  // since they're now handled by routing

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show inline sport selection for users without selected sports
  if (!loading && !isAdminMode && userSelectedSports.length === 0 && user) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10">
        <div className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              Witaj w Twojej Podróży!
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground">
              Wybierz sporty, które Cię interesują, aby rozpocząć
            </p>
          </div>

          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white text-center">
                Wybierz swoje sporty
              </CardTitle>
            </CardHeader>
            <CardContent>
              {availableSports.filter(s => s.is_published).length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">
                    Brak dostępnych sportów. Sprawdź ponownie później!
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    {availableSports
                      .filter(sport => sport.is_published)
                      .map((sport) => {
                        const isSelected = tempSelectedSports.includes(sport.id);
                        return (
                          <Card
                            key={sport.id}
                            className={`cursor-pointer transition-all duration-200 ${
                              isSelected
                                ? "bg-purple-500/20 border-purple-400/50 scale-105"
                                : "bg-white/5 border-white/10 hover:border-purple-400/30"
                            }`}
                            onClick={() => {
                              setTempSelectedSports(prev =>
                                prev.includes(sport.id)
                                  ? prev.filter(id => id !== sport.id)
                                  : [...prev, sport.id]
                              );
                            }}
                          >
                            <CardContent className="p-4 text-center">
                              <div className="text-3xl md:text-4xl mb-2">{sport.icon}</div>
                              <h3 className="font-semibold text-white text-sm md:text-base">
                                {sport.name}
                              </h3>
                              {sport.description && (
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {sport.description}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                  </div>

                  <div className="flex justify-center">
                    <Button
                      onClick={async () => {
                        if (tempSelectedSports.length === 0) {
                          toast.error("Wybierz przynajmniej jeden sport");
                          return;
                        }
                        
                        try {
                          const { error } = await supabase
                            .from("profiles")
                            .update({ sports: tempSelectedSports })
                            .eq("id", user.id);

                          if (error) throw error;

                          toast.success("Sporty zapisane!");
                          setUserSelectedSports(tempSelectedSports);
                          fetchAvailableSports();
                        } catch (error) {
                          console.error("Error saving sports:", error);
                          toast.error("Nie udało się zapisać sportów");
                        }
                      }}
                      disabled={tempSelectedSports.length === 0}
                      size="lg"
                      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                    >
                      Potwierdź wybór ({tempSelectedSports.length})
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10">
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="flex items-center justify-between mb-6">
          <div></div>

          {isAdmin && (
            <div className="flex items-center gap-3 bg-black/20 rounded-lg px-4 py-2 border border-white/10">
              <span className="text-sm text-white">User Mode</span>
              <Switch
                checked={isAdminMode}
                onCheckedChange={setIsAdminMode}
                className="data-[state=checked]:bg-yellow-500"
              />
              <span className="text-sm text-white">Admin Mode</span>
            </div>
          )}
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Twoja Podróż
          </h1>
        </div>

        {/* Available Sports */}
        <Card className="glass-effect border-white/10">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <CardTitle className="text-white flex items-center mb-2">
                  Odkrywaj umiejętności według sportu
                  {isAdmin && isAdminMode && (
                    <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-400/30">
                      Widok admina
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-muted-foreground">
                  {isAdmin && isAdminMode
                    ? "Wszystkie sporty (opublikowane i wersje robocze). Użyj przełączników, aby publikować/odpublikować sporty."
                    : "Kliknij na dowolny sport, aby zobaczyć pełne drzewo umiejętności i swoją progresję"}
                </p>
              </div>
              {!isAdminMode && userSelectedSports.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSportSelectionModal(true)}
                  className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edytuj sporty
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {filteredSports.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Brak dostępnych sportów
                </h3>
                <p className="text-muted-foreground">
                  {isAdmin && isAdminMode
                    ? "Nie utworzono jeszcze żadnych kategorii sportowych. Użyj przycisku Zarządzaj sportami, aby dodać."
                    : userSelectedSports.length === 0
                    ? "Nie wybrałeś jeszcze żadnych sportów. Użyj modala wyboru sportów, aby dodać."
                    : "Żaden sport z twojego wyboru nie jest obecnie opublikowany. Sprawdź ponownie później!"}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
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
                        (sport.unlockedLevels || 0) > 0 ||
                        (isAdmin && isAdminMode)
                          ? sport.is_published
                            ? "bg-white/5 border-white/10 hover:border-purple-400/50"
                            : "bg-orange-500/5 border-orange-400/20 hover:border-orange-400/50"
                          : "bg-gray-900/50 border-gray-600/20 opacity-60 cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (
                          (sport.unlockedLevels || 0) > 0 ||
                          (isAdmin && isAdminMode)
                        ) {
                          handleSkillTreeView(sport.key_name!, displayName);
                        }
                      }}
                    >
                      <CardContent className="p-4 md:p-6">
                        {/* Admin Controls */}
                        {isAdmin && isAdminMode && (
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
                        {isAdmin && isAdminMode && (
                          <div className="mb-3">
                            <Badge
                              className={`text-xs ${
                                sport.is_published
                                  ? "bg-green-500/20 text-green-400 border-green-400/30"
                                  : "bg-orange-500/20 text-orange-400 border-orange-400/30"
                              }`}
                            >
                              {sport.is_published
                                ? "Opublikowane"
                                : "Wersja robocza"}
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

                        <div className="space-y-2">
                          {/* Badge/Achievement System */}
                          {user && (
                            <div className="flex items-center justify-center mb-3">
                              {(sport.unlockedLevels || 0) > 0 ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-8 h-8 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 flex items-center justify-center text-black font-bold text-sm">
                                    {sport.unlockedLevels}
                                  </div>
                                  <span className="text-yellow-400 font-semibold text-sm">
                                    Poziom {sport.unlockedLevels}
                                  </span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 opacity-50">
                                  <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-gray-400 font-bold text-sm">
                                    ?
                                  </div>
                                  <span className="text-gray-400 text-sm">
                                    Zablokowane
                                  </span>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Simple progress bar - only show if user has progress */}
                          {hasLevels &&
                            user &&
                            (sport.unlockedLevels || 0) > 0 && (
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div
                                  className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                                  style={{ width: `${progressPercentage}%` }}
                                />
                              </div>
                            )}

                          {/* Only show figure count if not locked */}
                          {(sport.unlockedLevels || 0) > 0 ? (
                            <div className="text-center">
                              <span className="text-xs text-muted-foreground">
                                {sport.count} dostępnych figur
                              </span>
                            </div>
                          ) : (
                            <div className="text-center">
                              <span className="text-xs text-gray-500">
                                Ukończ inne sporty, aby odblokować
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <SportSelectionModal
          isOpen={showSportSelectionModal}
          onClose={() => setShowSportSelectionModal(false)}
          onSuccess={handleSportSelectionSuccess}
          preSelectedSports={userSelectedSports}
        />
      </div>
    </div>
  );
};

export default AerialJourney;
