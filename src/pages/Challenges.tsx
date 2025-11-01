import { useState, useEffect, useMemo } from "react";
import {
  Trophy,
  Clock,
  Plus,
  Crown,
  TrendingUp,
  Lock,
  Filter,
  LayoutGrid,
  List,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { useToast } from "@/hooks/use-toast";
import ChallengePreviewModal from "@/components/ChallengePreviewModal";
import CreateChallengeModal from "@/components/CreateChallengeModal";
import ChallengePurchaseModal from "@/components/ChallengePurchaseModal";
import ChallengeFiltersBar from "@/components/ChallengeFiltersBar";
import ChallengeFiltersSheet from "@/components/ChallengeFiltersSheet";
import ChallengePathCard from "@/components/ChallengePathCard";
import ChallengeGridView from "@/components/Challenge/ChallengeGridView";
import { ChallengeListView } from "@/components/Challenge/ChallengeListView";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useChallengeAccess } from "@/hooks/useChallengeAccess";
import { useChallengeFilters } from "@/hooks/useChallengeFilters";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface Challenge {
  id: string;
  title: string;
  description: string;
  level?: number;
  status: string;
  created_by: string;
  premium: boolean;
  price_usd: number;
  price_pln: number;
  duration: number;
  participants: number;
  difficulty: string;
  userProgress: number;
  image: string;
  userParticipating: boolean;
  created_at: string;
  updated_at?: string;
  series_name?: string;
  series_order?: number;
  is_new?: boolean;
  completedCycles?: number;
  start_date?: string;
  end_date?: string;
  category?: string;
}

