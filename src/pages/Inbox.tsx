import React, { useState } from 'react';
import { Heart, MessageCircle, Users, Trophy, Star, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

const Inbox = () => {
  const [filter, setFilter] = useState('all');

  const activities = [
    {
      id: 1,
      type: 'like',
      user: {
        username: 'sarah_aerial',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=100&h=100&fit=crop&crop=face'
      },
      content: 'liked your post "Perfect Caterpillar form! 🐛"',
      timeAgo: '2 minutes ago',
      isRead: false
    },
    {
      id: 2,
      type: 'comment',
      user: {
        username: 'mike_silk',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
      },
      content: 'commented: "Amazing progress! Your form is getting so much better 🔥"',
      timeAgo: '1 hour ago',
      isRead: false
    },
    {
      id: 3,
      type: 'follow',
      user: {
        username: 'luna_hoop',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face'
      },
      content: 'started following you',
      timeAgo: '3 hours ago',
      isRead: false
    },
    {
      id: 4,
      type: 'achievement',
      content: 'You earned the "Consistency Champion" badge! 🏆',
      timeAgo: '1 day ago',
      isRead: true
    },
    {
      id: 5,
      type: 'like',
      user: {
        username: 'alex_flow',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
      },
      content: 'liked your challenge completion "7-Day Flexibility Challenge"',
      timeAgo: '2 days ago',
      isRead: true
    },
    {
      id: 6,
      type: 'comment',
      user: {
        username: 'yoga_master',
        avatar: 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=100&h=100&fit=crop&crop=face'
      },
      content: 'commented: "Would love to see your tutorial on this move!"',
      timeAgo: '3 days ago',
      isRead: true
    }
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-5 h-5 text-pink-400" />;
      case 'comment':
        return <MessageCircle className="w-5 h-5 text-blue-400" />;
      case 'follow':
        return <Users className="w-5 h-5 text-green-400" />;
      case 'achievement':
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      default:
        return <Star className="w-5 h-5 text-purple-400" />;
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'unread') return !activity.isRead;
    if (filter === 'likes') return activity.type === 'like';
    if (filter === 'comments') return activity.type === 'comment';
    return true;
  });

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8">Inbox</h1>

        {/* Filter Tabs */}
        <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
          {[
            { id: 'all', label: 'All' },
            { id: 'unread', label: 'Unread' },
            { id: 'likes', label: 'Likes' },
            { id: 'comments', label: 'Comments' }
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={filter === tab.id ? "default" : "ghost"}
              className={`flex-1 ${
                filter === tab.id 
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500' 
                  : 'text-muted-foreground hover:text-white'
              }`}
              onClick={() => setFilter(tab.id)}
            >
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Activities List */}
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <Card key={activity.id} className={`glass-effect border-white/10 ${!activity.isRead ? 'border-purple-500/30' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="mt-1">
                    {getActivityIcon(activity.type)}
                  </div>

                  {/* Avatar (if user activity) */}
                  {activity.user && (
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={activity.user.avatar} />
                      <AvatarFallback>{activity.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  )}

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        {activity.user ? (
                          <p className="text-white">
                            <span className="font-semibold">{activity.user.username}</span>{' '}
                            <span className="text-muted-foreground">{activity.content}</span>
                          </p>
                        ) : (
                          <p className="text-white">{activity.content}</p>
                        )}
                        <div className="flex items-center space-x-2 mt-1">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground text-sm">{activity.timeAgo}</span>
                        </div>
                      </div>
                      
                      {!activity.isRead && (
                        <Badge className="bg-purple-500 text-white text-xs">New</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredActivities.length === 0 && (
          <div className="text-center py-12">
            <div className="text-muted-foreground text-lg">No activities found</div>
            <div className="text-muted-foreground text-sm">Check back later for updates!</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Inbox;