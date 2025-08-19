import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, X, Search } from "lucide-react";
import { useSimilarExercises } from "@/hooks/useSimilarExercises";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SimilarExercisesManagerProps {
  figureId: string;
}

export const SimilarExercisesManager = ({ figureId }: SimilarExercisesManagerProps) => {
  const { similarExercises, addSimilarExercise, removeSimilarExercise } = useSimilarExercises(figureId);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const { toast } = useToast();

  const searchExercises = async (query: string) => {
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('figures')
        .select('id, name, difficulty_level, image_url, premium')
        .or(`name.ilike.%${query}%,tags.cs.["${query}"]`)
        .neq('id', figureId)
        .limit(10);

      if (error) throw error;

      // Filter out exercises that are already similar
      const similarIds = similarExercises.map(ex => ex.id);
      const filtered = data?.filter(ex => !similarIds.includes(ex.id)) || [];
      
      setSearchResults(filtered);
    } catch (error) {
      console.error('Error searching exercises:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddSimilar = async (exerciseId: string) => {
    try {
      await addSimilarExercise(exerciseId);
      toast({
        title: "Success",
        description: "Similar exercise added successfully.",
      });
      // Remove from search results
      setSearchResults(prev => prev.filter(ex => ex.id !== exerciseId));
    } catch (error) {
      console.error('Error adding similar exercise:', error);
      toast({
        title: "Error",
        description: "Failed to add similar exercise.",
        variant: "destructive",
      });
    }
  };

  const handleRemoveSimilar = async (exerciseId: string) => {
    try {
      await removeSimilarExercise(exerciseId);
      toast({
        title: "Success",
        description: "Similar exercise removed successfully.",
      });
    } catch (error) {
      console.error('Error removing similar exercise:', error);
      toast({
        title: "Error", 
        description: "Failed to remove similar exercise.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="glass-effect border-white/10">
      <CardContent className="p-4">
        <Label className="text-white text-lg font-semibold mb-4 block">
          Similar Exercises
        </Label>
        
        {/* Current Similar Exercises */}
        {similarExercises.length > 0 && (
          <div className="mb-4">
            <h4 className="text-white text-sm font-medium mb-2">
              Current Similar Exercises ({similarExercises.length})
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {similarExercises.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-2 bg-white/5 rounded-lg border border-white/10"
                >
                  <div className="flex items-center space-x-2">
                    {exercise.image_url && (
                      <img
                        src={exercise.image_url}
                        alt={exercise.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium line-clamp-1">
                        {exercise.name}
                      </p>
                      {exercise.difficulty_level && (
                        <Badge className="text-xs" variant="secondary">
                          {exercise.difficulty_level}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveSimilar(exercise.id)}
                    className="text-red-400 hover:text-red-300 hover:bg-red-500/10 p-1"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search for New Similar Exercises */}
        <div className="space-y-3">
          <h4 className="text-white text-sm font-medium">Add Similar Exercise</h4>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  searchExercises(e.target.value);
                }}
                placeholder="Search exercises to add as similar..."
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60 pl-10"
              />
            </div>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {searchResults.map((exercise) => (
                <div
                  key={exercise.id}
                  className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg border border-white/10 cursor-pointer"
                  onClick={() => handleAddSimilar(exercise.id)}
                >
                  <div className="flex items-center space-x-2">
                    {exercise.image_url && (
                      <img
                        src={exercise.image_url}
                        alt={exercise.name}
                        className="w-8 h-8 rounded object-cover"
                      />
                    )}
                    <div>
                      <p className="text-white text-sm font-medium">
                        {exercise.name}
                      </p>
                      <div className="flex items-center space-x-1">
                        {exercise.difficulty_level && (
                          <Badge className="text-xs" variant="secondary">
                            {exercise.difficulty_level}
                          </Badge>
                        )}
                        {exercise.premium && (
                          <Badge className="text-xs bg-yellow-500/20 text-yellow-300">
                            Premium
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <Plus className="w-4 h-4 text-purple-400" />
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !isSearching && (
            <p className="text-white/60 text-sm text-center py-2">
              No exercises found matching "{searchQuery}"
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};