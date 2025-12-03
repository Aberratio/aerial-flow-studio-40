import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Grid, Users, Trophy } from 'lucide-react';
import { EditProfileModal } from '@/components/EditProfileModal';
import { ProfileHeaderCompact } from '@/components/Profile/ProfileHeaderCompact';
import { ContentTabs } from '@/components/Profile/ContentTabs';
import { ShareProfileModal } from '@/components/ShareProfileModal';
import { ActivityTab } from '@/components/Profile/ActivityTab';
import { NewFriendRequestsModal } from '@/components/NewFriendRequestsModal';
import { FriendInviteModal } from '@/components/FriendInviteModal';
import { ProfileCompletionCard } from '@/components/Profile/ProfileCompletionCard';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import Friends from './Friends';

const Profile = () => {
  const { user } = useAuth();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
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

      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Profile Completion Card - only shown if profile is incomplete */}
        <ProfileCompletionCard />

        {/* Main Tabs */}
        <Tabs defaultValue="posts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white/5 mb-4 sm:mb-6 h-auto p-1 rounded-xl">
            <TabsTrigger value="posts" className="flex items-center justify-center gap-2 py-2.5 rounded-lg">
              <Grid className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Posty</span>
            </TabsTrigger>
            <TabsTrigger value="friends" className="flex items-center justify-center gap-2 py-2.5 rounded-lg">
              <Users className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Znajomi</span>
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center justify-center gap-2 py-2.5 rounded-lg">
              <Trophy className="h-4 w-4" />
              <span className="text-xs sm:text-sm">Aktywność</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="posts" className="mt-0">
            <ContentTabs isOwnProfile={true} />
          </TabsContent>
          
          <TabsContent value="friends" className="mt-0">
            <Friends />
          </TabsContent>

          <TabsContent value="activity" className="mt-0">
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
      <FriendInviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onFriendAdded={handleFriendsUpdated}
      />
    </div>
  );
};

export default Profile;