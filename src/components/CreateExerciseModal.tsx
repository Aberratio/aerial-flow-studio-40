import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, Loader2 } from 'lucide-react';
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
    image_url: '',
    video_url: ''
  });

  // Update form when editing a figure
  useEffect(() => {
    if (editingFigure) {
      setFormData({
        name: editingFigure.name || '',
        description: editingFigure.description || '',
        instructions: editingFigure.instructions || '',
        difficulty_level: editingFigure.difficulty_level || '',
        image_url: editingFigure.image_url || '',
        video_url: editingFigure.video_url || ''
      });
    } else {
      setFormData({
        name: '',
        description: '',
        instructions: '',
        difficulty_level: '',
        image_url: '',
        video_url: ''
      });
    }
  }, [editingFigure, isOpen]);
  const [isLoading, setIsLoading] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.name.trim()) return;

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
            image_url: imageUrl || null,
            video_url: videoUrl || null,
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
            image_url: imageUrl || null,
            video_url: videoUrl || null,
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
        image_url: '',
        video_url: ''
      });
      setImageFile(null);
      setVideoFile(null);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">
            {editingFigure ? 'Edit Exercise' : 'Add New Exercise'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
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

            <div>
              <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
              <Select 
                value={formData.difficulty_level} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, difficulty_level: value }))}
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select difficulty level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                  <SelectItem value="Expert">Expert</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Description</Label>
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
              <Label htmlFor="instructions" className="text-white">Instructions</Label>
              <Textarea
                id="instructions"
                value={formData.instructions}
                onChange={(e) => setFormData(prev => ({ ...prev, instructions: e.target.value }))}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                placeholder="Step-by-step instructions"
                rows={4}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-white">Image Upload</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {imageFile ? imageFile.name : 'Upload Image'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>

              <div>
                <Label className="text-white">Video Upload</Label>
                <div className="mt-2">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleVideoUpload}
                    className="hidden"
                    id="video-upload"
                  />
                  <label htmlFor="video-upload">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {videoFile ? videoFile.name : 'Upload Video'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground">
              Or provide URLs instead:
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="image_url" className="text-white">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder="https://example.com/image.jpg"
                  disabled={!!imageFile}
                />
              </div>

              <div>
                <Label htmlFor="video_url" className="text-white">Video URL</Label>
                <Input
                  id="video_url"
                  value={formData.video_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, video_url: e.target.value }))}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  placeholder="https://example.com/video.mp4"
                  disabled={!!videoFile}
                />
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {editingFigure ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                editingFigure ? 'Update Exercise' : 'Add Exercise'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};