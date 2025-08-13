import { useState, useEffect } from "react";
import {
  Trophy,
  Users,
  Clock,
  Plus,
  Crown,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ChallengePreviewModal from "@/components/ChallengePreviewModal";
import CreateChallengeModal from "@/components/CreateChallengeModal";
import ChallengePurchaseModal from "@/components/ChallengePurchaseModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import { useChallengeAccess } from "@/hooks/useChallengeAccess";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";

const Challenges = () => {
  const navigate = useNavigate();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [challengeToPurchase, setChallengeToPurchase] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState({
    activeChallenges: 0,
    completedChallenges: 0,
    totalParticipants: 0,
    averageDuration: "0 days",
    averageTrainingDays: "0 training days",
  });

  const {
    canCreateChallenges,
    isAdmin,
    isLoading: roleLoading,
  } = useUserRole();
  const { hasPremiumAccess } = useSubscriptionStatus();
  const { userPurchases, refreshPurchases, checkChallengeAccess } = useChallengeAccess();
  const { user } = useAuth();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  useEffect(() => {
    fetchChallenges();
    fetchStats();
  }, [activeTab]);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      // Get challenges based on user role
      let challengeQuery = supabase
        .from("challenges")
        .select("*")
        .order("created_at", { ascending: false });

      // If not admin, only show published challenges
      if (!isAdmin) {
        challengeQuery = challengeQuery.eq("status", "published");
      }

      const { data: allChallenges, error } = await challengeQuery;
      if (error) throw error;

      let trainingDays;

      // Get user's participation data if logged in
      let userParticipation = {};
      const userProgress = {};
      if (user) {
        const { data: participationData } = await supabase
          .from("challenge_participants")
          .select("challenge_id, status, user_started_at")
          .eq("user_id", user.id);
        userParticipation =
          participationData?.reduce((acc, p) => {
            acc[p.challenge_id] = p.status;
            return acc;
          }, {}) || {};

        // Get user's progress data for challenges they're participating in
        const participatingChallengeIds =
          participationData?.map((p) => p.challenge_id) || [];
        if (participatingChallengeIds.length > 0) {
          const { data: progressData } = await supabase
            .from("user_challenge_calendar_days")
            .select(
              "challenge_id, status, day_number"
            )
            .eq("user_id", user.id)
            .in("challenge_id", participatingChallengeIds);

          // Get total calendar days for each challenge
          const { data: calendarDaysData } = await supabase
            .from("user_challenge_calendar_days")
            .select("challenge_id, day_number")
            .eq("user_id", user.id)
            .in("challenge_id", participatingChallengeIds);

          // Calculate progress percentage for each challenge based on completed calendar days
          const challengeTotalDays =
            calendarDaysData?.reduce((acc, day) => {
              acc[day.challenge_id] = (acc[day.challenge_id] || 0) + 1;
              return acc;
            }, {}) || {};

          const challengeCompletedDays =
            progressData?.reduce((acc, progress) => {
              if (progress.status === 'completed' || progress.status === 'rest') {
                acc[progress.challenge_id] =
                  (acc[progress.challenge_id] || 0) + 1;
              }
              return acc;
            }, {}) || {};

          participatingChallengeIds.forEach((challengeId) => {
            const completedDays = challengeCompletedDays[challengeId] || 0;
            const totalDays = challengeTotalDays[challengeId] || 1;
            userProgress[challengeId] = Math.round(
              (completedDays / totalDays) * 100
            );
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
        }, {}) || {};

      // Transform and filter data based on user participation and active tab
      let transformedData =
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
            status = "not-started"; // Challenge hasn't started yet
          }
          return {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            start_date: challenge.start_date,
            end_date: challenge.end_date,
            level: challenge.level,
            status,
            created_by: challenge.created_by,
            premium: challenge.premium || false,
            duration: 28,
            participants: participantCounts[challenge.id] || 0,
            difficulty: challenge.difficulty_level
              ? challenge.difficulty_level.charAt(0).toUpperCase() +
                challenge.difficulty_level.slice(1)
              : "Intermediate",
            userProgress: userProgress[challenge.id] || 0,
            image:
              challenge.image_url ||
              "https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=400&h=200&fit=crop",
            category: "General",
            // Default for now
            userParticipating: !!userParticipating,
          };
        }) || [];

      // Filter based on active tab
      if (activeTab === "active") {
        transformedData = transformedData.filter((c) => c.status === "active");
      } else if (activeTab === "completed") {
        transformedData = transformedData.filter(
          (c) => c.status === "completed" || c.status === "failed"
        );
      } else if (activeTab === "not-started") {
        transformedData = transformedData.filter(
          (c) => c.status === "not-started" || c.status === "available"
        );
      } else if (activeTab === "all") {
        // Show all challenges for the "all" tab - don't filter by status
        // transformedData = transformedData.filter(
        //   (c) => c.status !== "done" || c.userParticipating
        // );
      }

      // For the "done" tab, show challenges with "done" status
      if (activeTab === "done") {
        transformedData = transformedData.filter((c) => c.status === "done");
      }

      setChallenges(transformedData);
    } catch (error) {
      console.error("Error fetching challenges:", error);
    } finally {
      setIsLoading(false);
    }
  };
  const fetchStats = async () => {
    try {
      // Get stats based on user role - only count published challenges for stats
      const statsQuery = supabase
        .from("challenges")
        .select("id, start_date, end_date")
        .eq("status", "published");

      const { data: publishedChallenges } = await statsQuery;

      // Get participant data only for published challenges
      const publishedChallengeIds = publishedChallenges?.map((c) => c.id) || [];
      let participantData = [];
      if (publishedChallengeIds.length > 0) {
        const { data } = await supabase
          .from("challenge_participants")
          .select("challenge_id")
          .in("challenge_id", publishedChallengeIds);
        participantData = data || [];
      }

      // Get training days data for calculating training days vs total days
      let totalDurationDays = 0;
      let totalTrainingDays = 0;

      if (publishedChallengeIds.length > 0) {
        const { data: trainingDaysData } = await supabase
          .from("challenge_training_days")
          .select("challenge_id, is_rest_day")
          .in("challenge_id", publishedChallengeIds);

        // Count training days (non-rest days) and total days per challenge
        const challengeDayCounts =
          trainingDaysData?.reduce((acc, day) => {
            if (!acc[day.challenge_id]) {
              acc[day.challenge_id] = { total: 0, training: 0 };
            }
            acc[day.challenge_id].total++;
            if (!day.is_rest_day) {
              acc[day.challenge_id].training++;
            }
            return acc;
          }, {}) || {};

        // Sum up all days
        Object.values(challengeDayCounts).forEach((counts: any) => {
          totalDurationDays += counts.total;
          totalTrainingDays += counts.training;
        });
      }

      const now = new Date();
      let activeChallenges = 0;
      let completedChallenges = 0;

      publishedChallenges?.forEach((challenge) => {
        const start = new Date(challenge.start_date);
        const end = new Date(challenge.end_date);
        if (start <= now && end >= now) {
          activeChallenges++;
        } else if (end < now) {
          completedChallenges++;
        }
      });

      const averageDuration = publishedChallenges?.length
        ? Math.round(totalDurationDays / publishedChallenges.length)
        : 0;

      const averageTrainingDays = publishedChallenges?.length
        ? Math.round(totalTrainingDays / publishedChallenges.length)
        : 0;

      setStats({
        activeChallenges,
        completedChallenges,
        totalParticipants: participantData?.length || 0,
        averageDuration: `${averageDuration} days`,
        averageTrainingDays: `${averageTrainingDays} training days`,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const openChallengeModal = (challenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
  };
  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    // Find the challenge by ID and set it as selected
    const challenge = challenges.find((c) => c.id === challengeId);
    if (!challenge) {
      toast({
        title: "Error",
        description: "Challenge not found. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Check if challenge is premium and user has access
    if (challenge.premium) {
      const hasAccess = await checkChallengeAccess(challengeId);
      if (!hasAccess) {
        // Show purchase modal instead of toast
        setChallengeToPurchase(challenge);
        setIsPurchaseModalOpen(true);
        return;
      }
    }

    // Automatically start today
    const today = new Date();
    
    try {
      const { error, data } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: challengeId,
          user_id: user.id,
          status: "active",
          user_started_at: today.toISOString(),
        })
        .select();
      
      if (error) throw error;

      // Navigate to the challenge day overview using the challenge_id
      if (data && data.length > 0) {
        navigate(`/challenges/${data[0].challenge_id}`);
        toast({
          title: "Success!",
          description: "You've joined the challenge. Good luck!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to join challenge. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error joining challenge:", error);
      toast({
        title: "Error",
        description: "Failed to join challenge. Please try again.",
        variant: "destructive",
      });
    }
  };


  const closeChallengeModal = () => {
    setIsModalOpen(false);
    setSelectedChallenge(null);
  };
  const getStatusColor = (status: string) => {
    switch (status) {
      case "not-started":
      case "available":
        return "bg-blue-500/90 text-blue-100 border-blue-500/30";
      case "active":
        return "bg-pink-700/90 text-pink-100 border-pink-500/30";
      case "completed":
        return "bg-green-500/90 text-green-100 border-green-500/30";
      case "failed":
        return "bg-red-500/90 text-red-100 border-red-500/30";
      case "done":
        return "bg-purple-500/90 text-purple-100 border-purple-500/30";
      default:
        return "bg-gray-500/90 text-gray-100 border-gray-500/30";
    }
  };
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-400";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-400";
      case "Advanced":
        return "bg-red-500/20 text-red-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };
  const getButtonText = (status: string) => {
    switch (status) {
      case "not-started":
      case "available":
        return "Join Challenge";
      case "active":
        return "Continue";
      case "completed":
        return "View Results";
      case "failed":
        return "View Results";
      case "done":
        return "View Results";
      default:
        return "View";
    }
  };


  return (
    <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Challenges
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Push your limits with structured training programs
              </p>
            </div>
            {canCreateChallenges && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                variant="primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Challenge
              </Button>
            )}
          </div>
        </div>

        {/* Challenge Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-4 sm:mb-6"
        >
          <TabsList className="grid w-full grid-cols-4 text-xs sm:text-sm">
            <TabsTrigger value="all" className="px-2 sm:px-4">
              All
            </TabsTrigger>
            <TabsTrigger value="active" className="px-2 sm:px-4">
              Active
            </TabsTrigger>
            <TabsTrigger
              value="not-started"
              className="px-2 sm:px-4 hidden sm:inline-flex"
            >
              Not Started
            </TabsTrigger>
            <TabsTrigger value="not-started" className="px-2 sm:px-4 sm:hidden">
              New
            </TabsTrigger>
            <TabsTrigger value="completed" className="px-2 sm:px-4">
              Done
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4 sm:mt-6">
            {/* Challenges Grid */}
            {(() => {
              console.log("Rendering challenges:", {
                isLoading,
                challengesCount: challenges.length,
                challenges,
              });
              return null;
            })()}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {isLoading ? (
                Array.from({
                  length: 4,
                }).map((_, index) => (
                  <Card
                    key={index}
                    className="glass-effect border-white/10 animate-pulse"
                  >
                    <div className="h-48 bg-gray-300 rounded-t-lg"></div>
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-300 rounded mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded mb-4"></div>
                      <div className="h-8 bg-gray-300 rounded"></div>
                    </CardContent>
                  </Card>
                ))
              ) : challenges.length === 0 ? (
                <div className="col-span-2 text-center py-12">
                  <Trophy className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">
                    No Challenges Available
                  </h3>
                  <p className="text-muted-foreground">
                    Check back later for new challenges!
                  </p>
                </div>
              ) : (
                challenges.map((challenge) => {
                  const isPremiumLocked = challenge.premium && !hasPremiumAccess && !userPurchases[challenge.id];
                  
                  return (
                  <Card
                    key={challenge.id}
                    className={`glass-effect border-white/10 hover-lift overflow-hidden cursor-pointer relative ${
                      isPremiumLocked ? 'opacity-70' : ''
                    }`}
                    onClick={() => {
                      if (isPremiumLocked) {
                        setChallengeToPurchase(challenge);
                        setIsPurchaseModalOpen(true);
                      } else {
                        openChallengeModal(challenge);
                      }
                    }}
                  >
                    {/* Premium Overlay - only on image area */}
                    {isPremiumLocked && (
                      <div className="absolute top-0 left-0 right-0 h-48 bg-black/20 backdrop-blur-[0.5px] z-10 flex items-center justify-center">
                        <div className="text-center bg-black/60 backdrop-blur-sm rounded-lg p-4 border border-yellow-400/30">
                          <Crown className="w-10 h-10 text-yellow-400 mx-auto mb-2" />
                          <p className="text-white font-semibold text-base">Premium Challenge</p>
                          <p className="text-yellow-200 text-sm">Click to unlock</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="relative h-48">
                      <img
                        src={challenge.image}
                        alt={challenge.title}
                        className={`w-full h-full object-cover ${isPremiumLocked ? 'grayscale brightness-75' : ''}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Top badges */}
                      <div className="absolute top-3 right-3 flex flex-col gap-1">
                        {challenge.premium && (
                          <Badge className="bg-yellow-500/90 text-yellow-900 border-yellow-400 text-xs font-semibold">
                            Premium
                          </Badge>
                        )}
                        <Badge className={getStatusColor(challenge.status) + " text-xs font-medium"}>
                          {challenge.status.replace("-", " ")}
                        </Badge>
                      </div>
                    </div>

                    {/* Challenge Info - Below image */}
                    <div className="p-4 pb-3">
                      <h3 className="text-white font-bold text-xl mb-3 line-clamp-2">
                        {challenge.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-white/90 mb-4">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4" />
                          <span className="font-medium">{challenge.duration} days</span>
                        </div>
                        {challenge.level && (
                          <div className="flex items-center gap-1.5">
                            <Trophy className="w-4 h-4" />
                            <span className="font-medium">Level {challenge.level}</span>
                          </div>
                        )}
                        <Badge className={getDifficultyColor(challenge.difficulty) + " text-xs font-medium px-2 py-1"}>
                          {challenge.difficulty}
                        </Badge>
                      </div>
                      {/* Progress Bar (only show for active challenges) */}
                      {challenge.status === "active" && challenge.userProgress !== undefined && (
                        <div className="mb-4">
                          <div className="flex justify-between text-sm mb-2">
                            <span className="text-white">Progress</span>
                            <span className="text-muted-foreground">
                              {challenge.userProgress}% complete
                            </span>
                          </div>
                          <Progress value={challenge.userProgress} className="h-2" />
                        </div>
                      )}

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-white/20 text-white hover:bg-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isPremiumLocked) {
                              setChallengeToPurchase(challenge);
                              setIsPurchaseModalOpen(true);
                            } else {
                              openChallengeModal(challenge);
                            }
                          }}
                        >
                          {isPremiumLocked ? "Unlock" : "Preview"}
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          className="flex-1"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (challenge.premium) {
                              const hasAccess = await checkChallengeAccess(challenge.id);
                              if (!hasAccess) {
                                setChallengeToPurchase(challenge);
                                setIsPurchaseModalOpen(true);
                                return;
                              }
                            }
                            if (challenge.status === "active") {
                              navigate(`/challenges/${challenge.id}`);
                            } else {
                              handleJoinChallenge(challenge.id);
                            }
                          }}
                        >
                          {isPremiumLocked
                            ? "Unlock"
                            : getButtonText(challenge.status)}
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
                })
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Challenge Preview Modal */}
      <ChallengePreviewModal
        challenge={selectedChallenge}
        isOpen={isModalOpen}
        onClose={closeChallengeModal}
        ctaMessage={getButtonText(selectedChallenge?.status)}
      />

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChallengeCreated={fetchChallenges}
      />

      {/* Challenge Purchase Modal */}
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
