import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Repeat,
  Timer,
  Video,
  Volume2,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDictionary } from "@/contexts/DictionaryContext";

interface Exercise {
  id: string;
  figure_id: string;
  order_index: number;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  video_url?: string;
  audio_url?: string;
  notes?: string;
  figure?: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
    instructions?: string;
    image_url?: string;
  };
}

interface Figure {
  id: string;
  name: string;
  difficulty_level: string;
  category: string;
  image_url?: string;
  instructions?: string;
}

interface ExerciseManagementProps {
  trainingDayId: string;
  exercises: Exercise[];
  onExercisesChange: (exercises: Exercise[]) => void;
  canEdit: boolean;
  challengeType?: string;
}

const ExerciseManagement: React.FC<ExerciseManagementProps> = ({
  trainingDayId,
  exercises,
  onExercisesChange,
  canEdit,
  challengeType,
}) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [availableFigures, setAvailableFigures] = useState<Figure[]>([]);
  const [selectedFigure, setSelectedFigure] = useState<string>("");
  const [sets, setSets] = useState<number | undefined>();
  const [reps, setReps] = useState<number | undefined>();
  const [holdTime, setHoldTime] = useState<number | undefined>();
  const [restTime, setRestTime] = useState<number | undefined>();
  const [videoUrl, setVideoUrl] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const { user } = useAuth();
  const { getDifficultyColor, getDifficultyLabel } = useDictionary();

  useEffect(() => {
    fetchFigures();
  }, [challengeType]);

  const fetchFigures = async () => {
    try {
      let query = supabase
        .from("figures")
        .select("id, name, difficulty_level, category, image_url, type")
        .order("name");

      // Filter by "core" type for timer challenges
      if (challengeType === "timer") {
        query = query.eq("category", "core");
      }

      const { data, error } = await query;

      if (error) throw error;
      setAvailableFigures(data || []);
    } catch (error) {
      console.error("Error fetching figures:", error);
    }
  };

  const resetForm = () => {
    setSelectedFigure("");
    setSets(undefined);
    setReps(undefined);
    setHoldTime(undefined);
    setRestTime(undefined);
    setVideoUrl("");
    setAudioUrl("");
    setNotes("");
    setEditingExercise(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsAddModalOpen(true);
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setSelectedFigure(exercise.figure_id);
    setSets(exercise.sets);
    setReps(exercise.reps);
    setHoldTime(exercise.hold_time_seconds);
    setRestTime(exercise.rest_time_seconds);
    setVideoUrl(exercise.video_url || "");
    setAudioUrl(exercise.audio_url || "");
    setNotes(exercise.notes || "");
    setIsAddModalOpen(true);
  };

  const handleSave = async () => {
    if (!selectedFigure) {
      toast({
        title: "Error",
        description: "Please select a figure",
        variant: "destructive",
      });
      return;
    }

    // For temporary training day IDs (when creating new challenges),
    // we'll handle the save in the parent component
    if (trainingDayId.startsWith("temp-")) {
      const newExercise: Exercise = {
        id: `temp-${Date.now()}`,
        figure_id: selectedFigure,
        order_index: editingExercise
          ? editingExercise.order_index
          : exercises.length,
        sets,
        reps,
        hold_time_seconds: holdTime,
        rest_time_seconds: restTime,
        video_url: videoUrl || undefined,
        audio_url: audioUrl || undefined,
        notes: notes || undefined,
        figure: availableFigures.find((f) => f.id === selectedFigure),
      };

      const updatedExercises = editingExercise
        ? exercises.map((ex) =>
            ex.id === editingExercise.id ? newExercise : ex
          )
        : [...exercises, newExercise];

      onExercisesChange(updatedExercises);
      setIsAddModalOpen(false);
      resetForm();
      return;
    }

    // Handle saving to database for existing training days
    try {
      const exerciseData = {
        training_day_id: trainingDayId,
        figure_id: selectedFigure,
        order_index: editingExercise
          ? editingExercise.order_index
          : exercises.length,
        sets,
        reps,
        hold_time_seconds: holdTime,
        rest_time_seconds: restTime,
        video_url: videoUrl || null,
        audio_url: audioUrl || null,
        notes: notes || null,
      };

      let result;
      if (editingExercise) {
        result = await supabase
          .from("training_day_exercises")
          .update(exerciseData)
          .eq("id", editingExercise.id)
          .select(
            `
            *,
            figure:figures(id, name, difficulty_level, category)
          `
          )
          .single();
      } else {
        result = await supabase
          .from("training_day_exercises")
          .insert(exerciseData)
          .select(
            `
            *,
            figure:figures(id, name, difficulty_level, category)
          `
          )
          .single();
      }

      if (result.error) throw result.error;

      const updatedExercises = editingExercise
        ? exercises.map((ex) =>
            ex.id === editingExercise.id ? result.data : ex
          )
        : [...exercises, result.data];

      onExercisesChange(updatedExercises);

      toast({
        title: "Success",
        description: `Exercise ${
          editingExercise ? "updated" : "added"
        } successfully`,
      });

      setIsAddModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast({
        title: "Error",
        description: "Failed to save exercise",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (exerciseId: string) => {
    try {
      const { error } = await supabase
        .from("training_day_exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;

      onExercisesChange(exercises.filter((ex) => ex.id !== exerciseId));

      toast({
        title: "Success",
        description: "Exercise deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Exercises</Label>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openAddModal}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Exercise
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <Card key={exercise.id} className="border-white/10 bg-white/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                  <CardTitle className="text-sm">
                    {exercise.figure?.name}
                  </CardTitle>
                  <Badge
                    className={getDifficultyColor(
                      exercise.figure?.difficulty_level || ""
                    )}
                  >
                    {getDifficultyLabel(exercise.figure?.difficulty_level)}
                  </Badge>
                </div>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(exercise)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(exercise.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                {exercise.sets && (
                  <div className="flex items-center gap-1">
                    <Repeat className="w-3 h-3" />
                    <span>{exercise.sets} sets</span>
                  </div>
                )}
                {exercise.reps && (
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-purple-400 flex-shrink-0" />
                    <span>{exercise.reps} reps</span>
                  </div>
                )}
                {exercise.hold_time_seconds && (
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span>{exercise.hold_time_seconds}s hold</span>
                  </div>
                )}
                {exercise.rest_time_seconds && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{exercise.rest_time_seconds}s rest</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                {exercise.video_url && (
                  <Badge variant="outline" className="text-xs">
                    <Video className="w-3 h-3 mr-1" />
                    Video
                  </Badge>
                )}
                {exercise.audio_url && (
                  <Badge variant="outline" className="text-xs">
                    <Volume2 className="w-3 h-3 mr-1" />
                    Audio
                  </Badge>
                )}
                {exercise.notes && (
                  <Badge variant="outline" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Notes
                  </Badge>
                )}
              </div>

              {exercise.notes && (
                <p className="text-xs text-muted-foreground mt-2">
                  {exercise.notes}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {exercises.length === 0 && (
          <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
            <Plus className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No exercises added yet</p>
            <p className="text-sm">Click "Add Exercise" to get started</p>
          </div>
        )}
      </div>

      {/* Add/Edit Exercise Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingExercise ? "Edit Exercise" : "Add Exercise"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Figure *</Label>
              <Select value={selectedFigure} onValueChange={setSelectedFigure}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a figure" />
                </SelectTrigger>
                <SelectContent>
                  {availableFigures.map((figure) => (
                    <SelectItem key={figure.id} value={figure.id}>
                      <div className="flex items-center gap-2">
                        <span>{figure.name}</span>
                        <Badge
                          className={getDifficultyColor(
                            figure.difficulty_level
                          )}
                        >
                          {getDifficultyLabel(figure.difficulty_level)}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Sets</Label>
                <Input
                  type="number"
                  placeholder="Number of sets"
                  value={sets || ""}
                  onChange={(e) =>
                    setSets(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Reps</Label>
                <Input
                  type="number"
                  placeholder="Number of reps"
                  value={reps || ""}
                  onChange={(e) =>
                    setReps(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hold Time (seconds)</Label>
                <Input
                  type="number"
                  placeholder="Hold duration"
                  value={holdTime || ""}
                  onChange={(e) =>
                    setHoldTime(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Rest Time (seconds)</Label>
                <Input
                  type="number"
                  placeholder="Rest duration"
                  value={restTime || ""}
                  onChange={(e) =>
                    setRestTime(
                      e.target.value ? parseInt(e.target.value) : undefined
                    )
                  }
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Video URL</Label>
              <Input
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Audio URL</Label>
              <Input
                placeholder="https://..."
                value={audioUrl}
                onChange={(e) => setAudioUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional instructions or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
              >
                Cancel
              </Button>
              <Button onClick={handleSave}>
                {editingExercise ? "Update" : "Add"} Exercise
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseManagement;
