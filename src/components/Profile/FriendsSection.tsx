import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface FriendsSectionProps {
  refreshTrigger?: number;
}

export const FriendsSection: React.FC<FriendsSectionProps> = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's friends from database
  const fetchFriends = async () => {
    if (!user) return;

    try {
      // Get accepted friendships where user is either requester or addressee
      const { data: friendships, error: friendshipsError } = await supabase
        .from('friendships')
        .select(`
          requester_id,
          addressee_id,
          requester:profiles!friendships_requester_id_fkey (
            id,
            username,
            avatar_url,
            role
          ),
          addressee:profiles!friendships_addressee_id_fkey (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      if (friendshipsError) throw friendshipsError;

      // Get the friend profiles (the other person in each friendship)
      const friendProfiles = friendships?.map(friendship => {
        const isRequester = friendship.requester_id === user.id;
        return isRequester ? friendship.addressee : friendship.requester;
      }).filter(Boolean) || [];

      const friendsData = friendProfiles.map(friend => ({
        id: friend?.id || '',
        username: friend?.username || '',
        avatar: friend?.avatar_url || null,
        level: friend?.role === 'trainer' ? 'Trainer' : 'Member'
      }));

      setFriends(friendsData);
    } catch (error) {
      console.error('Error fetching friends:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriends();
  }, [user, refreshTrigger]);

  return (
    <Card className="glass-effect border-white/10 mb-6">
      <CardContent className="p-6">
        <h2 className="text-xl font-bold text-white mb-4">Friends</h2>
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading friends...</div>
        ) : friends.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No friends yet!</p>
            <p className="text-sm mt-2">
              <Link to="/friends" className="text-purple-400 hover:text-purple-300">
                Find and connect with other aerial artists
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {friends.map((friend: any) => (
              <div key={friend.id} onClick={() => window.location.href = `/profile/${friend.id}`} className="flex sm:flex-col items-center sm:text-center p-3 sm:p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer space-x-3 sm:space-x-0">
                <Avatar className="w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0 sm:mx-auto sm:mb-3 hover:scale-110 transition-transform">
                  <AvatarImage src={friend.avatar || undefined} />
                  <AvatarFallback>{friend.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 sm:flex-none min-w-0">
                  <div className="text-white font-semibold text-sm truncate sm:text-center">{friend.username}</div>
                  <div className="text-muted-foreground text-xs sm:text-center">{friend.level}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};