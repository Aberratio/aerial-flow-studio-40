import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FriendInviteModal } from '@/components/FriendInviteModal';
import { NewFriendRequestsModal } from '@/components/NewFriendRequestsModal';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

const Friends = () => {
  const { user } = useAuth();
  const [showFriendInvite, setShowFriendInvite] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [friendToRemove, setFriendToRemove] = useState<string | null>(null);

  useEffect(() => {
    const fetchFriendsAndRequests = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      try {
        // Fetch friends from friendships table
        const { data: friendshipData, error: friendshipError } = await supabase
          .from('friendships')
          .select(`
            requester_id,
            addressee_id,
            requester:profiles!friendships_requester_id_fkey (
              id,
              username,
              avatar_url,
              bio
            ),
            addressee:profiles!friendships_addressee_id_fkey (
              id,
              username,
              avatar_url,
              bio
            )
          `)
          .eq('status', 'accepted')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

        if (friendshipError) {
          console.error('Error fetching friends:', friendshipError);
        } else {
          // Get the friend profiles (the other person in each friendship)
          const friendProfiles = friendshipData?.map(friendship => {
            const isRequester = friendship.requester_id === user.id;
            return isRequester ? friendship.addressee : friendship.requester;
          }).filter(Boolean) || [];

          const formattedFriends = friendProfiles.map(friend => ({
            id: friend?.id || '',
            username: friend?.username || '',
            avatar: friend?.avatar_url || null,
            bio: friend?.bio || 'Aerial enthusiast',
            mutualFriends: 0
          }));

          setFriends(formattedFriends);
        }

        // Fetch pending friend requests (friendships table)
        const { data: requestsData, error: requestsError } = await supabase
          .from('friendships')
          .select('id')
          .eq('addressee_id', user.id)
          .eq('status', 'pending');

        if (requestsError) {
          console.error('Error fetching requests:', requestsError);
        } else {
          setPendingRequestsCount(requestsData?.length || 0);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFriendsAndRequests();
  }, [user, refreshTrigger]);

  const handleUnfriend = async (friendId: string) => {
    if (!user) return;
    try {
      // Remove from friendships table
      const { error: friendshipError } = await supabase
        .from('friendships')
        .delete()
        .or(`and(requester_id.eq.${user.id},addressee_id.eq.${friendId}),and(requester_id.eq.${friendId},addressee_id.eq.${user.id})`)
        .eq('status', 'accepted');

      if (friendshipError) {
        console.error('Error removing friendship:', friendshipError);
        return;
      }

      // Also remove from user_follows table (both directions)
      await supabase.from('user_follows').delete().eq('follower_id', user.id).eq('following_id', friendId);
      await supabase.from('user_follows').delete().eq('follower_id', friendId).eq('following_id', user.id);

      setFriends(friends.filter(friend => friend.id !== friendId));
      setShowRemoveModal(false);
      setFriendToRemove(null);
    } catch (error) {
      console.error('Error unfriending:', error);
    }
  };

  const handleConfirmRemove = () => {
    if (friendToRemove) {
      handleUnfriend(friendToRemove);
    }
  };

  const handleFriendsUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Show loading only if we're actually fetching data
  if (isLoading && user) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Twoi znajomi</h2>
          <p className="text-muted-foreground text-sm">Połącz się ze społecznością sportowców</p>
        </div>
        <Button variant="primary" onClick={() => setShowFriendInvite(true)} size="sm">
          <UserPlus className="w-4 h-4 mr-2" />
          <span className="hidden sm:inline">Znajdź znajomych</span>
        </Button>
      </div>

      {/* Friends Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="glass-effect border-white/10">
          <CardContent className="p-4 text-center">
            <Users className="w-6 h-6 mx-auto mb-1 text-primary" />
            <h3 className="text-xl font-bold text-white">{friends.length}</h3>
            <p className="text-muted-foreground text-xs">Znajomi</p>
          </CardContent>
        </Card>
        <Card className="glass-effect border-white/10">
          <CardContent className="p-4 text-center">
            <Mail className="w-6 h-6 mx-auto mb-1 text-purple-500" />
            <h3 className="text-xl font-bold text-white">{pendingRequestsCount}</h3>
            <p className="text-muted-foreground text-xs">Zaproszenia</p>
          </CardContent>
        </Card>
      </div>

      {/* Friends List or Empty State */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Lista znajomych</CardTitle>
        </CardHeader>
        <CardContent>
          {friends.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                <Users className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Jeszcze brak znajomych</h3>
              <p className="text-muted-foreground mb-6 max-w-sm mx-auto px-4">Zacznij budować swoją społeczność sportową i dziel się postępami!</p>
              <Button variant="primary" onClick={() => setShowFriendInvite(true)}>
                <UserPlus className="w-5 h-5 mr-2" />
                Znajdź znajomych
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {friends.map(friend => (
                <div 
                  key={friend.id} 
                  className="flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer" 
                  onClick={() => window.location.href = `/profile/${friend.id}`}
                >
                  <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-white text-sm sm:text-base truncate">{friend.username}</h4>
                    <p className="text-muted-foreground text-xs sm:text-sm truncate">{friend.bio || 'Aerial enthusiast'}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-red-400 hover:text-red-300 hover:bg-red-400/10 flex-shrink-0" 
                    onClick={e => {
                      e.stopPropagation();
                      setFriendToRemove(friend.id);
                      setShowRemoveModal(true);
                    }}
                  >
                    <UserX className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <FriendInviteModal 
        isOpen={showFriendInvite} 
        onClose={() => setShowFriendInvite(false)} 
        onFriendAdded={handleFriendsUpdated} 
      />

      <NewFriendRequestsModal 
        isOpen={showFriendRequests} 
        onClose={() => setShowFriendRequests(false)} 
        onFriendsUpdated={handleFriendsUpdated} 
      />

      <ConfirmDeleteModal 
        isOpen={showRemoveModal} 
        onClose={() => {
          setShowRemoveModal(false);
          setFriendToRemove(null);
        }} 
        onConfirm={handleConfirmRemove} 
        title="Usuń znajomego" 
        description="Czy na pewno chcesz usunąć tego znajomego? Nie będziesz już widzieć ich treści przeznaczonych dla znajomych, a oni nie będą widzieć Twoich." 
      />
    </div>
  );
};

export default Friends;
