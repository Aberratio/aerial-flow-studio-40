import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Grid, Award, Target } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';
import { useProfilePreviewData } from '@/hooks/useProfilePreviewData';
import { useUserRole } from '@/hooks/useUserRole';
import { ProfilePreviewHeader } from '@/components/Profile/ProfilePreviewHeader';
import { ProfilePreviewAchievements } from '@/components/Profile/ProfilePreviewAchievements';
import { ProfilePreviewPosts } from '@/components/Profile/ProfilePreviewPosts';
import { ProfileChallengesSection } from '@/components/Profile/ProfileChallengesSection';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const ProfilePreviewModal = ({ isOpen, onClose, userId }: ProfilePreviewModalProps) => {
  const { user } = useAuth();
  const { isAdmin } = useUserRole();
  const [activeTab, setActiveTab] = useState('posts');
  const { 
    isFriend,
    pendingFriendRequest, 
    loading: friendshipLoading,
    acceptFriendRequest,
    rejectFriendRequest
  } = useFriendshipStatus(userId);
  
  const canViewChallenges = isAdmin || isFriend || user?.id === userId;
  const { profile, posts, achievements, challenges, loading, challengesLoading } = useProfilePreviewData(
    userId, 
    isOpen, 
    isFriend, 
    isAdmin
  );

  if (!isOpen || !userId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Podgląd profilu</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">Ładowanie profilu...</p>
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
            <div className={`flex space-x-1 mb-6 bg-white/5 rounded-lg p-1`}>
              <Button
                variant="ghost"
                className={`flex-1 transition-all ${
                  activeTab === 'posts' 
                    ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('posts')}
              >
                <Grid className="w-4 h-4 mr-2" />
                Posty
              </Button>
              <Button
                variant="ghost"
                className={`flex-1 transition-all ${
                  activeTab === 'achievements' 
                    ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                }`}
                onClick={() => setActiveTab('achievements')}
              >
                <Award className="w-4 h-4 mr-2" />
                Osiągnięcia
              </Button>
              {canViewChallenges && (
                <Button
                  variant="ghost"
                  className={`flex-1 transition-all ${
                    activeTab === 'challenges' 
                      ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' 
                      : 'text-muted-foreground hover:text-white hover:bg-white/5'
                  }`}
                  onClick={() => setActiveTab('challenges')}
                >
                  <Target className="w-4 h-4 mr-2" />
                  Wyzwania
                </Button>
              )}
            </div>

            {/* Tab Content */}
            {activeTab === 'posts' && (
              posts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Brak postów</p>
                </div>
              ) : (
                <ProfilePreviewPosts posts={posts} />
              )
            )}

            {activeTab === 'achievements' && (
              achievements.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>Brak osiągnięć</p>
                </div>
              ) : (
                <ProfilePreviewAchievements achievements={achievements} />
              )
            )}

            {activeTab === 'challenges' && canViewChallenges && (
              <ProfileChallengesSection 
                challenges={challenges} 
                loading={challengesLoading}
                compact
              />
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Nie znaleziono profilu</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
