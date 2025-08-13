import React from "react";
import { X, Trophy } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

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
      <DialogContent className="max-w-4xl max-h-[90vh] glass-effect border-white/10 text-white p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">{exercise.name}</h2>
              <Badge className={getDifficultyColor(exercise.difficulty_level)}>
                {exercise.difficulty_level.charAt(0).toUpperCase() + exercise.difficulty_level.slice(1)}
              </Badge>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Image */}
        <div className="p-6 pt-4">
          <div className="relative aspect-video rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20 mb-6">
            {exercise.image_url ? (
              <img
                src={exercise.image_url}
                alt={exercise.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Trophy className="w-16 h-16 text-white/20 mx-auto mb-2" />
                  <p className="text-white/40">No image available</p>
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          {exercise.instructions && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">Instructions</h3>
              <div className="p-4 rounded-lg glass-effect border-white/10">
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {exercise.instructions}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExerciseImageModal;