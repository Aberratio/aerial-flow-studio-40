import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, Loader2, Save } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useUserRole } from "@/hooks/useUserRole";
import { SimilarExercisesManager } from "@/components/SimilarExercisesManager";
import { PrerequisiteExercisesManager } from "@/components/PrerequisiteExercisesManager";
import { useDictionary } from "@/contexts/DictionaryContext";

const EditExercise = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isTrainer, isAdmin } = useUserRole();
  const { getDifficultyLabel, getFigureTypeLabel, getSportCategoryLabel } = useDictionary();

  const [exercise, setExercise] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    instructions: "",
    difficulty_level: "",
    category: "",
    type: "",
    image_url: "",
    video_url: "",
    audio_url: "",
    tags: [] as string[],
    synonyms: [] as string[],
    premium: false,
    transition_from_figure_id: "",
    transition_to_figure_id: "",
  });
  const [tagInput, setTagInput] = useState("");
  const [synonymInput, setSynonymInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExercise = async () => {
      if (!exerciseId) return;

      try {
        const { data, error } = await supabase
          .from("figures")
          .select("*")
          .eq("id", exerciseId)
          .single();

        if (error) throw error;

        setExercise(data);
        setFormData({
          name: data.name || "",
          description: data.description || "",
          instructions: data.instructions || "",
          difficulty_level: data.difficulty_level || "",
          category: data.category || "",
          type: data.type || "",
          image_url: data.image_url || "",
          video_url: data.video_url || "",
          audio_url: data.audio_url || "",
          tags: data.tags || [],
          synonyms: data.synonyms || [],
          premium: data.premium || false,
          transition_from_figure_id: data.transition_from_figure_id || "",
          transition_to_figure_id: data.transition_to_figure_id || "",
        });
      } catch (error: any) {
        console.error("Error fetching exercise:", error);
        toast({
          title: "Error",
          description: "Failed to load exercise details",
          variant: "destructive",
        });
        navigate("/library");
      } finally {
        setLoading(false);
      }
    };

    fetchExercise();
  }, [exerciseId, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted with data:", formData);
    
    if (!user || !formData.name.trim() || !exercise) {
      console.log("Validation failed:", { user: !!user, name: formData.name.trim(), exercise: !!exercise });
      return;
    }

    setIsLoading(true);
    console.log("Starting exercise update process...");

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

      // Normalize data before saving to prevent future issues
      const updateData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        instructions: formData.instructions.trim() || null,
        difficulty_level: formData.difficulty_level?.toLowerCase() || null,
        category: formData.category || null,
        type: formData.type?.replace(/\s+/g, '_')?.toLowerCase() || null,
        image_url: imageUrl || null,
        video_url: videoUrl || null,
        audio_url: formData.audio_url || null,
        tags: formData.tags.length > 0 ? formData.tags : null,
        synonyms: formData.synonyms.length > 0 ? formData.synonyms : null,
        premium: formData.premium,
        transition_from_figure_id: formData.type === 'transitions' ? formData.transition_from_figure_id : null,
        transition_to_figure_id: formData.type === 'transitions' ? formData.transition_to_figure_id : null,
        updated_at: new Date().toISOString(),
      };
      
      console.log("Updating exercise with data:", updateData);
      console.log("Exercise ID:", exercise.id);

      const { error, data } = await supabase
        .from("figures")
        .update(updateData)
        .eq("id", exercise.id)
        .select();

      console.log("Update result:", { data, error });

      if (error) throw error;

      toast({
        title: "Exercise Updated",
        description: "Your exercise has been successfully updated.",
      });

      navigate(`/exercise/${exerciseId}`);
    } catch (error: any) {
      console.error("Error updating exercise:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update exercise",
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground mb-2">Exercise not found</h2>
          <Button onClick={() => navigate("/library")}>
            Return to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Exercise</h1>
              <p className="text-muted-foreground">{exercise.name}</p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !formData.name.trim()}
              className="bg-primary hover:bg-primary/90"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="name" className="text-foreground">
                  Exercise Name *
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="bg-background/50 border-border/50 text-foreground"
                  placeholder="Enter exercise name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="difficulty" className="text-foreground">
                    Difficulty Level *
                  </Label>
                  <Select
                    value={formData.difficulty_level}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, difficulty_level: value }))
                    }
                    required
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 text-foreground">
                      <SelectValue placeholder="Select difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">{getDifficultyLabel("beginner")}</SelectItem>
                      <SelectItem value="intermediate">{getDifficultyLabel("intermediate")}</SelectItem>
                      <SelectItem value="advanced">{getDifficultyLabel("advanced")}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="category" className="text-foreground">
                    Category *
                  </Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, category: value }))
                    }
                    required
                  >
                    <SelectTrigger className="bg-background/50 border-border/50 text-foreground">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="silks">Silks</SelectItem>
                      <SelectItem value="hoop">Hoop</SelectItem>
                      <SelectItem value="pole">Pole</SelectItem>
                      <SelectItem value="hammock">Hammock</SelectItem>
                      <SelectItem value="core">Core</SelectItem>
                      <SelectItem value="warm_up">Warm Up</SelectItem>
                      <SelectItem value="stretching">Stretching</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="type" className="text-foreground">
                  Type *
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, type: value }))
                  }
                  required
                >
                  <SelectTrigger className="bg-background/50 border-border/50 text-foreground">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="single_figure">{getFigureTypeLabel("single_figure")}</SelectItem>
                    <SelectItem value="combo">{getFigureTypeLabel("combo")}</SelectItem>
                    <SelectItem value="warm_up">{getFigureTypeLabel("warm_up")}</SelectItem>
                    <SelectItem value="stretching">{getFigureTypeLabel("stretching")}</SelectItem>
                    {isAdmin && (
                      <SelectItem value="transitions">Przejścia</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {!isTrainer && (
                <div>
                  <Label htmlFor="premium" className="text-foreground">
                    Access Level
                  </Label>
                  <div className="flex items-center space-x-3 mt-2">
                    <Switch
                      id="premium"
                      checked={formData.premium}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({ ...prev, premium: checked }))
                      }
                    />
                    <Label htmlFor="premium" className="text-foreground cursor-pointer">
                      {formData.premium ? "Premium" : "Free"}
                    </Label>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Media Upload */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Media</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="image-upload" className="text-foreground">
                    Exercise Image *
                  </Label>
                  <div className="space-y-3">
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
                        onClick={() => document.getElementById("image-upload")?.click()}
                        className="border-border/50 hover:bg-accent/50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      {imageFile && (
                        <span className="text-sm text-muted-foreground">{imageFile.name}</span>
                      )}
                    </div>
                    {(formData.image_url || imageFile) && (
                      <div className="text-sm text-green-600">
                        {imageFile ? "New image selected" : "Image uploaded"}
                      </div>
                    )}
                    {formData.image_url && !imageFile && (
                      <img
                        src={formData.image_url}
                        alt="Current exercise image"
                        className="w-32 h-32 object-cover rounded-lg border border-border/50"
                      />
                    )}
                  </div>
                </div>

                <div>
                  <Label htmlFor="video-upload" className="text-foreground">
                    Exercise Video (Optional)
                  </Label>
                  <div className="space-y-3">
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
                        onClick={() => document.getElementById("video-upload")?.click()}
                        className="border-border/50 hover:bg-accent/50"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Video
                      </Button>
                      {videoFile && (
                        <span className="text-sm text-muted-foreground">{videoFile.name}</span>
                      )}
                    </div>
                    {(formData.video_url || videoFile) && (
                      <div className="text-sm text-green-600">
                        {videoFile ? "New video selected" : "Video uploaded"}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content Details */}
          {!isTrainer && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-foreground">Content Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="description" className="text-foreground">
                    Description (Optional)
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
                    className="bg-background/50 border-border/50 text-foreground"
                    placeholder="Brief description of the exercise"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="instructions" className="text-foreground">
                    Instructions (Optional)
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
                    className="bg-background/50 border-border/50 text-foreground"
                    placeholder="Step-by-step instructions"
                    rows={4}
                  />
                </div>

                <div>
                  <Label htmlFor="tags" className="text-foreground">
                    Tags (Optional)
                  </Label>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="tags"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        className="bg-background/50 border-border/50 text-foreground"
                        placeholder="Add a tag and press Enter"
                      />
                      <Button
                        type="button"
                        onClick={addTag}
                        variant="outline"
                        className="border-border/50 hover:bg-accent/50"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag, index) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() => removeTag(tag)}
                        >
                          {tag} ✕
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="synonyms" className="text-foreground">
                    Synonyms (Optional)
                  </Label>
                  <p className="text-sm text-muted-foreground mb-3">
                    Alternative names for this exercise
                  </p>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        id="synonyms"
                        value={synonymInput}
                        onChange={(e) => setSynonymInput(e.target.value)}
                        onKeyPress={handleSynonymKeyPress}
                        className="bg-background/50 border-border/50 text-foreground"
                        placeholder="Add a synonym and press Enter"
                      />
                      <Button
                        type="button"
                        onClick={addSynonym}
                        variant="outline"
                        className="border-border/50 hover:bg-accent/50"
                      >
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {formData.synonyms.map((synonym, index) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() => removeSynonym(synonym)}
                        >
                          {synonym} ✕
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Foundational Exercises */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Foundational Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <PrerequisiteExercisesManager figureId={exercise.id} />
            </CardContent>
          </Card>

          {/* Similar Exercises */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-foreground">Similar Exercises</CardTitle>
            </CardHeader>
            <CardContent>
              <SimilarExercisesManager figureId={exercise.id} />
            </CardContent>
          </Card>

          {/* Action Buttons - Mobile Sticky */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-card/90 backdrop-blur-sm border-t border-border/50">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/exercise/${exerciseId}`)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading || !formData.name.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>

        {/* Add bottom padding for mobile sticky buttons */}
        <div className="md:hidden h-20"></div>
      </div>
    </div>
  );
};

export default EditExercise;