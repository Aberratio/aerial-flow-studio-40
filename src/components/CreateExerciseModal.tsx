import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Upload, Loader2, Languages } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    tags: [] as string[]
  });
  const [translations, setTranslations] = useState<Record<string, {
    name: string;
    description: string;
    instructions: string;
    tags: string[];
  }>>({});
  const [availableLanguages, setAvailableLanguages] = useState<Array<{id: string, name: string, native_name: string}>>([]);
  const [tagInput, setTagInput] = useState('');
  const [translationTagInputs, setTranslationTagInputs] = useState<Record<string, string>>({});

  // Fetch available languages
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('id, name, native_name')
          .order('is_default', { ascending: false });

        if (error) throw error;
        setAvailableLanguages(data || []);
      } catch (error) {
        console.error('Error fetching languages:', error);
      }
    };

    if (isOpen) {
      fetchLanguages();
    }
  }, [isOpen]);

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
        tags: editingFigure.tags || []
      });

      // Fetch existing translations
      const fetchTranslations = async () => {
        try {
          const { data, error } = await supabase
            .from('figure_translations')
            .select('*')
            .eq('figure_id', editingFigure.id);

          if (error) throw error;

          const translationData: Record<string, any> = {};
          data?.forEach(translation => {
            translationData[translation.language_id] = {
              name: translation.name || '',
              description: translation.description || '',
              instructions: translation.instructions || '',
              tags: translation.tags || []
            };
          });
          setTranslations(translationData);
        } catch (error) {
          console.error('Error fetching translations:', error);
        }
      };

      fetchTranslations();
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
        tags: []
      });
      setTranslations({});
    }
    setTagInput('');
    setTranslationTagInputs({});
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
      let figureId = editingFigure?.id;
      
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
            updated_at: new Date().toISOString()
          })
          .eq('id', editingFigure.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
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
            created_by: user.id
          })
          .select('id')
          .single();

        if (error) throw error;
        figureId = data.id;
      }

      // Save translations
      for (const [languageId, translation] of Object.entries(translations)) {
        if (translation.name.trim()) {
          const translationData = {
            figure_id: figureId,
            language_id: languageId,
            name: translation.name.trim(),
            description: translation.description.trim() || null,
            instructions: translation.instructions.trim() || null,
            tags: translation.tags.length > 0 ? translation.tags : null
          };

          // Check if translation already exists
          const { data: existingTranslation } = await supabase
            .from('figure_translations')
            .select('id')
            .eq('figure_id', figureId)
            .eq('language_id', languageId)
            .single();

          if (existingTranslation) {
            // Update existing translation
            const { error: translationError } = await supabase
              .from('figure_translations')
              .update(translationData)
              .eq('id', existingTranslation.id);

            if (translationError) throw translationError;
          } else {
            // Create new translation
            const { error: translationError } = await supabase
              .from('figure_translations')
              .insert(translationData);

            if (translationError) throw translationError;
          }
        }
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
        tags: []
      });
      setTranslations({});
      setImageFile(null);
      setVideoFile(null);
      setTagInput('');
      setTranslationTagInputs({});

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

  const addTranslationTag = (languageId: string) => {
    const tag = translationTagInputs[languageId]?.trim();
    if (tag && !translations[languageId]?.tags?.includes(tag)) {
      setTranslations(prev => ({
        ...prev,
        [languageId]: {
          ...prev[languageId],
          tags: [...(prev[languageId]?.tags || []), tag]
        }
      }));
      setTranslationTagInputs(prev => ({ ...prev, [languageId]: '' }));
    }
  };

  const removeTranslationTag = (languageId: string, tagToRemove: string) => {
    setTranslations(prev => ({
      ...prev,
      [languageId]: {
        ...prev[languageId],
        tags: prev[languageId]?.tags?.filter(tag => tag !== tagToRemove) || []
      }
    }));
  };

  const handleTranslationKeyPress = (e: React.KeyboardEvent, languageId: string) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTranslationTag(languageId);
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
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="translations" className="flex items-center">
                <Languages className="w-4 h-4 mr-2" />
                Translations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-6">
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
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

              <div>
                <Label htmlFor="category" className="text-white">Category</Label>
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
                <Label htmlFor="type" className="text-white">Type</Label>
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

            <div>
              <Label className="text-white">Tags</Label>
              <div className="mt-2 space-y-2">
                <div className="flex space-x-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                    placeholder="Add a tag (press Enter)"
                  />
                  <Button
                    type="button"
                    onClick={addTag}
                    disabled={!tagInput.trim()}
                    className="bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    Add
                  </Button>
                </div>
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <Badge 
                        key={index} 
                        variant="outline" 
                        className="border-purple-500/30 text-purple-300 pr-1"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-400"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
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
            </TabsContent>

            <TabsContent value="translations" className="space-y-4 mt-6">
              <div className="text-sm text-muted-foreground mb-4">
                Add translations for this exercise in different languages. This helps make your content accessible to more users.
              </div>
              
              {availableLanguages.filter(lang => lang.id !== 'en').map(language => (
                <Card key={language.id} className="glass-effect border-white/10">
                  <CardHeader>
                    <CardTitle className="text-white text-lg">{language.native_name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Exercise Name</Label>
                      <Input
                        value={translations[language.id]?.name || ''}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [language.id]: { ...prev[language.id], name: e.target.value }
                        }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder={`Exercise name in ${language.native_name}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Description</Label>
                      <Textarea
                        value={translations[language.id]?.description || ''}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [language.id]: { ...prev[language.id], description: e.target.value }
                        }))}
                        className="bg-white/5 border-white/10 text-white"
                        rows={3}
                        placeholder={`Description in ${language.native_name}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Instructions</Label>
                      <Textarea
                        value={translations[language.id]?.instructions || ''}
                        onChange={(e) => setTranslations(prev => ({
                          ...prev,
                          [language.id]: { ...prev[language.id], instructions: e.target.value }
                        }))}
                        className="bg-white/5 border-white/10 text-white"
                        rows={4}
                        placeholder={`Instructions in ${language.native_name}`}
                      />
                    </div>

                    <div>
                      <Label className="text-white">Tags</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={translationTagInputs[language.id] || ''}
                          onChange={(e) => setTranslationTagInputs(prev => ({ ...prev, [language.id]: e.target.value }))}
                          onKeyPress={(e) => handleTranslationKeyPress(e, language.id)}
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="Add a tag (press Enter)"
                        />
                        <Button
                          type="button"
                          onClick={() => addTranslationTag(language.id)}
                          disabled={!translationTagInputs[language.id]?.trim()}
                          className="bg-gradient-to-r from-purple-500 to-pink-500"
                        >
                          Add
                        </Button>
                      </div>
                      {translations[language.id]?.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {translations[language.id].tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="border-purple-500/30 text-purple-300 pr-1"
                            >
                              {tag}
                              <button
                                type="button"
                                onClick={() => removeTranslationTag(language.id, tag)}
                                className="ml-1 hover:text-red-400"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>
          </Tabs>

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