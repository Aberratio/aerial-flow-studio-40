import React, { useState, useEffect } from 'react';
import { X, Image, Users, Lock, Globe, Video, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  preselectedFigure?: any;
}

export const CreatePostModal = ({ isOpen, onClose, onPostCreated, preselectedFigure }: CreatePostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState<any>(null);
  const [figureSearchTerm, setFigureSearchTerm] = useState('');
  const [availableFigures, setAvailableFigures] = useState([]);
  const [showFigureSearch, setShowFigureSearch] = useState(false);
  const { toast } = useToast();

  // Fetch available figures for selection
  const fetchFigures = async () => {
    try {
      const { data: figures, error } = await supabase
        .from('figures')
        .select('id, name, difficulty_level, category, image_url')
        .order('name', { ascending: true });

      if (error) throw error;
      setAvailableFigures(figures || []);
    } catch (error) {
      console.error('Error fetching figures:', error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFigures();
      if (preselectedFigure) {
        setSelectedFigure(preselectedFigure);
        setShowFigureSearch(false);
      }
    }
  }, [isOpen, preselectedFigure]);

  const filteredFigures = availableFigures.filter(figure =>
    figure.name.toLowerCase().includes(figureSearchTerm.toLowerCase())
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your post",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    console.log('Starting post creation...', { user, content, selectedFile });
    try {
      let mediaUrl = null;

      // Upload media file if selected
      if (selectedFile) {
        console.log('Uploading media file...', selectedFile);
        const fileExt = selectedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error('Error uploading file:', uploadError);
          throw uploadError;
        } else {
          const { data } = supabase.storage
            .from('posts')
            .getPublicUrl(fileName);
          mediaUrl = data.publicUrl;
          console.log('Media uploaded successfully:', mediaUrl);
        }
      }

      console.log('Creating post in database...');
      // Create post in database
      const { data: newPost, error } = await supabase
        .from('posts')
        .insert({
          user_id: user.id,
          content,
          privacy,
          image_url: mediaType === 'image' ? mediaUrl : null,
          video_url: mediaType === 'video' ? mediaUrl : null,
          figure_id: selectedFigure?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select(`
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `)
        .single();

      if (error) {
        throw error;
      }

      // Pass the raw post data to the callback
      onPostCreated(newPost);
      
      // Reset form
      setContent('');
      setSelectedFile(null);
      setSelectedFilePreview(null);
      setPrivacy('public');
      onClose();
      
      toast({
        title: "Post created!",
        description: "Your post has been shared successfully."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getPrivacyIcon = () => {
    switch (privacy) {
      case 'friends':
        return <Users className="w-4 h-4" />;
      case 'private':
        return <Lock className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Post</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>{user?.username?.[0]?.toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{user?.username}</p>
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger className="w-40 h-8 bg-white/5 border-white/10 text-white">
                  <SelectValue>
                    <div className="flex items-center space-x-2">
                      {getPrivacyIcon()}
                      <span className="capitalize">{privacy === 'friends' ? 'Friends only' : privacy === 'private' ? 'Only me' : 'Public'}</span>
                    </div>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-background/95 border-white/10 z-50">
                  <SelectItem value="public">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4" />
                      <span>Public</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="friends">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4" />
                      <span>Friends only</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="private">
                    <div className="flex items-center space-x-2">
                      <Lock className="w-4 h-4" />
                      <span>Only me</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            placeholder={preselectedFigure ? `Share your version of ${preselectedFigure.name}...` : "What's on your mind?"}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground resize-none"
          />

          {/* Selected Figure Display */}
          {selectedFigure && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedFigure.image_url && (
                    <img 
                      src={selectedFigure.image_url} 
                      alt={selectedFigure.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">{selectedFigure.name}</p>
                    <p className="text-muted-foreground text-sm">{selectedFigure.difficulty_level}</p>
                  </div>
                </div>
                {!preselectedFigure && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFigure(null)}
                    className="text-muted-foreground hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Figure Selection */}
          {!selectedFigure && !preselectedFigure && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowFigureSearch(!showFigureSearch)}
                className="w-full justify-start border-white/20 text-white hover:bg-white/10"
              >
                <Target className="w-4 h-4 mr-2" />
                {showFigureSearch ? 'Hide Figure Selection' : 'Link to a Figure (Optional)'}
              </Button>
              
              {showFigureSearch && (
                <div className="space-y-2">
                  <input
                    type="text"
                    placeholder="Search figures..."
                    value={figureSearchTerm}
                    onChange={(e) => setFigureSearchTerm(e.target.value)}
                    className="w-full p-2 bg-white/5 border border-white/10 rounded text-white placeholder:text-muted-foreground"
                  />
                  <div className="max-h-40 overflow-y-auto space-y-1">
                    {filteredFigures.slice(0, 5).map((figure) => (
                      <div
                        key={figure.id}
                        onClick={() => {
                          setSelectedFigure(figure);
                          setShowFigureSearch(false);
                          setFigureSearchTerm('');
                        }}
                        className="p-2 hover:bg-white/10 rounded cursor-pointer flex items-center space-x-2"
                      >
                        {figure.image_url && (
                          <img 
                            src={figure.image_url} 
                            alt={figure.name}
                            className="w-8 h-8 rounded object-cover"
                          />
                        )}
                        <div>
                          <p className="text-white text-sm">{figure.name}</p>
                          <p className="text-muted-foreground text-xs">{figure.difficulty_level}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {selectedFilePreview && mediaType === 'image' && (
            <div className="relative">
              <img
                src={selectedFilePreview}
                alt="Selected"
                className="w-full max-h-48 sm:max-h-64 object-cover rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFilePreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {selectedFilePreview && mediaType === 'video' && (
            <div className="relative">
              <video
                src={selectedFilePreview}
                className="w-full max-h-48 sm:max-h-64 object-cover rounded-lg"
                controls
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFilePreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-white text-sm"
                  asChild
                  onClick={() => setMediaType('image')}
                >
                  <span className="flex items-center space-x-2 cursor-pointer">
                    <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Add Photo</span>
                    <span className="sm:hidden">Photo</span>
                  </span>
                </Button>
              </label>
              
              <input
                type="file"
                accept="video/*"
                onChange={handleFileUpload}
                className="hidden"
                id="video-upload"
              />
              <label htmlFor="video-upload">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-white text-sm"
                  asChild
                  onClick={() => setMediaType('video')}
                >
                  <span className="flex items-center space-x-2 cursor-pointer">
                    <Video className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">Add Video</span>
                    <span className="sm:hidden">Video</span>
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex space-x-2 justify-end">
              <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-white text-sm">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90 text-sm"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Posting...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  'Post'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};