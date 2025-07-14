import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Users, 
  BookOpen, 
  Trophy, 
  Dumbbell, 
  ArrowRight, 
  Heart, 
  MessageCircle,
  UserPlus,
  Crown,
  Play
} from 'lucide-react';
import { PricingModal } from '@/components/PricingModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useUserRole } from '@/hooks/useUserRole';

const Summary = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { isPremium, isTrainer, isAdmin } = useUserRole();
  const [suggestedFriends, setSuggestedFriends] = useState<any[]>([]);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);
  const [featuredExercises, setFeaturedExercises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const hasFullAccess = isPremium || isTrainer || isAdmin;

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Fetch suggested friends (users not already friends with)
      const { data: friendsData } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .neq('id', user.id)
        .limit(3);

      // Filter out existing friends
      if (friendsData) {
        const { data: existingFriends } = await supabase
          .from('friendships')
          .select('requester_id, addressee_id')
          .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

        const friendIds = new Set(
          existingFriends?.flatMap(f => [f.requester_id, f.addressee_id]).filter(id => id !== user.id) || []
        );

        const suggestedUsers = friendsData.filter(u => !friendIds.has(u.id));
        setSuggestedFriends(suggestedUsers.slice(0, 3));
      }

      // Fetch recent public posts from other users
      const { data: postsData } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          created_at,
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url
          ),
          post_likes(count)
        `)
        .eq('privacy', 'public')
        .neq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      setRecentPosts(postsData || []);

      // Fetch random featured exercises 
      const { data: exercisesData } = await supabase
        .from('figures')
        .select('id, name, description, image_url, difficulty_level, category')
        .order('created_at', { ascending: false })
        .limit(20);

      // Shuffle and take 6 random exercises
      const shuffled = exercisesData?.sort(() => 0.5 - Math.random()) || [];
      setFeaturedExercises(shuffled.slice(0, 6));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard content',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .insert({
          requester_id: user?.id,
          addressee_id: userId,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Friend request sent successfully!'
      });

      // Remove from suggested friends
      setSuggestedFriends(prev => prev.filter(friend => friend.id !== userId));
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send friend request',
        variant: 'destructive'
      });
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expert':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user?.username}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening in your aerial journey today
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/friends">
            <Card className="glass-effect border-white/10 hover-lift group cursor-pointer">
              <CardContent className="p-6 text-center">
                <Users className="w-8 h-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-white mb-1">Friends</h3>
                <p className="text-muted-foreground text-sm">Connect with others</p>
              </CardContent>
            </Card>
          </Link>

          <Link to="/library">
            <Card className="glass-effect border-white/10 hover-lift group cursor-pointer">
              <CardContent className="p-6 text-center">
                <BookOpen className="w-8 h-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-white mb-1">Library</h3>
                <p className="text-muted-foreground text-sm">Explore exercises</p>
              </CardContent>
            </Card>
          </Link>

          <Card 
            className="glass-effect border-white/10 hover-lift group cursor-pointer relative"
            onClick={() => hasFullAccess ? window.location.href = '/challenges' : setShowPricingModal(true)}
          >
            <CardContent className="p-6 text-center">
              <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white mb-1">Challenges</h3>
              <p className="text-muted-foreground text-sm">Join competitions</p>
              {!hasFullAccess && (
                <Crown className="w-5 h-5 text-yellow-400 absolute top-4 right-4" />
              )}
            </CardContent>
          </Card>

          <Card 
            className="glass-effect border-white/10 hover-lift group cursor-pointer relative"
            onClick={() => hasFullAccess ? window.location.href = '/training' : setShowPricingModal(true)}
          >
            <CardContent className="p-6 text-center">
              <Dumbbell className="w-8 h-8 text-green-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <h3 className="font-semibold text-white mb-1">Training</h3>
              <p className="text-muted-foreground text-sm">Your sessions</p>
              {!hasFullAccess && (
                <Crown className="w-5 h-5 text-yellow-400 absolute top-4 right-4" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Suggested Friends */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <UserPlus className="w-5 h-5 mr-2" />
                Find New Friends
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {suggestedFriends.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No new friends to suggest right now
                </p>
              ) : (
                suggestedFriends.map((friend) => (
                  <div key={friend.id} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={friend.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500">
                          {friend.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-white font-medium text-sm">{friend.username}</p>
                        <p className="text-muted-foreground text-xs truncate max-w-24">
                          {friend.bio || 'Aerial enthusiast'}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendFriendRequest(friend.id)}
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      <UserPlus className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              )}
              <Link to="/friends">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-white">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Recent Community Posts */}
          <Card className="glass-effect border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <MessageCircle className="w-5 h-5 mr-2" />
                Community Posts
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-96 overflow-y-auto">
              {recentPosts.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No recent posts to show
                </p>
              ) : (
                recentPosts.map((post) => (
                  <Link key={post.id} to={`/post/${post.id}`}>
                    <div className="p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center space-x-2 mb-2">
                        <Avatar className="w-6 h-6">
                          <AvatarImage src={post.profiles?.avatar_url} />
                          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-xs">
                            {post.profiles?.username?.[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-white text-sm font-medium">
                          {post.profiles?.username}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm line-clamp-2">
                        {post.content}
                      </p>
                      {post.image_url && (
                        <img 
                          src={post.image_url} 
                          alt="Post image" 
                          className="w-full h-24 object-cover rounded mt-2"
                        />
                      )}
                    </div>
                  </Link>
                ))
              )}
              <Link to="/feed">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-white">
                  View Feed
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Featured Exercises - Full Width Section */}
        <Card className="glass-effect border-white/10 mt-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Featured Exercises
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {featuredExercises.length === 0 ? (
                <p className="text-muted-foreground text-center py-4 col-span-full">
                  No exercises available
                </p>
              ) : (
                featuredExercises.map((exercise) => {
                  const isLocked = !hasFullAccess && exercise.difficulty_level?.toLowerCase() !== 'beginner';
                  
                  const handleClick = () => {
                    if (isLocked) {
                      setShowPricingModal(true);
                    } else {
                      window.location.href = `/exercise/${exercise.id}`;
                    }
                  };
                  
                  return (
                    <div 
                      key={exercise.id} 
                      className={`p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer relative ${isLocked ? 'opacity-75' : ''}`}
                      onClick={handleClick}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-white font-medium text-sm">{exercise.name}</h4>
                        {isLocked && <Crown className="w-4 h-4 text-yellow-400" />}
                      </div>
                      {exercise.difficulty_level && (
                        <Badge className={`text-xs ${getDifficultyColor(exercise.difficulty_level)} mb-2`}>
                          {exercise.difficulty_level}
                        </Badge>
                      )}
                      <p className="text-muted-foreground text-xs line-clamp-2 mb-3">
                        {exercise.description || 'No description available'}
                      </p>
                      {exercise.image_url && (
                        <img 
                          src={exercise.image_url} 
                          alt={exercise.name}
                          className={`w-full h-32 object-cover rounded ${isLocked ? 'filter grayscale' : ''}`}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
            <div className="mt-6">
              <Link to="/library">
                <Button variant="ghost" className="w-full text-muted-foreground hover:text-white">
                  View Full Library
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      <PricingModal 
        isOpen={showPricingModal} 
        onClose={() => setShowPricingModal(false)}
        onUpgrade={() => setShowPricingModal(false)}
      />
    </div>
  );
};

export default Summary;