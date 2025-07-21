import React, { useState, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  Trophy,
  Users,
  Clock,
  ChevronRight,
  Plus,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import ChallengePreviewModal from "@/components/ChallengePreviewModal";
import CreateChallengeModal from "@/components/CreateChallengeModal";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, subMonths } from "date-fns";
import { Calendar } from "@/components/ui/calendar";

const Challenges = () => {
  const navigate = useNavigate();
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [challenges, setChallenges] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("active");
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [selectedStartDate, setSelectedStartDate] = useState<
    Date | undefined
  >();
  const [stats, setStats] = useState({
    activeChallenges: 0,
    completedChallenges: 0,
    totalParticipants: 0,
    averageDuration: "0 days",
  });

  const {
    canCreateChallenges,
    isAdmin,
    isLoading: roleLoading,
  } = useUserRole();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchChallenges();
    fetchStats();
  }, [activeTab]);

  const fetchChallenges = async () => {
    setIsLoading(true);
    try {
      // Get all published challenges first
      const { data: allChallenges, error } = await supabase
        .from("challenges")
        .select("*")
        .eq("status", "published")
        .order("created_at", {
          ascending: false,
        });
      if (error) throw error;

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
            .from("challenge_day_progress")
            .select(
              "challenge_id, training_day_id, exercises_completed, total_exercises"
            )
            .eq("user_id", user.id)
            .in("challenge_id", participatingChallengeIds);

          // Get total training days for each challenge
          const { data: trainingDaysData } = await supabase
            .from("challenge_training_days")
            .select("challenge_id, id")
            .in("challenge_id", participatingChallengeIds);

          // Calculate progress percentage for each challenge
          const challengeTrainingDays =
            trainingDaysData?.reduce((acc, day) => {
              acc[day.challenge_id] = (acc[day.challenge_id] || 0) + 1;
              return acc;
            }, {}) || {};

          const challengeCompletedDays =
            progressData?.reduce((acc, progress) => {
              if (
                progress.exercises_completed === progress.total_exercises &&
                progress.total_exercises > 0
              ) {
                acc[progress.challenge_id] =
                  (acc[progress.challenge_id] || 0) + 1;
              }
              return acc;
            }, {}) || {};

          participatingChallengeIds.forEach((challengeId) => {
            const completedDays = challengeCompletedDays[challengeId] || 0;
            const totalDays = challengeTrainingDays[challengeId] || 1;
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
          const now = new Date();
          const startDate = new Date(challenge.start_date);
          const endDate = new Date(challenge.end_date);
          const userParticipating = userParticipation[challenge.id];
          const progress = userProgress[challenge.id] || 0;

          let status;
          if (userParticipating) {
            // User is participating - status based on their progress
            if (progress === 100) {
              status = "completed";
            } else if (progress > 0) {
              // Challenge is past end date but user didn't complete it
              if (now > endDate) {
                status = "failed";
              } else {
                status = "active";
              }
            } else {
              // User joined but hasn't started yet
              if (now > endDate) {
                status = "failed";
              } else {
                status = "active";
              }
            }
          } else {
            // User not participating - status based on dates
            if (now > endDate) {
              status = "done"; // Challenge is finished but user never joined
            } else if (now < startDate) {
              status = "not-started";
            } else if (now >= startDate && now <= endDate) {
              status = "not-started"; // Available to join
            } else {
              status = "completed"; // Challenge ended
            }
          }
          return {
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            start_date: challenge.start_date,
            end_date: challenge.end_date,
            status,
            created_by: challenge.created_by,
            duration: calculateDuration(
              challenge.start_date,
              challenge.end_date
            ),
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
        // Show all challenges for the "all" tab
        transformedData = transformedData.filter(
          (c) => c.status !== "done" || c.userParticipating
        );
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
      const { data: allChallenges } = await supabase
        .from("challenges")
        .select("start_date, end_date")
        .eq("status", "published");
      const { data: participantData } = await supabase
        .from("challenge_participants")
        .select("challenge_id");
      const now = new Date();
      let activeChallenges = 0;
      let completedChallenges = 0;
      let totalDays = 0;
      allChallenges?.forEach((challenge) => {
        const start = new Date(challenge.start_date);
        const end = new Date(challenge.end_date);
        if (start <= now && end >= now) {
          activeChallenges++;
        } else if (end < now) {
          completedChallenges++;
        }
        totalDays += Math.ceil(
          (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        );
      });
      const averageDuration = allChallenges?.length
        ? Math.round(totalDays / allChallenges.length)
        : 0;
      setStats({
        activeChallenges,
        completedChallenges,
        totalParticipants: participantData?.length || 0,
        averageDuration: `${averageDuration} days`,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };
  const getChallengeStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (start > now) return "not-started";
    if (start <= now && end >= now) return "active";
    return "completed";
  };
  const calculateDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };
  const openChallengeModal = (challenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
  };
  const handleJoinChallenge = async (challengeId: string) => {
    if (!user) return;

    // Find the challenge by ID and set it as selected
    const challenge = challenges.find((c) => c.id === challengeId);
    if (challenge) {
      setSelectedChallenge(challenge);
      // allow the user to set the start challenge date
      setShowStartDatePicker(true);
    } else {
      toast({
        title: "Error",
        description: "Challenge not found. Please try again.",
        variant: "destructive",
      });
    }
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
        return "bg-yellow-500/90 text-yellow-100 border-yellow-500/30";
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

  // Show admin-only access message for non-admin users
  if (!roleLoading && !isAdmin) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="max-w-2xl mx-auto text-center">
          <div className="glass-effect p-8 rounded-xl border border-white/10">
            <div className="mb-6">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary to-primary-foreground rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4">
                Admin Only
              </h1>
              <p className="text-muted-foreground text-lg mb-6">
                Challenges are currently only accessible to administrators.
              </p>
              <div className="space-y-3 text-left">
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Create and manage training challenges</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Track participant progress</span>
                </div>
                <div className="flex items-center text-muted-foreground">
                  <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                  <span>Community engagement features</span>
                </div>
              </div>
            </div>
            <Button
              onClick={() => navigate("/")}
              variant="primary"
              className="mr-4"
            >
              Go to Home
            </Button>
            <Button
              onClick={() => navigate("/library")}
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
            >
              View Library
            </Button>
          </div>
        </div>
      </div>
    );
  }

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

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {[
            {
              label: "Active Challenges",
              value: stats.activeChallenges.toString(),
              icon: Trophy,
            },
            {
              label: "Completed",
              value: stats.completedChallenges.toString(),
              icon: Calendar,
            },
            {
              label: "Total Participants",
              value: stats.totalParticipants.toLocaleString(),
              icon: Users,
            },
            {
              label: "Average Duration",
              value: stats.averageDuration,
              icon: Clock,
            },
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-effect border-white/10">
                <CardContent className="p-3 sm:p-6 text-center">
                  <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400 mx-auto mb-2 sm:mb-3" />
                  <div className="gradient-text text-lg sm:text-2xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-xs sm:text-sm">
                    {stat.label}
                  </div>
                </CardContent>
              </Card>
            );
          })}
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
                challenges.map((challenge) => (
                  <Card
                    key={challenge.id}
                    className="glass-effect border-white/10 hover-lift overflow-hidden cursor-pointer"
                    onClick={() => openChallengeModal(challenge)}
                  >
                    <div className="relative h-48">
                      <img
                        src={challenge.image}
                        alt={challenge.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                      <div className="absolute top-4 right-4">
                        <Badge className={getStatusColor(challenge.status)}>
                          {challenge.status.replace("-", " ")}
                        </Badge>
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
                        <Badge
                          className={getDifficultyColor(challenge.difficulty)}
                        >
                          {challenge.difficulty}
                        </Badge>
                      </div>

                      {/* Action Buttons */}
                      {challenge.status === "not-started" ? (
                        <div className="flex flex-col sm:flex-row gap-2">
                          <Button
                            variant="outline"
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                            onClick={(e) => {
                              e.stopPropagation();
                              openChallengeModal(challenge);
                            }}
                          >
                            Preview
                          </Button>
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleJoinChallenge(challenge.id);
                            }}
                          >
                            Join Challenge
                          </Button>
                        </div>
                      ) : (
                        <Button
                          variant="primary"
                          className="w-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            openChallengeModal(challenge);
                          }}
                        >
                          {getButtonText(challenge.status)}
                          <ChevronRight className="ml-2 w-4 h-4" />
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))
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
      />

      {/* Create Challenge Modal */}
      <CreateChallengeModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onChallengeCreated={fetchChallenges}
      />

      {/* Start Date Picker Modal */}
      {showStartDatePicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <Card className="glass-effect border-white/10 max-w-md w-full">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <CalendarIcon className="w-5 h-5 mr-2" />
                Choose Challenge Start Date
              </CardTitle>
              <p className="text-muted-foreground">
                Select when you want to start this challenge (up to 1 month ago)
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal border-white/20 bg-black/20"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedStartDate
                        ? format(selectedStartDate, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[70]" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedStartDate}
                      onSelect={(date) => {
                        setSelectedStartDate(date);
                      }}
                      disabled={(date) =>
                        date > new Date() || date < subMonths(new Date(), 1)
                      }
                      initialFocus
                      className="p-3 pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
                <div className="flex space-x-2">
                  <Button
                    onClick={handleStartDateConfirm}
                    disabled={!selectedStartDate}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    Confirm & Start Challenge
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
