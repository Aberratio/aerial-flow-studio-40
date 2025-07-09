import React, { useState } from 'react';
import { Camera, Settings, Heart, MessageCircle, Grid, Bookmark, Award } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileModal } from '@/components/EditProfileModal';
import { SettingsModal } from '@/components/SettingsModal';
import { FigurePreviewModal } from '@/components/FigurePreviewModal';
import { PostPreviewModal } from '@/components/PostPreviewModal';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Profile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState(null);
  const [isFigureModalOpen, setIsFigureModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    console.log('Starting avatar upload...', file);
    
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });

      if (uploadError) {
        console.error('Error uploading avatar:', uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      const avatarUrl = data.publicUrl;
      console.log('Avatar uploaded successfully:', avatarUrl);

      // Update profile in database
      const { error } = await supabase
        .from('profiles')
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (error) {
        console.error('Database update error:', error);
        throw error;
      }

      console.log('Profile avatar updated successfully!');
      
      toast({
        title: "Profile Photo Updated",
        description: "Your profile photo has been successfully updated.",
      });

      // Refresh the page to show the new avatar
      window.location.reload();
    } catch (error: any) {
      console.error('Avatar upload error:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo",
        variant: "destructive"
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const stats = [
    { label: 'Posts', value: '127' },
    { label: 'Followers', value: user?.followersCount.toLocaleString() || '0' },
    { label: 'Following', value: user?.followingCount.toLocaleString() || '0' },
    { label: 'Score', value: '2,450' }
  ];

  const userPosts = [
    {
      id: 1,
      user: {
        username: user?.username || 'you',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: true
      },
      content: 'Just nailed my first perfect silk drop! The feeling of flying through the air is indescribable. Hours of practice finally paid off! 🌟',
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=300&h=300&fit=crop',
      likes: 127,
      comments: 23,
      timeAgo: '2h ago',
      isLiked: false
    },
    {
      id: 2,
      user: {
        username: user?.username || 'you',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: true
      },
      content: 'Morning training session complete! Working on my strength building routine. Every day gets a little easier 💪',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
      likes: 89,
      comments: 15,
      timeAgo: '1d ago',
      isLiked: true
    },
    {
      id: 3,
      user: {
        username: user?.username || 'you',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: true
      },
      content: 'Flexibility training is paying off! Finally achieved this pose I\'ve been working towards for months 🧘‍♀️',
      image: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=300&h=300&fit=crop',
      likes: 203,
      comments: 31,
      timeAgo: '3d ago',
      isLiked: false
    },
    {
      id: 4,
      user: {
        username: user?.username || 'you',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: true
      },
      content: 'Beautiful evening session with the golden hour lighting. These moments make all the hard work worth it ✨',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=300&fit=crop',
      likes: 156,
      comments: 42,
      timeAgo: '5d ago',
      isLiked: true
    },
    {
      id: 5,
      user: {
        username: user?.username || 'you',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: true
      },
      content: 'Progress check! Comparing today\'s form to where I started. The journey is just as important as the destination 🌱',
      image: 'https://images.unsplash.com/photo-1594736797933-d0d8e3b82d9a?w=300&h=300&fit=crop',
      likes: 178,
      comments: 28,
      timeAgo: '1w ago',
      isLiked: false
    },
    {
      id: 6,
      user: {
        username: user?.username || 'you',
        avatar: user?.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        verified: true
      },
      content: 'First time attempting this advanced sequence. Not perfect yet, but getting closer every day! 🔥',
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=300&h=300&fit=crop',
      likes: 134,
      comments: 19,
      timeAgo: '1w ago',
      isLiked: true
    }
  ];

  const achievements = [
    { name: 'First Post', icon: '🎉', description: 'Shared your first aerial moment', points: 100 },
    { name: 'Flexibility Master', icon: '🤸', description: 'Completed flexibility challenge', points: 500 },
    { name: 'Community Star', icon: '⭐', description: '100+ likes on a single post', points: 250 },
    { name: 'Consistent Trainer', icon: '💪', description: '7-day training streak', points: 350 },
    { name: 'Perfect Form', icon: '✨', description: 'Excellent technique rating', points: 200 },
    { name: 'Challenge Champion', icon: '🏆', description: 'Completed 5 challenges', points: 750 },
    { name: 'Social Butterfly', icon: '🦋', description: 'Helped 10 community members', points: 300 },
    { name: 'Dedication', icon: '🔥', description: '30-day training streak', points: 1000 }
  ];

  const figureJourney = {
    completed: [
      { id: 1, name: 'Basic Silk Climb', image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=150&h=150&fit=crop', difficulty: 'Beginner' },
      { id: 2, name: 'Foot Lock', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop', difficulty: 'Beginner' },
      { id: 3, name: 'Straddle Up', image: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=150&h=150&fit=crop', difficulty: 'Intermediate' }
    ],
    inProgress: [
      { id: 4, name: 'Caterpillar', image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=150&h=150&fit=crop', difficulty: 'Intermediate', progress: 60 },
      { id: 5, name: 'Scorpion', image: 'https://images.unsplash.com/photo-1594736797933-d0d8e3b82d9a?w=150&h=150&fit=crop', difficulty: 'Advanced', progress: 30 }
    ],
    savedForLater: [
      { id: 6, name: 'Angel Drop', image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=150&h=150&fit=crop', difficulty: 'Advanced' },
      { id: 7, name: 'Belay', image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=150&h=150&fit=crop', difficulty: 'Expert' }
    ]
  };

  const friends = [
    { id: 1, username: 'sarah_aerial', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=100&h=100&fit=crop&crop=face', level: 'Advanced', score: 3200 },
    { id: 2, username: 'mike_silk', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face', level: 'Expert', score: 4500 },
    { id: 3, username: 'luna_hoop', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', level: 'Intermediate', score: 2100 },
    { id: 4, username: 'alex_flow', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face', level: 'Advanced', score: 2800 }
  ];

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className={`w-32 h-32 ${user?.role === 'trainer' ? 'ring-4 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-4 ring-offset-black' : ''}`}>
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                    {user?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload">
                  <Button
                    size="sm"
                    disabled={isUploadingAvatar}
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 cursor-pointer"
                    asChild
                  >
                    <span>
                      {isUploadingAvatar ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-4 h-4" />
                      )}
                    </span>
                  </Button>
                </label>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-white">{user?.username}</h1>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 md:mt-0">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                      Verified Athlete
                    </Badge>
                    {user?.role && (
                      <Badge 
                        className={
                          user.role === 'trainer' 
                            ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold" 
                            : user.role === 'premium'
                            ? "bg-gradient-to-r from-purple-400 to-pink-400 text-white"
                            : "bg-white/10 text-white"
                        }
                      >
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </Badge>
                    )}
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{user?.bio}</p>

                {/* Stats */}
                <div className="grid grid-cols-4 gap-4 mb-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="gradient-text text-2xl font-bold">{stat.value}</div>
                      <div className="text-muted-foreground text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <Button 
                    onClick={() => setIsEditModalOpen(true)}
                    className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
                  >
                    Edit Profile
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsSettingsModalOpen(true)}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Recent Achievements</h2>
              <div className="text-sm text-muted-foreground">
                Total Score: <span className="gradient-text font-bold">2,450 pts</span>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.slice(0, 4).map((achievement, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className="text-white font-semibold text-sm">{achievement.name}</div>
                  <div className="text-muted-foreground text-xs">{achievement.description}</div>
                  <div className="text-purple-400 text-xs font-semibold mt-1">+{achievement.points} pts</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* My Library */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">My Figure Journey</h2>
            
            {/* Completed */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <span className="text-green-400 mr-2">✅</span>
                Completed ({figureJourney.completed.length})
              </h3>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {figureJourney.completed.map((figure) => (
                  <div 
                    key={figure.id} 
                    className="flex-shrink-0 w-32 cursor-pointer hover:transform hover:scale-105 transition-transform"
                    onClick={() => {
                      setSelectedFigure(figure);
                      setIsFigureModalOpen(true);
                    }}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2">
                      <img src={figure.image} alt={figure.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="text-white text-sm font-medium">{figure.name}</div>
                    <div className="text-muted-foreground text-xs">{figure.difficulty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* In Progress */}
            <div className="mb-6">
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <span className="text-yellow-400 mr-2">⏳</span>
                In Progress ({figureJourney.inProgress.length})
              </h3>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {figureJourney.inProgress.map((figure) => (
                  <div 
                    key={figure.id} 
                    className="flex-shrink-0 w-32 cursor-pointer hover:transform hover:scale-105 transition-transform"
                    onClick={() => {
                      setSelectedFigure(figure);
                      setIsFigureModalOpen(true);
                    }}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2 relative">
                      <img src={figure.image} alt={figure.name} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-lg font-bold">{figure.progress}%</div>
                      </div>
                    </div>
                    <div className="text-white text-sm font-medium">{figure.name}</div>
                    <div className="text-muted-foreground text-xs">{figure.difficulty}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Saved for Later */}
            <div>
              <h3 className="text-white font-semibold mb-3 flex items-center">
                <span className="text-blue-400 mr-2">🔖</span>
                Saved for Later ({figureJourney.savedForLater.length})
              </h3>
              <div className="flex space-x-3 overflow-x-auto pb-2">
                {figureJourney.savedForLater.map((figure) => (
                  <div 
                    key={figure.id} 
                    className="flex-shrink-0 w-32 cursor-pointer hover:transform hover:scale-105 transition-transform"
                    onClick={() => {
                      setSelectedFigure(figure);
                      setIsFigureModalOpen(true);
                    }}
                  >
                    <div className="aspect-square rounded-lg overflow-hidden mb-2">
                      <img src={figure.image} alt={figure.name} className="w-full h-full object-cover opacity-70" />
                    </div>
                    <div className="text-white text-sm font-medium">{figure.name}</div>
                    <div className="text-muted-foreground text-xs">{figure.difficulty}</div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Friends Overview */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-bold text-white mb-4">Friends</h2>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
               {friends.map((friend) => (
                 <Link key={friend.id} to={`/profile/${friend.id}`} className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                   <Avatar className="w-16 h-16 mx-auto mb-3 hover:scale-110 transition-transform">
                     <AvatarImage src={friend.avatar} />
                     <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                   </Avatar>
                   <div className="text-white font-semibold text-sm">{friend.username}</div>
                   <div className="text-muted-foreground text-xs">{friend.level}</div>
                   <div className="text-purple-400 text-xs font-semibold mt-1">{friend.score.toLocaleString()} pts</div>
                 </Link>
               ))}
             </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          {[
            { id: 'posts', label: 'Posts', icon: Grid },
            { id: 'achievements', label: 'All Achievements', icon: Award },
            { id: 'saved', label: 'Saved', icon: Bookmark }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "default" : "ghost"}
                className={`flex-1 ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500' 
                    : 'text-muted-foreground hover:text-white'
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.label}
              </Button>
            );
          })}
        </div>

        {/* Content based on active tab */}
        {activeTab === 'posts' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userPosts.map((post) => (
              <div 
                key={post.id} 
                className="relative group cursor-pointer"
                onClick={() => {
                  setSelectedPost(post);
                  setIsPostModalOpen(true);
                }}
              >
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={post.image} 
                    alt="User post"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
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
              </div>
            ))}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="text-4xl mb-3">{achievement.icon}</div>
                <div className="text-white font-semibold mb-2">{achievement.name}</div>
                <div className="text-muted-foreground text-sm mb-3">{achievement.description}</div>
                <div className="text-purple-400 font-bold text-lg">+{achievement.points} pts</div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'saved' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userPosts.slice(0, 3).map((post) => (
              <div 
                key={post.id} 
                className="relative group cursor-pointer"
                onClick={() => {
                  setSelectedPost(post);
                  setIsPostModalOpen(true);
                }}
              >
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={post.image} 
                    alt="Saved post"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                  />
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
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditProfileModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
      />
      <SettingsModal 
        isOpen={isSettingsModalOpen} 
        onClose={() => setIsSettingsModalOpen(false)} 
      />
      <FigurePreviewModal 
        figure={selectedFigure} 
        isOpen={isFigureModalOpen} 
        onClose={() => setIsFigureModalOpen(false)} 
      />
      <PostPreviewModal 
        post={selectedPost} 
        isOpen={isPostModalOpen} 
        onClose={() => setIsPostModalOpen(false)} 
      />
    </div>
  );
};

export default Profile;
