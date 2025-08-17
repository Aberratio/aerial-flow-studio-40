import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, Filter, X, Target, Zap, Heart } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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
}

interface ExerciseSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseSelect: (exercise: Exercise, sets?: number, reps?: number, holdTime?: number) => void;
  selectedExercises: string[];
}

export const ExerciseSearchModal: React.FC<ExerciseSearchModalProps> = ({
  isOpen,
  onClose,
  onExerciseSelect,
  selectedExercises
}) => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [filteredExercises, setFilteredExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [difficultyFilter, setDifficultyFilter] = useState('all');
  
  // Exercise parameters for selection
  const [exerciseParams, setExerciseParams] = useState<{[key: string]: {sets: number, reps: number, holdTime: number}}>({});

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'aerial_silk', label: 'Aerial Silk' },
    { value: 'aerial_hoop', label: 'Aerial Hoop' },
    { value: 'warm_up', label: 'Warm-up' },
    { value: 'stretching', label: 'Stretching' },
    { value: 'conditioning', label: 'Conditioning' },
    { value: 'flow', label: 'Flow' }
  ];

  const difficulties = [
    { value: 'all', label: 'All Levels' },
    { value: 'Beginner', label: 'Beginner' },
    { value: 'Intermediate', label: 'Intermediate' },
    { value: 'Advanced', label: 'Advanced' }
  ];

  useEffect(() => {
    if (isOpen) {
      fetchExercises();
    }
  }, [isOpen]);

  useEffect(() => {
    filterExercises();
  }, [exercises, searchTerm, categoryFilter, difficultyFilter]);

  const fetchExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('figures')
        .select('*')
        .order('name');

      if (error) throw error;
      setExercises(data || []);
    } catch (error) {
      console.error('Error fetching exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load exercises.",
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
      filtered = filtered.filter(exercise => 
        exercise.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        exercise.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(exercise => exercise.category === categoryFilter);
    }

    // Difficulty filter
    if (difficultyFilter !== 'all') {
      filtered = filtered.filter(exercise => exercise.difficulty_level === difficultyFilter);
    }

    setFilteredExercises(filtered);
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'warm_up': return <Zap className="w-4 h-4 text-yellow-500" />;
      case 'stretching': return <Heart className="w-4 h-4 text-pink-500" />;
      default: return <Target className="w-4 h-4 text-purple-500" />;
    }
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'Advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const handleExerciseSelect = (exercise: Exercise) => {
    const params = exerciseParams[exercise.id] || { sets: 1, reps: 1, holdTime: 30 };
    onExerciseSelect(exercise, params.sets, params.reps, params.holdTime);
    
    // Reset params for this exercise
    setExerciseParams(prev => {
      const newParams = { ...prev };
      delete newParams[exercise.id];
      return newParams;
    });
  };

  const updateExerciseParams = (exerciseId: string, field: 'sets' | 'reps' | 'holdTime', value: number) => {
    setExerciseParams(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId] || { sets: 1, reps: 1, holdTime: 30 },
        [field]: value
      }
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-white/10 max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-white text-xl">Add Exercises to Session</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search exercises..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/5 border-white/10 text-white"
              />
            </div>
            
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
              <SelectTrigger className="bg-white/5 border-white/10 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map(diff => (
                  <SelectItem key={diff.value} value={diff.value}>{diff.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Results */}
          <ScrollArea className="h-[400px] pr-4">
            {loading ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Loading exercises...</p>
              </div>
            ) : filteredExercises.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No exercises found matching your criteria.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredExercises.map((exercise) => {
                  const isSelected = selectedExercises.includes(exercise.id);
                  const params = exerciseParams[exercise.id] || { sets: 1, reps: 1, holdTime: 30 };
                  
                  return (
                    <Card 
                      key={exercise.id} 
                      className={`glass-effect border-white/10 transition-all ${
                        isSelected ? 'ring-2 ring-primary/50 opacity-50' : 'hover:border-white/20'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {getCategoryIcon(exercise.category)}
                              <h3 className="font-semibold text-white">{exercise.name}</h3>
                              {exercise.difficulty_level && (
                                <Badge className={getDifficultyColor(exercise.difficulty_level)}>
                                  {exercise.difficulty_level}
                                </Badge>
                              )}
                              {isSelected && (
                                <Badge variant="secondary" className="bg-primary/20 text-primary">
                                  Added
                                </Badge>
                              )}
                            </div>
                            
                            {exercise.description && (
                              <p className="text-muted-foreground text-sm mb-2">{exercise.description}</p>
                            )}
                            
                            {exercise.tags && exercise.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {exercise.tags.slice(0, 3).map((tag, index) => (
                                  <Badge key={index} variant="outline" className="text-xs border-white/20 text-white/70">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2 min-w-[200px]">
                            {/* Exercise Parameters */}
                            <div className="grid grid-cols-3 gap-2 text-xs">
                              <div>
                                <Label className="text-white/70">Sets</Label>
                                <Input
                                  type="number"
                                  value={params.sets}
                                  onChange={(e) => updateExerciseParams(exercise.id, 'sets', parseInt(e.target.value) || 1)}
                                  min="1"
                                  className="h-8 bg-white/5 border-white/10 text-white text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-white/70">Reps</Label>
                                <Input
                                  type="number"
                                  value={params.reps}
                                  onChange={(e) => updateExerciseParams(exercise.id, 'reps', parseInt(e.target.value) || 1)}
                                  min="1"
                                  className="h-8 bg-white/5 border-white/10 text-white text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-white/70">Hold (s)</Label>
                                <Input
                                  type="number"
                                  value={params.holdTime}
                                  onChange={(e) => updateExerciseParams(exercise.id, 'holdTime', parseInt(e.target.value) || 30)}
                                  min="1"
                                  className="h-8 bg-white/5 border-white/10 text-white text-xs"
                                />
                              </div>
                            </div>

                            <Button
                              onClick={() => handleExerciseSelect(exercise)}
                              disabled={isSelected}
                              size="sm"
                              variant={isSelected ? "secondary" : "outline"}
                              className={
                                isSelected 
                                  ? "opacity-50 cursor-not-allowed" 
                                  : "border-primary/50 text-primary hover:bg-primary/10"
                              }
                            >
                              {isSelected ? (
                                <>
                                  <X className="w-3 h-3 mr-1" />
                                  Added
                                </>
                              ) : (
                                <>
                                  <Plus className="w-3 h-3 mr-1" />
                                  Add
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </ScrollArea>

          {/* Actions */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Done
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};