import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Lock,
  CheckCircle,
  Circle,
  Crown,
  Bookmark,
  AlertCircle,
  Trophy,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { FigurePreviewModal } from "@/components/FigurePreviewModal";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import BreadcrumbNavigation from "@/components/Layout/BreadcrumbNavigation";

interface Figure {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  image_url: string | null;
  category: string;
  hold_time_seconds?: number;
  video_url?: string;
  premium?: boolean;
  // Level-specific fields
  level_figure_id?: string;
  is_boss?: boolean;
  boss_description?: string;
  level_hold_time_seconds?: number;
  level_reps?: number;
  level_notes?: string;
  order_index?: number;
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
  onBack?: () => void;
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
  const [userChallengeParticipations, setUserChallengeParticipations] =
    useState<{
      [challengeId: string]: { participating: boolean; completed: boolean; status?: string };
    }>({});

  useEffect(() => {
    const loadData = async () => {
      await fetchSportLevelsAndProgress();
      const participations = await fetchUserChallengeParticipations();
      await fetchUserPoints(participations);
    };
    loadData();
  }, [sportCategory, user]);

  const fetchSportLevelsAndProgress = async () => {
    if (!user) return;

    try {
      // Fetch sport levels with their figures and challenges
      const { data: levelsData, error: levelsError } = await supabase
        .from("sport_levels")
        .select(
          `
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
            id,
            figure_id,
            order_index,
            is_boss,
            boss_description,
            hold_time_seconds,
            reps,
            notes,
            figures (
              id,
              name,
              description,
              difficulty_level,
              image_url,
              video_url,
              premium,
              category,
              hold_time_seconds
            )
          )
        `
        )
        .eq("sport_category", sportCategory)
        .eq("status", "published")
        .order("level_number", { ascending: true });

      if (levelsError) throw levelsError;

      // Format the data to include figures with level-specific parameters
      const formattedLevels =
        levelsData?.map((level) => ({
          id: level.id,
          sport_category: level.sport_category,
          level_number: level.level_number,
          level_name: level.level_name,
          point_limit: level.point_limit,
          challenge_id: level.challenge_id,
          challenges: level.challenges,
          figures:
            level.level_figures
              ?.sort((a: any, b: any) => a.order_index - b.order_index)
              ?.map((lf: any) => ({
                ...lf.figures,
                level_figure_id: lf.id,
                is_boss: lf.is_boss,
                boss_description: lf.boss_description,
                level_hold_time_seconds: lf.hold_time_seconds,
                level_reps: lf.reps,
                level_notes: lf.notes,
                order_index: lf.order_index,
              }))
              ?.filter(Boolean) || [],
        })) || [];

      setSportLevels(formattedLevels);

      // Fetch user progress
      const { data: progressData, error: progressError } = await supabase
        .from("figure_progress")
        .select("figure_id, status")
        .eq("user_id", user.id);

      if (progressError) throw progressError;

      setUserProgress(progressData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async (participations?: {
    [challengeId: string]: { participating: boolean; completed: boolean; status?: string };
  }) => {
    if (!user) return;

    try {
      // Use provided participations or current state
      const currentParticipations =
        participations || userChallengeParticipations;

      // Get all sport levels for this category, ordered by level number
      const { data: levelsData } = await supabase
        .from("sport_levels")
        .select("id, level_number, point_limit, challenge_id")
        .eq("sport_category", sportCategory)
        .eq("status", "published")
        .order("level_number", { ascending: true });

      if (!levelsData) {
        setUserPoints(0);
        return;
      }

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
        .eq("figures.category", sportCategory);

      let calculatedPoints = 0;

      // Calculate points iteratively, level by level
      // Start with level 1 (point_limit 0) and work our way up
      for (const level of levelsData) {
        // Check if this level is unlocked based on current calculated points
        if (calculatedPoints >= level.point_limit) {
          // Count points from completed figures in this unlocked level
          const levelFigures =
            progressData?.filter((progress) => {
              const levelId = progress.figures?.level_figures?.[0]?.level_id;
              return levelId === level.id;
            }) || [];

          // Add points for each completed figure in this level
          levelFigures.forEach(() => {
            calculatedPoints += 1 * level.level_number; // 1 point × level number
          });

          // Add points for completed challenges in this level (3 x level number)
          if (
            level.challenge_id &&
            currentParticipations[level.challenge_id]?.completed
          ) {
            calculatedPoints += 3 * level.level_number;
          }
        }
      }

      setUserPoints(calculatedPoints);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchUserChallengeParticipations = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("challenge_participants")
        .select("challenge_id, completed, status")
        .eq("user_id", user.id);

      if (error) throw error;

      const participations: {
        [challengeId: string]: { participating: boolean; completed: boolean; status?: string };
      } = {};
      data?.forEach((participant) => {
        participations[participant.challenge_id] = {
          participating: true,
          completed: participant.completed || false,
          status: participant.status,
        };
      });

      setUserChallengeParticipations(participations);
      return participations;
    } catch (error) {
      console.error("Error fetching challenge participations:", error);
      return {};
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

  const handleFigureCompleted = async (figureId: string) => {
    // Modal is already closed by FigurePreviewModal
    setIsPreviewModalOpen(false);
    setSelectedFigure(null);

    // Refresh data to update points immediately
    await fetchSportLevelsAndProgress();
    await fetchUserPoints();
  };

  const getFigureProgress = (figureId: string) => {
    return userProgress.find((p) => p.figure_id === figureId);
  };

  const isLevelUnlocked = (level: SportLevel, index: number) => {
    // First level always unlocked
    if (index === 0) return true;
    
    // Check points
    if (userPoints < level.point_limit) return false;
    
    // Check if boss of previous level was completed
    if (index > 0) {
      const previousLevel = sportLevels[index - 1];
      const bossFigure = previousLevel.figures.find((f) => f.is_boss);
      
      if (bossFigure) {
        const bossProgress = getFigureProgress(bossFigure.id);
        if (bossProgress?.status !== "completed") {
          return false;
        }
      }
    }
    
    return true;
  };

  const getLevelProgress = (level: SportLevel) => {
    // Check if challenge is completed for this level
    const challengeCompleted = level.challenge_id
      ? userChallengeParticipations[level.challenge_id]?.completed
      : false;

    // If level has no figures but has a completed challenge, consider it 100%
    if (level.figures.length === 0 && challengeCompleted) {
      return 100;
    }

    if (level.figures.length === 0) return 0;

    const completedFigures = level.figures.filter((figure) => {
      const progress = getFigureProgress(figure.id);
      return progress?.status === "completed";
    });

    const figureProgress =
      (completedFigures.length / level.figures.length) * 100;

    // If challenge is completed, ensure progress is at least 100%
    return challengeCompleted ? 100 : Math.round(figureProgress);
  };

  // Check if figure requires premium access
  const requiresPremiumAccess = (figure: Figure) => {
    // Check if figure is marked as premium (you might need to add this field to the Figure interface and database)
    // For now, checking if it's a premium feature based on category or other criteria
    return (
      figure.difficulty_level === "Expert" ||
      figure.difficulty_level === "Advanced"
    );
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
        .from("challenge_participants")
        .select("id, completed")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .single();

      if (existingParticipant) {
        toast({
          title: "Already joined!",
          description: "You're already participating in this challenge.",
        });
        return;
      }

      // Join the challenge
      const { error } = await supabase.from("challenge_participants").insert({
        user_id: user.id,
        challenge_id: challengeId,
        status: "active",
        joined_at: new Date().toISOString(),
        user_started_at: new Date().toISOString(),
      });

      if (error) throw error;

      // Skipping legacy calendar generation (handled client-side)

      toast({
        title: "Challenge joined!",
        description: "You've successfully joined the challenge. Good luck!",
      });

      // Update local state
      const newParticipations = {
        ...userChallengeParticipations,
        [challengeId]: { participating: true, completed: false, status: 'active' },
      };
      setUserChallengeParticipations(newParticipations);

      // Refresh points after joining challenge with new participations
      await fetchUserPoints(newParticipations);

      // Navigate to challenge page
      navigate(`/challenges/${challengeId}`);
    } catch (error) {
      console.error("Error joining challenge:", error);
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
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <BreadcrumbNavigation
          items={[
            { label: "Podróż", path: "/aerial-journey" },
            { label: sportName },
          ]}
          className="mb-6"
        />

        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
            Podróż {sportName}
          </h1>
        </div>

        {/* Simplified Level Grid */}
        <div className="space-y-6">
          {sportLevels.map((level, index) => {
            const isUnlocked = isLevelUnlocked(level, index);
            const progress = getLevelProgress(level);
            const isCompleted = progress === 100;

            return (
              <Card
                key={level.id}
                className={`transition-all duration-300 ${
                  isUnlocked
                    ? "bg-white/5 border-white/10 hover:border-purple-400/50"
                    : "bg-gray-900/30 border-gray-600/20 opacity-60"
                }`}
              >
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 md:gap-4 mb-4">
                    <div className="flex items-center gap-3 md:gap-4">
                      {/* Level Badge */}
                      <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-base md:text-lg flex-shrink-0 ${
                          isCompleted
                            ? "bg-gradient-to-r from-green-400 to-emerald-400 text-black"
                            : isUnlocked
                            ? "bg-gradient-to-r from-purple-400 to-blue-400 text-white"
                            : "bg-gray-600 text-gray-400"
                        }`}
                      >
                        {isCompleted ? (
                          <Crown className="w-5 h-5 md:w-6 md:h-6" />
                        ) : (
                          level.level_number
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-base md:text-lg ${
                            isUnlocked ? "text-white" : "text-gray-500"
                          }`}
                        >
                          {level.level_name}
                        </h3>
                        {isUnlocked && (
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {level.figures.length} dostępnych figur
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Status Indicator */}
                    {isUnlocked ? (
                      <div className="flex items-center justify-end md:text-right ml-auto">
                        {isCompleted ? (
                          <div className="flex items-center gap-2 text-green-400">
                            <CheckCircle className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm font-medium">
                              Ukończone
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-blue-400">
                            <Circle className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="text-xs md:text-sm font-medium whitespace-nowrap">
                              {progress}% ukończone
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-gray-500 ml-auto">
                        <Lock className="w-4 h-4 md:w-5 md:h-5" />
                        <span className="text-xs md:text-sm">Zablokowane</span>
                      </div>
                    )}
                  </div>

                  {/* Progress Bar for Unlocked Levels */}
                  {isUnlocked && !isCompleted && (
                    <div className="mb-4">
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-purple-400 to-blue-400 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Challenge Section */}
                  {level.challenges && isUnlocked && (
                    <div className="mt-4 p-4 bg-purple-900/20 border border-purple-400/20 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-purple-400 mb-1">
                            Dostępne wyzwanie
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {level.challenges.title}
                          </p>
                        </div>
                        <div className="text-right">
                          {(() => {
                            const challengeParticipation =
                              userChallengeParticipations[level.challenge_id!];

                            // 1. Wyzwanie ukończone - sprawdzamy completed lub status='completed'
                            if (
                              challengeParticipation?.completed === true || 
                              challengeParticipation?.status === 'completed'
                            ) {
                              return (
                                <div className="flex items-center gap-2">
                                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                    <Trophy className="w-3 h-3 mr-1" />
                                    Ukończone
                                  </Badge>
                                </div>
                              );
                            }

                            // 2. Wyzwanie w trakcie - uczestniczy, NIE jest ukończone, i status='active'
                            if (
                              challengeParticipation?.participating &&
                              !challengeParticipation?.completed &&
                              challengeParticipation?.status === 'active'
                            ) {
                              return (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() =>
                                    navigate(
                                      `/challenges/${level.challenge_id}`
                                    )
                                  }
                                  className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                                >
                                  Kontynuuj wyzwanie
                                </Button>
                              );
                            }

                            // 3. Nierozpoczęte - brak participacji lub status !== 'active'
                            if (!challengeParticipation?.participating) {
                              return (
                                <Button
                                  size="sm"
                                  onClick={() =>
                                    joinChallenge(level.challenge_id!)
                                  }
                                  disabled={
                                    joiningChallenge === level.challenge_id
                                  }
                                  className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
                                >
                                  {joiningChallenge === level.challenge_id
                                    ? "Dołączanie..."
                                    : "Rozpocznij wyzwanie"}
                                </Button>
                              );
                            }

                            return null;
                          })()}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Boss Figure - if exists */}
                  {isUnlocked && level.figures.some((f) => f.is_boss) && (
                    <div className="mt-4 mb-6">
                      {level.figures
                        .filter((f) => f.is_boss)
                        .map((bossFigure) => {
                          const figureProgress = getFigureProgress(bossFigure.id);
                          const canPractice = canAccessFigure(bossFigure);
                          
                          return (
                            <Card
                              key={bossFigure.id}
                              className="border-2 border-yellow-500/50 bg-gradient-to-br from-yellow-900/20 to-orange-900/20 cursor-pointer hover:border-yellow-400/70 transition-all"
                              onClick={() => handleFigureClick(bossFigure, canPractice)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  {/* Boss Icon/Image */}
                                  <div className="relative flex-shrink-0">
                                    <div className="w-20 h-20 rounded-lg overflow-hidden border-2 border-yellow-500/50">
                                      {bossFigure.image_url ? (
                                        <img
                                          src={bossFigure.image_url}
                                          alt={bossFigure.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full bg-yellow-500/10 flex items-center justify-center text-3xl">
                                          👑
                                        </div>
                                      )}
                                    </div>
                                    {/* Boss Badge */}
                                    <Badge className="absolute -top-2 -right-2 bg-yellow-500 text-black font-bold">
                                      BOSS
                                    </Badge>
                                  </div>

                                  {/* Boss Info */}
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-yellow-400 mb-1">
                                      {bossFigure.name}
                                    </h4>

                                    {/* Boss Description */}
                                    {bossFigure.boss_description && (
                                      <p className="text-sm text-muted-foreground mb-2">
                                        {bossFigure.boss_description}
                                      </p>
                                    )}

                                    {/* Boss Requirements */}
                                    <div className="flex flex-wrap gap-2 mt-2">
                                      {bossFigure.level_hold_time_seconds && (
                                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                                          ⏱️ {bossFigure.level_hold_time_seconds}s
                                        </Badge>
                                      )}
                                      {bossFigure.level_reps && (
                                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30">
                                          🔁 {bossFigure.level_reps} reps
                                        </Badge>
                                      )}

                                      {/* Boss Completion Status */}
                                      {figureProgress?.status === "completed" ? (
                                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                                          ✅ Ukończone
                                        </Badge>
                                      ) : (
                                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                                          ⚔️ Wymaga zaliczenia
                                        </Badge>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                    </div>
                  )}

                  {/* Simplified Figure Grid - Only for Unlocked Levels */}
                  {isUnlocked && (
                    <div className="mt-4">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {level.figures.filter(f => !f.is_boss).slice(0, 8).map((figure) => {
                          const figureProgress = getFigureProgress(figure.id);
                          const canPractice =
                            isUnlocked && canAccessFigure(figure);

                          return (
                            <div
                              key={figure.id}
                              className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer transition-all duration-200 ${
                                canPractice ? "hover:scale-105" : "opacity-60"
                              }`}
                              onClick={() =>
                                handleFigureClick(figure, canPractice)
                              }
                            >
                              {figure.image_url ? (
                                <img
                                  src={figure.image_url}
                                  alt={figure.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                                  <span className="text-2xl">🤸</span>
                                </div>
                              )}

                              {/* Status Overlay */}
                              <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                {figureProgress?.status === "completed" ? (
                                  <CheckCircle className="w-8 h-8 text-green-400" />
                                ) : figureProgress?.status === "for_later" ? (
                                  <Bookmark className="w-6 h-6 text-blue-400" />
                                ) : figureProgress?.status === "failed" ? (
                                  <AlertCircle className="w-6 h-6 text-red-400" />
                                ) : canPractice ? (
                                  <Circle className="w-6 h-6 text-white/60" />
                                ) : (
                                  <Lock className="w-6 h-6 text-gray-400" />
                                )}
                              </div>

                              {/* Figure Name and Hold Time */}
                              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2">
                                <p className="text-white text-xs font-medium truncate">
                                  {figure.name}
                                </p>
                                <div className="flex items-center gap-1 mt-1 flex-wrap">
                                  {/* Level-specific hold time has priority */}
                                  {(figure.level_hold_time_seconds || figure.hold_time_seconds) && (
                                    <div className="bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                      {figure.level_hold_time_seconds || figure.hold_time_seconds}s
                                    </div>
                                  )}
                                  {figure.level_reps && (
                                    <div className="bg-purple-500 text-white text-xs px-2 py-0.5 rounded-full font-bold">
                                      {figure.level_reps}x
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}

                        {level.figures.length > 8 && (
                          <div className="aspect-square rounded-lg border-2 border-dashed border-white/20 flex items-center justify-center">
                            <span className="text-white/60 text-sm font-medium">
                              +{level.figures.length - 8} more
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Locked Level Message */}
                  {!isUnlocked && (
                    <div className="text-center py-4">
                      <p className="text-gray-500 text-sm">
                        Zdobądź jeszcze {level.point_limit - userPoints}{" "}
                        punktów, aby odblokować ten poziom
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Figure Preview Modal */}
        {selectedFigure && (
          <FigurePreviewModal
            figure={selectedFigure}
            isOpen={isPreviewModalOpen}
            onClose={handleClosePreviewModal}
            onFigureCompleted={handleFigureCompleted}
          />
        )}
      </div>
    </div>
  );
};

export default SkillTree;
