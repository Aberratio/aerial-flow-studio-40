import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Grid, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';
import { useProfilePreviewData } from '@/hooks/useProfilePreviewData';
import { ProfilePreviewHeader } from '@/components/Profile/ProfilePreviewHeader';
import { ProfilePreviewAchievements } from '@/components/Profile/ProfilePreviewAchievements';
import { ProfilePreviewPosts } from '@/components/Profile/ProfilePreviewPosts';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const ProfilePreviewModal = ({ isOpen, onClose, userId }: ProfilePreviewModalProps) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const { 
    pendingFriendRequest, 
    loading: friendshipLoading,
    acceptFriendRequest,
    rejectFriendRequest
  } = useFriendshipStatus(userId);
  const { profile, posts, achievements, loading } = useProfilePreviewData(userId, isOpen);

  if (!isOpen || !userId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Profile Preview</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading profile...</p>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            <ProfilePreviewHeader
              profile={profile}
              userId={userId}
              pendingFriendRequest={pendingFriendRequest}
              friendshipLoading={friendshipLoading}
              onAcceptFriend={acceptFriendRequest}
              onRejectFriend={rejectFriendRequest}
            />

            {/* Content Tabs */}
            <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
              <Button
                variant="ghost"
                className={`flex-1 transition-all ${
                  activeTab === 'posts' 
                    ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                } ${activeTab === 'posts' ? 'hover:bg-gradient-to-r hover:from-purple-500/20 hover:via-pink-500/20 hover:to-blue-500/20' : ''}`}
                onClick={() => setActiveTab('posts')}
              >
                <Grid className="w-4 h-4 mr-2" />
                Posts
              </Button>
              <Button
                variant="ghost"
                className={`flex-1 transition-all ${
                  activeTab === 'achievements' 
                    ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                } ${activeTab === 'achievements' ? 'hover:bg-gradient-to-r hover:from-purple-500/20 hover:via-pink-500/20 hover:to-blue-500/20' : ''}`}
                onClick={() => setActiveTab('achievements')}
              >
                <Award className="w-4 h-4 mr-2" />
                Achievements
              </Button>
            </div>

            {/* Tab Content */}
            {activeTab === 'posts' && (
              posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No posts yet</p>
                </div>
              ) : (
                <ProfilePreviewPosts posts={posts} />
              )
            )}

            {activeTab === 'achievements' && (
              achievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No achievements yet</p>
                </div>
              ) : (
                <ProfilePreviewAchievements achievements={achievements} />
              )
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};