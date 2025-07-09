import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Bell, 
  Shield, 
  Moon, 
  Globe, 
  Trash2, 
  Download, 
  LogOut,
  Eye,
  MessageCircle,
  Heart
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState({
    likes: true,
    comments: true,
    follows: true,
    challenges: true,
    achievements: false,
  });
  const [privacy, setPrivacy] = useState({
    profilePublic: true,
    showProgress: true,
    allowMessages: true,
  });
  const [darkMode, setDarkMode] = useState(true);

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
    onClose();
  };

  const handleDeleteAccount = () => {
    // Would show confirmation dialog
    toast({
      title: "Account Deletion",
      description: "This action requires confirmation. Please contact support.",
      variant: "destructive",
    });
  };

  const handleLogout = () => {
    // Would handle logout logic
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black/95 border-white/10 max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Notifications */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-purple-400" />
              <h3 className="text-white font-semibold">Notifications</h3>
            </div>
            
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart className="w-4 h-4 text-pink-400" />
                  <Label className="text-white">Likes</Label>
                </div>
                <Switch
                  checked={notifications.likes}
                  onCheckedChange={(checked) => setNotifications({...notifications, likes: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <MessageCircle className="w-4 h-4 text-blue-400" />
                  <Label className="text-white">Comments</Label>
                </div>
                <Switch
                  checked={notifications.comments}
                  onCheckedChange={(checked) => setNotifications({...notifications, comments: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white">New Followers</Label>
                <Switch
                  checked={notifications.follows}
                  onCheckedChange={(checked) => setNotifications({...notifications, follows: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white">Challenge Updates</Label>
                <Switch
                  checked={notifications.challenges}
                  onCheckedChange={(checked) => setNotifications({...notifications, challenges: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white">Achievements</Label>
                <Switch
                  checked={notifications.achievements}
                  onCheckedChange={(checked) => setNotifications({...notifications, achievements: checked})}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Privacy */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <h3 className="text-white font-semibold">Privacy</h3>
            </div>
            
            <div className="space-y-3 pl-7">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Eye className="w-4 h-4 text-blue-400" />
                  <Label className="text-white">Public Profile</Label>
                </div>
                <Switch
                  checked={privacy.profilePublic}
                  onCheckedChange={(checked) => setPrivacy({...privacy, profilePublic: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white">Show Progress</Label>
                <Switch
                  checked={privacy.showProgress}
                  onCheckedChange={(checked) => setPrivacy({...privacy, showProgress: checked})}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label className="text-white">Allow Messages</Label>
                <Switch
                  checked={privacy.allowMessages}
                  onCheckedChange={(checked) => setPrivacy({...privacy, allowMessages: checked})}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Appearance */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Moon className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Appearance</h3>
            </div>
            
            <div className="flex items-center justify-between pl-7">
              <Label className="text-white">Dark Mode</Label>
              <Switch
                checked={darkMode}
                onCheckedChange={setDarkMode}
              />
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Data & Account */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Globe className="w-5 h-5 text-blue-400" />
              <h3 className="text-white font-semibold">Data & Account</h3>
            </div>
            
            <div className="space-y-3 pl-7">
              <Button
                variant="outline"
                className="w-full justify-start border-white/20 text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download My Data
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSaveSettings}
            className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
          >
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};