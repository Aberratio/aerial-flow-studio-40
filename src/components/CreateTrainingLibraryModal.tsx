import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  TrainingExerciseManager,
  TrainingExerciseData,
} from "@/components/TrainingExerciseManager";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

interface CreateTrainingLibraryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export const CreateTrainingLibraryModal = ({
  open,
  onOpenChange,
  onSuccess,
}: CreateTrainingLibraryModalProps) => {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Step 1: Basic info
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("strength");
  const [sportType, setSportType] = useState<string[]>(["aerial_silks"]);
  const [difficulty, setDifficulty] = useState("intermediate");
  const [premium, setPremium] = useState(false);

  // Step 2: Training type
  const [trainingType, setTrainingType] = useState<
    "video" | "figure_set" | "complex"
  >("figure_set");

  // Step 3: Content
  const [videoUrl, setVideoUrl] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [exercises, setExercises] = useState<TrainingExerciseData[]>([]);

  const calculateDuration = () => {
    if (trainingType === "figure_set") {
      return exercises.reduce((total, ex) => {
        if (ex.completion_mode === "time") {
          const setTime =
            (ex.hold_time_seconds || 0) + (ex.rest_time_seconds || 0);
          return total + setTime * (ex.sets || 1) * (ex.reps || 1);
        }
        return total;
      }, 0);
    }
    return 0;
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Błąd",
        description: "Podaj tytuł treningu",
        variant: "destructive",
      });
      return;
    }

    if (trainingType === "figure_set" && exercises.length === 0) {
      toast({
        title: "Błąd",
        description: "Dodaj przynajmniej jedno ćwiczenie",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Create training
      const { data: training, error: trainingError } = await supabase
        .from("training_library")
        .insert({
          title: title.trim(),
          description: description.trim(),
          category,
          sport_type: sportType,
          difficulty_level: difficulty,
          training_type: trainingType,
          premium,
          video_url: trainingType === "video" ? videoUrl : null,
          thumbnail_url: thumbnailUrl || null,
          duration_seconds: calculateDuration(),
          is_published: false,
        })
        .select()
        .single();

      if (trainingError) throw trainingError;

      // 2. Add exercises if figure_set
      if (trainingType === "figure_set" && exercises.length > 0) {
        const exerciseInserts = exercises.map((ex) => ({
          training_id: training.id,
          figure_id: ex.figure_id,
          order_index: ex.order_index,
          completion_mode: ex.completion_mode,
          sets: ex.sets,
          reps: ex.reps,
          hold_time_seconds: ex.hold_time_seconds,
          rest_time_seconds: ex.rest_time_seconds,
          notes: ex.notes,
        }));

        const { error: exercisesError } = await supabase
          .from("training_library_exercises")
          .insert(exerciseInserts);

        if (exercisesError) throw exercisesError;
      }

      toast({
        title: "Sukces!",
        description: "Trening został utworzony",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating training:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się utworzyć treningu",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setTitle("");
    setDescription("");
    setCategory("strength");
    setSportType(["aerial_silks"]);
    setDifficulty("intermediate");
    setPremium(false);
    setTrainingType("figure_set");
    setVideoUrl("");
    setThumbnailUrl("");
    setExercises([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Dodaj nowy trening - Krok {step}/3</DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tytuł treningu *</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="np. Rozciąganie dla powietrznych"
              />
            </div>

            <div className="space-y-2">
              <Label>Opis</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Opisz trening..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategoria</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="strength">Siła</SelectItem>
                    <SelectItem value="flexibility">Elastyczność</SelectItem>
                    <SelectItem value="conditioning">Kondycja</SelectItem>
                    <SelectItem value="warmup">Rozgrzewka</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Poziom trudności</Label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Początkujący</SelectItem>
                    <SelectItem value="intermediate">Średni</SelectItem>
                    <SelectItem value="advanced">Zaawansowany</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card">
              <div>
                <Label>Trening Premium</Label>
                <p className="text-sm text-muted-foreground">
                  Tylko dla użytkowników premium
                </p>
              </div>
              <Switch checked={premium} onCheckedChange={setPremium} />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Label className="text-lg">Wybierz typ treningu</Label>

            <div className="space-y-3">
              <Card
                className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                  trainingType === "video" ? "border-primary" : ""
                }`}
                onClick={() => setTrainingType("video")}
              >
                <h4 className="font-semibold">📹 Trening wideo</h4>
                <p className="text-sm text-muted-foreground">
                  Pojedynczy film treningowy
                </p>
              </Card>

              <Card
                className={`p-4 cursor-pointer hover:border-primary transition-colors ${
                  trainingType === "figure_set" ? "border-primary" : ""
                }`}
                onClick={() => setTrainingType("figure_set")}
              >
                <h4 className="font-semibold">🎯 Zestaw ćwiczeń</h4>
                <p className="text-sm text-muted-foreground">
                  Seria ćwiczeń z timerem
                </p>
              </Card>
            </div>
          </div>
        )}

        {step === 3 && trainingType === "video" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL wideo *</Label>
              <Input
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>

            <div className="space-y-2">
              <Label>URL miniatury</Label>
              <Input
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
          </div>
        )}

        {step === 3 && trainingType === "figure_set" && (
          <TrainingExerciseManager
            exercises={exercises}
            onChange={setExercises}
          />
        )}

        <div className="flex justify-between pt-4">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Wstecz
            </Button>
          )}

          {step < 3 ? (
            <Button onClick={() => setStep(step + 1)} className="ml-auto">
              Dalej
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="ml-auto"
            >
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Utwórz trening
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
