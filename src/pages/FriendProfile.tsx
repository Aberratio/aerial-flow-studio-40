import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { ArrowLeft, UserPlus, MessageCircle, Trophy, Heart, Grid, Bookmark, Share2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { PostPreviewModal } from '@/components/PostPreviewModal';

const FriendProfile = () => {
  const { id } = useParams();
  const [selectedPost, setSelectedPost] = useState(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('posts');
  const [friendshipStatus, setFriendshipStatus] = useState('not_friends'); // 'not_friends', 'pending', 'friends'

  // Mock user data - in real app this would come from API
  const friendData = {
    id: id,
    username: 'sarah_aerial',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=150&h=150&fit=crop&crop=face',
    bio: 'Aerial silk instructor and performer. Teaching the art of flying since 2018 ✨',
    followersCount: 1234,
    followingCount: 567,
    level: 'Advanced',
    isVerified: true
  };

  const friendPosts = [
    {
      id: 1,
      user: {
        id: friendData.id,
        username: friendData.username,
        avatar: friendData.avatar,
        verified: friendData.isVerified
      },
      content: 'Beautiful aerial silk routine today! Feeling grateful for this art form ✨',
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=600&fit=crop',
      likes: 127,
      comments: 23,
      timeAgo: '2h ago',
      isLiked: false
    },
    {
      id: 2,
      user: {
        id: friendData.id,
        username: friendData.username,
        avatar: friendData.avatar,
        verified: friendData.isVerified
      },
      content: 'Working on my drops today. Practice makes perfect! 💪',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop',
      likes: 89,
      comments: 15,
      timeAgo: '1d ago',
      isLiked: true
    },
    {
      id: 3,
      user: {
        id: friendData.id,
        username: friendData.username,
        avatar: friendData.avatar,
        verified: friendData.isVerified
      },
      content: 'Flexibility training session complete! 🧘‍♀️',
      image: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=600&h=600&fit=crop',
      likes: 203,
      comments: 31,
      timeAgo: '2d ago',
      isLiked: false
    },
    {
      id: 4,
      user: {
        id: friendData.id,
        username: friendData.username,
        avatar: friendData.avatar,
        verified: friendData.isVerified
      },
      content: 'New choreo coming together nicely! Can\'t wait to share the full routine',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=600&fit=crop',
      likes: 156,
      comments: 42,
      timeAgo: '3d ago',
      isLiked: true
    }
  ];

  const achievements = [
    { name: 'Flexibility Master', icon: '🤸', description: 'Completed flexibility challenge', points: 500 },
    { name: 'Community Star', icon: '⭐', description: '100+ likes on a single post', points: 250 },
    { name: 'Perfect Form', icon: '✨', description: 'Excellent technique rating', points: 200 },
    { name: 'Challenge Champion', icon: '🏆', description: 'Completed 5 challenges', points: 750 }
  ];

  const stats = [
    { label: 'Posts', value: '89' },
    { label: 'Followers', value: friendData.followersCount.toLocaleString() },
    { label: 'Following', value: friendData.followingCount.toLocaleString() }
  ];

  const handleAddFriend = () => {
    setFriendshipStatus('pending');
    toast({
      title: "Friend Request Sent",
      description: `Your friend request has been sent to ${friendData.username}`,
    });
  };

  const handleMessage = () => {
    toast({
      title: "Message Feature",
      description: "Direct messaging will be available soon!",
    });
  };

  const renderActionButton = () => {
    switch (friendshipStatus) {
      case 'not_friends':
        return (
          <Button 
            onClick={handleAddFriend}
            className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Add Friend
          </Button>
        );
      case 'pending':
        return (
          <Button 
            disabled
            variant="outline"
            className="border-yellow-500/30 text-yellow-400"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Request Sent
          </Button>
        );
      case 'friends':
        return (
          <Button 
            variant="outline"
            className="border-green-500/30 text-green-400"
          >
            <Trophy className="w-4 h-4 mr-2" />
            Friends
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-muted-foreground hover:text-white"
        >
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
                  <AvatarImage src={friendData.avatar} />
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
                    <Badge className="bg-gradient-to-r from-blue-500 to-cyan-500">
                      {friendData.level}
                    </Badge>
                  </div>
                </div>

                <p className="text-muted-foreground mb-6">{friendData.bio}</p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {stats.map((stat, index) => (
                    <div key={index} className="text-center">
                      <div className="gradient-text text-2xl font-bold">{stat.value}</div>
                      <div className="text-muted-foreground text-sm">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  {renderActionButton()}
                  <Button 
                    variant="outline" 
                    onClick={handleMessage}
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Message
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Achievements Preview */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Achievements</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {achievements.map((achievement, index) => (
                <div key={index} className="text-center p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="text-3xl mb-2">{achievement.icon}</div>
                  <div className="text-white font-semibold text-sm">{achievement.name}</div>
                  <div className="text-muted-foreground text-xs">{achievement.description}</div>
                  <div className="text-purple-400 text-xs font-semibold mt-1">+{achievement.points} pts</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          {[
            { id: 'posts', label: 'Posts', icon: Grid },
            { id: 'achievements', label: 'All Achievements', icon: Trophy }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <Button
                key={tab.id}
                variant="ghost"
                className={`flex-1 transition-all ${
                  activeTab === tab.id 
                    ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' 
                    : 'text-muted-foreground hover:text-white hover:bg-white/5'
                } ${activeTab === tab.id ? 'hover:bg-gradient-to-r hover:from-purple-500/20 hover:via-pink-500/20 hover:to-blue-500/20' : ''}`}
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
            {friendPosts.map((post) => (
              <div 
                key={post.id} 
                className="relative group cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <div className="aspect-square rounded-lg overflow-hidden">
                  <img 
                    src={post.image} 
                    alt="Friend post"
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
      </div>

      <PostPreviewModal 
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
      />
    </div>
  );
};

export default FriendProfile;