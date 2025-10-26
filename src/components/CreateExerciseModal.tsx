import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Upload, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { useSimilarExercises } from "@/hooks/useSimilarExercises";
import { SimilarExercisesManager } from "@/components/SimilarExercisesManager";

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated?: () => void;
  editingFigure?: any;
  isTrainingSpecial?: boolean;
}

export const CreateExerciseModal = ({
  isOpen,
  onClose,
  onExerciseCreated,
  editingFigure,
  isTrainingSpecial = false,
}: CreateExerciseModalProps) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    difficulty_level: "",
    category: "",
    type: "",
    image_url: "",
    video_url: "",
    tags: [] as string[],
    synonyms: [] as string[],
    premium: false,
    hold_time_seconds: 0,
  });
  const [tagInput, setTagInput] = useState("");
  const [synonymInput, setSynonymInput] = useState("");
  const { isTrainer } = useUserRole();

  // Update form when editing a figure
  useEffect(() => {
    if (editingFigure) {
      setFormData({
        name: editingFigure.name || "",
        description: editingFigure.description || "",
        instructions: editingFigure.instructions || "",
        difficulty_level: editingFigure.difficulty_level || "",
        category: editingFigure.category || "",
        type: editingFigure.type || "",
        image_url: editingFigure.image_url || "",
        video_url: editingFigure.video_url || "",
        tags: editingFigure.tags || [],
        synonyms: editingFigure.synonyms || [],
        premium: editingFigure.premium || false,
        hold_time_seconds: editingFigure.hold_time_seconds || 0,
      });
    } else {
      setFormData({
        name: "",
        description: "",
        instructions: "",
        difficulty_level: "",
        category: "",
        type: "",
        image_url: "",
        video_url: "",
        tags: [],
        synonyms: [],
        premium: false,
        hold_time_seconds: 0,
      });
    }
    setTagInput("");
    setSynonymInput("");
  }, [editingFigure, isOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

    // Check if image is required (for new exercises or if no existing image)
    if (!editingFigure && !imageFile && !formData.image_url) {
      toast({
        title: "Wymagane zdjęcie",
        description: "Prześlij zdjęcie ćwiczenia.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = formData.image_url;
      let videoUrl = formData.video_url;

      // Upload image if provided
      if (imageFile) {
        const imageExt = imageFile.name.split(".").pop();
        const imageName = `${Date.now()}.${imageExt}`;

        const { error: imageError } = await supabase.storage
          .from("posts")
          .upload(`figures/${imageName}`, imageFile);

        if (imageError) throw imageError;

        const { data: imageData } = supabase.storage
          .from("posts")
          .getPublicUrl(`figures/${imageName}`);

        imageUrl = imageData.publicUrl;
      }

      // Upload video if provided
      if (videoFile) {
        const videoExt = videoFile.name.split(".").pop();
        const videoName = `${Date.now()}.${videoExt}`;

        const { error: videoError } = await supabase.storage
          .from("posts")
          .upload(`figures/${videoName}`, videoFile);

        if (videoError) throw videoError;

        const { data: videoData } = supabase.storage
          .from("posts")
          .getPublicUrl(`figures/${videoName}`);

        videoUrl = videoData.publicUrl;
      }

      // Create or update the figure
      if (editingFigure) {
        const { error } = await supabase
          .from("figures")
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            instructions: formData.instructions.trim() || null,
            difficulty_level: formData.difficulty_level || null,
            category: formData.category || null,
            type: formData.type || null,
            image_url: imageUrl || null,
            video_url: videoUrl || null,
            tags: formData.tags.length > 0 ? formData.tags : null,
            synonyms: formData.synonyms.length > 0 ? formData.synonyms : null,
            premium: formData.premium,
            hold_time_seconds:
              formData.hold_time_seconds > 0
                ? formData.hold_time_seconds
                : null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", editingFigure.id);

        if (error) throw error;
      } else {
        const { data: figureData, error } = await supabase
          .from("figures")
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            instructions: formData.instructions.trim() || null,
            difficulty_level: formData.difficulty_level || null,
            category: formData.category || null,
            type: formData.type || null,
            image_url: imageUrl || null,
            video_url: videoUrl || null,
            tags: formData.tags.length > 0 ? formData.tags : null,
            synonyms: formData.synonyms.length > 0 ? formData.synonyms : null,
            premium: formData.premium,
            hold_time_seconds:
              formData.hold_time_seconds > 0
                ? formData.hold_time_seconds
                : null,
            created_by: user.id,
          })
          .select()
          .single();

        if (error) throw error;

        // Add trainer as expert for the exercise if they are a trainer
        if (isTrainer && figureData) {
          const { error: expertError } = await supabase
            .from("figure_experts")
            .insert({
              figure_id: figureData.id,
              expert_user_id: user.id,
              added_by: user.id,
            });

          if (expertError) {
            console.warn("Failed to add trainer as expert:", expertError);
          }
        }
      }

      toast({
        title: editingFigure ? "Ćwiczenie zaktualizowane" : "Ćwiczenie dodane",
        description: editingFigure
          ? "Twoje ćwiczenie zostało pomyślnie zaktualizowane."
          : "Twoje ćwiczenie zostało pomyślnie dodane do biblioteki.",
      });

      // Reset form
      setFormData({
        name: "",
        description: "",
        instructions: "",
        difficulty_level: "",
        category: "",
        type: "",
        image_url: "",
        video_url: "",
        tags: [],
        synonyms: [],
        premium: false,
        hold_time_seconds: 0,
      });
      setImageFile(null);
      setVideoFile(null);
      setTagInput("");
      setSynonymInput("");

      if (onExerciseCreated) onExerciseCreated();
      onClose();
    } catch (error: any) {
      console.error("Error creating exercise:", error);
      toast({
        title: "Błąd",
        description: error.message || "Nie udało się utworzyć ćwiczenia",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setFormData((prev) => ({ ...prev, image_url: "" }));
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setFormData((prev) => ({ ...prev, video_url: "" }));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addTag();
    }
  };

  const addSynonym = () => {
    const synonym = synonymInput.trim();
    if (synonym && !formData.synonyms.includes(synonym)) {
      setFormData((prev) => ({
        ...prev,
        synonyms: [...prev.synonyms, synonym],
      }));
      setSynonymInput("");
    }
  };

  const removeSynonym = (synonymToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      synonyms: prev.synonyms.filter((synonym) => synonym !== synonymToRemove),
    }));
  };

  const handleSynonymKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addSynonym();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingFigure ? "Edytuj ćwiczenie" : "Dodaj nowe ćwiczenie"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-white">
              Nazwa ćwiczenia *
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
              placeholder="Wprowadź nazwę ćwiczenia"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty" className="text-white">
                Poziom trudności *
              </Label>
              <Select
                value={formData.difficulty_level}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, difficulty_level: value }))
                }
                required
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Wybierz poziom trudności" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="category" className="text-white">
                Kategoria *
              </Label>
              <Select
                value={formData.category}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, category: value }))
                }
                required
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Wybierz kategorię" />
                </SelectTrigger>
                <SelectContent>
                  {isTrainingSpecial ? (
                    <>
                      <SelectItem value="warm_up">Warm Up</SelectItem>
                      <SelectItem value="stretching">Stretching</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="silks">Silks</SelectItem>
                      <SelectItem value="hoop">Hoop</SelectItem>
                      <SelectItem value="pole">Pole</SelectItem>
                      <SelectItem value="hammock">Hammock</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Hold Time - show only for core exercises */}
          {formData.category === "core" && (
            <div>
              <Label htmlFor="hold_time" className="text-white">
                Domyślny czas trzymania (sekundy)
              </Label>
              <Input
                id="hold_time"
                type="number"
                min="0"
                value={formData.hold_time_seconds}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    hold_time_seconds: parseInt(e.target.value) || 0,
                  }))
                }
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                placeholder="Wprowadź czas trzymania w sekundach (np. 30)"
              />
              <p className="text-sm text-white/60 mt-1">
                Jak długo należy trzymać to ćwiczenie? (0 = tryb ukończenia)
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="type" className="text-white">
              Typ *
            </Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, type: value }))
              }
              required
            >
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue placeholder="Wybierz typ" />
              </SelectTrigger>
              <SelectContent>
                {isTrainingSpecial ? (
                  <>
                    <SelectItem value="warm_up">Warm Up</SelectItem>
                    <SelectItem value="stretching">Stretching</SelectItem>
                  </>
                ) : (
                  <>
                    <SelectItem value="single figure">Single Figure</SelectItem>
                    <SelectItem value="combo">Combo</SelectItem>
                  </>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image-upload" className="text-white">
                Zdjęcie ćwiczenia *
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("image-upload")?.click()
                    }
                    className="border-white/10 text-white hover:bg-white/10"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Prześlij zdjęcie
                  </Button>
                  {imageFile && (
                    <span className="text-sm text-white/60">
                      {imageFile.name}
                    </span>
                  )}
                </div>
                {(formData.image_url || imageFile) && (
                  <div className="text-sm text-green-400">
                    {imageFile ? "Nowe zdjęcie wybrane" : "Zdjęcie przesłane"}
                  </div>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="video-upload" className="text-white">
                Wideo ćwiczenia (Opcjonalne)
              </Label>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    id="video-upload"
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      document.getElementById("video-upload")?.click()
                    }
                    className="border-white/10 text-white hover:bg-white/10"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Prześlij wideo
                  </Button>
                  {videoFile && (
                    <span className="text-sm text-white/60">
                      {videoFile.name}
                    </span>
                  )}
                </div>
                {(formData.video_url || videoFile) && (
                  <div className="text-sm text-green-400">
                    {videoFile ? "Nowe wideo wybrane" : "Wideo przesłane"}
                  </div>
                )}
              </div>
            </div>
          </div>

          {!isTrainer && (
            <>
              <div>
                <Label htmlFor="premium" className="text-white">
                  Poziom dostępu
                </Label>
                <div className="flex items-center space-x-3 mt-2">
                  <Switch
                    id="premium"
                    checked={formData.premium}
                    onCheckedChange={(checked) => {
                      console.log("Premium switch changed to:", checked);
                      setFormData((prev) => ({ ...prev, premium: checked }));
                    }}
                  />
                  <Label
                    htmlFor="premium"
                    className="text-white cursor-pointer"
                  >
                    {formData.premium ? "Premium" : "Free"}
                  </Label>
                  <div className="text-xs text-white/60 ml-2">
                    Obecnie: {formData.premium ? "Premium" : "Darmowe"}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="description" className="text-white">
                  Opis (Opcjonalne)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder="Krótki opis ćwiczenia"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="instructions" className="text-white">
                  Instrukcje (Opcjonalne)
                </Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      instructions: e.target.value,
                    }))
                  }
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder="Instrukcje krok po kroku"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="tags" className="text-white">
                  Tagi (Opcjonalne)
                </Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                      placeholder="Dodaj tag i naciśnij Enter"
                    />
                    <Button
                      type="button"
                      onClick={addTag}
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-white/10 text-white border-white/20 cursor-pointer"
                        onClick={() => removeTag(tag)}
                      >
                        {tag} ✕
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="synonyms" className="text-white">
                  Synonimy (Opcjonalne)
                </Label>
                <p className="text-sm text-white/60 mb-2">
                  Alternatywne nazwy dla tego ćwiczenia
                </p>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="synonyms"
                      value={synonymInput}
                      onChange={(e) => setSynonymInput(e.target.value)}
                      onKeyPress={handleSynonymKeyPress}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                      placeholder="Dodaj synonim i naciśnij Enter"
                    />
                    <Button
                      type="button"
                      onClick={addSynonym}
                      variant="outline"
                      className="border-white/10 text-white hover:bg-white/10"
                    >
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.synonyms.map((synonym, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-blue-500/20 text-blue-300 border-blue-500/30 cursor-pointer"
                        onClick={() => removeSynonym(synonym)}
                      >
                        {synonym} ✕
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Similar Exercises Management - Only show when editing */}
          {editingFigure && (
            <SimilarExercisesManager figureId={editingFigure.id} />
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Anuluj
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {editingFigure ? "Aktualizowanie..." : "Tworzenie..."}
                </>
              ) : editingFigure ? (
                "Zaktualizuj ćwiczenie"
              ) : (
                "Utwórz ćwiczenie"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
