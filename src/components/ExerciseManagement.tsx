import React, { useState, useEffect } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Repeat,
  Timer,
  Video,
  FileText,
  ArrowUp,
  ArrowDown,
  Copy,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
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
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDictionary } from "@/contexts/DictionaryContext";
import { ExerciseSearchModal } from "@/components/ExerciseSearchModal";

interface Exercise {
  id: string;
  figure_id: string;
  order_index: number;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
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
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercise | null>(null);
  const [availableFigures, setAvailableFigures] = useState<Figure[]>([]);
  
  // Edit form state
  const [sets, setSets] = useState<number | undefined>();
  const [reps, setReps] = useState<number | undefined>();
  const [holdTime, setHoldTime] = useState<number | undefined>();
  const [restTime, setRestTime] = useState<number | undefined>();
  const [notes, setNotes] = useState("");
  const [playVideo, setPlayVideo] = useState<boolean>(true);
  const [videoPosition, setVideoPosition] = useState<'center' | 'top' | 'bottom' | 'left' | 'right'>('center');
  
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

  const resetEditForm = () => {
    setSets(undefined);
    setReps(undefined);
    setHoldTime(undefined);
    setRestTime(undefined);
    setNotes("");
    setPlayVideo(true);
    setVideoPosition('center');
    setEditingExercise(null);
  };

  const openEditModal = (exercise: Exercise) => {
    setEditingExercise(exercise);
    setSets(exercise.sets);
    setReps(exercise.reps);
    setHoldTime(exercise.hold_time_seconds);
    setRestTime(exercise.rest_time_seconds);
    setNotes(exercise.notes || "");
    setPlayVideo(exercise.play_video ?? true);
    setVideoPosition(exercise.video_position || 'center');
    setIsEditModalOpen(true);
  };

  const selectedFigureHasVideo = (): boolean => {
    if (!editingExercise) return false;
    return !!(editingExercise.figure?.video_url);
  };

  const handleExerciseFromSearch = async (
    selectedExercise: { id: string; name: string; hold_time_seconds?: number },
    defaultSets?: number,
    defaultReps?: number,
    defaultHoldTime?: number
  ) => {
    // Create exercise with defaults
    const figure = availableFigures.find(f => f.id === selectedExercise.id) || {
      id: selectedExercise.id,
      name: selectedExercise.name,
      difficulty_level: '',
      category: '',
    };

    const newExercise: Exercise = {
      id: trainingDayId.startsWith("temp-") ? `temp-${Date.now()}` : "",
      figure_id: selectedExercise.id,
      order_index: exercises.length,
      sets: defaultSets || 1,
      reps: defaultReps || 1,
      hold_time_seconds: defaultHoldTime || selectedExercise.hold_time_seconds || 30,
      rest_time_seconds: 30,
      notes: undefined,
      play_video: figure.video_url ? true : undefined,
      video_position: figure.video_url ? 'center' : undefined,
      figure: figure as any,
    };

    if (trainingDayId.startsWith("temp-")) {
      onExercisesChange([...exercises, newExercise]);
      toast({
        title: "Dodano",
        description: `${selectedExercise.name} zostało dodane`,
      });
    } else {
      try {
        const { data, error } = await supabase
          .from("training_day_exercises")
          .insert({
            training_day_id: trainingDayId,
            figure_id: selectedExercise.id,
            order_index: exercises.length,
            sets: newExercise.sets,
            reps: newExercise.reps,
            hold_time_seconds: newExercise.hold_time_seconds,
            rest_time_seconds: newExercise.rest_time_seconds,
            play_video: newExercise.play_video,
            video_position: newExercise.video_position,
          })
          .select(`
            *,
            figure:figures(id, name, difficulty_level, category, image_url, video_url, instructions)
          `)
          .single();

        if (error) throw error;

        onExercisesChange([...exercises, data]);
        toast({
          title: "Dodano",
          description: `${selectedExercise.name} zostało dodane`,
        });
      } catch (error) {
        console.error("Error adding exercise:", error);
        toast({
          title: "Błąd",
          description: "Nie udało się dodać ćwiczenia",
          variant: "destructive",
        });
      }
    }
  };

