import React, { useState } from 'react';
import { EditProfileModal } from '@/components/EditProfileModal';
import { SettingsModal } from '@/components/SettingsModal';
import { PostPreviewModal } from '@/components/PostPreviewModal';
import { ProfileHeader } from '@/components/Profile/ProfileHeader';
import { AchievementsSection } from '@/components/Profile/AchievementsSection';
import { FigureJourneySection } from '@/components/Profile/FigureJourneySection';
import { FriendsSection } from '@/components/Profile/FriendsSection';
import { NewPendingRequestsSection } from '@/components/NewPendingRequestsSection';
import { ContentTabs } from '@/components/Profile/ContentTabs';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [friendsRefreshTrigger, setFriendsRefreshTrigger] = useState(0);
  const { user } = useAuth();

  const handlePostSelect = (post: any) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const handleFriendsUpdated = () => {
    setFriendsRefreshTrigger(prev => prev + 1);
  };

  const toggleLike = async (postId: string) => {
    if (!user || !selectedPost) return;

    try {
      if (selectedPost.is_liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setSelectedPost(prev => prev ? { 
          ...prev, 
          is_liked: false, 
          likes_count: prev.likes_count - 1 
        } : null);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });

        setSelectedPost(prev => prev ? { 
          ...prev, 
          is_liked: true, 
          likes_count: prev.likes_count + 1 
        } : null);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <ProfileHeader 
          onEditProfile={() => setIsEditModalOpen(true)}
          onSettings={() => setIsSettingsModalOpen(true)}
        />

        {/* Achievements */}
        <AchievementsSection />

        {/* My Figure Journey */}
        <FigureJourneySection />

        {/* Pending Friend Requests */}
        <NewPendingRequestsSection onFriendsUpdated={handleFriendsUpdated} />

        {/* Friends Overview */}
        <FriendsSection refreshTrigger={friendsRefreshTrigger} />

        {/* Content Tabs */}
        <ContentTabs onPostSelect={handlePostSelect} />
      </div>

      {/* Modals */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
      <PostPreviewModal 
        post={selectedPost} 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)}
        onToggleLike={toggleLike}
      />
    </div>
  );
};

export default Profile;