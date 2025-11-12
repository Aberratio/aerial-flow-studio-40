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
  ArrowUp,
  ArrowDown,
  Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
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
  play_video?: boolean;
  video_position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
  figure?: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
    instructions?: string;
    image_url?: string;
    video_url?: string;
  };
}

interface Figure {
  id: string;
  name: string;
  difficulty_level: string;
  category: string;
  image_url?: string;
  video_url?: string;
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
  const [playVideo, setPlayVideo] = useState<boolean>(true);
  const [videoPosition, setVideoPosition] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>('center');
  const [applyToAllDays, setApplyToAllDays] = useState<boolean>(true);
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
        .select("id, name, difficulty_level, category, image_url, video_url, type")
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

  const selectedFigureHasVideo = (): boolean => {
    if (!selectedFigure) return false;
    const figure = availableFigures.find(f => f.id === selectedFigure);
    return !!(figure?.video_url);
  };

  useEffect(() => {
    if (selectedFigure && !editingExercise) {
      const figure = availableFigures.find(f => f.id === selectedFigure);
      if (figure?.video_url) {
        setPlayVideo(true);
      }
    }
  }, [selectedFigure]);

  const resetForm = () => {
    setSelectedFigure("");
    setSets(undefined);
    setReps(undefined);
    setHoldTime(undefined);
    setRestTime(undefined);
    setVideoUrl("");
    setAudioUrl("");
    setNotes("");
    setPlayVideo(true);
    setVideoPosition('center');
    setApplyToAllDays(true);
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
    setPlayVideo(exercise.play_video ?? true);
    setVideoPosition(exercise.video_position || 'center');
    setApplyToAllDays(true);
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
        play_video: selectedFigureHasVideo() ? playVideo : undefined,
        video_position: selectedFigureHasVideo() ? videoPosition : undefined,
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
        play_video: selectedFigureHasVideo() ? playVideo : null,
        video_position: selectedFigureHasVideo() ? videoPosition : null,
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

        // Update all instances of this figure in the challenge if applyToAllDays is checked
        if (!result.error && applyToAllDays && selectedFigureHasVideo()) {
          await updateVideoSettingsForAllDays(selectedFigure, {
            play_video: playVideo,
            video_position: videoPosition as 'center' | 'top' | 'bottom' | 'left' | 'right',
          });
        }
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

  const updateVideoSettingsForAllDays = async (
    figureId: string,
    settings: { play_video: boolean; video_position: 'center' | 'top' | 'bottom' | 'left' | 'right' }
  ) => {
    try {
      // Get challenge_id from current training_day_id
      const { data: dayData } = await supabase
        .from("challenge_training_days")
        .select("challenge_id")
        .eq("id", trainingDayId)
        .single();

      if (!dayData) return;

      // Get all training days for this challenge
      const { data: allDays } = await supabase
        .from("challenge_training_days")
        .select("id")
        .eq("challenge_id", dayData.challenge_id);

      if (!allDays) return;

      const dayIds = allDays.map(d => d.id);

      // Update all exercises with this figure_id in all days of this challenge
      const { error } = await supabase
        .from("training_day_exercises")
        .update(settings)
        .eq("figure_id", figureId)
        .in("training_day_id", dayIds);

      if (error) {
        console.error("Error updating video settings for all days:", error);
        toast({
          title: "Partial update",
          description: "Exercise updated but settings may not have applied to all days.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error in updateVideoSettingsForAllDays:", error);
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

  const handleMoveUp = async (exerciseId: string, currentIndex: number) => {
    if (currentIndex === 0) return;

    const currentExercise = exercises[currentIndex];
    const aboveExercise = exercises[currentIndex - 1];

    const updatedExercises = [...exercises];
    updatedExercises[currentIndex] = { ...aboveExercise, order_index: currentExercise.order_index };
    updatedExercises[currentIndex - 1] = { ...currentExercise, order_index: aboveExercise.order_index };

    if (!trainingDayId.startsWith("temp-")) {
      try {
        const { error: error1 } = await supabase
          .from("training_day_exercises")
          .update({ order_index: currentExercise.order_index })
          .eq("id", aboveExercise.id);

        const { error: error2 } = await supabase
          .from("training_day_exercises")
          .update({ order_index: aboveExercise.order_index })
          .eq("id", currentExercise.id);

        if (error1 || error2) throw error1 || error2;

        toast({
          title: "Success",
          description: "Exercise moved up successfully",
        });
      } catch (error) {
        console.error("Error moving exercise:", error);
        toast({
          title: "Error",
          description: "Failed to move exercise",
          variant: "destructive",
        });
        return;
      }
    }

    onExercisesChange(updatedExercises.sort((a, b) => a.order_index - b.order_index));
  };

  const handleMoveDown = async (exerciseId: string, currentIndex: number) => {
    if (currentIndex === exercises.length - 1) return;

    const currentExercise = exercises[currentIndex];
    const belowExercise = exercises[currentIndex + 1];

    const updatedExercises = [...exercises];
    updatedExercises[currentIndex] = { ...belowExercise, order_index: currentExercise.order_index };
    updatedExercises[currentIndex + 1] = { ...currentExercise, order_index: belowExercise.order_index };

    if (!trainingDayId.startsWith("temp-")) {
      try {
        const { error: error1 } = await supabase
          .from("training_day_exercises")
          .update({ order_index: currentExercise.order_index })
          .eq("id", belowExercise.id);

        const { error: error2 } = await supabase
          .from("training_day_exercises")
          .update({ order_index: belowExercise.order_index })
          .eq("id", currentExercise.id);

        if (error1 || error2) throw error1 || error2;

        toast({
          title: "Success",
          description: "Exercise moved down successfully",
        });
      } catch (error) {
        console.error("Error moving exercise:", error);
        toast({
          title: "Error",
          description: "Failed to move exercise",
          variant: "destructive",
        });
        return;
      }
    }

    onExercisesChange(updatedExercises.sort((a, b) => a.order_index - b.order_index));
  };

  const handleDuplicate = async (exercise: Exercise, currentIndex: number) => {
    try {
      const newOrderIndex = currentIndex + 1;
      
      // Increment order_index for all exercises after the current one
      const updatedExercises = exercises.map((ex, idx) => {
        if (idx > currentIndex) {
          return { ...ex, order_index: ex.order_index + 1 };
        }
        return ex;
      });

      // Create the duplicate exercise
      const duplicatedExercise: Exercise = {
        ...exercise,
        id: trainingDayId.startsWith("temp-") ? `temp-${Date.now()}` : exercise.id,
        order_index: newOrderIndex,
      };

      if (!trainingDayId.startsWith("temp-")) {
        // Update order_index for affected exercises
        const affectedExercises = exercises.filter((_, idx) => idx > currentIndex);
        
        for (const ex of affectedExercises) {
          const { error } = await supabase
            .from("training_day_exercises")
            .update({ order_index: ex.order_index + 1 })
            .eq("id", ex.id);
          
          if (error) throw error;
        }

        // Insert the new exercise
        const { data, error } = await supabase
          .from("training_day_exercises")
          .insert({
            training_day_id: trainingDayId,
            figure_id: exercise.figure_id,
            order_index: newOrderIndex,
            sets: exercise.sets,
            reps: exercise.reps,
            hold_time_seconds: exercise.hold_time_seconds,
            rest_time_seconds: exercise.rest_time_seconds,
            video_url: exercise.video_url,
            audio_url: exercise.audio_url,
            notes: exercise.notes,
            play_video: exercise.play_video,
            video_position: exercise.video_position,
          })
          .select(`
            *,
            figure:figures(id, name, difficulty_level, category, image_url, video_url, instructions)
          `)
          .single();

        if (error) throw error;
        duplicatedExercise.id = data.id;
        duplicatedExercise.figure = data.figure;

        toast({
          title: "Success",
          description: "Exercise duplicated successfully",
        });
      }

      // Insert the duplicated exercise at the correct position
      const finalExercises = [
        ...updatedExercises.slice(0, newOrderIndex),
        duplicatedExercise,
        ...updatedExercises.slice(newOrderIndex),
      ];

      onExercisesChange(finalExercises.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error("Error duplicating exercise:", error);
      toast({
        title: "Error",
        description: "Failed to duplicate exercise",
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
                      onClick={() => handleMoveUp(exercise.id, index)}
                      disabled={index === 0}
                      title="Przenieś w górę"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMoveDown(exercise.id, index)}
                      disabled={index === exercises.length - 1}
                      title="Przenieś w dół"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDuplicate(exercise, index)}
                      title="Duplikuj ćwiczenie"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
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
                      {figure.name} - {getDifficultyLabel(figure.difficulty_level)}
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

            {selectedFigureHasVideo() && (
              <>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={playVideo}
                      onCheckedChange={setPlayVideo}
                      id="play-video"
                    />
                    <Label htmlFor="play-video" className="cursor-pointer">
                      <div className="flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        <span>Pokaż wideo podczas treningu</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Jeśli włączone, podczas treningu zamiast zdjęcia odtworzy się wideo figury
                      </p>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="video-position">Pozycja kadrowania video</Label>
                  <Select
                    value={videoPosition}
                    onValueChange={(value: any) => setVideoPosition(value)}
                  >
                    <SelectTrigger id="video-position">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full" />
                          </div>
                          Centrum
                        </div>
                      </SelectItem>
                      <SelectItem value="top">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white rounded flex items-start justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full mt-0.5" />
                          </div>
                          Góra
                        </div>
                      </SelectItem>
                      <SelectItem value="bottom">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white rounded flex items-end justify-center">
                            <div className="w-1.5 h-1.5 bg-white rounded-full mb-0.5" />
                          </div>
                          Dół
                        </div>
                      </SelectItem>
                      <SelectItem value="left">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-start">
                            <div className="w-1.5 h-1.5 bg-white rounded-full ml-0.5" />
                          </div>
                          Lewa strona
                        </div>
                      </SelectItem>
                      <SelectItem value="right">
                        <div className="flex items-center gap-2">
                          <div className="w-4 h-4 border-2 border-white rounded flex items-center justify-end">
                            <div className="w-1.5 h-1.5 bg-white rounded-full mr-0.5" />
                          </div>
                          Prawa strona
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Określa, która część video jest widoczna gdy jest przycinane do kwadratu
                  </p>
                </div>

                <div className="space-y-2 bg-blue-900/20 border border-blue-400/30 rounded-lg p-3">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="apply-to-all-days"
                      checked={applyToAllDays}
                      onCheckedChange={(checked) => setApplyToAllDays(!!checked)}
                    />
                    <Label htmlFor="apply-to-all-days" className="cursor-pointer text-sm font-medium text-blue-300">
                      Zastosuj ustawienia video do wszystkich dni z tym ćwiczeniem
                    </Label>
                  </div>
                  <p className="text-xs text-blue-200/70 ml-6">
                    Jeśli zaznaczone, ustawienia "Pokaż wideo" i "Pozycja kadrowania" zostaną 
                    zastosowane do wszystkich wystąpień tego ćwiczenia w wyzwaniu
                  </p>
                </div>
              </>
            )}

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
