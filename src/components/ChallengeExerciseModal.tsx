import React, { useState, useEffect } from 'react';
import { Clock, Trophy, CheckCircle, Play, Volume2, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Exercise {
  id: string;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  video_url?: string;
  audio_url?: string;
  notes?: string;
  figure: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
    instructions?: string;
    image_url?: string;
  };
}

interface ChallengeExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  challengeId: string;
  dayId: string;
  dayNumber: number;
  exercises: Exercise[];
}

const ChallengeExerciseModal: React.FC<ChallengeExerciseModalProps> = ({
  isOpen,
  onClose,
  challengeId,
  dayId,
  dayNumber,
  exercises
}) => {
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && user) {
      loadCompletedExercises();
    }
  }, [isOpen, user, dayId]);

  const loadCompletedExercises = async () => {
    try {
      // This would typically load from user progress tracking
      // For now, we'll start with empty set
      setCompletedExercises(new Set());
    } catch (error) {
      console.error('Error loading completed exercises:', error);
    }
  };

  const toggleExerciseCompletion = (exerciseId: string) => {
    const newCompleted = new Set(completedExercises);
    if (newCompleted.has(exerciseId)) {
      newCompleted.delete(exerciseId);
    } else {
      newCompleted.add(exerciseId);
    }
    setCompletedExercises(newCompleted);
  };

  const completionPercentage = exercises.length > 0 ? 
    (completedExercises.size / exercises.length) * 100 : 0;

  const handleFinishDay = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // Update user's challenge progress
      const { error } = await supabase
        .from('challenge_participants')
        .update({ 
          status: completionPercentage === 100 ? 'active' : 'active' // Keep as active for now
        })
        .eq('challenge_id', challengeId)
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: "Day Completed!",
        description: `You've completed ${completedExercises.size} out of ${exercises.length} exercises.`
      });
      
      onClose();
    } catch (error) {
      console.error('Error finishing day:', error);
      toast({
        title: "Error",
        description: "Failed to save progress. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-white/10 text-white">
        <div className="max-h-[85vh] overflow-y-auto pr-2">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">Day {dayNumber} Exercises</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress Overview */}
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-white">Progress</h3>
                  <p className="text-muted-foreground">
                    {completedExercises.size} of {exercises.length} exercises completed
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold gradient-text">
                    {Math.round(completionPercentage)}%
                  </div>
                  <Trophy className="w-6 h-6 text-purple-400 mx-auto mt-1" />
                </div>
              </div>
              <Progress value={completionPercentage} className="h-3" />
            </CardContent>
          </Card>

          {/* Exercise List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-white">Exercises</h3>
            {exercises.map((exercise, index) => {
              const isCompleted = completedExercises.has(exercise.id);
              return (
                <Card 
                  key={exercise.id} 
                  className={`glass-effect transition-all duration-200 ${
                    isCompleted ? 'border-green-500/50 bg-green-500/10' : 'border-white/10'
                  }`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      {/* Completion Checkbox */}
                      <div className="flex items-center mt-1">
                        <Checkbox
                          checked={isCompleted}
                          onCheckedChange={() => toggleExerciseCompletion(exercise.id)}
                          className="w-5 h-5"
                        />
                      </div>

                      {/* Exercise Image */}
                      <div className="flex-shrink-0">
                        <div className="w-16 h-16 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500/20 to-blue-500/20">
                          {exercise.figure.image_url ? (
                            <img 
                              src={exercise.figure.image_url} 
                              alt={exercise.figure.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Trophy className="w-8 h-8 text-white/40" />
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Exercise Details */}
                      <div className="flex-1">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold text-white mb-1">
                              {index + 1}. {exercise.figure.name}
                            </h4>
                            <Badge className="mb-2">
                              {exercise.figure.difficulty_level || 'Intermediate'}
                            </Badge>
                          </div>
                          {isCompleted && (
                            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                          )}
                        </div>

                        {exercise.figure.instructions && (
                          <p className="text-muted-foreground text-sm mb-3">
                            {exercise.figure.instructions}
                          </p>
                        )}

                        {/* Exercise Parameters */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs mb-3">
                          {exercise.sets && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-purple-400 rounded-full" />
                              <span>{exercise.sets} sets</span>
                            </div>
                          )}
                          {exercise.reps && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-blue-400 rounded-full" />
                              <span>{exercise.reps} reps</span>
                            </div>
                          )}
                          {exercise.hold_time_seconds && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-3 h-3 text-green-400" />
                              <span>{exercise.hold_time_seconds}s hold</span>
                            </div>
                          )}
                          {exercise.rest_time_seconds && (
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 bg-yellow-400 rounded-full" />
                              <span>{exercise.rest_time_seconds}s rest</span>
                            </div>
                          )}
                        </div>

                        {/* Media Buttons */}
                        <div className="flex gap-2">
                          {exercise.video_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => window.open(exercise.video_url, '_blank')}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Video
                            </Button>
                          )}
                          {exercise.audio_url && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-white/20 text-white hover:bg-white/10"
                              onClick={() => window.open(exercise.audio_url, '_blank')}
                            >
                              <Volume2 className="w-3 h-3 mr-1" />
                              Audio
                            </Button>
                          )}
                        </div>

                        {exercise.notes && (
                          <div className="bg-white/5 rounded-lg p-3 mt-3">
                            <p className="text-white text-sm">{exercise.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Close
            </Button>
            <Button 
              onClick={handleFinishDay}
              disabled={isLoading}
              className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
            >
              {isLoading ? 'Saving...' : 'Finish Day'}
            </Button>
          </div>
        </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengeExerciseModal;