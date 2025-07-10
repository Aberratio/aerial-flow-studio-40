import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useMutualFriends } from '@/hooks/useMutualFriends';
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
  const { mutualFriends } = useMutualFriends(user?.id || '', userId);
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
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto glass-effect border-white/10">
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
              mutualFriends={mutualFriends}
              pendingFriendRequest={pendingFriendRequest}
              friendshipLoading={friendshipLoading}
              onAcceptFriend={acceptFriendRequest}
              onRejectFriend={rejectFriendRequest}
            />

            <ProfilePreviewAchievements achievements={achievements} />
            
            <ProfilePreviewPosts posts={posts} />

            {/* Empty State */}
            {posts.length === 0 && achievements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No public content available</p>
              </div>
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