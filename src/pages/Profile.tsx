import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ProfileHeader } from '@/components/Profile/ProfileHeader';
import { AchievementsSection } from '@/components/Profile/AchievementsSection';
import { FigureJourneySection } from '@/components/Profile/FigureJourneySection';
import { NewPendingRequestsSection } from '@/components/NewPendingRequestsSection';
import { ContentTabs } from '@/components/Profile/ContentTabs';
import { ShareProfileModal } from '@/components/ShareProfileModal';
import { YourSportsSection } from '@/components/Profile/YourSportsSection';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Friends from './Friends';
import Inbox from './Inbox';

const Profile = () => {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
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
          onShare={() => setIsShareModalOpen(true)}
          isOwnProfile={true}
        />

        {/* Your Sports Section */}
        <YourSportsSection />

        {/* Achievements */}
        <AchievementsSection />

        {/* My Figure Journey */}
        <FigureJourneySection />

        {/* Pending Friend Requests */}
        <NewPendingRequestsSection onFriendsUpdated={handleFriendsUpdated} />

        {/* Main Tabs - Posts, Friends, Inbox */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5">
            <TabsTrigger value="posts">Posty</TabsTrigger>
            <TabsTrigger value="friends">Znajomi</TabsTrigger>
            <TabsTrigger value="inbox">Wiadomości</TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-6">
            <ContentTabs isOwnProfile={true} />
          </TabsContent>
          
          <TabsContent value="friends" className="mt-6">
            <Friends />
          </TabsContent>
          
          <TabsContent value="inbox" className="mt-6">
            <Inbox />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modals */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={user?.id || ''}
        profileName={user?.username || ''}
      />
    </div>
  );
};

export default Profile;