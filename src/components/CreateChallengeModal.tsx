import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Save, Globe, X, Award, CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

import ExerciseManagement from '@/components/ExerciseManagement';

interface CreateChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onChallengeCreated: () => void;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
}

interface Exercise {
  id: string;
  figure_id: string;
  order_index: number;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  video_url?: string;
  audio_url?: string;
  notes?: string;
  figure?: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
  };
}

interface TrainingDay {
  date: Date;
  title: string;
  description: string;
  isRestDay: boolean;
  exercises: Exercise[];
}

const CreateChallengeModal = ({ isOpen, onClose, onChallengeCreated }: CreateChallengeModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>([]);
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (isOpen) {
      fetchAchievements();
    }
  }, [isOpen]);

  const fetchAchievements = async () => {
    try {
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('name');

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setDifficultyLevel('intermediate');
    setStartDate(undefined);
    setEndDate(undefined);
    setSelectedAchievements([]);
    setTrainingDays([]);
    setChallengeId(null);
    setImageFile(null);
    setImageUrl('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `challenges/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('challenges')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('challenges')
        .getPublicUrl(filePath);

      return data.publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const saveDraft = async () => {
    if (!user) return;
    
    if (!title.trim() || !startDate || !endDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in title, start date, and end date.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      let uploadedImageUrl = imageUrl;
      
      // Upload image if a new file is selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          uploadedImageUrl = uploadedUrl;
          setImageUrl(uploadedUrl);
        }
      }

      const challengeData = {
        title: title.trim(),
        description: description.trim() || null,
        difficulty_level: difficultyLevel,
        start_date: startDate?.toISOString(),
        end_date: endDate?.toISOString(),
        created_by: user.id,
        status: 'draft',
        image_url: uploadedImageUrl || null
      };

      let result;
      if (challengeId) {
        // Update existing draft
        result = await supabase
          .from('challenges')
          .update(challengeData)
          .eq('id', challengeId)
          .select()
          .single();
      } else {
        // Create new draft
        result = await supabase
          .from('challenges')
          .insert([challengeData])
          .select()
          .single();
      }

      if (result.error) throw result.error;

      setChallengeId(result.data.id);
      
      // Save achievements and training days
      await saveAchievementsAndTrainingDays(result.data.id);
      
      toast({
        title: "Draft Saved",
        description: "Challenge saved as draft successfully.",
      });
    } catch (error) {
      console.error('Error saving challenge:', error);
      toast({
        title: "Error",
        description: "Failed to save challenge draft.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAchievementsAndTrainingDays = async (challengeIdToUse: string) => {
    // Save achievements
    if (selectedAchievements.length > 0) {
      const achievementData = selectedAchievements.map(achievementId => ({
        challenge_id: challengeIdToUse,
        achievement_id: achievementId
      }));

      const { error: achievementError } = await supabase
        .from('challenge_achievements')
        .delete()
        .eq('challenge_id', challengeIdToUse);

      if (achievementError) throw achievementError;

      const { error: insertError } = await supabase
        .from('challenge_achievements')
        .insert(achievementData);

      if (insertError) throw insertError;
    }

    // Save training days and their exercises
    if (trainingDays.length > 0) {
      // First, delete existing training days (this will cascade delete exercises)
      const { error: deleteError } = await supabase
        .from('challenge_training_days')
        .delete()
        .eq('challenge_id', challengeIdToUse);

      if (deleteError) throw deleteError;

      // Insert training days one by one to get their IDs
      for (const day of trainingDays) {
          const { data: trainingDayData, error: dayError } = await supabase
            .from('challenge_training_days')
            .insert({
              challenge_id: challengeIdToUse,
              day_date: day.date.toISOString().split('T')[0],
              title: day.title,
              description: day.description,
              is_rest_day: day.isRestDay
            })
            .select()
            .single();

        if (dayError) throw dayError;

        // Now save exercises for this training day
        if (day.exercises && day.exercises.length > 0) {
          const exerciseData = day.exercises.map((exercise, index) => ({
            training_day_id: trainingDayData.id,
            figure_id: exercise.figure_id,
            order_index: exercise.order_index || index,
            sets: exercise.sets,
            reps: exercise.reps,
            hold_time_seconds: exercise.hold_time_seconds,
            rest_time_seconds: exercise.rest_time_seconds,
            video_url: exercise.video_url,
            audio_url: exercise.audio_url,
            notes: exercise.notes
          }));

          const { error: exerciseError } = await supabase
            .from('training_day_exercises')
            .insert(exerciseData);

          if (exerciseError) throw exerciseError;
        }
      }
    }
  };

  const addTrainingDay = () => {
    setTrainingDays([...trainingDays, { 
      date: new Date(), 
      title: '', 
      description: '',
      isRestDay: false,
      exercises: []
    }]);
  };

  const removeTrainingDay = (index: number) => {
    setTrainingDays(trainingDays.filter((_, i) => i !== index));
  };

  const updateTrainingDay = (index: number, field: keyof TrainingDay, value: any) => {
    const updated = [...trainingDays];
    updated[index] = { ...updated[index], [field]: value };
    setTrainingDays(updated);
  };

  const toggleAchievement = (achievementId: string) => {
    setSelectedAchievements(prev => 
      prev.includes(achievementId) 
        ? prev.filter(id => id !== achievementId)
        : [...prev, achievementId]
    );
  };

  const publishChallenge = async () => {
    if (!challengeId && !title.trim()) {
      toast({
        title: "Save Draft First",
        description: "Please save as draft before publishing.",
        variant: "destructive",
      });
      return;
    }

    // Save as draft first if not already saved
    if (!challengeId) {
      await saveDraft();
      if (!challengeId) return; // If save failed, don't proceed
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('challenges')
        .update({ status: 'published' })
        .eq('id', challengeId);

      if (error) throw error;

      toast({
        title: "Challenge Published",
        description: "Challenge has been published successfully.",
      });
      
      onChallengeCreated();
      handleClose();
    } catch (error) {
      console.error('Error publishing challenge:', error);
      toast({
        title: "Error",
        description: "Failed to publish challenge.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Create New Challenge
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Challenge Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter challenge title"
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your challenge..."
              rows={4}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="image">Challenge Image</Label>
            <div className="space-y-2">
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                  }
                }}
                className="cursor-pointer"
              />
              <div className="text-xs text-muted-foreground">
                {imageFile ? `Selected: ${imageFile.name}` : imageUrl ? 'Current image uploaded' : 'No file selected'}
              </div>
            </div>
            {imageUrl && (
              <div className="mt-2">
                <img 
                  src={imageUrl} 
                  alt="Challenge preview" 
                  className="w-32 h-20 object-cover rounded-md border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="difficulty">Difficulty Level</Label>
            <select
              id="difficulty"
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="w-full p-2 rounded-md border border-input bg-background text-foreground"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Start Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>End Date *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    disabled={(date) => date < (startDate || new Date())}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Achievements Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-purple-400" />
              <Label className="text-lg font-semibold">Challenge Achievements</Label>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-40 overflow-y-auto border rounded-lg p-4">
              {achievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={achievement.id}
                    checked={selectedAchievements.includes(achievement.id)}
                    onCheckedChange={() => toggleAchievement(achievement.id)}
                  />
                  <Label 
                    htmlFor={achievement.id}
                    className="flex-1 text-sm cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span>{achievement.icon}</span>
                      <div>
                        <div className="font-medium">{achievement.name}</div>
                        <div className="text-xs text-muted-foreground">{achievement.points} points</div>
                      </div>
                    </div>
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Training Days Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-5 h-5 text-blue-400" />
                <Label className="text-lg font-semibold">Training Days</Label>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addTrainingDay}
                className="flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Day
              </Button>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {trainingDays.map((day, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Day {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeTrainingDay(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Date</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal",
                              !day.date && "text-muted-foreground"
                            )}
                            size="sm"
                          >
                            <Calendar className="mr-2 h-4 w-4" />
                            {day.date ? format(day.date, "PP") : <span>Pick date</span>}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <CalendarComponent
                            mode="single"
                            selected={day.date}
                            onSelect={(date) => date && updateTrainingDay(index, 'date', date)}
                            disabled={(date) => startDate ? date < startDate : date < new Date()}
                            initialFocus
                            className="p-3 pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-xs">Title</Label>
                      <Input
                        placeholder="Training day title"
                        value={day.title}
                        onChange={(e) => updateTrainingDay(index, 'title', e.target.value)}
                        size={undefined}
                      />
                    </div>
                  </div>
                  
                    <div className="space-y-2">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        placeholder="Training day description"
                        value={day.description}
                        onChange={(e) => updateTrainingDay(index, 'description', e.target.value)}
                        rows={2}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={`rest-day-${index}`}
                        checked={day.isRestDay}
                        onChange={(e) => updateTrainingDay(index, 'isRestDay', e.target.checked)}
                        className="rounded border-gray-300"
                      />
                      <Label htmlFor={`rest-day-${index}`} className="text-xs">
                        Rest Day (no exercises)
                      </Label>
                    </div>
                  
                  {/* Exercise Management */}
                  {!day.isRestDay && (
                    <ExerciseManagement
                      trainingDayId={`temp-${index}`}
                      exercises={day.exercises}
                      onExercisesChange={(exercises) => updateTrainingDay(index, 'exercises', exercises)}
                      canEdit={true}
                    />
                  )}
                  
                  {day.isRestDay && (
                    <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
                      <span className="text-2xl">😴</span>
                      <p className="mt-2">Rest Day - No exercises scheduled</p>
                    </div>
                  )}
                </div>
              ))}
              
              {trainingDays.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <CalendarDays className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No training days added yet</p>
                  <p className="text-sm">Click "Add Day" to create training sessions</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={saveDraft}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Save Draft
              </Button>
              
              <Button
                onClick={publishChallenge}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
              >
                <Globe className="w-4 h-4" />
                Publish Challenge
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CreateChallengeModal;