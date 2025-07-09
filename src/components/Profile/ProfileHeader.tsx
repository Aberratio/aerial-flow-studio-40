import React, { useState } from 'react';
import { Camera, Settings } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileHeaderProps {
  onEditProfile: () => void;
  onSettings: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({ onEditProfile, onSettings }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    console.log('Starting avatar upload...', file);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const avatarUrl = data.publicUrl;
      console.log('Avatar uploaded successfully:', avatarUrl);

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Profile avatar updated successfully!');
      
      toast({
        title: "Profile Photo Updated",
        description: "Your profile photo has been successfully updated.",
      });

      // Refresh the page to show the new avatar
      window.location.reload();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const stats = [
    { label: 'Posts', value: '127' },
    { label: 'Followers', value: user?.followersCount?.toLocaleString() || '0' },
    { label: 'Following', value: user?.followingCount?.toLocaleString() || '0' },
    { label: 'Score', value: '2,450' }
  ];

  return (
    <Card className="glass-effect border-white/10 mb-6">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="relative">
            <Avatar className={`w-32 h-32 ${user?.role === 'trainer' ? 'ring-4 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-4 ring-offset-black' : ''}`}>
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarUpload}
              className="hidden"
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload">
              <Button
                size="sm"
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 cursor-pointer"
                asChild
              >
                <span>
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </span>
              </Button>
            </label>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
              <h1 className="text-3xl font-bold text-white">{user?.username}</h1>
              <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 md:mt-0">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  Verified Athlete
                </Badge>
                {user?.role && (
                  <Badge 
                    className={
                      user.role === 'trainer' 
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold" 
                        : user.role === 'premium'
                        ? "bg-gradient-to-r from-purple-400 to-pink-400 text-white"
                        : "bg-white/10 text-white"
                    }
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-muted-foreground mb-6">{user?.bio}</p>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="gradient-text text-2xl font-bold">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-3">
              <Button 
                onClick={onEditProfile}
                className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
              >
                Edit Profile
              </Button>
              <Button 
                variant="outline" 
                onClick={onSettings}
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};