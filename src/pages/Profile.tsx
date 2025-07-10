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

const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [friendsRefreshTrigger, setFriendsRefreshTrigger] = useState(0);

  const handlePostSelect = (post: any) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
  };

  const handleFriendsUpdated = () => {
    setFriendsRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
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
      />
    </div>
  );
};

export default Profile;