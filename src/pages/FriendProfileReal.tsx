import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, MessageCircle, Trophy, Heart, Grid, Users, Clock, Check, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PostPreviewModal } from '@/components/PostPreviewModal';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useFollowCounts } from '@/hooks/useFollowCounts';
import { useMutualFriends } from '@/hooks/useMutualFriends';
import { useUserAchievements } from '@/hooks/useUserAchievements';
const FriendProfile = () => {
  const {
    id
  } = useParams();
  const {
    user,
    refetchCounts
  } = useAuth();
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();
  const {
    toast
  } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [friendshipStatus, setFriendshipStatus] = useState('loading');
  const [friendData, setFriendData] = useState<any>(null);
  const [friendPosts, setFriendPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get friend's follow counts
  const {
    followersCount,
    followingCount
  } = useFollowCounts(id || '');

  // Get mutual friends
  const {
    mutualCount
  } = useMutualFriends(user?.id || '', id || '');

  // Get friend's achievements
  const {
    achievements
  } = useUserAchievements();

  // Fetch friend's profile data
  useEffect(() => {
    const fetchFriendData = async () => {
      if (!id || !user) return;
      try {
        setLoading(true);

        // Get friend's profile
        const {
          data: profile,
          error: profileError
        } = await supabase.from('profiles').select('*').eq('id', id).single();
        if (profileError) throw profileError;

        // Get user's score
        const {
          data: scoreData
        } = await supabase.from('user_scores').select('total_points').eq('user_id', id).single();

        // Check friendship status using the new friendships table
        const {
          data: friendshipData
        } = await supabase.from('friendships').select('status').or(`and(requester_id.eq.${user.id},addressee_id.eq.${id}),and(requester_id.eq.${id},addressee_id.eq.${user.id})`).maybeSingle();
        let status = 'not_friends';
        if (friendshipData) {
          status = friendshipData.status === 'accepted' ? 'friends' : 'pending';
        }

        // Get friend's posts (public and friends-only if they are friends)
        let postsQuery = supabase.from('posts').select(`
            *,
            profiles!posts_user_id_fkey (
              username,
              avatar_url
            )
          `).eq('user_id', id).order('created_at', {
          ascending: false
        }).limit(12);

        // If they are friends, include both public and friends-only posts
        if (status === 'friends') {
          postsQuery = postsQuery.in('privacy', ['public', 'friends']);
        } else {
          postsQuery = postsQuery.eq('privacy', 'public');
        }
        const {
          data: posts,
          error: postsError
        } = await postsQuery;
        if (postsError) throw postsError;

        // Get likes and comments counts for each post
        const postsWithCounts = await Promise.all((posts || []).map(async post => {
          const {
            count: likesCount
          } = await supabase.from('post_likes').select('*', {
            count: 'exact',
            head: true
          }).eq('post_id', post.id);
          const {
            count: commentsCount
          } = await supabase.from('post_comments').select('*', {
            count: 'exact',
            head: true
          }).eq('post_id', post.id);
          return {
            id: post.id,
            content: post.content,
            image: post.image_url,
            video: post.video_url,
            likes: likesCount || 0,
            comments: commentsCount || 0,
            timeAgo: new Date(post.created_at).toLocaleString(),
            user: {
              id: profile.id,
              username: profile.username,
              avatar: profile.avatar_url,
              verified: profile.role === 'trainer' || profile.role === 'admin'
            }
          };
        }));
        setFriendData({
          ...profile,
          score: scoreData?.total_points || 0,
          isVerified: profile.role === 'trainer' || profile.role === 'admin'
        });
        setFriendPosts(postsWithCounts);
        setFriendshipStatus(status);
      } catch (error) {
        console.error('Error fetching friend data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    fetchFriendData();
  }, [id, user]);
  const handleAddFriend = async () => {
    if (!user || !id) return;
    try {
      const {
        error
      } = await supabase.from('friendships').insert({
        requester_id: user.id,
        addressee_id: id,
        status: 'pending'
      });
      if (error) throw error;

      // Create activity notification for the recipient
      const {
        error: activityError
      } = await supabase.from('user_activities').insert({
        user_id: id,
        activity_type: 'friend_request',
        activity_data: {
          requester_id: user.id,
          requester_username: user.username
        },
        target_user_id: user.id,
        points_awarded: 0
      });
      if (activityError) {
        console.error('Error creating friend request activity:', activityError);
      }
      setFriendshipStatus('pending');
      toast({
        title: "Friend Request Sent",
        description: `Your friend request has been sent to ${friendData?.username}`
      });
    } catch (error) {
      console.error('Error sending friend request:', error);
      toast({
        title: "Error",
        description: "Failed to send friend request.",
        variant: "destructive"
      });
    }
  };
  const handleMessage = () => {
    toast({
      title: "Message Feature",
      description: "Direct messaging will be available soon!"
    });
  };
  const renderActionButton = () => {
    switch (friendshipStatus) {
      case 'not_friends':
        return <Button onClick={handleAddFriend} className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600">
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </Button>;
      case 'pending':
        return <Button disabled variant="outline" className="border-yellow-500/30 text-yellow-400">
            <Clock className="w-4 h-4 mr-2" />
            Request Sent
          </Button>;
      case 'friends':
        return <Button variant="outline" className="border-green-500/30 text-green-400">
            <Check className="w-4 h-4 mr-2" />
            Friends
          </Button>;
      default:
        return null;
    }
  };
  if (loading || !friendData) {
    return <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>;
  }
  const stats = [{
    label: 'Posts',
    value: friendPosts.length.toString()
  }, {
    label: 'Followers',
    value: followersCount.toLocaleString()
  }, {
    label: 'Following',
    value: followingCount.toLocaleString()
  }, {
    label: 'Score',
    value: friendData.score.toLocaleString()
  }];
  return <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 text-muted-foreground hover:text-white my-[32px]">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>

        {/* Profile Header */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-32 h-32">
                  <AvatarImage src={friendData.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                    {friendData.username[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-white">{friendData.username}</h1>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 md:mt-0">
                    {friendData.isVerified && <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                        Verified Athlete
                      </Badge>}
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">
                      {friendData.role === 'trainer' ? 'Trainer' : 'Member'}
                    </Badge>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{friendData.bio || 'Aerial enthusiast'}</p>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {stats.map((stat, index) => <div key={index} className="text-center">
                      <div className="gradient-text text-2xl font-bold">{stat.value}</div>
                      <div className="text-muted-foreground text-sm">{stat.label}</div>
                    </div>)}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {renderActionButton()}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Preview */}
        {achievements.length > 0 && <Card className="glass-effect border-white/10 mb-6">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-white">Achievements</h2>
                <div className="text-sm text-muted-foreground">
                  Total Score: <span className="gradient-text font-bold">{friendData.score.toLocaleString()} pts</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {achievements.slice(0, 4).map((achievement, index) => <div key={index} className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <div className="text-3xl mb-2">{achievement.icon}</div>
                    <div className="text-white font-semibold text-sm">{achievement.name}</div>
                    <div className="text-muted-foreground text-xs">{achievement.description}</div>
                    <div className="text-purple-400 text-xs font-semibold mt-1">+{achievement.points} pts</div>
                  </div>)}
              </div>
            </CardContent>
          </Card>}

        {/* Content Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          {[{
          id: 'posts',
          label: 'Posts',
          icon: Grid
        }, {
          id: 'achievements',
          label: 'All Achievements',
          icon: Trophy
        }].map(tab => {
          const Icon = tab.icon;
          return <Button key={tab.id} variant={activeTab === tab.id ? "default" : "ghost"} className={`flex-1 ${activeTab === tab.id ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500' : 'text-muted-foreground hover:text-white'}`} onClick={() => setActiveTab(tab.id)}>
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>;
        })}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'posts' && (friendPosts.length === 0 ? <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">No posts yet</div>
            </div> : <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {friendPosts.map((post: any) => <div key={post.id} className="relative group cursor-pointer" onClick={() => setSelectedPost(post)}>
                  <div className="aspect-square rounded-lg overflow-hidden">
                    {post.image ? <img src={post.image} alt="Friend post" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" /> : <div className="w-full h-full bg-white/5 flex items-center justify-center">
                        <MessageCircle className="w-8 h-8 text-muted-foreground" />
                      </div>}
                  </div>
                  
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-6">
                    <div className="flex items-center text-white">
                      <Heart className="w-5 h-5 mr-2" />
                      {post.likes}
                    </div>
                    <div className="flex items-center text-white">
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {post.comments}
                    </div>
                  </div>
                </div>)}
            </div>)}

        {activeTab === 'achievements' && (achievements.length === 0 ? <div className="text-center py-12">
              <div className="text-muted-foreground text-lg">No achievements yet</div>
            </div> : <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {achievements.map((achievement, index) => <div key={index} className="text-center p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <div className="text-white font-semibold mb-2">{achievement.name}</div>
                  <div className="text-muted-foreground text-sm mb-3">{achievement.description}</div>
                  <div className="text-purple-400 font-bold text-lg">+{achievement.points} pts</div>
                </div>)}
            </div>)}
      </div>

      <PostPreviewModal post={selectedPost} isOpen={!!selectedPost} onClose={() => setSelectedPost(null)} />
    </div>;
};
export default FriendProfile;