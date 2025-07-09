import React, { useState } from 'react';
import { UserPlus, Mail, Users, UserCheck, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FriendInviteModal } from '@/components/FriendInviteModal';
import { FriendRequestsModal } from '@/components/FriendRequestsModal';
import { Link } from 'react-router-dom';

const Friends = () => {
  const [showFriendInvite, setShowFriendInvite] = useState(false);
  const [showFriendRequests, setShowFriendRequests] = useState(false);

  // Mock friends data
  const [friends] = useState([
    {
      id: 1,
      username: 'aerial_grace',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=150&h=150&fit=crop&crop=face',
      bio: 'Aerial hoop enthusiast',
      mutualFriends: 12,
      isOnline: true
    },
    {
      id: 2,
      username: 'silk_master',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      bio: 'Aerial silk instructor',
      mutualFriends: 8,
      isOnline: false
    },
    {
      id: 3,
      username: 'pole_phoenix',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      bio: 'Pole dance artist',
      mutualFriends: 15,
      isOnline: true
    },
    {
      id: 4,
      username: 'circus_star',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      bio: 'Circus performer',
      mutualFriends: 5,
      isOnline: false
    }
  ]);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Friends</h1>
              <p className="text-muted-foreground">Connect with fellow aerial athletes</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => setShowFriendRequests(true)}
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Mail className="w-5 h-5 mr-2" />
                Friend Requests
              </Button>
              <Button
                onClick={() => setShowFriendInvite(true)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                <UserPlus className="w-5 h-5 mr-2" />
                Find Friends
              </Button>
            </div>
          </div>
        </div>

        {/* Friends Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-2xl font-bold text-white">{friends.length}</h3>
              <p className="text-muted-foreground">Total Friends</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-green-500 rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
              <h3 className="text-2xl font-bold text-white">{friends.filter(f => f.isOnline).length}</h3>
              <p className="text-muted-foreground">Online Now</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 text-purple-500" />
              <h3 className="text-2xl font-bold text-white">3</h3>
              <p className="text-muted-foreground">Pending Requests</p>
            </CardContent>
          </Card>
        </div>

        {/* Friends List */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Your Friends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center space-x-4 p-4 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="relative">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {friend.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900"></div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Link to={`/profile/${friend.id}`} className="cursor-pointer hover:text-primary transition-colors">
                      <h4 className="font-semibold text-white">{friend.username}</h4>
                    </Link>
                    <p className="text-muted-foreground text-sm">{friend.bio}</p>
                    <p className="text-muted-foreground text-xs">{friend.mutualFriends} mutual friends</p>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                      <Mail className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <UserX className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <FriendInviteModal
        isOpen={showFriendInvite}
        onClose={() => setShowFriendInvite(false)}
      />

      <FriendRequestsModal
        isOpen={showFriendRequests}
        onClose={() => setShowFriendRequests(false)}
      />
    </div>
  );
};

export default Friends;