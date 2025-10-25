import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Grid, Users, MessageCircle, Trophy } from 'lucide-react';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ProfileHeaderCompact } from '@/components/Profile/ProfileHeaderCompact';
import { ContentTabs } from '@/components/Profile/ContentTabs';
import { ShareProfileModal } from '@/components/ShareProfileModal';
import { ActivityTab } from '@/components/Profile/ActivityTab';
import { NewFriendRequestsModal } from '@/components/NewFriendRequestsModal';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import Friends from './Friends';
import Inbox from './Inbox';

const Profile = () => {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [friendsRefreshTrigger, setFriendsRefreshTrigger] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [showRequestsModal, setShowRequestsModal] = useState(false);

  // Fetch pending requests count
  useEffect(() => {
    const fetchPendingCount = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('friendships')
        .select('id', { count: 'exact' })
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (!error && data) {
        setPendingRequestsCount(data.length);
      }
    };

    fetchPendingCount();
  }, [user, friendsRefreshTrigger]);

  const handleFriendsUpdated = () => {
    setFriendsRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen">
      {/* Compact Header - Sticky */}
      <ProfileHeaderCompact
        onEditProfile={() => setIsEditModalOpen(true)}
        onShare={() => setIsShareModalOpen(true)}
        pendingRequestsCount={pendingRequestsCount}
        onViewRequests={() => setShowRequestsModal(true)}
      />

      <div className="max-w-4xl mx-auto p-3 sm:p-6">
        {/* Main Tabs - At the top now */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/5 sticky top-[88px] sm:top-[96px] z-30">
            <TabsTrigger value="posts" className="flex items-center gap-1 sm:gap-2">
              <Grid className="h-4 w-4" />
              <span className="hidden sm:inline">Posty</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center gap-1 sm:gap-2">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Znajomi</span>
            </TabsTrigger>
            <TabsTrigger value="inbox" className="flex items-center gap-1 sm:gap-2">
              <MessageCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Wiadomości</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-1 sm:gap-2">
              <Trophy className="h-4 w-4" />
              <span className="hidden sm:inline">Aktywność</span>
            </TabsTrigger>
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

          <TabsContent value="activity" className="mt-6">
            <ActivityTab />
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
      <NewFriendRequestsModal
        isOpen={showRequestsModal}
        onClose={() => setShowRequestsModal(false)}
        onFriendsUpdated={handleFriendsUpdated}
      />
    </div>
  );
};

export default Profile;