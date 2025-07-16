import React, { useState } from 'react';
import { 
  Users, 
  Camera, 
  Edit, 
  Check, 
  Plus, 
  X, 
  Upload
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ProfileCompletionSectionProps {
  user: any;
  onUpdate: () => void;
}

const COMMON_SPORTS = [
  'Aerial Silk', 'Aerial Hoop', 'Aerial Straps', 'Aerial Hammock', 'Pole Dance',
  'Contortion', 'Acrobatics', 'Gymnastics', 'Dance', 'Yoga', 'Pilates',
  'Calisthenics', 'Trapeze', 'Handstand', 'Flexibility Training'
];

export const ProfileCompletionSection: React.FC<ProfileCompletionSectionProps> = ({ user, onUpdate }) => {
  const { refreshUser } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    bio: user.bio || '',
    sports: user.sports || []
  });
  const [newSport, setNewSport] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addSport = (sport: string) => {
    if (sport && !formData.sports.includes(sport)) {
      setFormData(prev => ({
        ...prev,
        sports: [...prev.sports, sport]
      }));
    }
  };

  const removeSport = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      sports: prev.sports.filter(s => s !== sport)
    }));
  };

  const addCustomSport = () => {
    if (newSport.trim()) {
      addSport(newSport.trim());
      setNewSport('');
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      let avatarUrl = user.avatar_url;
      
      // Upload avatar if changed
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile);
        
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);
        
        avatarUrl = publicUrl;
      }
      
      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          bio: formData.bio,
          sports: formData.sports,
          avatar_url: avatarUrl
        })
        .eq('id', user.id);
      
      if (updateError) throw updateError;
      
      await refreshUser();
      onUpdate();
      setIsEditing(false);
      setAvatarFile(null);
      setAvatarPreview(null);
      
      toast({
        title: 'Success',
        description: 'Profile updated successfully!'
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update profile',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      bio: user.bio || '',
      sports: user.sports || []
    });
    setNewSport('');
    setAvatarFile(null);
    setAvatarPreview(null);
    setIsEditing(false);
  };

  const missingItems = [];
  if (!user.avatar_url) missingItems.push('profile picture');
  if (!user.bio) missingItems.push('bio');
  if (!user.sports?.length) missingItems.push('trained sports');

  return (
    <Card className="glass-effect border-white/10 mb-8 border-2 border-purple-400/30">
      <CardHeader>
        <CardTitle className="text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center flex-wrap gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <span>Finish Your Profile</span>
              <Badge className="bg-purple-500/20 text-purple-300 border-purple-400/30 text-xs">
                {missingItems.length} item{missingItems.length !== 1 ? 's' : ''} missing
              </Badge>
            </div>
            {!isEditing && (
              <Button
                onClick={() => setIsEditing(true)}
                variant="outline"
                size="sm"
                className="text-purple-400 border-purple-400/30 hover:bg-purple-500/20 w-fit"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isEditing ? (
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Complete your profile to get better recommendations and connect with the community
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10">
                <div className={`w-3 h-3 rounded-full mr-3 ${user.avatar_url ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-white text-sm">Profile picture</span>
              </div>
              <div className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10">
                <div className={`w-3 h-3 rounded-full mr-3 ${user.bio ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-white text-sm">Bio</span>
              </div>
              <div className="flex items-center p-3 bg-white/5 rounded-lg border border-white/10">
                <div className={`w-3 h-3 rounded-full mr-3 ${user.sports?.length ? 'bg-green-400' : 'bg-red-400'}`}></div>
                <span className="text-white text-sm">Trained sports</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Avatar Section */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20 ring-2 ring-purple-400/30">
                <AvatarImage src={avatarPreview || user.avatar_url} />
                <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl">
                  {user.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <label className="cursor-pointer">
                  <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg border border-white/20 transition-colors">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span className="text-white text-sm">Change Photo</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Bio Section */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Bio
              </label>
              <Textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                placeholder="Tell us about yourself and your aerial journey..."
                className="min-h-[100px] bg-white/5 border-white/20 text-white placeholder-muted-foreground focus:border-purple-400/50"
              />
            </div>

            {/* Sports Section */}
            <div>
              <label className="block text-sm font-medium text-white mb-2">
                Sports & Disciplines
              </label>
              
              {/* Current Sports */}
              <div className="flex flex-wrap gap-2 mb-4">
                {formData.sports.map((sport) => (
                  <Badge
                    key={sport}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30"
                  >
                    {sport}
                    <button
                      onClick={() => removeSport(sport)}
                      className="ml-2 hover:text-red-400 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              {/* Common Sports */}
              <div className="mb-4">
                <p className="text-sm text-muted-foreground mb-2">Popular choices:</p>
                <div className="flex flex-wrap gap-2">
                  {COMMON_SPORTS.filter(sport => !formData.sports.includes(sport)).map((sport) => (
                    <button
                      key={sport}
                      onClick={() => addSport(sport)}
                      className="px-3 py-1 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-muted-foreground hover:text-white transition-colors"
                    >
                      + {sport}
                    </button>
                  ))}
                </div>
              </div>

              {/* Add Custom Sport */}
              <div className="flex gap-2">
                <Input
                  value={newSport}
                  onChange={(e) => setNewSport(e.target.value)}
                  placeholder="Add custom sport/discipline..."
                  className="bg-white/5 border-white/20 text-white placeholder-muted-foreground"
                  onKeyPress={(e) => e.key === 'Enter' && addCustomSport()}
                />
                <Button
                  onClick={addCustomSport}
                  variant="outline"
                  size="sm"
                  className="border-purple-400/30 text-purple-400 hover:bg-purple-500/20"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleSave}
                disabled={isSaving}
                variant="default"
                className="flex-1"
              >
                {isSaving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};