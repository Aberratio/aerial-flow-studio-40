
import React, { useState } from 'react';
import { Camera, Settings, Heart, MessageCircle, Grid, Bookmark } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileModal } from '@/components/EditProfileModal';
import { SettingsModal } from '@/components/SettingsModal';

const Profile = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('posts');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  const stats = [
    { label: 'Posts', value: '127' },
    { label: 'Followers', value: user?.followersCount.toLocaleString() || '0' },
    { label: 'Following', value: user?.followingCount.toLocaleString() || '0' },
    { label: 'Score', value: '2,450' }
  ];

  const userPosts = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=300&h=300&fit=crop',
      likes: 127,
      comments: 23
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
      likes: 89,
      comments: 15
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=300&h=300&fit=crop',
      likes: 203,
      comments: 31
    },
    {
      id: 4,
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=300&h=300&fit=crop',
      likes: 156,
      comments: 42
    },
    {
      id: 5,
      image: 'https://images.unsplash.com/photo-1594736797933-d0d8e3b82d9a?w=300&h=300&fit=crop',
      likes: 178,
      comments: 28
    },
    {
      id: 6,
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=300&h=300&fit=crop',
      likes: 134,
      comments: 19
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
                <Avatar className="w-32 h-32">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                    {user?.username?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <Button
                  size="sm"
                  className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              {/* Profile Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
                  <h1 className="text-3xl font-bold text-white">{user?.username}</h1>
                  <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 md:mt-0">
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                      Verified Athlete
                    </Badge>
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
                  <div key={figure.id} className="flex-shrink-0 w-32">
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
                  <div key={figure.id} className="flex-shrink-0 w-32">
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
                  <div key={figure.id} className="flex-shrink-0 w-32">
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
                <div key={friend.id} className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                  <Avatar className="w-16 h-16 mx-auto mb-3">
                    <AvatarImage src={friend.avatar} />
                    <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="text-white font-semibold text-sm">{friend.username}</div>
                  <div className="text-muted-foreground text-xs">{friend.level}</div>
                  <div className="text-purple-400 text-xs font-semibold mt-1">{friend.score.toLocaleString()} pts</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          {[
            { id: 'posts', label: 'Posts', icon: Grid },
            { id: 'achievements', label: 'All Achievements', icon: Badge },
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
              <div key={post.id} className="relative group cursor-pointer">
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
              <div key={post.id} className="relative group cursor-pointer">
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
    </div>
  );
};

export default Profile;
