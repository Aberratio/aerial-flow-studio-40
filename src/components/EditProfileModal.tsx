import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Camera, Save, X, Loader2, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

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
  const [sports, setSports] = useState<string[]>([]);
  const [newSport, setNewSport] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const popularSports = [
    'silks', 'hoop', 'pole', 'straps', 'hammock', 'acrobatics', 
    'gymnastics', 'dance', 'yoga', 'contortion', 'circus arts'
  ];

  useEffect(() => {
    if (user && isOpen) {
      // Fetch user's sports from profile
      const fetchUserSports = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('sports')
          .eq('id', user.id)
          .single();
        
        if (data?.sports) {
          setSports(data.sports || []);
        }
      };
      
      fetchUserSports();
    }
  }, [user, isOpen]);

  const addSport = (sport: string) => {
    if (!sports.includes(sport)) {
      setSports([...sports, sport]);
    }
  };

  const removeSport = (sport: string) => {
    setSports(sports.filter(s => s !== sport));
  };

  const addCustomSport = () => {
    if (newSport.trim() && !sports.includes(newSport.trim())) {
      setSports([...sports, newSport.trim()]);
      setNewSport('');
    }
  };

  const resizeAndCropImage = (file: File): Promise<{ file: File; preview: string }> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d')!;
      const img = new Image();
      
      img.onload = () => {
        const size = 400; // Target size for square avatar
        canvas.width = size;
        canvas.height = size;
        
        // Calculate dimensions for center crop
        const scale = Math.max(size / img.width, size / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const offsetX = (size - scaledWidth) / 2;
        const offsetY = (size - scaledHeight) / 2;
        
        // Fill background with white (for transparent images)
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        
        // Draw cropped and scaled image
        ctx.drawImage(img, offsetX, offsetY, scaledWidth, scaledHeight);
        
        const preview = canvas.toDataURL('image/jpeg', 0.9);
        
        canvas.toBlob((blob) => {
          const resizedFile = new File([blob!], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          });
          resolve({ file: resizedFile, preview });
        }, 'image/jpeg', 0.9);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        const { file: processedFile, preview } = await resizeAndCropImage(file);
        setAvatarFile(processedFile);
        setAvatarPreview(preview);
      } catch (error) {
        console.error('Error processing image:', error);
        toast({
          title: "Error",
          description: "Failed to process image. Please try another file.",
          variant: "destructive"
        });
      }
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
        const fileExt = 'jpg'; // Always use jpg for consistency
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
          sports: sports,
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
              <Label className="text-white">Sports & Activities</Label>
              <div className="space-y-3">
                {/* Popular Sports */}
                <div className="flex flex-wrap gap-2">
                  {popularSports.map((sport) => (
                    <Button
                      key={sport}
                      variant={sports.includes(sport) ? "primary" : "outline"}
                      size="sm"
                      onClick={() => sports.includes(sport) ? removeSport(sport) : addSport(sport)}
                      className={sports.includes(sport) 
                        ? "bg-purple-500/80 text-white" 
                        : "border-white/20 text-white hover:bg-white/10"
                      }
                    >
                      {sport.charAt(0).toUpperCase() + sport.slice(1)}
                    </Button>
                  ))}
                </div>

                {/* Selected Sports */}
                {sports.length > 0 && (
                  <div className="border border-white/10 rounded-lg p-3 bg-white/5">
                    <Label className="text-white text-sm mb-2 block">Your Sports:</Label>
                    <div className="flex flex-wrap gap-2">
                      {sports.map((sport) => (
                        <Badge 
                          key={sport} 
                          className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                        >
                          {sport}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSport(sport)}
                            className="h-4 w-4 p-0 hover:bg-red-500/20"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Sport */}
                <div className="flex gap-2">
                  <Input
                    value={newSport}
                    onChange={(e) => setNewSport(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60 flex-1"
                    placeholder="Add a custom sport..."
                    onKeyPress={(e) => e.key === 'Enter' && addCustomSport()}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addCustomSport}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
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