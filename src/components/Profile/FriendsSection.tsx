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
      const { data, error } = await supabase
        .from('user_follows')
        .select(`
          following_id,
          profiles!user_follows_following_id_fkey (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .eq('follower_id', user.id);

      if (error) throw error;

      const friendsData = data?.map(follow => ({
        id: follow.profiles?.id || '',
        username: follow.profiles?.username || '',
        avatar: follow.profiles?.avatar_url || null,
        level: follow.profiles?.role === 'trainer' ? 'Trainer' : 'Member',
        score: Math.floor(Math.random() * 5000) + 1000 // Mock score for now
      })) || [];

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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {friends.map((friend: any) => (
              <Link key={friend.id} to={`/profile/${friend.id}`} className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <Avatar className="w-16 h-16 mx-auto mb-3 hover:scale-110 transition-transform">
                  <AvatarImage src={friend.avatar || undefined} />
                  <AvatarFallback>{friend.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div className="text-white font-semibold text-sm">{friend.username}</div>
                <div className="text-muted-foreground text-xs">{friend.level}</div>
                <div className="text-purple-400 text-xs font-semibold mt-1">{friend.score.toLocaleString()} pts</div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};