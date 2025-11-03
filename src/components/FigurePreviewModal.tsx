import React, { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, CheckCircle, ExternalLink } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { FigureCompletionCelebration } from "./FigureCompletionCelebration";
import { useDictionary } from "@/contexts/DictionaryContext";

interface FigurePreviewModalProps {
  figure: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
    instructions?: string;
    image_url?: string;
    description?: string;
    video_url?: string;
    audio_url?: string;
    type?: string;
    tags?: string[];
    hold_time_seconds?: number;
    level_number?: number;
    // Level-specific fields
    is_boss?: boolean;
    boss_description?: string;
    level_hold_time_seconds?: number;
    level_reps?: number;
    level_notes?: string;
    // Transitions fields
    transition_from_figure_id?: string;
    transition_to_figure_id?: string;
    transition_from_figure?: {
      id: string;
      name: string;
      image_url?: string;
    };
    transition_to_figure?: {
      id: string;
      name: string;
      image_url?: string;
    };
  } | null;
  isOpen: boolean;
  onClose: () => void;
  onFigureCompleted?: (figureId: string) => void;
}

export const FigurePreviewModal: React.FC<FigurePreviewModalProps> = ({
  figure,
  isOpen,
  onClose,
  onFigureCompleted,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getDifficultyColor, getDifficultyLabel } = useDictionary();
  const [figureProgress, setFigureProgress] = useState<string>("not_tried");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  // Fetch figure progress
  const fetchFigureProgress = async () => {
    if (!figure || !user) return;

    try {
      const { data, error } = await supabase
        .from("figure_progress")
        .select("status")
        .eq("user_id", user.id)
        .eq("figure_id", figure.id)
        .single();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      setFigureProgress(data?.status || "not_tried");
    } catch (error) {
      console.error("Error fetching figure progress:", error);
    }
  };

  // Update figure status
  const updateFigureStatus = async (newStatus: string) => {
    if (!figure || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from("figure_progress").upsert({
        user_id: user.id,
        figure_id: figure.id,
        status: newStatus,
      });

      if (error) throw error;

      setFigureProgress(newStatus);
      
      // If marking as completed, show celebration
      if (newStatus === "completed") {
        setShowCelebration(true);
        
        // After 3 seconds, hide celebration, close modal, and call callback
        setTimeout(() => {
          setShowCelebration(false);
          onClose();
          onFigureCompleted?.(figure.id);
        }, 3000);
      } else {
        toast.success(`Figure marked as ${newStatus.replace("_", " ")}`);
      }
    } catch (error) {
      console.error("Error updating figure status:", error);
      toast.error("Failed to update figure status");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && figure) {
      fetchFigureProgress();
    }
  }, [isOpen, figure, user]);

  if (!figure) return null;

  return (
    <>
      <FigureCompletionCelebration
        isOpen={showCelebration}
        figureName={figure?.name || ""}
        pointsEarned={figure?.level_number || 1}
      />
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl w-full p-0 bg-black/95 border-white/10">
        <div className="relative">
          {/* Image */}
          <div className="w-full aspect-video bg-black/50 flex items-center justify-center">
            {figure.image_url ? (
              <img
                src={figure.image_url}
                alt={figure.name}
                className="w-full h-full object-cover"
              />
            ) : figure.video_url ? (
              <video
                src={figure.video_url}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📷</div>
                <p>Brak mediów</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">
                {figure.name}
              </h2>
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <Badge className={getDifficultyColor(figure.difficulty_level)}>
                  {figure.difficulty_level || "Nieznany"}
                </Badge>
                
                {/* Level-specific hold time has priority */}
                {figure.level_hold_time_seconds && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                    ⏱️ Trzymaj {figure.level_hold_time_seconds}s
                  </Badge>
                )}
                {!figure.level_hold_time_seconds && figure.hold_time_seconds && figure.hold_time_seconds > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                    ⏱️ Trzymaj {figure.hold_time_seconds}s
                  </Badge>
                )}
                
                {/* Level-specific reps */}
                {figure.level_reps && (
                  <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30">
                    🔁 {figure.level_reps} powtórzeń
                  </Badge>
                )}
              </div>
            </div>

            {/* Level-specific notes */}
            {figure.level_notes && (
              <div className="mb-4 p-3 bg-blue-900/20 border border-blue-400/20 rounded-lg">
                <p className="text-sm text-blue-300">
                  💡 {figure.level_notes}
                </p>
              </div>
            )}

            {/* Boss indicator */}
            {figure.is_boss && (
              <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-400/30 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👑</span>
                  <span className="font-bold text-yellow-400">Figurka Boss</span>
                </div>
                {figure.boss_description && (
                  <p className="text-sm text-yellow-200">
                    {figure.boss_description}
                  </p>
                )}
              </div>
            )}

            {/* Transitions Section - Show from/to figures */}
            {figure.type === 'transitions' && figure.transition_from_figure && figure.transition_to_figure && (
              <div className="mb-4 p-4 bg-purple-900/20 border border-purple-400/20 rounded-lg">
                <h3 className="text-lg font-semibold text-white mb-3">Przejście między figurami</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* From Figure */}
                  <div 
                    className="p-3 bg-blue-900/20 border border-blue-400/20 rounded-lg cursor-pointer hover:border-blue-400/40 transition-all"
                    onClick={() => navigate(`/exercise/${figure.transition_from_figure?.id}`)}
                  >
                    <div className="text-center mb-2">
                      <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                        Figura Z
                      </Badge>
                    </div>
                    {figure.transition_from_figure.image_url && (
                      <img 
                        src={figure.transition_from_figure.image_url} 
                        alt={figure.transition_from_figure.name}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                    )}
                    <p className="text-white font-medium text-center text-sm">
                      {figure.transition_from_figure.name}
                    </p>
                  </div>
                  
                  {/* Arrow */}
                  <div className="hidden sm:flex items-center justify-center text-purple-400 text-4xl">
                    →
                  </div>
                  
                  {/* To Figure */}
                  <div 
                    className="p-3 bg-green-900/20 border border-green-400/20 rounded-lg cursor-pointer hover:border-green-400/40 transition-all"
                    onClick={() => navigate(`/exercise/${figure.transition_to_figure?.id}`)}
                  >
                    <div className="text-center mb-2">
                      <Badge className="bg-green-500/20 text-green-400 border-green-400/30">
                        Figura DO
                      </Badge>
                    </div>
                    {figure.transition_to_figure.image_url && (
                      <img 
                        src={figure.transition_to_figure.image_url} 
                        alt={figure.transition_to_figure.name}
                        className="w-full aspect-square object-cover rounded-lg mb-2"
                      />
                    )}
                    <p className="text-white font-medium text-center text-sm">
                      {figure.transition_to_figure.name}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Audio Player */}
            {figure.audio_url && (
              <div className="mb-4 p-3 bg-orange-900/20 border border-orange-400/20 rounded-lg">
                <h4 className="text-white font-medium mb-2 flex items-center gap-2">
                  🎵 Instrukcje audio
                </h4>
                <audio controls className="w-full">
                  <source src={figure.audio_url} type="audio/mpeg" />
                  Twoja przeglądarka nie obsługuje odtwarzania audio.
                </audio>
              </div>
            )}

            {/* Completed Status Button */}
            {user && (
              <div className="mb-6">
                <Button
                  variant={
                    figureProgress === "completed" ? "default" : "outline"
                  }
                  onClick={() =>
                    updateFigureStatus(
                      figureProgress === "completed" ? "not_tried" : "completed"
                    )
                  }
                  disabled={loading}
                  className={cn(
                    "w-full flex items-center justify-center gap-2",
                    figureProgress === "completed"
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-green-400/30 text-green-400 hover:bg-green-400/10"
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                  {figureProgress === "completed"
                    ? "Ukończone!"
                    : "Zaznacz jako ukończone"}
                </Button>
              </div>
            )}

            {/* View Full Exercise Button */}
            <Button
              onClick={() => navigate(`/exercise/${figure.id}`)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Pokaż pełne ćwiczenie
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
};
