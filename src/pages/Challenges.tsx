import { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
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
import { format, subMonths, subWeeks } from "date-fns";
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
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<
    Date | undefined
  >();
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

    setSelectedChallenge(challenge);
    // allow the user to set the start challenge date
    setShowStartDatePicker(true);
  };

  const addChallengeParticipant = async () => {
    if (!selectedChallenge) {
      toast({
        title: "Error",
        description: "No challenge selected. Please try again.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error, data } = await supabase
        .from("challenge_participants")
        .insert({
          challenge_id: selectedChallenge.id,
          user_id: user.id,
          status: "active",
          user_started_at: selectedStartDate?.toISOString(),
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

  const handleStartDateConfirm = async () => {
    if (selectedStartDate) {
      await addChallengeParticipant();
      setShowStartDatePicker(false);
      setSelectedStartDate(undefined);
    } else {
      toast({
        title: "Error",
        description: "Please select a start date.",
        variant: "destructive",
      });
    }
  };

  // Mobile date options for quick selection
  const getMobileDateOptions = () => {
    const today = new Date();
    const oneMonthAgo = subMonths(today, 1);

    return [
      {
        label: "Today",
        value: today,
        description: "Start your challenge today",
      },
      {
        label: "1 week ago",
        value: subWeeks(today, 1),
        description: "For testing purposes",
      },
      {
        label: "1 month ago",
        value: oneMonthAgo,
        description: "For testing purposes",
      },
    ];
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
                      isPremiumLocked ? 'opacity-60' : ''
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
                    {/* Premium Overlay */}
                    {isPremiumLocked && (
                      <div className="absolute inset-0 bg-black/30 backdrop-blur-[1px] z-10 flex items-center justify-center">
                        <div className="text-center">
                          <Crown className="w-12 h-12 text-yellow-400 mx-auto mb-2" />
                          <p className="text-white font-semibold text-lg">Premium Challenge</p>
                          <p className="text-gray-300 text-sm">Unlock to access</p>
                        </div>
                      </div>
                    )}
                    
                    <div className="relative h-48">
                      <img
                        src={challenge.image}
                        alt={challenge.title}
                        className={`w-full h-full object-cover ${isPremiumLocked ? 'grayscale' : ''}`}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-4 right-4 flex flex-col gap-2">
                        <Badge className={getStatusColor(challenge.status)}>
                          {challenge.status.replace("-", " ")}
                        </Badge>
                        {challenge.premium && (
                          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 font-semibold shadow-lg">
                            Premium 👑
                          </Badge>
                        )}
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <Badge
                          variant="outline"
                          className="border-white/30 text-white/90 mb-2"
                        >
                          {challenge.category}
                        </Badge>
                      </div>
                    </div>

                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-white text-xl mb-2">
                            {challenge.title}
                          </CardTitle>
                          <p className="text-muted-foreground text-sm">
                            {challenge.description}
                          </p>
                        </div>
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-4">
                      {/* Progress Bar (only show for in-progress challenges) */}
                      {challenge.status === "active" &&
                        challenge.userProgress !== undefined && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-white">Progress</span>
                              <span className="text-muted-foreground">
                                {challenge.userProgress}% complete
                              </span>
                            </div>
                            <Progress
                              value={challenge.userProgress}
                              className="h-2"
                            />
                          </div>
                        )}

                      {/* Challenge Details */}
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-muted-foreground">
                            <Clock className="w-4 h-4 mr-1" />
                            {challenge.duration}
                          </div>
                          <div className="flex items-center text-muted-foreground">
                            <Users className="w-4 h-4 mr-1" />
                            {challenge.participants.toLocaleString()}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {challenge.level && (
                            <Badge
                              variant="outline"
                              className="border-purple-400/50 text-purple-300 bg-purple-500/20"
                            >
                              Level {challenge.level}
                            </Badge>
                          )}
                          <Badge
                            className={getDifficultyColor(challenge.difficulty)}
                          >
                            {challenge.difficulty}
                          </Badge>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      {challenge.status === "not-started" ||
                      challenge.status === "available" ||
                      challenge.status === "active" ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
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
                              ? "Unlock Challenge"
                              : getButtonText(challenge.status)}
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          className="w-full"
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
                          {isPremiumLocked ? "Unlock Challenge" : getButtonText(challenge.status)}
                        </Button>
                      )}
                    </CardContent>
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

      {/* Start Date Picker Modal */}
      {showStartDatePicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="glass-effect border-white/10 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center text-lg sm:text-xl">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Choose Challenge Start Date
              </CardTitle>
              <p className="text-muted-foreground text-sm sm:text-base">
                Select when you want to start this challenge (up to 1 month ago)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-3">
                  <div className="text-sm text-muted-foreground mb-3">
                    Choose when to start your challenge:
                  </div>
                  {getMobileDateOptions().map((option, index) => (
                    <Button
                      key={index}
                      variant={
                        selectedStartDate?.toDateString() ===
                        option.value.toDateString()
                          ? "primary"
                          : "outline"
                      }
                      onClick={() => setSelectedStartDate(option.value)}
                      className={`w-full p-4 h-auto flex flex-col items-start justify-start text-left ${
                        selectedStartDate?.toDateString() ===
                        option.value.toDateString()
                          ? "border-primary bg-primary/10"
                          : "border-white/20 bg-black/20 hover:bg-white/10"
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-base">
                          {option.label}
                        </span>
                        <span className="text-xs opacity-70">
                          {format(option.value, "MMM d")}
                        </span>
                      </div>
                      <span className="text-xs text-muted-foreground mt-1">
                        {option.description}
                      </span>
                    </Button>
                  ))}
                </div>

                <div className="flex space-x-2 pt-2">
                  <Button
                    variant="primary"
                    onClick={handleStartDateConfirm}
                    disabled={!selectedStartDate}
                    className="flex-1"
                  >
                    {isMobile ? "Start Challenge" : "Confirm & Start Challenge"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowStartDatePicker(false);
                      setSelectedStartDate(undefined);
                    }}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
export default Challenges;
