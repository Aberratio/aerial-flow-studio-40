import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useDictionary } from '@/contexts/DictionaryContext';

interface CreateTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingSession?: any;
}

export const CreateTrainingModal: React.FC<CreateTrainingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSession
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { difficultyLevels } = useDictionary();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    duration: '',
    difficulty_level: '',
    warmup_exercises: [] as string[],
    figures: [] as string[],
    stretching_exercises: [] as string[],
    playlist: '',
    thumbnail_url: '',
    published: false
  });

  const [currentWarmup, setCurrentWarmup] = useState('');
  const [currentFigure, setCurrentFigure] = useState('');
  const [currentStretch, setCurrentStretch] = useState('');

  useEffect(() => {
    if (editingSession) {
      setFormData({
        title: editingSession.title || '',
        description: editingSession.description || '',
        duration: editingSession.duration_minutes?.toString() || '',
        difficulty_level: editingSession.difficulty_level || '',
        warmup_exercises: editingSession.warmup_exercises || [],
        figures: editingSession.figures || [],
        stretching_exercises: editingSession.stretching_exercises || [],
        playlist: editingSession.playlist || '',
        thumbnail_url: editingSession.thumbnail_url || '',
        published: editingSession.published || false
      });
    } else {
      setFormData({
        title: '',
        description: '',
        duration: '',
        difficulty_level: '',
        warmup_exercises: [],
        figures: [],
        stretching_exercises: [],
        playlist: '',
        thumbnail_url: '',
        published: false
      });
    }
  }, [editingSession, isOpen]);

  const addItem = (type: 'warmup_exercises' | 'figures' | 'stretching_exercises', item: string) => {
    if (item.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], item.trim()]
      }));
      
      if (type === 'warmup_exercises') setCurrentWarmup('');
      if (type === 'figures') setCurrentFigure('');
      if (type === 'stretching_exercises') setCurrentStretch('');
    }
  };

  const removeItem = (type: 'warmup_exercises' | 'figures' | 'stretching_exercises', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const sessionData = {
        title: formData.title,
        description: formData.description,
        duration_minutes: parseInt(formData.duration) || null,
        difficulty_level: formData.difficulty_level,
        warmup_exercises: formData.warmup_exercises,
        figures: formData.figures,
        stretching_exercises: formData.stretching_exercises,
        playlist: formData.playlist,
        thumbnail_url: formData.thumbnail_url,
        published: formData.published,
        user_id: user.id
      };

      if (editingSession) {
        const { error } = await supabase
          .from('training_sessions')
          .update(sessionData)
          .eq('id', editingSession.id);
        
        if (error) throw error;
        
        toast({
          title: "Session Updated",
          description: "Training session has been updated successfully.",
        });
      } else {
        const { error } = await supabase
          .from('training_sessions')
          .insert(sessionData);
        
        if (error) throw error;
        
        toast({
          title: "Session Created",
          description: "Training session has been created successfully.",
        });
      }
      
      onSave();
      onClose();
    } catch (error) {
      console.error('Error saving session:', error);
      toast({
        title: "Error",
        description: "Failed to save session. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-white/10 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingSession ? 'Edytuj sesję treningową' : 'Utwórz sesję treningową'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-white">Tytuł sesji</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Wpisz tytuł sesji"
                className="bg-white/5 border-white/10 text-white"
                required
              />
            </div>
            <div>
              <Label htmlFor="duration" className="text-white">Czas trwania (minuty)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="45"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-white">Opis</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Opisz sesję treningową..."
              className="bg-white/5 border-white/10 text-white"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty" className="text-white">Poziom trudności</Label>
              <Select value={formData.difficulty_level} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Wybierz poziom" />
                </SelectTrigger>
                <SelectContent>
                  {difficultyLevels.map(level => (
                    <SelectItem key={level.key} value={level.key}>{level.name_pl}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="playlist" className="text-white">Rekomendowana playlista</Label>
              <Input
                id="playlist"
                value={formData.playlist}
                onChange={(e) => setFormData(prev => ({ ...prev, playlist: e.target.value }))}
                placeholder="Nazwa playlisty lub link"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Published Status */}
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={formData.published}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, published: checked }))}
            />
            <Label htmlFor="published" className="text-white">
              Opublikuj sesję (widoczna dla użytkowników)
            </Label>
          </div>

          {/* Warm-up Section */}
          <div>
            <Label className="text-white mb-2 block">Ćwiczenia rozgrzewkowe</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentWarmup}
                onChange={(e) => setCurrentWarmup(e.target.value)}
                placeholder="Dodaj ćwiczenie rozgrzewkowe"
                className="bg-white/5 border-white/10 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addItem('warmup_exercises', currentWarmup)}
              />
              <Button
                onClick={() => addItem('warmup_exercises', currentWarmup)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.warmup_exercises.map((item, index) => (
                <Badge key={index} variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                  {item}
                  <button
                    onClick={() => removeItem('warmup_exercises', index)}
                    className="ml-2 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Figures Section */}
          <div>
            <Label className="text-white mb-2 block">Figury i kombo</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentFigure}
                onChange={(e) => setCurrentFigure(e.target.value)}
                placeholder="Dodaj figurę lub kombo"
                className="bg-white/5 border-white/10 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addItem('figures', currentFigure)}
              />
              <Button
                onClick={() => addItem('figures', currentFigure)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.figures.map((item, index) => (
                <Badge key={index} variant="secondary" className="bg-purple-500/20 text-purple-400">
                  {item}
                  <button
                    onClick={() => removeItem('figures', index)}
                    className="ml-2 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Stretching Section */}
          <div>
            <Label className="text-white mb-2 block">Rozciąganie</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentStretch}
                onChange={(e) => setCurrentStretch(e.target.value)}
                placeholder="Dodaj ćwiczenie rozciągające"
                className="bg-white/5 border-white/10 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addItem('stretching_exercises', currentStretch)}
              />
              <Button
                onClick={() => addItem('stretching_exercises', currentStretch)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.stretching_exercises.map((item, index) => (
                <Badge key={index} variant="secondary" className="bg-pink-500/20 text-pink-400">
                  {item}
                  <button
                    onClick={() => removeItem('stretching_exercises', index)}
                    className="ml-2 hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          {/* Thumbnail URL */}
          <div>
            <Label htmlFor="thumbnail" className="text-white">URL miniatury (opcjonalne)</Label>
            <Input
              id="thumbnail"
              value={formData.thumbnail_url}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail_url: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Anuluj
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || !formData.title}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingSession ? 'Aktualizowanie...' : 'Tworzenie...'}
                </>
              ) : (
                editingSession ? 'Zaktualizuj sesję' : 'Utwórz sesję'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};