import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Plus, Save, Globe, X, Award, CalendarDays, ArrowLeft } from 'lucide-react';
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
  id?: string;
  date: Date;
  title: string;
  description: string;
  exercises: Exercise[];
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
}

const EditChallenge = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>([]);
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    if (challengeId) {
      fetchChallengeData();
      fetchAchievements();
    }
  }, [challengeId]);

  const fetchChallengeData = async () => {
    try {
      setIsLoadingData(true);

      // Fetch challenge with related data
      const { data: challengeData, error: challengeError } = await supabase
        .from('challenges')
        .select(`
          *,
          challenge_achievements (
            achievement_id
          ),
          challenge_training_days (
            id, day_date, title, description,
            training_day_exercises (
              *,
              figure:figures (
                id, name, difficulty_level, category
              )
            )
          )
        `)
        .eq('id', challengeId)
        .single();

      if (challengeError) throw challengeError;

      setChallenge(challengeData);
      setTitle(challengeData.title);
      setDescription(challengeData.description || '');
      setStartDate(new Date(challengeData.start_date));
      setEndDate(new Date(challengeData.end_date));
      
      // Set selected achievements
      setSelectedAchievements(
        challengeData.challenge_achievements?.map((ca: any) => ca.achievement_id) || []
      );

      // Set training days with exercises
      const formattedTrainingDays = challengeData.challenge_training_days?.map((day: any) => ({
        id: day.id,
        date: new Date(day.day_date),
        title: day.title || '',
        description: day.description || '',
        exercises: day.training_day_exercises?.map((ex: any) => ({
          id: ex.id,
          figure_id: ex.figure_id,
          order_index: ex.order_index,
          sets: ex.sets,
          reps: ex.reps,
          hold_time_seconds: ex.hold_time_seconds,
          rest_time_seconds: ex.rest_time_seconds,
          video_url: ex.video_url,
          audio_url: ex.audio_url,
          notes: ex.notes,
          figure: ex.figure
        })) || []
      })) || [];

      setTrainingDays(formattedTrainingDays);

    } catch (error) {
      console.error('Error fetching challenge:', error);
      toast({
        title: "Error",
        description: "Failed to load challenge data.",
        variant: "destructive",
      });
      navigate('/challenges');
    } finally {
      setIsLoadingData(false);
    }
  };

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

  const saveChallenge = async () => {
    if (!user || !challenge) return;
    
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
      // Update challenge
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
        })
        .eq('id', challengeId);

      if (updateError) throw updateError;

      // Save achievements and training days
      await saveAchievementsAndTrainingDays();
      
      toast({
        title: "Success",
        description: "Challenge updated successfully.",
      });
      
      navigate('/challenges');
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast({
        title: "Error",
        description: "Failed to update challenge.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveAchievementsAndTrainingDays = async () => {
    if (!challengeId) return;

    // Save achievements
    if (selectedAchievements.length > 0) {
      const achievementData = selectedAchievements.map(achievementId => ({
        challenge_id: challengeId,
        achievement_id: achievementId
      }));

      const { error: deleteError } = await supabase
        .from('challenge_achievements')
        .delete()
        .eq('challenge_id', challengeId);

      if (deleteError) throw deleteError;

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
        .eq('challenge_id', challengeId);

      if (deleteError) throw deleteError;

      // Insert training days one by one to get their IDs
      for (const day of trainingDays) {
        const { data: trainingDayData, error: dayError } = await supabase
          .from('challenge_training_days')
          .insert({
            challenge_id: challengeId,
            day_date: day.date.toISOString().split('T')[0],
            title: day.title,
            description: day.description
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

  if (isLoadingData) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading challenge...</div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-white text-xl mb-4">Challenge not found</h2>
          <Button onClick={() => navigate('/challenges')} variant="outline">
            Back to Challenges
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/challenges')}
            className="mr-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Challenges
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Edit Challenge</h1>
            <p className="text-muted-foreground">Make changes to your challenge</p>
          </div>
        </div>

        <div className="bg-black/50 backdrop-blur-lg rounded-lg border border-white/10 p-6">
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
                    
                    {/* Exercise Management */}
                    <ExerciseManagement
                      trainingDayId={day.id || `temp-${index}`}
                      exercises={day.exercises}
                      onExercisesChange={(exercises) => updateTrainingDay(index, 'exercises', exercises)}
                      canEdit={true}
                    />
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
              <Button variant="outline" onClick={() => navigate('/challenges')}>
                Cancel
              </Button>
              
              <Button
                onClick={saveChallenge}
                disabled={isLoading}
                className="flex items-center gap-2 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
              >
                <Save className="w-4 h-4" />
                Update Challenge
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditChallenge;