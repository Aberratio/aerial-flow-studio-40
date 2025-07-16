import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface CreateExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExerciseCreated?: () => void;
  editingFigure?: any;
}

export const CreateExerciseModal = ({ isOpen, onClose, onExerciseCreated, editingFigure }: CreateExerciseModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    difficulty_level: '',
    category: '',
    level: '',
    type: '',
    image_url: '',
    video_url: '',
    tags: [] as string[],
    premium: false
  });
  const [tagInput, setTagInput] = useState('');

  // Update form when editing a figure
  useEffect(() => {
    if (editingFigure) {
      setFormData({
        name: editingFigure.name || '',
        description: editingFigure.description || '',
        instructions: editingFigure.instructions || '',
        difficulty_level: editingFigure.difficulty_level || '',
        category: editingFigure.category || '',
        level: editingFigure.level || '',
        type: editingFigure.type || '',
        image_url: editingFigure.image_url || '',
        video_url: editingFigure.video_url || '',
        tags: editingFigure.tags || [],
        premium: editingFigure.premium || false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        instructions: '',
        difficulty_level: '',
        category: '',
        level: '',
        type: '',
        image_url: '',
        video_url: '',
        tags: [],
        premium: false
      });
    }
    setTagInput('');
  }, [editingFigure, isOpen]);

  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;
    
    // Check if image is required (for new exercises or if no existing image)
    if (!editingFigure && !imageFile && !formData.image_url) {
      toast({
        title: "Image Required",
        description: "Please upload an image for the exercise.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl = formData.image_url;
      let videoUrl = formData.video_url;

      // Upload image if provided
      if (imageFile) {
        const imageExt = imageFile.name.split('.').pop();
        const imageName = `${Date.now()}.${imageExt}`;
        
        const { error: imageError } = await supabase.storage
          .from('posts')
          .upload(`figures/${imageName}`, imageFile);

        if (imageError) throw imageError;

        const { data: imageData } = supabase.storage
          .from('posts')
          .getPublicUrl(`figures/${imageName}`);
        
        imageUrl = imageData.publicUrl;
      }

      // Upload video if provided
      if (videoFile) {
        const videoExt = videoFile.name.split('.').pop();
        const videoName = `${Date.now()}.${videoExt}`;
        
        const { error: videoError } = await supabase.storage
          .from('posts')
          .upload(`figures/${videoName}`, videoFile);

        if (videoError) throw videoError;

        const { data: videoData } = supabase.storage
          .from('posts')
          .getPublicUrl(`figures/${videoName}`);
        
        videoUrl = videoData.publicUrl;
      }

      // Create or update the figure
      if (editingFigure) {
        const { error } = await supabase
          .from('figures')
          .update({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            instructions: formData.instructions.trim() || null,
            difficulty_level: formData.difficulty_level || null,
            category: formData.category || null,
            level: formData.level || null,
            type: formData.type || null,
            image_url: imageUrl || null,
            video_url: videoUrl || null,
            tags: formData.tags.length > 0 ? formData.tags : null,
            premium: formData.premium,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFigure.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('figures')
          .insert({
            name: formData.name.trim(),
            description: formData.description.trim() || null,
            instructions: formData.instructions.trim() || null,
            difficulty_level: formData.difficulty_level || null,
            category: formData.category || null,
            level: formData.level || null,
            type: formData.type || null,
            image_url: imageUrl || null,
            video_url: videoUrl || null,
            tags: formData.tags.length > 0 ? formData.tags : null,
            premium: formData.premium,
            created_by: user.id
          });

        if (error) throw error;
      }

      toast({
        title: editingFigure ? "Exercise Updated" : "Exercise Added",
        description: editingFigure ? "Your exercise has been successfully updated." : "Your exercise has been successfully added to the library.",
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        instructions: '',
        difficulty_level: '',
        category: '',
        level: '',
        type: '',
        image_url: '',
        video_url: '',
        tags: [],
        premium: false
      });
      setImageFile(null);
      setVideoFile(null);
      setTagInput('');

      if (onExerciseCreated) onExerciseCreated();
      onClose();
    } catch (error: any) {
      console.error('Error creating exercise:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create exercise",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setFormData(prev => ({ ...prev, image_url: '' }));
    }
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setVideoFile(file);
      setFormData(prev => ({ ...prev, video_url: '' }));
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingFigure ? 'Edit Exercise' : 'Add New Exercise'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="name" className="text-white">Exercise Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
              placeholder="Enter exercise name"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="premium" className="text-white">Access Level</Label>
              <div className="flex items-center space-x-3 mt-2">
                <Switch
                  id="premium"
                  checked={formData.premium}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, premium: checked }))}
                />
                <Label htmlFor="premium" className="text-white cursor-pointer">
                  {formData.premium ? 'Premium' : 'Free'}
                </Label>
              </div>
            </div>

            <div>
              <Label htmlFor="difficulty" className="text-white">Difficulty Level (Optional)</Label>
              <Select 
                value={formData.difficulty_level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="category" className="text-white">Category (Optional)</Label>
              <Select 
                value={formData.category} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="silks">Silks</SelectItem>
                  <SelectItem value="hoop">Hoop</SelectItem>
                  <SelectItem value="pole">Pole</SelectItem>
                  <SelectItem value="straps">Straps</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="type" className="text-white">Type (Optional)</Label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single figure">Single Figure</SelectItem>
                  <SelectItem value="combo">Combo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="level" className="text-white">Level (Optional)</Label>
              <Select 
                value={formData.level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, level: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Level 1</SelectItem>
                  <SelectItem value="2">Level 2</SelectItem>
                  <SelectItem value="3">Level 3</SelectItem>
                  <SelectItem value="4">Level 4</SelectItem>
                  <SelectItem value="5">Level 5</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
              placeholder="Brief description of the exercise"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="instructions" className="text-white">Instructions (Optional)</Label>
            <Textarea
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
              className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
              placeholder="Step-by-step instructions"
              rows={4}
            />
          </div>

          <div>
            <Label htmlFor="tags" className="text-white">Tags (Optional)</Label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder="Add a tag and press Enter"
                />
                <Button
                  type="button"
                  onClick={addTag}
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                >
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge
                    key={index}
                    variant="secondary"
                    className="bg-white/10 text-white border-white/20 cursor-pointer"
                    onClick={() => removeTag(tag)}
                  >
                    {tag} ✕
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="image" className="text-white">Exercise Image *</Label>
              <div className="space-y-2">
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="bg-white/5 border-white/10 text-white file:bg-white/10 file:text-white file:border-0"
                />
                {imageFile && (
                  <p className="text-sm text-green-400">Image selected: {imageFile.name}</p>
                )}
                {formData.image_url && !imageFile && (
                  <p className="text-sm text-white/60">Current image URL set</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="video" className="text-white">Video (Optional)</Label>
              <div className="space-y-2">
                <Input
                  id="video"
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="bg-white/5 border-white/10 text-white file:bg-white/10 file:text-white file:border-0"
                />
                {videoFile && (
                  <p className="text-sm text-green-400">Video selected: {videoFile.name}</p>
                )}
                {formData.video_url && !videoFile && (
                  <p className="text-sm text-white/60">Current video URL set</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-white/10 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingFigure ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingFigure ? 'Update Exercise' : 'Create Exercise'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};