import React, { useState } from 'react';
import { X, Image, Users, Lock, Globe, Video, Loader2 } from 'lucide-react';
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
}

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }: CreatePostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
          image_url: mediaType === 'image' ? mediaUrl : null,
          video_url: mediaType === 'video' ? mediaUrl : null,
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

      console.log('Post created successfully:', newPost);
      // Transform the post data to match the Feed component's expected format
      const transformedPost = {
        id: newPost.id,
        content: newPost.content,
        image: newPost.image_url,
        video: newPost.video_url,
        timeAgo: 'now',
        likes: 0,
        comments: 0,
        isLiked: false,
        user: {
          id: newPost.profiles.id,
          username: newPost.profiles.username,
          avatar: newPost.profiles.avatar_url,
          verified: false
        }
      };

      // Call the callback with the transformed post
      onPostCreated(transformedPost);
      
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
      <DialogContent className="sm:max-w-[600px] glass-effect border-white/10">
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
                  <div className="flex items-center space-x-2">
                    {getPrivacyIcon()}
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-background/95 border-white/10">
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
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground resize-none"
          />

          {selectedFilePreview && mediaType === 'image' && (
            <div className="relative">
              <img
                src={selectedFilePreview}
                alt="Selected"
                className="w-full max-h-64 object-cover rounded-lg"
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
                className="w-full max-h-64 object-cover rounded-lg"
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

          <div className="flex items-center justify-between">
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
                  className="text-muted-foreground hover:text-white"
                  asChild
                  onClick={() => setMediaType('image')}
                >
                  <span className="flex items-center space-x-2 cursor-pointer">
                    <Image className="w-5 h-5" />
                    <span>Add Photo</span>
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
                  className="text-muted-foreground hover:text-white"
                  asChild
                  onClick={() => setMediaType('video')}
                >
                  <span className="flex items-center space-x-2 cursor-pointer">
                    <Video className="w-5 h-5" />
                    <span>Add Video</span>
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex space-x-2">
              <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-white">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={isLoading}
                className="bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Posting...
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