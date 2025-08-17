import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  EyeOff, 
  Clock,
  Target,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { SessionExerciseManager } from '@/components/SessionExerciseManager';

const EditTrainingSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin, isLoading: roleLoading } = useUserRole();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [session, setSession] = useState<any>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration_minutes: '',
    difficulty_level: '',
    playlist: '',
    thumbnail_url: '',
    published: false
  });

  const [sessionExercises, setSessionExercises] = useState<any[]>([]);

  // Redirect if not admin
  useEffect(() => {
    if (!roleLoading && !isAdmin) {
      navigate('/training');
    }
  }, [isAdmin, roleLoading, navigate]);

  // Fetch session data
  useEffect(() => {
    const fetchSession = async () => {
      if (!sessionId) {
        navigate('/training');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('training_sessions')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) throw error;
        
        if (!data) {
          navigate('/training');
          return;
        }

        setSession(data);
        setFormData({
          title: data.title || '',
          description: data.description || '',
          duration_minutes: data.duration_minutes?.toString() || '',
          difficulty_level: data.difficulty_level || '',
          playlist: data.playlist || '',
          thumbnail_url: data.thumbnail_url || '',
          published: data.published || false
        });
      } catch (error) {
        console.error('Error fetching session:', error);
        toast({
          title: "Error",
          description: "Failed to load training session.",
          variant: "destructive",
        });
        navigate('/training');
      } finally {
        setLoading(false);
      }
    };

    if (sessionId && !roleLoading && isAdmin) {
      fetchSession();
    }
  }, [sessionId, isAdmin, roleLoading, navigate, toast]);

  const handleSave = async () => {
    if (!user || !sessionId) return;
    
    setSaving(true);
    try {
      // Convert session exercises to the format expected in the session structure
      const exerciseData = sessionExercises.map(ex => ({
        id: ex.figure_id,
        name: ex.exercise?.name || '',
        sets: ex.sets || 1,
        reps: ex.reps || 1,
        hold_time_seconds: ex.hold_time_seconds || 30,
        notes: ex.notes || '',
        order_index: ex.order_index
      }));

      const sessionData = {
        title: formData.title,
        description: formData.description,
        duration_minutes: parseInt(formData.duration_minutes) || null,
        difficulty_level: formData.difficulty_level,
        figures: exerciseData, // Use only structured exercise data from library
        playlist: formData.playlist,
        thumbnail_url: formData.thumbnail_url,
        published: formData.published,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('training_sessions')
        .update(sessionData)
        .eq('id', sessionId);
      
      if (error) throw error;
      
      toast({
        title: "Session Updated",
        description: "Training session updated with exercises successfully.",
      });
      
      navigate('/training');
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading training session...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90">
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              size="icon"
              onClick={() => navigate('/training')}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white">Edit Training Session</h1>
              <p className="text-muted-foreground">Modify your training session details and exercises</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
                id="published-toggle"
              />
              <Label htmlFor="published-toggle" className="text-white flex items-center space-x-1">
                {formData.published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <span>{formData.published ? 'Published' : 'Draft'}</span>
              </Label>
            </div>
            
            <Button
              onClick={handleSave}
              disabled={saving || !formData.title}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Target className="w-5 h-5 mr-2 text-primary" />
                  Basic Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-white">Session Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter an engaging session title"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="description" className="text-white">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Describe what participants can expect from this session..."
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                    rows={4}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={formData.duration_minutes}
                      onChange={(e) => setFormData(prev => ({ ...prev, duration_minutes: e.target.value }))}
                      placeholder="45"
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
                    <Select value={formData.difficulty_level} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}>
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Beginner">Beginner</SelectItem>
                        <SelectItem value="Intermediate">Intermediate</SelectItem>
                        <SelectItem value="Advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="playlist" className="text-white">Recommended Playlist</Label>
                  <Input
                    id="playlist"
                    value={formData.playlist}
                    onChange={(e) => setFormData(prev => ({ ...prev, playlist: e.target.value }))}
                    placeholder="Spotify playlist name or link"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  />
                </div>

                <div>
                  <Label htmlFor="thumbnail" className="text-white">Thumbnail URL</Label>
                  <Input
                    id="thumbnail"
                    value={formData.thumbnail_url}
                    onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Exercise Management */}
            <SessionExerciseManager
              sessionId={sessionId}
              onExercisesChange={setSessionExercises}
            />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Preview */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <img
                    src={formData.thumbnail_url || "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=300&fit=crop"}
                    alt="Session preview"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  {formData.difficulty_level && (
                    <Badge className={`absolute top-2 right-2 ${
                      formData.difficulty_level === 'Beginner' ? 'bg-green-500' :
                      formData.difficulty_level === 'Intermediate' ? 'bg-yellow-500' : 'bg-red-500'
                    } text-white`}>
                      {formData.difficulty_level}
                    </Badge>
                  )}
                  {!formData.published && (
                    <Badge className="absolute top-2 left-2 bg-orange-500/20 text-orange-400">
                      Draft
                    </Badge>
                  )}
                </div>
                <div className="mt-4 space-y-2">
                  <h3 className="text-white font-semibold">{formData.title || 'Untitled Session'}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-2">
                    {formData.description || 'No description provided'}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Session Stats */}
            <Card className="glass-effect border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Session Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-muted-foreground">Duration</span>
                  </div>
                  <span className="text-white font-medium">
                    {formData.duration_minutes || 0} min
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-muted-foreground">Exercises</span>
                  </div>
                  <span className="text-white font-medium">
                    {sessionExercises.length} exercises
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTrainingSession;