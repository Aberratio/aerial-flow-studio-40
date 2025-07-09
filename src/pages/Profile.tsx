import React, { useState } from 'react';
import { EditProfileModal } from '@/components/EditProfileModal';
import { SettingsModal } from '@/components/SettingsModal';
import { PostPreviewModal } from '@/components/PostPreviewModal';
import { ProfileHeader } from '@/components/Profile/ProfileHeader';
import { AchievementsSection } from '@/components/Profile/AchievementsSection';
import { FigureJourneySection } from '@/components/Profile/FigureJourneySection';
import { FriendsSection } from '@/components/Profile/FriendsSection';
import { ContentTabs } from '@/components/Profile/ContentTabs';

const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);

  const handlePostSelect = (post: any) => {
    setSelectedPost(post);
    setIsPostModalOpen(true);
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

        {/* Friends Overview */}
        <FriendsSection />

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