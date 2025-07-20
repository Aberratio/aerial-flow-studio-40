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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
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
  isRestDay?: boolean;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
  created_by: string;
  difficulty_level?: string;
  image_url?: string;
}

const EditChallenge = () => {
  const { challengeId } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [difficultyLevel, setDifficultyLevel] = useState('intermediate');
  const [type, setType] = useState('manual');
  const [selectedAchievements, setSelectedAchievements] = useState<string[]>([]);
  const [trainingDays, setTrainingDays] = useState<TrainingDay[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
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
      setDifficultyLevel(challengeData.difficulty_level || 'intermediate');
      setType(challengeData.type || 'manual');
      setImageUrl(challengeData.image_url || '');
      
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
      let uploadedImageUrl = imageUrl;
      
      // Upload image if a new file is selected
      if (imageFile) {
        const uploadedUrl = await uploadImage(imageFile);
        if (uploadedUrl) {
          uploadedImageUrl = uploadedUrl;
          setImageUrl(uploadedUrl);
        }
      }

      // Update challenge
      const { error: updateError } = await supabase
        .from('challenges')
        .update({
          title: title.trim(),
          description: description.trim() || null,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          difficulty_level: difficultyLevel,
          type: type,
          image_url: uploadedImageUrl || null,
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
            description: day.description || null,
            is_rest_day: day.isRestDay || false,
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
    const newDay = {
      date: null,
      title: `Day ${trainingDays.length + 1}`,
      description: '',
      exercises: [],
      isRestDay: false,
    };
    setTrainingDays([...trainingDays, newDay as TrainingDay]);
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

            <div className="space-y-2">
              <Label htmlFor="difficulty">Difficulty Level</Label>
              <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      Beginner
                    </div>
                  </SelectItem>
                  <SelectItem value="intermediate">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                      Intermediate
                    </div>
                  </SelectItem>
                  <SelectItem value="advanced">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-red-500"></div>
                      Advanced
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Challenge Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select challenge type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                      Manual
                    </div>
                  </SelectItem>
                  <SelectItem value="timer">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                      Timer
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
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
              
              <div className="space-y-4 max-h-[400px] overflow-y-auto">
                {trainingDays.map((day, index) => (
                  <div key={index} className="border rounded-lg overflow-hidden animate-fade-in">
                    {/* Day Header */}
                    <div className="bg-muted/30 p-4 border-b">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-semibold">
                            {index + 1}
                          </div>
                          <Label className="text-base font-semibold">Day {index + 1}</Label>
                          {day.isRestDay && (
                            <Badge variant="secondary" className="text-xs">
                              <span className="mr-1">😴</span> Rest Day
                            </Badge>
                          )}
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTrainingDay(index)}
                          className="hover:bg-destructive/20 hover:text-destructive"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Date</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal h-9",
                                  !day.date && "text-muted-foreground"
                                )}
                              >
                                <Calendar className="mr-2 h-4 w-4" />
                                {day.date ? format(day.date, "MMM dd") : <span>Pick date</span>}
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
                          <Label className="text-sm font-medium">Title</Label>
                          <Input
                            placeholder="e.g., Upper Body Focus"
                            value={day.title}
                            onChange={(e) => updateTrainingDay(index, 'title', e.target.value)}
                            className="h-9"
                          />
                        </div>
                      </div>
                      
                      <div className="mt-4 space-y-2">
                        <Label className="text-sm font-medium">Description</Label>
                        <Textarea
                          placeholder="Describe what this training day focuses on..."
                          value={day.description}
                          onChange={(e) => updateTrainingDay(index, 'description', e.target.value)}
                          rows={2}
                          className="resize-none"
                        />
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <Label className="text-sm font-medium">Day Type:</Label>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={day.isRestDay || false}
                              onCheckedChange={(checked) => updateTrainingDay(index, 'isRestDay', checked)}
                            />
                            <span className="text-sm">
                              {day.isRestDay ? 'Rest Day' : 'Training Day'}
                            </span>
                          </div>
                        </div>
                        {!day.isRestDay && (
                          <Badge variant="outline" className="text-xs">
                            {day.exercises?.length || 0} exercise{(day.exercises?.length || 0) !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    {/* Day Content */}
                    <div className="p-4">
                      {day.isRestDay ? (
                        <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg bg-blue-500/5">
                          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <span className="text-2xl">😴</span>
                          </div>
                          <p className="font-medium text-base">Rest & Recovery Day</p>
                          <p className="text-sm mt-1">No exercises needed - time to let your body recover!</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 pb-2 border-b">
                            <CalendarDays className="w-4 h-4 text-primary" />
                            <span className="text-sm font-medium">Exercises for this day</span>
                          </div>
                          <ExerciseManagement
                            trainingDayId={day.id || `temp-${index}`}
                            exercises={day.exercises}
                            onExercisesChange={(exercises) => updateTrainingDay(index, 'exercises', exercises)}
                            canEdit={true}
                          />
                        </div>
                      )}
                    </div>
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