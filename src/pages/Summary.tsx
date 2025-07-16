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
  Play,
  CheckCircle,
  Bookmark,
  AlertCircle
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
  const [exerciseOfTheDay, setExerciseOfTheDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const hasFullAccess = isPremium || isTrainer || isAdmin;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "expert":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "for_later":
        return <Bookmark className="w-4 h-4 text-blue-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  // Function to get a deterministic random exercise based on current date
  const getDeterministicRandomExercise = (exercises: any[]) => {
    if (!exercises || exercises.length === 0) return null;
    
    const today = new Date();
    const dateString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    // Create a simple hash from the date string
    let hash = 0;
    for (let i = 0; i < dateString.length; i++) {
      const char = dateString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use the hash to select an exercise
    const index = Math.abs(hash) % exercises.length;
    return exercises[index];
  };

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

      // Fetch progress for current user if logged in
      if (exercisesData) {
        const { data: progressData } = await supabase
          .from('figure_progress')
          .select('figure_id, status')
          .eq('user_id', user.id);

        const progressMap = new Map(
          progressData?.map((p) => [p.figure_id, p.status]) || []
        );
        
        const exercisesWithProgress = exercisesData.map((exercise) => ({
          ...exercise,
          progress_status: progressMap.get(exercise.id) || 'not_tried',
        }));
        
        // Select exercise of the day
        const exerciseOfDay = getDeterministicRandomExercise(exercisesWithProgress);
        setExerciseOfTheDay(exerciseOfDay);
        
        // Shuffle and take 6 random exercises
        const shuffled = exercisesWithProgress?.sort(() => 0.5 - Math.random()) || [];
        setFeaturedExercises(shuffled.slice(0, 6));
      }
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

        {/* Exercise of the Day */}
        {exerciseOfTheDay && (
          <Card className="glass-effect border-white/10 mb-8 overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                {/* Image Section */}
                <div className="relative h-64 lg:h-auto">
                  <img
                    src={
                      exerciseOfTheDay.image_url ||
                      "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=400&fit=crop"
                    }
                    alt={exerciseOfTheDay.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-purple-500/90 text-white border-none">
                      Exercise of the Day
                    </Badge>
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-6 lg:p-8 flex flex-col justify-center">
                  <div className="mb-4">
                    <h2 className="text-2xl lg:text-3xl font-bold text-white mb-2">
                      {exerciseOfTheDay.name}
                    </h2>
                    <div className="flex items-center gap-3 mb-3">
                      {exerciseOfTheDay.difficulty_level && (
                        <Badge
                          className={`text-xs ${getDifficultyColor(
                            exerciseOfTheDay.difficulty_level
                          )}`}
                        >
                          {exerciseOfTheDay.difficulty_level}
                        </Badge>
                      )}
                      <div className="flex items-center gap-2">
                        {getStatusIcon(exerciseOfTheDay.progress_status)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {exerciseOfTheDay.progress_status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-6 leading-relaxed">
                      Challenge yourself with today's featured exercise. Perfect for building strength and improving your aerial skills.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      variant="primary"
                      size="lg"
                      onClick={() => {
                        const isLocked = !hasFullAccess && exerciseOfTheDay.difficulty_level?.toLowerCase() !== 'beginner';
                        if (isLocked) {
                          setShowPricingModal(true);
                        } else {
                          window.location.href = `/exercise/${exerciseOfTheDay.id}`;
                        }
                      }}
                      className="flex-1"
                    >
                      {!hasFullAccess && exerciseOfTheDay.difficulty_level?.toLowerCase() !== 'beginner' ? (
                        <>
                          <Crown className="w-4 h-4 mr-2" />
                          Unlock Premium
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 mr-2" />
                          Start Exercise
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

                  const handleViewDetails = (e: React.MouseEvent) => {
                    e.stopPropagation();
                    
                    if (isLocked) {
                      setShowPricingModal(true);
                      return;
                    }
                    
                    window.location.href = `/exercise/${exercise.id}`;
                  };
                  
                  return (
                    <Card
                      key={exercise.id}
                      className={`glass-effect border-white/10 hover-lift group overflow-hidden cursor-pointer relative ${
                        isLocked ? 'opacity-75' : ''
                      }`}
                      onClick={handleClick}
                    >
                      <div className="relative overflow-hidden">
                        <div className="w-full h-56 md:h-64 lg:h-72 overflow-hidden">
                          <img
                            src={
                              exercise.image_url ||
                              "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=400&fit=crop"
                            }
                            alt={exercise.name}
                            className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${
                              isLocked ? 'filter grayscale' : ''
                            }`}
                          />
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:scale-110 transition-transform duration-300" />
                        
                        {isLocked && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/80 rounded-full p-3">
                              <Crown className="w-8 h-8 text-yellow-400" />
                            </div>
                          </div>
                        )}
                      </div>

                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-white text-lg">
                            {exercise.name}
                          </h3>
                          {exercise.difficulty_level && (
                            <Badge
                              className={`text-xs ${getDifficultyColor(
                                exercise.difficulty_level
                              )}`}
                            >
                              {exercise.difficulty_level}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center gap-2 mb-4">
                          {getStatusIcon(exercise.progress_status)}
                          <span className="text-sm text-muted-foreground capitalize">
                            {exercise.progress_status.replace('_', ' ')}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex flex-col space-y-1">
                          </div>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleViewDetails}
                            className={isLocked ? 'opacity-75' : ''}
                          >
                            {isLocked ? (
                              <>
                                <Crown className="w-4 h-4 mr-1" />
                                Premium
                              </>
                            ) : (
                              "View Details"
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
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