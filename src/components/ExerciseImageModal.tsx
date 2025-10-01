import React from "react";
import { X, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Exercise {
  name: string;
  image_url?: string;
  difficulty_level: string;
  instructions?: string;
}

interface ExerciseImageModalProps {
  exercise: Exercise | null;
  isOpen: boolean;
  onClose: () => void;
}

const ExerciseImageModal: React.FC<ExerciseImageModalProps> = ({
  exercise,
  isOpen,
  onClose,
}) => {
  if (!exercise) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] glass-effect border-white/10 text-white p-0 overflow-hidden">
        {/* Header */}
        <div className="p-4 md:p-6 pb-3 md:pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
              <h2 className="text-lg md:text-2xl font-bold text-white truncate">{exercise.name}</h2>
              <Badge className={`${getDifficultyColor(exercise.difficulty_level)} text-xs flex-shrink-0`}>
                {exercise.difficulty_level.charAt(0).toUpperCase() + exercise.difficulty_level.slice(1)}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="p-4 md:p-6 pt-3 md:pt-4">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-4 md:mb-6">
              {exercise.image_url ? (
                <img
                  src={exercise.image_url}
                  alt={exercise.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Trophy className="w-12 md:w-16 h-12 md:h-16 text-white/20 mx-auto mb-2" />
                    <p className="text-sm md:text-base text-white/40">No image available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            {exercise.instructions && (
              <div className="space-y-2 md:space-y-3">
                <h3 className="text-base md:text-lg font-semibold text-white">Instructions</h3>
                <div className="p-3 md:p-4 rounded-lg glass-effect border-white/10">
                  <p className="text-sm md:text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {exercise.instructions}
                  </p>
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseImageModal;