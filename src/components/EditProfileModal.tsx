import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, X, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EditProfileModal = ({ isOpen, onClose }: EditProfileModalProps) => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [email, setEmail] = useState(user?.email || '');
  const [location, setLocation] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    
    setIsLoading(true);
    console.log('Starting profile save...', { user, username, bio, email, avatarFile });
    try {
      let avatarUrl = user.avatar_url;

      // Upload avatar if changed
      if (avatarFile) {
        console.log('Uploading avatar...', avatarFile);
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
          throw uploadError;
        } else {
          const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);
          avatarUrl = data.publicUrl;
          console.log('Avatar uploaded successfully:', avatarUrl);
        }
      }

      console.log('Updating profile in database...');
      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          username,
          bio,
          email,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Profile updated successfully!');

      // Refresh user data to show new avatar
      await refreshUser();

      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-slate-900/95 border-white/30 shadow-2xl backdrop-blur-sm">
        <DialogHeader>
          <DialogTitle className="text-white">Edit Profile</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center space-y-4">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={avatarPreview || user?.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl">
                  {user?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                className="hidden"
                id="avatar-upload"
              />
              <label htmlFor="avatar-upload">
                <Button
                  size="sm"
                  variant="primary"
                  className="absolute bottom-0 right-0 w-8 h-8 rounded-full"
                  asChild
                >
                  <span className="cursor-pointer">
                    <Camera className="w-4 h-4" />
                  </span>
                </Button>
              </label>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              Change Photo
            </Button>
          </div>

          {/* Form Fields */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-white">Username</Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                placeholder="Enter username"
              />
            </div>

            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                placeholder="Enter email"
              />
            </div>

            <div>
              <Label htmlFor="bio" className="text-white">Bio</Label>
              <Textarea
                id="bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60 min-h-[100px]"
                placeholder="Tell us about yourself..."
              />
            </div>

            <div>
              <Label htmlFor="location" className="text-white">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                placeholder="Enter location"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <Button
              variant="primary"
              onClick={handleSave}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save Changes
            </Button>
            <Button
              variant="outline"
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};