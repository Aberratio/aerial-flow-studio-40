import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Plus, Check, Target, Zap, Heart, Dumbbell, Circle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { getDifficultyLabel, getDifficultyColorClass } from "@/lib/figureUtils";
import { useDictionary } from "@/contexts/DictionaryContext";

interface Exercise {
  id: string;
  name: string;
  description?: string;
  difficulty_level?: string;
  category?: string;
  type?: string;
  image_url?: string;
  video_url?: string;
  tags?: string[];
  hold_time_seconds?: number;
}

interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseSelect: (
    exercise: Exercise,
    sets?: number,
    reps?: number,
    holdTime?: number
  ) => void;
  selectedExercises: string[];
}

interface DifficultyLevel {
  key: string;
  name_pl: string;
  color_class: string;
}

export const ExerciseSearchModal: React.FC<ExerciseSearchModalProps> = ({
  isOpen,
  onClose,
  onExerciseSelect,
  selectedExercises,
}) => {
  const { toast } = useToast();
  const { getFigureTypeLabel } = useDictionary();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [difficultyFilter, setDifficultyFilter] = useState("all");

  // Dynamic filters from database
  const [categories, setCategories] = useState<string[]>([]);
  const [types, setTypes] = useState<string[]>([]);
  const [difficultyLevels, setDifficultyLevels] = useState<DifficultyLevel[]>([]);

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
      fetchFilters();
    }
  }, [isOpen]);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, categoryFilter, typeFilter, difficultyFilter]);

  const fetchFilters = async () => {
    try {
      // Fetch unique categories
      const { data: categoriesData } = await supabase
        .from("figures")
        .select("category")
        .not("category", "is", null);
      
      if (categoriesData) {
        const uniqueCategories = [...new Set(categoriesData.map(d => d.category).filter(Boolean))] as string[];
        setCategories(uniqueCategories.sort());
      }

      // Fetch unique types
      const { data: typesData } = await supabase
        .from("figures")
        .select("type")
        .not("type", "is", null);
      
      if (typesData) {
        const uniqueTypes = [...new Set(typesData.map(d => d.type).filter(Boolean))] as string[];
        setTypes(uniqueTypes.sort());
      }

      // Fetch difficulty levels
      const { data: diffData } = await supabase
        .from("figure_difficulty_levels")
        .select("key, name_pl, color_class")
        .order("order_index");
      
      if (diffData) {
        setDifficultyLevels(diffData);
      }
    } catch (error) {
      console.error("Error fetching filters:", error);
    }
  };

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("figures")
        .select("id, name, description, difficulty_level, category, type, image_url, video_url, tags, hold_time_seconds")
        .order("name");

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error("Error fetching exercises:", error);
      toast({
        title: "Błąd",
        description: "Nie udało się załadować ćwiczeń.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterExercises = () => {
    let filtered = exercises;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (exercise) =>
          exercise.name.toLowerCase().includes(searchLower) ||
          exercise.description?.toLowerCase().includes(searchLower) ||
          exercise.tags?.some((tag) => tag.toLowerCase().includes(searchLower))
      );
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (exercise) => exercise.category === categoryFilter
      );
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter(
        (exercise) => exercise.type === typeFilter
      );
    }

    // Difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter(
        (exercise) => exercise.difficulty_level === difficultyFilter
      );
    }

    setFilteredExercises(filtered);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case "warm_up":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "stretching":
        return <Heart className="w-4 h-4 text-pink-500" />;
      case "core":
        return <Dumbbell className="w-4 h-4 text-orange-500" />;
      case "silks":
      case "hoop":
      case "pole":
      case "hammock":
        return <Circle className="w-4 h-4 text-purple-500" />;
      default:
        return <Target className="w-4 h-4 text-purple-500" />;
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    onExerciseSelect(
      exercise, 
      1, 
      1, 
      exercise.hold_time_seconds || 30
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setCategoryFilter("all");
    setTypeFilter("all");
    setDifficultyFilter("all");
  };

  const hasActiveFilters = searchTerm || categoryFilter !== "all" || typeFilter !== "all" || difficultyFilter !== "all";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-white/10 max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white text-xl flex items-center justify-between">
            <span>Wybierz ćwiczenia</span>
            <Badge variant="secondary" className="ml-2">
              {filteredExercises.length} / {exercises.length}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Szukaj ćwiczeń po nazwie, opisie lub tagach..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Kategoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie kategorie</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Typ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie typy</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>
                      {getFigureTypeLabel ? getFigureTypeLabel(type) : type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Poziom trudności" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Wszystkie poziomy</SelectItem>
                  {difficultyLevels.map((diff) => (
                    <SelectItem key={diff.key} value={diff.key}>
                      {diff.name_pl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  onClick={clearFilters}
                  className="text-white/70 hover:text-white"
                >
                  Wyczyść filtry
                </Button>
              )}
            </div>
          </div>

          {/* Results */}
          <ScrollArea className="flex-1 pr-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Ładowanie ćwiczeń...</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  Nie znaleziono ćwiczeń pasujących do kryteriów.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredExercises.map((exercise) => {
                  const isSelected = selectedExercises.includes(exercise.id);

                  return (
                    <Card
                      key={exercise.id}
                      className={`glass-effect border-white/10 transition-all cursor-pointer group ${
                        isSelected
                          ? "ring-2 ring-green-500/50 bg-green-500/10"
                          : "hover:border-white/20 hover:bg-white/5"
                      }`}
                      onClick={() => !isSelected && handleExerciseSelect(exercise)}
                    >
                      <CardContent className="p-3">
                        <div className="flex gap-3">
                          {/* Thumbnail */}
                          <div className="w-16 h-16 flex-shrink-0 rounded-md overflow-hidden bg-white/5">
                            {exercise.image_url ? (
                              <img
                                src={exercise.image_url}
                                alt={exercise.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                {getCategoryIcon(exercise.category)}
                              </div>
                            )}
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h3 className="font-medium text-sm text-white truncate">
                                {exercise.name}
                              </h3>
                              {isSelected && (
                                <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1 mt-1">
                              {exercise.difficulty_level && (
                                <Badge
                                  className={`text-xs ${getDifficultyColorClass(exercise.difficulty_level)}`}
                                >
                                  {getDifficultyLabel(exercise.difficulty_level)}
                                </Badge>
                              )}
                              {exercise.category && (
                                <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                                  {exercise.category}
                                </Badge>
                              )}
                            </div>

                            {exercise.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {exercise.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Tags */}
                        {exercise.tags && exercise.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {exercise.tags.slice(0, 3).map((tag, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs border-white/10 text-white/50"
                              >
                                {tag}
                              </Badge>
                            ))}
                            {exercise.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs border-white/10 text-white/50">
                                +{exercise.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}

                        {/* Add button overlay */}
                        {!isSelected && (
                          <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                            <Button size="sm" className="gap-1">
                              <Plus className="w-4 h-4" />
                              Dodaj
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-white/10">
            <p className="text-sm text-muted-foreground">
              Wybrano: <span className="text-white font-medium">{selectedExercises.length}</span> ćwiczeń
            </p>
            <Button variant="outline" onClick={onClose}>
              Gotowe
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
