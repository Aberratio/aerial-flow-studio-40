import React, { useState } from 'react';
import { Search, UserPlus, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';

interface FriendInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendInviteModal = ({ isOpen, onClose }: FriendInviteModalProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sentInvites, setSentInvites] = useState<number[]>([]);
  const { toast } = useToast();

  const suggestedFriends = [
    {
      id: 1,
      username: 'aerial_star',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 3,
      isOnline: true
    },
    {
      id: 2,
      username: 'flow_master',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 1,
      isOnline: false
    },
    {
      id: 3,
      username: 'silk_dancer',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 5,
      isOnline: true
    },
    {
      id: 4,
      username: 'pole_artist',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
      mutualFriends: 2,
      isOnline: false
    }
  ];

  const filteredFriends = suggestedFriends.filter(friend =>
    friend.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSendInvite = (friendId: number, username: string) => {
    setSentInvites(prev => [...prev, friendId]);
    toast({
      title: "Friend request sent!",
      description: `Your friend request has been sent to ${username}.`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Find Friends</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search for friends..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-muted-foreground"
            />
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            <h3 className="text-sm font-medium text-muted-foreground">Suggested for you</h3>
            
            {filteredFriends.map((friend) => (
              <div key={friend.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Avatar>
                      <AvatarImage src={friend.avatar} />
                      <AvatarFallback>{friend.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    {friend.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></div>
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-white">{friend.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {friend.mutualFriends} mutual friends
                    </p>
                  </div>
                </div>

                {sentInvites.includes(friend.id) ? (
                  <div className="flex items-center space-x-2 text-green-400">
                    <Check className="w-4 h-4" />
                    <span className="text-sm">Sent</span>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => handleSendInvite(friend.id, friend.username)}
                    className="bg-primary hover:bg-primary/90"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    Add Friend
                  </Button>
                )}
              </div>
            ))}

            {filteredFriends.length === 0 && searchQuery && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No users found matching "{searchQuery}"</p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};