import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

interface CreateTrainingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (session: any) => void;
  editingSession?: any;
}

export const CreateTrainingModal: React.FC<CreateTrainingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingSession
}) => {
  const [formData, setFormData] = useState({
    title: '',
    duration: '',
    difficulty: '',
    warmup: [] as string[],
    figures: [] as string[],
    stretching: [] as string[],
    playlist: '',
    thumbnail: ''
  });

  const [currentWarmup, setCurrentWarmup] = useState('');
  const [currentFigure, setCurrentFigure] = useState('');
  const [currentStretch, setCurrentStretch] = useState('');

  useEffect(() => {
    if (editingSession) {
      setFormData({
        title: editingSession.title || '',
        duration: editingSession.duration?.toString() || '',
        difficulty: editingSession.difficulty || '',
        warmup: editingSession.warmup || [],
        figures: editingSession.figures || [],
        stretching: editingSession.stretching || [],
        playlist: editingSession.playlist || '',
        thumbnail: editingSession.thumbnail || ''
      });
    } else {
      setFormData({
        title: '',
        duration: '',
        difficulty: '',
        warmup: [],
        figures: [],
        stretching: [],
        playlist: '',
        thumbnail: ''
      });
    }
  }, [editingSession, isOpen]);

  const addItem = (type: 'warmup' | 'figures' | 'stretching', item: string) => {
    if (item.trim()) {
      setFormData(prev => ({
        ...prev,
        [type]: [...prev[type], item.trim()]
      }));
      
      if (type === 'warmup') setCurrentWarmup('');
      if (type === 'figures') setCurrentFigure('');
      if (type === 'stretching') setCurrentStretch('');
    }
  };

  const removeItem = (type: 'warmup' | 'figures' | 'stretching', index: number) => {
    setFormData(prev => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = () => {
    const session = {
      id: editingSession?.id || Date.now(),
      title: formData.title,
      duration: parseInt(formData.duration),
      difficulty: formData.difficulty,
      warmup: formData.warmup,
      figures: formData.figures,
      stretching: formData.stretching,
      playlist: formData.playlist,
      thumbnail: formData.thumbnail || 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=300&fit=crop',
      instructor: 'You',
      participants: editingSession?.participants || 0
    };
    
    onSave(session);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-white/10 max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingSession ? 'Edit Training Session' : 'Create Training Session'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title" className="text-white">Session Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Enter session title"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
              <Select value={formData.difficulty} onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty: value }))}>
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
            <div>
              <Label htmlFor="playlist" className="text-white">Recommended Playlist</Label>
              <Input
                id="playlist"
                value={formData.playlist}
                onChange={(e) => setFormData(prev => ({ ...prev, playlist: e.target.value }))}
                placeholder="Playlist name or link"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
          </div>

          {/* Warm-up Section */}
          <div>
            <Label className="text-white mb-2 block">Warm-up Exercises</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentWarmup}
                onChange={(e) => setCurrentWarmup(e.target.value)}
                placeholder="Add warm-up exercise"
                className="bg-white/5 border-white/10 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addItem('warmup', currentWarmup)}
              />
              <Button
                onClick={() => addItem('warmup', currentWarmup)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.warmup.map((item, index) => (
                <Badge key={index} variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                  {item}
                  <button
                    onClick={() => removeItem('warmup', index)}
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
            <Label className="text-white mb-2 block">Figures & Combos</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentFigure}
                onChange={(e) => setCurrentFigure(e.target.value)}
                placeholder="Add figure or combo"
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
            <Label className="text-white mb-2 block">Stretching Routine</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={currentStretch}
                onChange={(e) => setCurrentStretch(e.target.value)}
                placeholder="Add stretching exercise"
                className="bg-white/5 border-white/10 text-white flex-1"
                onKeyPress={(e) => e.key === 'Enter' && addItem('stretching', currentStretch)}
              />
              <Button
                onClick={() => addItem('stretching', currentStretch)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.stretching.map((item, index) => (
                <Badge key={index} variant="secondary" className="bg-pink-500/20 text-pink-400">
                  {item}
                  <button
                    onClick={() => removeItem('stretching', index)}
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
            <Label htmlFor="thumbnail" className="text-white">Thumbnail URL (optional)</Label>
            <Input
              id="thumbnail"
              value={formData.thumbnail}
              onChange={(e) => setFormData(prev => ({ ...prev, thumbnail: e.target.value }))}
              placeholder="https://example.com/image.jpg"
              className="bg-white/5 border-white/10 text-white"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              {editingSession ? 'Update Session' : 'Create Session'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};