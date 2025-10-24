import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseSearchModal } from '@/components/ExerciseSearchModal';
import { Trash2, GripVertical, Plus } from 'lucide-react';
import { Card } from '@/components/ui/card';

export interface TrainingExerciseData {
  figure_id: string;
  figure_name?: string;
  figure_image?: string;
  order_index: number;
  completion_mode: 'time' | 'completion';
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  notes?: string;
}

interface TrainingExerciseManagerProps {
  exercises: TrainingExerciseData[];
  onChange: (exercises: TrainingExerciseData[]) => void;
}

export const TrainingExerciseManager = ({ exercises, onChange }: TrainingExerciseManagerProps) => {
  const [showExerciseSearch, setShowExerciseSearch] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleAddExercise = (figure: any) => {
    const newExercise: TrainingExerciseData = {
      figure_id: figure.id,
      figure_name: figure.name,
      figure_image: figure.image_url,
      order_index: exercises.length,
      completion_mode: 'time',
      sets: 3,
      reps: 1,
      hold_time_seconds: 30,
      rest_time_seconds: 10,
    };
    onChange([...exercises, newExercise]);
    setShowExerciseSearch(false);
  };

  const handleUpdateExercise = (index: number, updates: Partial<TrainingExerciseData>) => {
    const updated = exercises.map((ex, i) => 
      i === index ? { ...ex, ...updates } : ex
    );
    onChange(updated);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = exercises.filter((_, i) => i !== index).map((ex, i) => ({
      ...ex,
      order_index: i,
    }));
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-lg">Ćwiczenia w treningu</Label>
        <Button 
          type="button"
          onClick={() => setShowExerciseSearch(true)}
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          Dodaj ćwiczenie
        </Button>
      </div>

      {exercises.length === 0 && (
        <Card className="p-8 text-center text-muted-foreground">
          Dodaj pierwsze ćwiczenie do treningu
        </Card>
      )}

      <div className="space-y-3">
        {exercises.map((exercise, index) => (
          <Card key={index} className="p-4 space-y-4">
            <div className="flex items-start gap-3">
              <GripVertical className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-2 cursor-move" />
              
              {exercise.figure_image && (
                <img 
                  src={exercise.figure_image} 
                  alt={exercise.figure_name}
                  className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                />
              )}

              <div className="flex-1 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">{exercise.figure_name || 'Ćwiczenie'}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveExercise(index)}
                  >
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Tryb ukończenia</Label>
                    <Select
                      value={exercise.completion_mode}
                      onValueChange={(value: 'time' | 'completion') => 
                        handleUpdateExercise(index, { completion_mode: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="time">Na czas</SelectItem>
                        <SelectItem value="completion">Na wykonania</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {exercise.completion_mode === 'time' && (
                    <>
                      <div className="space-y-2">
                        <Label>Serie</Label>
                        <Input
                          type="number"
                          min="1"
                          value={exercise.sets || 1}
                          onChange={(e) => handleUpdateExercise(index, { sets: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Powtórzenia</Label>
                        <Input
                          type="number"
                          min="1"
                          value={exercise.reps || 1}
                          onChange={(e) => handleUpdateExercise(index, { reps: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Czas przytrzymania (s)</Label>
                        <Input
                          type="number"
                          min="1"
                          value={exercise.hold_time_seconds || 30}
                          onChange={(e) => handleUpdateExercise(index, { hold_time_seconds: parseInt(e.target.value) })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Czas odpoczynku (s)</Label>
                        <Input
                          type="number"
                          min="0"
                          value={exercise.rest_time_seconds || 10}
                          onChange={(e) => handleUpdateExercise(index, { rest_time_seconds: parseInt(e.target.value) })}
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Notatki (opcjonalnie)</Label>
                  <Textarea
                    value={exercise.notes || ''}
                    onChange={(e) => handleUpdateExercise(index, { notes: e.target.value })}
                    placeholder="Dodatkowe wskazówki..."
                    rows={2}
                  />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <ExerciseSearchModal
        isOpen={showExerciseSearch}
        onClose={() => setShowExerciseSearch(false)}
        onExerciseSelect={handleAddExercise}
        selectedExercises={exercises.map(e => e.figure_id)}
      />
    </div>
  );
};
