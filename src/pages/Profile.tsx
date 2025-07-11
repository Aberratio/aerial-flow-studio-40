import React, { useState } from 'react';
import { EditProfileModal } from '@/components/EditProfileModal';
import { SettingsModal } from '@/components/SettingsModal';
import { ProfileHeader } from '@/components/Profile/ProfileHeader';
import { AchievementsSection } from '@/components/Profile/AchievementsSection';
import { FigureJourneySection } from '@/components/Profile/FigureJourneySection';
import { FriendsSection } from '@/components/Profile/FriendsSection';
import { NewPendingRequestsSection } from '@/components/NewPendingRequestsSection';
import { ContentTabs } from '@/components/Profile/ContentTabs';

const Profile = () => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [friendsRefreshTrigger, setFriendsRefreshTrigger] = useState(0);

  const handleFriendsUpdated = () => {
    setFriendsRefreshTrigger(prev => prev + 1);
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
        <ContentTabs />
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
    </div>
  );
};

export default Profile;