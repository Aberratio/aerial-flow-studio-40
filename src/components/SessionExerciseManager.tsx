import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Edit, 
  Save, 
  X, 
  Target,
  Clock,
  RotateCcw
} from 'lucide-react';
import { ExerciseSearchModal } from './ExerciseSearchModal';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Exercise {
  id: string;
  name: string;
  description?: string;
  difficulty_level?: string;
  category?: string;
  image_url?: string;
}

interface SessionExercise {
  id?: string;
  figure_id: string;
  order_index: number;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  notes?: string;
  exercise?: Exercise;
}

interface SessionExerciseManagerProps {
  sessionId: string;
  onExercisesChange: (exercises: SessionExercise[]) => void;
}

export const SessionExerciseManager: React.FC<SessionExerciseManagerProps> = ({
  sessionId,
  onExercisesChange
}) => {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSessionExercises();
  }, [sessionId]);

  const fetchSessionExercises = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('training_session_figures')
        .select(`
          *,
          exercise:figures(*)
        `)
        .eq('session_id', sessionId)
        .order('order_index');

      if (error) throw error;
      
      const formattedExercises = (data || []).map(item => ({
        id: item.id,
        figure_id: item.figure_id,
        order_index: item.order_index,
        sets: item.sets,
        reps: item.reps,
        hold_time_seconds: item.hold_time_seconds,
        notes: item.notes,
        exercise: item.exercise
      }));

      setExercises(formattedExercises);
      onExercisesChange(formattedExercises);
    } catch (error) {
      console.error('Error fetching session exercises:', error);
      toast({
        title: "Error",
        description: "Failed to load session exercises.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExerciseSelect = async (exercise: Exercise, sets = 1, reps = 1, holdTime = 30) => {
    setSaving(true);
    try {
      const maxOrder = exercises.length > 0 ? Math.max(...exercises.map(e => e.order_index)) : -1;
      const newOrderIndex = maxOrder + 1;

      const { data, error } = await supabase
        .from('training_session_figures')
        .insert({
          session_id: sessionId,
          figure_id: exercise.id,
          order_index: newOrderIndex,
          sets,
          reps,
          hold_time_seconds: holdTime
        })
        .select(`
          *,
          exercise:figures(*)
        `)
        .single();

      if (error) throw error;

      const newExercise: SessionExercise = {
        id: data.id,
        figure_id: data.figure_id,
        order_index: data.order_index,
        sets: data.sets,
        reps: data.reps,
        hold_time_seconds: data.hold_time_seconds,
        notes: data.notes,
        exercise: data.exercise
      };

      const updatedExercises = [...exercises, newExercise].sort((a, b) => a.order_index - b.order_index);
      setExercises(updatedExercises);
      onExercisesChange(updatedExercises);

      toast({
        title: "Exercise Added",
        description: `${exercise.name} has been added to the session.`,
      });
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast({
        title: "Error",
        description: "Failed to add exercise to session.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveExercise = async (index: number) => {
    const exercise = exercises[index];
    if (!exercise.id) return;

    try {
      const { error } = await supabase
        .from('training_session_figures')
        .delete()
        .eq('id', exercise.id);

      if (error) throw error;

      const updatedExercises = exercises.filter((_, i) => i !== index);
      setExercises(updatedExercises);
      onExercisesChange(updatedExercises);

      toast({
        title: "Exercise Removed",
        description: "Exercise has been removed from the session.",
      });
    } catch (error) {
      console.error('Error removing exercise:', error);
      toast({
        title: "Error",
        description: "Failed to remove exercise.",
        variant: "destructive",
      });
    }
  };

  const handleUpdateExercise = async (index: number, updates: Partial<SessionExercise>) => {
    const exercise = exercises[index];
    if (!exercise.id) return;

    try {
      const { error } = await supabase
        .from('training_session_figures')
        .update(updates)
        .eq('id', exercise.id);

      if (error) throw error;

      const updatedExercises = [...exercises];
      updatedExercises[index] = { ...updatedExercises[index], ...updates };
      setExercises(updatedExercises);
      onExercisesChange(updatedExercises);
      setEditingIndex(null);

      toast({
        title: "Exercise Updated",
        description: "Exercise details have been updated.",
      });
    } catch (error) {
      console.error('Error updating exercise:', error);
      toast({
        title: "Error",
        description: "Failed to update exercise.",
        variant: "destructive",
      });
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

  if (loading) {
    return (
      <Card className="glass-effect border-white/10">
        <CardContent className="p-6 text-center">
          <p className="text-muted-foreground">Loading exercises...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center">
              <Target className="w-5 h-5 mr-2 text-primary" />
              Session Exercises ({exercises.length})
            </CardTitle>
            <Button
              onClick={() => setShowSearchModal(true)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              disabled={saving}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Exercise
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {exercises.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-white/10 rounded-lg">
              <Target className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold text-white mb-2">No exercises added yet</h3>
              <p className="text-muted-foreground mb-4">
                Start building your session by adding exercises from our library
              </p>
              <Button
                onClick={() => setShowSearchModal(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Exercise
              </Button>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-4">
              <div className="space-y-3">
                {exercises.map((exercise, index) => (
                  <Card key={exercise.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-move" />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-white">{exercise.exercise?.name}</h4>
                            {exercise.exercise?.difficulty_level && (
                              <Badge className={getDifficultyColor(exercise.exercise.difficulty_level)}>
                                {exercise.exercise.difficulty_level}
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs border-white/20 text-white/70">
                              #{index + 1}
                            </Badge>
                          </div>
                          
                          {exercise.exercise?.description && (
                            <p className="text-muted-foreground text-sm mb-2">
                              {exercise.exercise.description}
                            </p>
                          )}

                          {editingIndex === index ? (
                            <div className="grid grid-cols-4 gap-2 mt-3">
                              <div>
                                <Label className="text-white/70 text-xs">Sets</Label>
                                <Input
                                  type="number"
                                  value={exercise.sets || 1}
                                  onChange={(e) => {
                                    const updatedExercises = [...exercises];
                                    updatedExercises[index].sets = parseInt(e.target.value) || 1;
                                    setExercises(updatedExercises);
                                  }}
                                  className="h-8 bg-white/5 border-white/10 text-white text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-white/70 text-xs">Reps</Label>
                                <Input
                                  type="number"
                                  value={exercise.reps || 1}
                                  onChange={(e) => {
                                    const updatedExercises = [...exercises];
                                    updatedExercises[index].reps = parseInt(e.target.value) || 1;
                                    setExercises(updatedExercises);
                                  }}
                                  className="h-8 bg-white/5 border-white/10 text-white text-xs"
                                />
                              </div>
                              <div>
                                <Label className="text-white/70 text-xs">Hold (s)</Label>
                                <Input
                                  type="number"
                                  value={exercise.hold_time_seconds || 30}
                                  onChange={(e) => {
                                    const updatedExercises = [...exercises];
                                    updatedExercises[index].hold_time_seconds = parseInt(e.target.value) || 30;
                                    setExercises(updatedExercises);
                                  }}
                                  className="h-8 bg-white/5 border-white/10 text-white text-xs"
                                />
                              </div>
                              <div className="flex gap-1 items-end">
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateExercise(index, exercises[index])}
                                  className="h-8 w-8 p-0 bg-green-500/20 text-green-400 hover:bg-green-500/30"
                                >
                                  <Save className="w-3 h-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => setEditingIndex(null)}
                                  className="h-8 w-8 p-0 border-white/20 text-white/70 hover:bg-white/10"
                                >
                                  <X className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <RotateCcw className="w-3 h-3" />
                                <span>{exercise.sets || 1} sets</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Target className="w-3 h-3" />
                                <span>{exercise.reps || 1} reps</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>{exercise.hold_time_seconds || 30}s hold</span>
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingIndex(index)}
                            className="w-8 h-8 p-0 border-white/20 text-white/70 hover:bg-white/10"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRemoveExercise(index)}
                            className="w-8 h-8 p-0 border-red-500/50 text-red-400 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <ExerciseSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        onExerciseSelect={handleExerciseSelect}
        selectedExercises={exercises.map(e => e.figure_id)}
      />
    </>
  );
};