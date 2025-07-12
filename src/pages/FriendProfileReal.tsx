import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Users, UserPlus, Check, X, UserMinus, Share2, LogIn, UserPlus2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { ShareProfileModal } from '@/components/ShareProfileModal';
import { useProfilePreviewData } from '@/hooks/useProfilePreviewData';
import { useFollowCounts } from '@/hooks/useFollowCounts';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';
import { useMutualFriends } from '@/hooks/useMutualFriends';
import { supabase } from '@/integrations/supabase/client';
import { ProfilePreviewModal } from '@/components/ProfilePreviewModal';
import { FriendInviteModal } from '@/components/FriendInviteModal';

const FriendProfile = () => {
  const { user } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);
  const [publicPosts, setPublicPosts] = useState<any[]>([]);

  const { followersCount, followingCount } = useFollowCounts(id || '');
  const { mutualCount } = useMutualFriends(user?.id || '', id || '');
  const { 
    isFollowing, 
    sendFriendRequest, 
    acceptFriendRequest, 
    rejectFriendRequest,
    followUser,
    unfollowUser
  } = useFriendshipStatus(id || '');

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        // Fetch profile data
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) throw profileError;
        setProfileData(profile);

        // Fetch public posts
        const { data: posts, error: postsError } = await supabase
          .from('posts')
          .select(`
            *,
            profiles!posts_user_id_fkey (
              username,
              avatar_url
            )
          `)
          .eq('user_id', id)
          .eq('privacy', 'public')
          .order('created_at', { ascending: false })
          .limit(20);

        if (postsError) throw postsError;

        // Get likes and comments counts for each post
        const postsWithCounts = await Promise.all(
          (posts || []).map(async (post) => {
            const { count: likesCount } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            const { count: commentsCount } = await supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            return {
              id: post.id,
              content: post.content,
              image_url: post.image_url,
              video_url: post.video_url,
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              created_at: post.created_at,
              user: {
                username: post.profiles?.username || profile.username,
                avatar_url: post.profiles?.avatar_url || profile.avatar_url,
                verified: true
              }
            };
          })
        );

        setPublicPosts(postsWithCounts);
      } catch (error) {
        console.error('Error fetching profile data:', error);
        toast({
          title: "Error",
          description: "Failed to load profile data.",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [id]);

  const handleSendFriendRequest = async () => {
    const success = await sendFriendRequest();
    if (success) {
      toast({
        title: "Friend Request Sent",
        description: `Your friend request has been sent to ${profileData?.username}`
      });
    }
  };

  const handleAcceptFriend = async () => {
    const success = await acceptFriendRequest();
    if (success) {
      toast({
        title: "Friend Request Accepted",
        description: `You and ${profileData?.username} are now friends!`
      });
    }
  };

  const handleRejectFriend = async () => {
    const success = await rejectFriendRequest();
    if (success) {
      toast({
        title: "Friend Request Rejected",
        description: `You rejected ${profileData?.username}'s friend request.`
      });
    }
  };

  const handleFollow = async () => {
    const success = await followUser();
    if (success) {
      toast({
        title: "Now Following",
        description: `You are now following ${profileData?.username}.`
      });
    }
  };

  const handleUnfollow = async () => {
    const success = await unfollowUser();
    if (success) {
      toast({
        title: "Unfollowed",
        description: `You are no longer following ${profileData?.username}.`
      });
    }
  };

  // Show public content for non-logged users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-3 sm:p-6">
        <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
          {/* Public Profile View */}
          <Card className="glass-effect border-white/10">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
                {/* Avatar */}
                <div className="relative">
                  <Avatar className={`w-32 h-32 ${profileData?.role === 'trainer' ? 'ring-4 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-4 ring-offset-black' : ''}`}>
                    <AvatarImage src={profileData?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                      {profileData?.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </div>

                {/* Profile Info */}
                <div className="flex-1 text-center md:text-left">
                  <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                    <h1 className="text-3xl font-bold text-white">{profileData?.username}</h1>
                    <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 md:mt-0">
                      {profileData?.role === 'trainer' && (
                        <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold">
                          Trainer
                        </Badge>
                      )}
                    </div>
                  </div>

                  <p className="text-muted-foreground mb-6">{profileData?.bio}</p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="text-center">
                      <div className="gradient-text text-2xl font-bold">{publicPosts.length}</div>
                      <div className="text-muted-foreground text-sm">Posts</div>
                    </div>
                    <div className="text-center">
                      <div className="gradient-text text-2xl font-bold">{followersCount}</div>
                      <div className="text-muted-foreground text-sm">Followers</div>
                    </div>
                    <div className="text-center">
                      <div className="gradient-text text-2xl font-bold">{followingCount}</div>
                      <div className="text-muted-foreground text-sm">Following</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Sign Up Invitation */}
          <Card className="glass-effect border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
            <CardContent className="p-8 text-center">
              <UserPlus2 className="w-16 h-16 text-purple-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-4">Join Our Fitness Community!</h2>
              <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                Create your profile to connect with {profileData?.username} and thousands of other fitness enthusiasts. 
                Share your progress, get inspired, and achieve your goals together!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="primary" size="lg">
                  <Link to="/">
                    <UserPlus2 className="w-5 h-5 mr-2" />
                    Sign Up Now
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                  <Link to="/">
                    <LogIn className="w-5 h-5 mr-2" />
                    Already have an account?
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Public Posts */}
          {publicPosts.length > 0 && (
            <Card className="glass-effect border-white/10">
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold text-white mb-6">Public Posts</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {publicPosts.slice(0, 6).map((post) => (
                    <div key={post.id} className="relative group">
                      <div className="aspect-square rounded-lg overflow-hidden">
                        {post.image_url ? (
                          <img 
                            src={post.image_url} 
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                        ) : post.video_url ? (
                          <div className="relative w-full h-full">
                            <video 
                              src={post.video_url}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <MessageCircle className="w-8 h-8 text-white" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 flex flex-col items-center justify-center p-4">
                            <MessageCircle className="w-8 h-8 text-purple-400 mb-2" />
                            <p className="text-xs text-center text-white/70 leading-tight">
                              {post.content.length > 60 ? `${post.content.substring(0, 60)}...` : post.content}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {publicPosts.length > 6 && (
                  <div className="text-center mt-6">
                    <p className="text-muted-foreground">
                      Sign up to see more posts from {profileData?.username}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Profile Header */}
        <Card className="glass-effect border-white/10">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className={`w-32 h-32 ${profileData?.role === 'trainer' ? 'ring-4 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-4 ring-offset-black' : ''}`}>
                  <AvatarImage src={profileData?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                    {profileData?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-white">{profileData?.username}</h1>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 md:mt-0">
                    {profileData?.role === 'trainer' && (
                      <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold">
                        Trainer
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{profileData?.bio}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="gradient-text text-2xl font-bold">{publicPosts.length}</div>
                    <div className="text-muted-foreground text-sm">Posts</div>
                  </div>
                  <div className="text-center">
                    <div className="gradient-text text-2xl font-bold">{followersCount}</div>
                    <div className="text-muted-foreground text-sm">Followers</div>
                  </div>
                  <div className="text-center">
                    <div className="gradient-text text-2xl font-bold">{followingCount}</div>
                    <div className="text-muted-foreground text-sm">Following</div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleSendFriendRequest}
                    variant="primary"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                  {isFollowing ? (
                    <Button 
                      variant="outline" 
                      onClick={handleUnfollow}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <UserMinus className="w-4 h-4 mr-2" />
                      Unfollow
                    </Button>
                  ) : (
                    <Button 
                      variant="outline" 
                      onClick={handleFollow}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <UserPlus className="w-4 h-4 mr-2" />
                      Follow
                    </Button>
                  )}

                  {/* Share Button */}
                  <Button 
                    variant="outline" 
                    onClick={() => setIsShareModalOpen(true)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posts */}
        {publicPosts.length > 0 && (
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Posts</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {publicPosts.map((post) => (
                  <div 
                    key={post.id} 
                    className="relative group cursor-pointer"
                    onClick={() => navigate(`/post/${post.id}`)}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden">
                      {post.image_url ? (
                        <img 
                          src={post.image_url} 
                          alt="Post"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                        />
                      ) : post.video_url ? (
                        <div className="relative w-full h-full">
                          <video 
                            src={post.video_url}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                            <MessageCircle className="w-8 h-8 text-white" />
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 flex flex-col items-center justify-center p-4">
                          <MessageCircle className="w-8 h-8 text-purple-400 mb-2" />
                          <p className="text-xs text-center text-white/70 leading-tight">
                            {post.content.length > 60 ? `${post.content.substring(0, 60)}...` : post.content}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-6">
                      <div className="flex items-center text-white">
                        <Heart className="w-5 h-5 mr-2" />
                        {post.likes_count}
                      </div>
                      <div className="flex items-center text-white">
                        <MessageCircle className="w-5 h-5 mr-2" />
                        {post.comments_count}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modals */}
      <ShareProfileModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        profileId={id || ''}
        profileName={profileData?.username || ''}
      />
    </div>
  );
};

export default FriendProfile;