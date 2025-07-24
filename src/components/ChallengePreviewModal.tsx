import React, { useState, useEffect } from "react";
import {
  Calendar,
  Trophy,
  Users,
  Clock,
  ChevronRight,
  X,
  Play,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChallengeDetailsModal } from "@/components/ChallengeDetailsModal";
import RetakeChallengeModal from "@/components/RetakeChallengeModal";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useNavigate } from "react-router-dom";
import { Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level?: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  image_url?: string;
  achievements?: Array<{
    id: string;
    name: string;
    points: number;
    icon: string;
  }>;
  training_days?: Array<{
    id: string;
    day_number: number;
    title: string;
    description: string;
    is_rest_day?: boolean;
    exercises?: Array<{
      id: string;
      figure: {
        name: string;
        difficulty_level: string;
      };
      sets?: number;
      reps?: number;
      hold_time_seconds?: number;
    }>;
  }>;
  participants_count?: number;
}

interface ChallengePreviewModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  ctaMessage: string;
}

const ChallengePreviewModal: React.FC<ChallengePreviewModalProps> = ({
  challenge: initialChallenge,
  isOpen,
  onClose,
  ctaMessage,
}) => {
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRetakeModalOpen, setIsRetakeModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetaking, setIsRetaking] = useState(false);
  const { user } = useAuth();
  const { canCreateChallenges } = useUserRole();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen && initialChallenge) {
      fetchChallengeDetails(initialChallenge.id);
    }
  }, [isOpen, initialChallenge]);

  const fetchChallengeDetails = async (challengeId: string) => {
    setIsLoading(true);
    try {
      // Fetch challenge with achievements and training days
      const { data: challengeData, error: challengeError } = await supabase
        .from("challenges")
        .select(
          `
          *,
          challenge_achievements (
            achievement:achievements (
              id, name, points, icon
            )
          ),
          challenge_training_days (
            id, day_number, title, description, is_rest_day,
            training_day_exercises (
              id, sets, reps, hold_time_seconds,
              figure:figures (
                name, difficulty_level
              )
            )
          )
        `
        )
        .eq("id", challengeId)
        .single();

      if (challengeError) throw challengeError;

      // Fetch participants count
      const { count: participantsCount } = await supabase
        .from("challenge_participants")
        .select("*", { count: "exact", head: true })
        .eq("challenge_id", challengeId);

      setChallenge({
        ...challengeData,
        achievements:
          challengeData.challenge_achievements?.map(
            (ca: any) => ca.achievement
          ) || [],
        training_days: challengeData.challenge_training_days || [],
        participants_count: participantsCount || 0,
      });
    } catch (error) {
      console.error("Error fetching challenge details:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canEditChallenge = () => {
    return (
      canCreateChallenges &&
      challenge &&
      (user?.id === challenge.created_by || user?.role === "admin")
    );
  };

  if (!challenge) return null;

  const calculateDuration = () => {
    const start = new Date(challenge.start_date);
    const end = new Date(challenge.end_date);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} days`;
  };

  const getDifficultyFromChallenge = () => {
    if (challenge.difficulty_level) {
      return (
        challenge.difficulty_level.charAt(0).toUpperCase() +
        challenge.difficulty_level.slice(1)
      );
    }
    return "Intermediate";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "published":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "draft":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
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
    const challengeStatus = initialChallenge?.status;

    if (
      challengeStatus === "done" ||
      challengeStatus === "completed" ||
      challengeStatus === "failed"
    ) {
      return "Retake Challenge";
    }

    return ctaMessage;
  };

  const handleRetakeChallenge = async () => {
    if (!user || !challenge) return;

    setIsRetaking(true);
    try {
      // Delete all progress for this challenge
      const { error: progressError } = await supabase
        .from("challenge_day_progress")
        .delete()
        .eq("user_id", user.id)
        .eq("challenge_id", challenge.id);

      if (progressError) throw progressError;

      // Use upsert to update the existing participant record instead of delete + insert
      // This avoids the unique constraint violation race condition
      const { error: upsertParticipantError } = await supabase
        .from("challenge_participants")
        .upsert(
          {
            user_id: user.id,
            challenge_id: challenge.id,
            status: "active",
            completed: false,
            user_started_at: new Date().toISOString(),
            joined_at: new Date().toISOString(),
          },
          {
            onConflict: "challenge_id,user_id",
          }
        );

      if (upsertParticipantError) throw upsertParticipantError;

      toast({
        title: "Challenge Reset!",
        description:
          "Your progress has been reset. You can now start the challenge from the beginning.",
      });

      setIsRetakeModalOpen(false);
      onClose();

      // Navigate to challenge preview page
      navigate(`/challenges/${challenge.id}`);
    } catch (error) {
      console.error("Error retaking challenge:", error);
      toast({
        title: "Error",
        description: "Failed to reset challenge progress. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRetaking(false);
    }
  };

  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl glass-effect border-white/10 text-white">
          <div className="flex items-center justify-center py-12">
            <div className="text-muted-foreground">
              Loading challenge details...
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-effect border-white/10 text-white">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl gradient-text">
              {challenge.title}
            </DialogTitle>
            {canEditChallenge() && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onClose();
                  navigate(`/challenges/${challenge.id}/edit`);
                }}
                className="border-white/20 text-white hover:bg-white/10 ml-4 mt-3"
              >
                <Edit2 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Image */}
          <div className="relative h-64 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
            {challenge.image_url ? (
              <img
                src={challenge.image_url}
                alt={challenge.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <Trophy className="w-16 h-16 text-white/20" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-4 right-4">
              <Badge
                className={`${getStatusColor(
                  challenge.status
                )} bg-black/80 backdrop-blur-sm`}
              >
                {challenge.status === "published"
                  ? "Available"
                  : challenge.status}
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4">
              <Badge
                variant="outline"
                className="border-white/30 text-white/90"
              >
                {challenge.training_days?.length || 0} Training Days
              </Badge>
            </div>
          </div>

          {/* Challenge Details */}
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {challenge.description}
            </p>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-effect border-white/10 p-4 text-center">
                <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="text-white font-semibold">
                  {calculateDuration()}
                </div>
              </Card>

              <Card className="glass-effect border-white/10 p-4 text-center">
                <Users className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">
                  Participants
                </div>
                <div className="text-white font-semibold">
                  {challenge.participants_count?.toLocaleString() || "0"}
                </div>
              </Card>

              <Card className="glass-effect border-white/10 p-4 text-center">
                <Trophy className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Difficulty</div>
                <Badge
                  className={getDifficultyColor(getDifficultyFromChallenge())}
                >
                  {getDifficultyFromChallenge()}
                </Badge>
              </Card>

              <Card className="glass-effect border-white/10 p-4 text-center">
                <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">
                  Training Days
                </div>
                <div className="text-white font-semibold">
                  {challenge.training_days?.length || 0}
                </div>
              </Card>
            </div>

            {/* Achievements */}
            {challenge.achievements && challenge.achievements.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  Challenge Achievements
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {challenge.achievements.map((achievement) => (
                    <Card
                      key={achievement.id}
                      className="glass-effect border-white/10 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{achievement.icon}</span>
                        <div>
                          <div className="font-medium text-white">
                            {achievement.name}
                          </div>
                          <div className="text-xs text-purple-400">
                            {achievement.points} points
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Training Overview */}
            {challenge.training_days && challenge.training_days.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-lg font-semibold text-white">
                  Training Overview
                </h3>
                <div className="text-muted-foreground">
                  <p>
                    This {calculateDuration()} challenge includes{" "}
                    {challenge.training_days.length} structured training days
                    with progressively challenging exercises.
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li>• Comprehensive training schedule</li>
                    <li>• Exercise demonstrations and instructions</li>
                    <li>• Progressive difficulty levels</li>
                    <li>• Achievement rewards for completion</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Close
            </Button>

            {/* Dynamic Action Button */}
            {(() => {
              const challengeStatus = initialChallenge?.status;

              if (
                challengeStatus === "done" ||
                challengeStatus === "completed" ||
                challengeStatus === "failed"
              ) {
                return (
                  <Button
                    onClick={() => setIsRetakeModalOpen(true)}
                    className="flex-1 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white"
                  >
                    Retake Challenge
                    <ChevronRight className="ml-2 w-4 h-4" />
                  </Button>
                );
              }

              return (
                <Button
                  className="flex-1"
                  variant="primary"
                  onClick={() => {
                    if (challenge.status === "published") {
                      onClose();
                      navigate(`/challenges/${challenge.id}`);
                    }
                  }}
                  disabled={challenge.status !== "published"}
                >
                  <Play className="w-4 h-4 mr-2" />
                  {getButtonText(challenge.status)}
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              );
            })()}
          </div>
        </div>
      </DialogContent>

      {/* Challenge Details Modal */}
      {challenge.training_days && (
        <ChallengeDetailsModal
          challenge={{
            id: challenge.id,
            title: challenge.title,
            description: challenge.description,
            level: getDifficultyFromChallenge(),
            totalDays: challenge.training_days.length,
            currentDay: 0,
            completedDays: 0,
            image: challenge.image_url || "",
            days: challenge.training_days.map((day, index) => ({
              day: index + 1,
              dayId: day.id, // Add the actual training day ID
              title: day.title || `Day ${index + 1}`,
              description: day.is_rest_day
                ? "Rest Day"
                : day.description || "Training session",
              duration: day.is_rest_day ? "Rest" : "30-45 mins",
              completed: false,
              figures: day.is_rest_day
                ? []
                : day.exercises?.map((ex) => ex.figure.name) || [],
              isRestDay: day.is_rest_day,
            })),
            training_days: challenge.training_days,
          }}
          isOpen={isDetailsModalOpen}
          onClose={() => setIsDetailsModalOpen(false)}
          onStart={() => {
            setIsDetailsModalOpen(false);
            onClose();
          }}
          onContinue={() => {
            setIsDetailsModalOpen(false);
            onClose();
          }}
        />
      )}

      {/* Retake Challenge Confirmation Modal */}
      <RetakeChallengeModal
        isOpen={isRetakeModalOpen}
        onClose={() => setIsRetakeModalOpen(false)}
        onConfirm={handleRetakeChallenge}
        challengeTitle={challenge?.title || ""}
        isLoading={isRetaking}
      />
    </Dialog>
  );
};

export default ChallengePreviewModal;