const Challenges = () => {
  const navigate = useNavigate();
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [challengeToPurchase, setChallengeToPurchase] = useState<Challenge | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const isMobile = useIsMobile();

  const {
    canCreateChallenges,
    isAdmin,
    isLoading: roleLoading,
  } = useUserRole();
  const { hasPremiumAccess } = useSubscriptionStatus();
  const { userPurchases, refreshPurchases, checkChallengeAccess } = useChallengeAccess();
  const { user } = useAuth();
  const { toast } = useToast();

  const {
    filters,
    sortBy,
    toggleFilter,
    clearFilters,
    initializeFilters,
    setSortBy,
    activeFilterCount,
    applyFilters,
    applySorting,
  } = useChallengeFilters();

  useEffect(() => {
    if (!roleLoading) {
      fetchChallenges();
    }
  }, [roleLoading, isAdmin, canCreateChallenges, user]);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      // Get challenges based on user role
      let challengeQuery = supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      // If not admin, show published challenges + own drafts for trainers
      if (!isAdmin) {
        if (canCreateChallenges && user) {
          challengeQuery = challengeQuery.or(`status.eq.published,and(status.eq.draft,created_by.eq.${user.id})`);
        } else {
          challengeQuery = challengeQuery.eq("status", "published");
        }
      }

      const { data: allChallenges, error } = await challengeQuery;
      if (error) throw error;

      // Get user's participation data if logged in
      let userParticipation: Record<string, string> = {};
      let userProgress: Record<string, number> = {};
      let completedCycles: Record<string, number> = {};

      if (user) {
        const { data: participationData } = await supabase
          .from("challenge_participants")
          .select("challenge_id, status, user_started_at")
          .eq("user_id", user.id);
        
        userParticipation =
          participationData?.reduce((acc, p) => {
            acc[p.challenge_id] = p.status;
            return acc;
          }, {} as Record<string, string>) || {};

        // Get user's progress data for challenges they're participating in
        const participatingChallengeIds =
          participationData?.map((p) => p.challenge_id) || [];
        
        if (participatingChallengeIds.length > 0) {
          const { data: progressData } = await supabase
            .from("challenge_day_progress")
            .select("challenge_id, status, training_day_id, attempt_number")
            .eq("user_id", user.id)
            .in("challenge_id", participatingChallengeIds);

          // Get total calendar days for each challenge
          const { data: calendarDaysData } = await supabase
            .from("challenge_training_days")
            .select("challenge_id, id")
            .in("challenge_id", participatingChallengeIds);

          // Calculate progress percentage for each challenge
          const challengeTotalDays =
            calendarDaysData?.reduce((acc, day) => {
              acc[day.challenge_id] = (acc[day.challenge_id] || 0) + 1;
              return acc;
            }, {} as Record<string, number>) || {};

          const challengeCompletedDays =
            progressData?.reduce((acc, progress) => {
              if (progress.status === 'completed') {
                acc[progress.challenge_id] =
                  (acc[progress.challenge_id] || 0) + 1;
              }
              return acc;
            }, {} as Record<string, number>) || {};

          // Calculate completed cycles (max attempt_number for completed challenges)
          completedCycles = progressData?.reduce((acc, progress) => {
            if (progress.status === 'completed') {
              acc[progress.challenge_id] = Math.max(
                acc[progress.challenge_id] || 0,
                progress.attempt_number || 1
              );
            }
            return acc;
          }, {} as Record<string, number>) || {};

          participatingChallengeIds.forEach((challengeId) => {
            const completedDays = challengeCompletedDays[challengeId] || 0;
            const totalDays = challengeTotalDays[challengeId] || 1;
            userProgress[challengeId] = Math.min(100, Math.round((completedDays / totalDays) * 100));
          });
        }
      }

      // Get participant counts for each challenge
      const challengeIds = allChallenges?.map((c) => c.id) || [];
      const { data: participantData } = await supabase
        .from("challenge_participants")
        .select("challenge_id")
        .in("challenge_id", challengeIds);
      
      const participantCounts =
        participantData?.reduce((acc, p) => {
          acc[p.challenge_id] = (acc[p.challenge_id] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {};

      // Transform data
      const transformedData: Challenge[] =
        allChallenges?.map((challenge) => {
          const userParticipating = userParticipation[challenge.id];
          const progress = userProgress[challenge.id] || 0;

          let status;
          if (userParticipating) {
            if (progress === 100) {
              status = "completed";
            } else {
              status = "active";
            }
          } else {
            status = "not-started";
          }

          return {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            level: challenge.level,
            status,
            created_by: challenge.created_by,
            premium: challenge.premium || false,
            price_usd: challenge.price_usd,
            price_pln: challenge.price_pln,
            duration: 28, // Default 28 days
            participants: participantCounts[challenge.id] || 0,
            difficulty: challenge.difficulty_level
              ? challenge.difficulty_level === 'beginner'
                ? 'Początkujący'
                : challenge.difficulty_level === 'intermediate'
                ? 'Średniozaawansowany'
                : 'Zaawansowany'
              : 'Średniozaawansowany',
            userProgress: userProgress[challenge.id] || 0,
            image:
              challenge.image_url ||
              "https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=400&h=200&fit=crop",
            userParticipating: !!userParticipating,
            created_at: challenge.created_at,
            updated_at: challenge.updated_at,
            series_name: challenge.series_name,
            series_order: challenge.series_order,
            is_new: challenge.is_new,
            completedCycles: completedCycles[challenge.id] || 0,
            start_date: challenge.start_date,
            end_date: challenge.end_date,
            category: 'General',
          };
        }) || [];

      setChallenges(transformedData);
      
      // Initialize filters - tylko jeśli użytkownik ma aktywne wyzwania
      const hasActive = transformedData.some(c => c.status === 'active');
      initializeFilters(hasActive);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and sorting
  const filteredAndSortedChallenges = useMemo(() => {
    const filtered = applyFilters(challenges);
    return applySorting(filtered);
  }, [challenges, filters, sortBy]);

  // Group challenges by series
  const { seriesChallenges, standaloneChallenges, activeChallenges } = useMemo(() => {
    const series: Record<string, Challenge[]> = {};
    const standalone: Challenge[] = [];
    const active: Challenge[] = [];

    filteredAndSortedChallenges.forEach(challenge => {
      // Collect active challenges
      if (challenge.status === 'active') {
        active.push(challenge);
      }

      // Only add to series/standalone if NOT active (to avoid duplication)
      if (challenge.status !== 'active') {
        // Group by series or standalone
        if (challenge.series_name) {
          if (!series[challenge.series_name]) {
            series[challenge.series_name] = [];
          }
          series[challenge.series_name].push(challenge);
        } else {
          standalone.push(challenge);
        }
      }
    });

    // Sort challenges within each series by series_order
    Object.keys(series).forEach(seriesName => {
      series[seriesName].sort((a, b) => (a.series_order || 0) - (b.series_order || 0));
    });

    return {
      seriesChallenges: series,
      standaloneChallenges: standalone,
      activeChallenges: active.slice(0, 3), // Max 3 active challenges
    };
  }, [filteredAndSortedChallenges]);

  const openChallengeModal = (challenge: Challenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
  };

  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      toast({
        title: "Błąd",
        description: "Nie znaleziono wyzwania. Spróbuj ponownie.",
        variant: "destructive",
      });
      return;
    }

    // Check if challenge is premium and user has access
    if (challenge.premium) {
      const hasAccess = await checkChallengeAccess(challengeId);
      if (!hasAccess) {
        setChallengeToPurchase(challenge);
        setIsPurchaseModalOpen(true);
        return;
      }
    }

    try {
      const { error, data } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: "active",
          user_started_at: new Date().toISOString(),
        })
        .select();
      
      if (error) throw error;

      // Small delay to ensure data is saved
      await new Promise(resolve => setTimeout(resolve, 500));

      if (data && data.length > 0) {
        navigate(`/challenges/${data[0].challenge_id}`);
        toast({
          title: "Sukces!",
          description: "Dołączyłeś do wyzwania. Powodzenia!",
        });
      }
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się dołączyć do wyzwania. Spróbuj ponownie.",
        variant: "destructive",
      });
    }
  };

  const closeChallengeModal = () => {
    setIsModalOpen(false);
    setSelectedChallenge(null);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Początkujący":
        return "bg-green-500/20 text-green-400";
      case "Średniozaawansowany":
        return "bg-yellow-500/20 text-yellow-400";
      case "Zaawansowany":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case "not-started":
        return "Rozpocznij";
      case "active":
        return "Kontynuuj";
      case "completed":
        return "Wyniki";
      default:
        return "Zobacz";
    }
  };

  const renderChallengeCard = (challenge: Challenge) => {
    const isPremiumLocked = challenge.premium && !hasPremiumAccess && !userPurchases[challenge.id];
    const showBadge = challenge.premium || challenge.is_new;
    const badgeType = challenge.premium ? 'premium' : 'new';

    return (
      <Card
        key={challenge.id}
        className="overflow-hidden hover:shadow-xl transition-all duration-300 relative group"
      >
        {/* Premium Badge - mały, bez blura */}
        {isPremiumLocked && (
          <div className="absolute top-2 right-2 z-10">
            <Badge variant="default" className="bg-yellow-500/90 backdrop-blur-sm">
              <Crown className="w-3 h-3 mr-1" />
              Premium
            </Badge>
          </div>
        )}

        <CardContent className="p-0">
          {/* Thumbnail 16:9 */}
          <div className="relative overflow-hidden">
            <AspectRatio ratio={16 / 9}>
              <img
                src={challenge.image}
                alt={challenge.title}
                className="object-cover w-full h-full cursor-pointer"
                onClick={() => openChallengeModal(challenge)}
              />
            </AspectRatio>
            {/* Only 1 badge - Priority: Premium > New */}
            {showBadge && (
              <Badge
                variant={badgeType === 'premium' ? 'default' : 'secondary'}
                className="absolute top-2 right-2"
              >
                {badgeType === 'premium' && <Crown className="w-3 h-3 mr-1" />}
                {badgeType === 'premium' ? 'Premium' : 'Nowe'}
              </Badge>
            )}
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            {/* Title & Description */}
            <div>
              <h3 className="text-lg font-semibold mb-1 line-clamp-1">{challenge.title}</h3>
              <p className="text-sm text-muted-foreground line-clamp-1">{challenge.description}</p>
            </div>

            {/* Meta - one line with icons */}
            <div className="flex items-center gap-2 sm:gap-3 text-sm text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{challenge.duration} dni</span>
              </div>
              {challenge.level && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-4 h-4" />
                  <span className="hidden sm:inline">Poziom </span>
                  <span>{challenge.level}</span>
                </div>
              )}
              <Badge variant="outline" className={`${getDifficultyColor(challenge.difficulty)} text-xs sm:text-sm`}>
                <span className="sm:hidden">
                  {challenge.difficulty === 'Początkujący' ? 'Pocz.' : 
                   challenge.difficulty === 'Średniozaawansowany' ? 'Śred.' : 
                   'Zaw.'}
                </span>
                <span className="hidden sm:inline">{challenge.difficulty}</span>
              </Badge>
            </div>

            {/* Progress 0-100% */}
            {challenge.userParticipating && (
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Postęp</span>
                  <span className="font-medium">{challenge.userProgress}%</span>
                </div>
                <Progress value={challenge.userProgress} className="h-2" />
                {challenge.completedCycles && challenge.completedCycles > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Ukończone cykle: {challenge.completedCycles}
                  </p>
                )}
              </div>
            )}

            {/* CTAs */}
            <div className="flex gap-2 pt-2">
              {!challenge.userParticipating && (
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => {
                    e.stopPropagation();
                  openChallengeModal(challenge);
                }}
              >
                  Szczegóły
                </Button>
              )}
              <Button
                variant="default"
                size="sm"
                className={challenge.userParticipating ? 'w-full' : 'flex-1'}
                onClick={async (e) => {
                  e.stopPropagation();
                  if (isPremiumLocked) {
                    setChallengeToPurchase(challenge);
                    setIsPurchaseModalOpen(true);
                    return;
                  }
                  if (challenge.status === "active") {
                    navigate(`/challenges/${challenge.id}`);
                  } else if (challenge.status === "completed") {
                    openChallengeModal(challenge);
                  } else {
                    handleJoinChallenge(challenge.id);
                  }
                }}
              >
              {isPremiumLocked ? "Wykup" : getButtonText(challenge.status)}
              </Button>
            </div>

            {/* Secondary link for completed */}
            {challenge.status === "completed" && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full"
                onClick={() => handleJoinChallenge(challenge.id)}
              >
                Rozpocznij ponownie
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Wyzwania
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Przekrocz swoje granice ze strukturalnym treningiem
              </p>
            </div>
            <div className="flex items-center gap-2">
            {canCreateChallenges && (
                <Button
                  onClick={() => setIsCreateModalOpen(true)}
                  variant="default"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Stwórz wyzwanie
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Filters - Desktop Bar, Mobile Sheet */}
        {!isMobile ? (
          <ChallengeFiltersBar
            filters={filters}
            sortBy={sortBy}
            activeFilterCount={activeFilterCount}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
            onSortChange={setSortBy}
          />
        ) : (
          <ChallengeFiltersSheet
            filters={filters}
            sortBy={sortBy}
            activeFilterCount={activeFilterCount}
            onToggleFilter={toggleFilter}
            onClearFilters={clearFilters}
            onSortChange={setSortBy}
            isOpen={isFilterOpen}
            onOpenChange={setIsFilterOpen}
          />
        )}

        {/* View Toggle - always visible, sticky on mobile */}
        <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm py-3 mb-4 flex justify-end">
          <div className="flex items-center gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Active Challenges Section */}
        {activeChallenges.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Aktywne teraz</h2>
            {viewMode === 'grid' ? (
              <ChallengeGridView>
                {activeChallenges.map(challenge => renderChallengeCard(challenge))}
              </ChallengeGridView>
            ) : (
              <ChallengeListView
                challenges={activeChallenges}
                onChallengeClick={(challenge) => openChallengeModal(challenge)}
                onPurchase={(challenge) => {
                  setChallengeToPurchase(challenge);
                  setIsPurchaseModalOpen(true);
                }}
                onJoinChallenge={handleJoinChallenge}
                getDifficultyColor={getDifficultyColor}
                getButtonText={getButtonText}
                userPurchases={userPurchases}
                hasPremiumAccess={hasPremiumAccess}
              />
            )}
          </div>
        )}

        {/* Main Challenges Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <div className="aspect-video bg-muted" />
                <CardContent className="p-4 space-y-3">
                  <div className="h-4 bg-muted rounded" />
                  <div className="h-3 bg-muted rounded w-2/3" />
                  <div className="h-8 bg-muted rounded" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAndSortedChallenges.length === 0 ? (
          <div className="text-center py-12">
            <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Brak dostępnych wyzwań
            </h3>
            <p className="text-muted-foreground">
              Wróć później po nowe wyzwania!
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Series Paths */}
            {Object.keys(seriesChallenges).length > 0 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold">Ścieżki</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {Object.entries(seriesChallenges).map(([seriesName, seriesList]) => (
                    <ChallengePathCard
                      key={seriesName}
                      seriesName={seriesName}
                      challenges={seriesList}
                      onChallengeClick={openChallengeModal}
                      onJoinChallenge={handleJoinChallenge}
                      hasAccess={hasPremiumAccess || seriesList.every(c => !c.premium || userPurchases[c.id])}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Standalone Challenges */}
            {standaloneChallenges.length > 0 && (
              <div className="space-y-4">
                {Object.keys(seriesChallenges).length > 0 && (
                  <h2 className="text-xl font-semibold">Pozostałe wyzwania</h2>
                )}
            {viewMode === 'grid' ? (
              <ChallengeGridView>
                    {standaloneChallenges.map(challenge => renderChallengeCard(challenge))}
                  </ChallengeGridView>
                ) : (
                  <ChallengeListView
                    challenges={standaloneChallenges}
                    onChallengeClick={(challenge) => openChallengeModal(challenge)}
                    onPurchase={(challenge) => {
                      setChallengeToPurchase(challenge);
                      setIsPurchaseModalOpen(true);
                    }}
                    onJoinChallenge={handleJoinChallenge}
                    getDifficultyColor={getDifficultyColor}
                    getButtonText={getButtonText}
                    userPurchases={userPurchases}
                    hasPremiumAccess={hasPremiumAccess}
                  />
                )}
              </div>
            )}
          </div>
        )}

        {/* Mobile Filter Button - floating */}
        {isMobile && (
          <Button
            className="fixed bottom-20 right-4 z-50 rounded-full w-14 h-14 shadow-lg"
            size="icon"
            onClick={() => setIsFilterOpen(true)}
          >
            <Filter className="w-6 h-6" />
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </Button>
        )}
      </div>

      {/* Modals */}
      <ChallengePreviewModal
        challenge={selectedChallenge}
        isOpen={isModalOpen}
        onClose={closeChallengeModal}
        ctaMessage={getButtonText(selectedChallenge?.status || '')}
      />

      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChallengeCreated={fetchChallenges}
      />

      {challengeToPurchase && (
        <ChallengePurchaseModal
          isOpen={isPurchaseModalOpen}
          onClose={() => {
            setIsPurchaseModalOpen(false);
            setChallengeToPurchase(null);
          }}
          challenge={challengeToPurchase}
          onPurchaseSuccess={() => {
            refreshPurchases();
            fetchChallenges();
          }}
        />
      )}
    </div>
  );
};

export default Challenges;
