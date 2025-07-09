import React, { useState } from 'react';
import { X, Image, Users, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
}

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }: CreatePostModalProps) => {
  const [content, setContent] = useState('');
  const [privacy, setPrivacy] = useState('public');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your post",
        variant: "destructive"
      });
      return;
    }

    const newPost = {
      id: Date.now(),
      user: {
        id: 'current-user',
        username: 'you',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: false
      },
      content,
      image: selectedImage,
      likes: 0,
      comments: 0,
      timeAgo: 'now',
      isLiked: false,
      privacy
    };

    onPostCreated(newPost);
    setContent('');
    setSelectedImage(null);
    setPrivacy('public');
    onClose();
    
    toast({
      title: "Post created!",
      description: "Your post has been shared successfully."
    });
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
              <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback>You</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">You</p>
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

          {selectedImage && (
            <div className="relative">
              <img
                src={selectedImage}
                alt="Selected"
                className="w-full max-h-64 object-cover rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => setSelectedImage(null)}
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
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
              />
              <label htmlFor="image-upload">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-white"
                  asChild
                >
                  <span className="flex items-center space-x-2 cursor-pointer">
                    <Image className="w-5 h-5" />
                    <span>Add Photo</span>
                  </span>
                </Button>
              </label>
            </div>

            <div className="flex space-x-2">
              <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-white">
                Cancel
              </Button>
              <Button onClick={handleSubmit} className="bg-primary hover:bg-primary/90">
                Post
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};