  const handleSaveEdit = async () => {
    if (!editingExercise) return;

    const exerciseData = {
      sets,
      reps,
      hold_time_seconds: holdTime,
      rest_time_seconds: restTime,
      notes: notes || null,
      play_video: selectedFigureHasVideo() ? playVideo : null,
      video_position: selectedFigureHasVideo() ? videoPosition : null,
    };

    if (trainingDayId.startsWith("temp-")) {
      const updatedExercises = exercises.map((ex) =>
        ex.id === editingExercise.id
          ? { ...ex, ...exerciseData }
          : ex
      );
      onExercisesChange(updatedExercises);
      setIsEditModalOpen(false);
      resetEditForm();
      return;
    }

    try {
      const { data, error } = await supabase
        .from("training_day_exercises")
        .update(exerciseData)
        .eq("id", editingExercise.id)
        .select(`
          *,
          figure:figures(id, name, difficulty_level, category, image_url, video_url, instructions)
        `)
        .single();

      if (error) throw error;

      const updatedExercises = exercises.map((ex) =>
        ex.id === editingExercise.id ? data : ex
      );
      onExercisesChange(updatedExercises);

      toast({
        title: "Zapisano",
        description: "Ćwiczenie zostało zaktualizowane",
      });

      setIsEditModalOpen(false);
      resetEditForm();
    } catch (error) {
      console.error("Error saving exercise:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zapisać zmian",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (exerciseId: string) => {
    if (trainingDayId.startsWith("temp-")) {
      onExercisesChange(exercises.filter((ex) => ex.id !== exerciseId));
      return;
    }

    try {
      const { error } = await supabase
        .from("training_day_exercises")
        .delete()
        .eq("id", exerciseId);

      if (error) throw error;

      onExercisesChange(exercises.filter((ex) => ex.id !== exerciseId));
      toast({
        title: "Usunięto",
        description: "Ćwiczenie zostało usunięte",
      });
    } catch (error) {
      console.error("Error deleting exercise:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się usunąć ćwiczenia",
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
        await supabase
          .from("training_day_exercises")
          .update({ order_index: currentExercise.order_index })
          .eq("id", aboveExercise.id);

        await supabase
          .from("training_day_exercises")
          .update({ order_index: aboveExercise.order_index })
          .eq("id", currentExercise.id);
      } catch (error) {
        console.error("Error moving exercise:", error);
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
        await supabase
          .from("training_day_exercises")
          .update({ order_index: currentExercise.order_index })
          .eq("id", belowExercise.id);

        await supabase
          .from("training_day_exercises")
          .update({ order_index: belowExercise.order_index })
          .eq("id", currentExercise.id);
      } catch (error) {
        console.error("Error moving exercise:", error);
        return;
      }
    }

    onExercisesChange(updatedExercises.sort((a, b) => a.order_index - b.order_index));
  };

  const handleDuplicate = async (exercise: Exercise, currentIndex: number) => {
    try {
      const newOrderIndex = currentIndex + 1;
      
      const updatedExercises = exercises.map((ex, idx) => {
        if (idx > currentIndex) {
          return { ...ex, order_index: ex.order_index + 1 };
        }
        return ex;
      });

      const duplicatedExercise: Exercise = {
        ...exercise,
        id: trainingDayId.startsWith("temp-") ? `temp-${Date.now()}` : exercise.id,
        order_index: newOrderIndex,
      };

      if (!trainingDayId.startsWith("temp-")) {
        const affectedExercises = exercises.filter((_, idx) => idx > currentIndex);
        
        for (const ex of affectedExercises) {
          await supabase
            .from("training_day_exercises")
            .update({ order_index: ex.order_index + 1 })
            .eq("id", ex.id);
        }

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
          title: "Zduplikowano",
          description: "Ćwiczenie zostało zduplikowane",
        });
      }

      const finalExercises = [
        ...updatedExercises.slice(0, newOrderIndex),
        duplicatedExercise,
        ...updatedExercises.slice(newOrderIndex),
      ];

      onExercisesChange(finalExercises.sort((a, b) => a.order_index - b.order_index));
    } catch (error) {
      console.error("Error duplicating exercise:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się zduplikować ćwiczenia",
        variant: "destructive",
      });
    }
  };

  const selectedExerciseIds = exercises.map(e => e.figure_id);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Ćwiczenia ({exercises.length})</Label>
        {canEdit && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsSearchModalOpen(true)}
            className="flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Dodaj ćwiczenia
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
                    <span>{exercise.sets} serii</span>
                  </div>
                )}
                {exercise.reps && (
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full bg-purple-400 flex-shrink-0" />
                    <span>{exercise.reps} powt.</span>
                  </div>
                )}
                {exercise.hold_time_seconds && (
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3" />
                    <span>{exercise.hold_time_seconds}s trzymania</span>
                  </div>
                )}
                {exercise.rest_time_seconds && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>{exercise.rest_time_seconds}s przerwy</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 mt-2">
                {exercise.notes && (
                  <Badge variant="outline" className="text-xs">
                    <FileText className="w-3 h-3 mr-1" />
                    Notatki
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
            <p>Brak dodanych ćwiczeń</p>
            <p className="text-sm">Kliknij "Dodaj ćwiczenia" aby zacząć</p>
          </div>
        )}
      </div>

      {/* Exercise Search Modal */}
      <ExerciseSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        onExerciseSelect={handleExerciseFromSearch}
        selectedExercises={selectedExerciseIds}
      />

      {/* Edit Exercise Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              Edytuj: {editingExercise?.figure?.name}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Serie</Label>
                <Input
                  type="number"
                  placeholder="Liczba serii"
                  value={sets || ""}
                  onChange={(e) =>
                    setSets(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Powtórzenia</Label>
                <Input
                  type="number"
                  placeholder="Liczba powtórzeń"
                  value={reps || ""}
                  onChange={(e) =>
                    setReps(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Czas trzymania (s)</Label>
                <Input
                  type="number"
                  placeholder="Sekundy"
                  value={holdTime || ""}
                  onChange={(e) =>
                    setHoldTime(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Czas przerwy (s)</Label>
                <Input
                  type="number"
                  placeholder="Sekundy"
                  value={restTime || ""}
                  onChange={(e) =>
                    setRestTime(e.target.value ? parseInt(e.target.value) : undefined)
                  }
                />
              </div>
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
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Pozycja kadrowania video</Label>
                  <Select
                    value={videoPosition}
                    onValueChange={(value: any) => setVideoPosition(value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="center">Centrum</SelectItem>
                      <SelectItem value="top">Góra</SelectItem>
                      <SelectItem value="bottom">Dół</SelectItem>
                      <SelectItem value="left">Lewa strona</SelectItem>
                      <SelectItem value="right">Prawa strona</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label>Notatki</Label>
              <Textarea
                placeholder="Dodatkowe instrukcje..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditModalOpen(false);
                  resetEditForm();
                }}
              >
                Anuluj
              </Button>
              <Button onClick={handleSaveEdit}>
                Zapisz zmiany
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExerciseManagement;
