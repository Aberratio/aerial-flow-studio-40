
import React, { useState, useEffect } from 'react';
import { UserPlus, Mail, Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FriendInviteModal } from '@/components/FriendInviteModal';
import { FriendRequestsModal } from '@/components/FriendRequestsModal';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const Friends = () => {
  const { user } = useAuth();
  const [showFriendInvite, setShowFriendInvite] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);
  const [friends, setFriends] = useState<any[]>([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const fetchFriendsAndRequests = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        // Fetch friends (people the current user is following)
        const { data: friendsData, error: friendsError } = await supabase
          .from('user_follows')
          .select(`
            following_id,
            profiles!user_follows_following_id_fkey (
              id,
              username,
              avatar_url,
              bio
            )
          `)
          .eq('follower_id', user.id)
          .eq('status', 'accepted');

        if (friendsError) {
          console.error('Error fetching friends:', friendsError);
        } else {
          const formattedFriends = friendsData?.map(follow => ({
            id: follow.profiles.id,
            username: follow.profiles.username,
            avatar: follow.profiles.avatar_url,
            bio: follow.profiles.bio || 'Aerial enthusiast',
            mutualFriends: 0
          })) || [];
          setFriends(formattedFriends);
        }

        // Fetch pending requests (people who are following the current user)
        const { data: requestsData, error: requestsError } = await supabase
          .from('user_follows')
          .select('id')
          .eq('following_id', user.id)
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
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', friendId)
        .eq('status', 'accepted');

      if (error) {
        console.error('Error unfriending:', error);
        return;
      }

      setFriends(friends.filter(friend => friend.id !== friendId));
    } catch (error) {
      console.error('Error unfriending:', error);
    }
  };

  const handleFriendsUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  // Show loading only if we're actually fetching data
  if (isLoading && user) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
              <p className="text-muted-foreground">Connect with fellow aerial athletes</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowFriendRequests(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Mail className="w-5 h-5 mr-2" />
                Friend Requests
              </Button>
              <Button
                onClick={() => setShowFriendInvite(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Find Friends
              </Button>
            </div>
          </div>
        </div>

        {/* Friends Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-2xl font-bold text-white">{friends.length}</h3>
              <p className="text-muted-foreground">Total Friends</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h3 className="text-2xl font-bold text-white">{pendingRequestsCount}</h3>
              <p className="text-muted-foreground">Pending Requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Friends List or Empty State */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Your Friends</CardTitle>
          </CardHeader>
          <CardContent>
            {friends.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold text-white mb-2">No friends yet</h3>
                <p className="text-muted-foreground mb-6">Start building your aerial community by finding and connecting with other athletes</p>
                <Button
                  onClick={() => setShowFriendInvite(true)}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  <UserPlus className="w-5 h-5 mr-2" />
                  Find Friends
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friends.map((friend) => (
                  <div key={friend.id} className="flex items-center space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="relative">
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={friend.avatar} />
                        <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div className="flex-1">
                      <Link to={`/profile/${friend.id}`} className="cursor-pointer hover:text-primary transition-colors">
                        <h4 className="font-semibold text-white">{friend.username}</h4>
                      </Link>
                      <p className="text-muted-foreground text-sm">{friend.bio}</p>
                      <p className="text-muted-foreground text-xs">{friend.mutualFriends} mutual friends</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                        <Mail className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-400 hover:text-red-300"
                        onClick={() => handleUnfriend(friend.id)}
                      >
                        <UserX className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <FriendInviteModal
        isOpen={showFriendInvite}
        onClose={() => setShowFriendInvite(false)}
        onFriendAdded={handleFriendsUpdated}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
        onFriendsUpdated={handleFriendsUpdated}
      />
    </div>
  );
};

export default Friends;
