import React, { useState } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface FriendRequest {
  id: number;
  user: {
    id: number;
    username: string;
    avatar: string;
    mutualFriends: number;
  };
  timestamp: string;
  type: 'received' | 'sent';
}

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FriendRequestsModal = ({ isOpen, onClose }: FriendRequestsModalProps) => {
  const [requests, setRequests] = useState<FriendRequest[]>([
    {
      id: 1,
      user: {
        id: 1,
        username: 'aerial_star',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=150&h=150&fit=crop&crop=face',
        mutualFriends: 3
      },
      timestamp: '2h ago',
      type: 'received'
    },
    {
      id: 2,
      user: {
        id: 2,
        username: 'flow_master',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        mutualFriends: 1
      },
      timestamp: '1d ago',
      type: 'received'
    },
    {
      id: 3,
      user: {
        id: 3,
        username: 'silk_dancer',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        mutualFriends: 5
      },
      timestamp: '3h ago',
      type: 'sent'
    }
  ]);

  const { toast } = useToast();

  const receivedRequests = requests.filter(req => req.type === 'received');
  const sentRequests = requests.filter(req => req.type === 'sent');

  const handleAccept = (requestId: number, username: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    toast({
      title: "Friend request accepted!",
      description: `You and ${username} are now friends.`
    });
  };

  const handleReject = (requestId: number, username: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    toast({
      title: "Friend request declined",
      description: `You declined ${username}'s friend request.`
    });
  };

  const handleCancelSent = (requestId: number, username: string) => {
    setRequests(prev => prev.filter(req => req.id !== requestId));
    toast({
      title: "Friend request cancelled",
      description: `Your friend request to ${username} has been cancelled.`
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Friend Requests</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Received Requests */}
          {receivedRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Received Requests</h3>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {receivedRequests.length}
                </Badge>
              </div>
              
              {receivedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={request.user.avatar} />
                      <AvatarFallback>{request.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{request.user.username}</p>
                      <p className="text-sm text-muted-foreground">
                        {request.user.mutualFriends} mutual friends • {request.timestamp}
                      </p>
                    </div>
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={() => handleAccept(request.id, request.user.username)}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleReject(request.id, request.user.username)}
                      className="text-muted-foreground hover:text-white hover:bg-red-600/20"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Sent Requests */}
          {sentRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Sent Requests</h3>
                <Badge variant="secondary" className="bg-muted/20 text-muted-foreground">
                  {sentRequests.length}
                </Badge>
              </div>
              
              {sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={request.user.avatar} />
                      <AvatarFallback>{request.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-white">{request.user.username}</p>
                      <p className="text-sm text-muted-foreground">
                        Sent {request.timestamp}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Pending</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleCancelSent(request.id, request.user.username)}
                      className="text-muted-foreground hover:text-white hover:bg-red-600/20"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty State */}
          {receivedRequests.length === 0 && sentRequests.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>No friend requests at the moment</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};