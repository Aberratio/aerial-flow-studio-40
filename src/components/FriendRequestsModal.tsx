import React, { useState, useEffect } from 'react';
import { Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ProfilePreviewModal } from '@/components/ProfilePreviewModal';

interface FriendRequest {
  id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    bio: string | null;
    mutualFriends: number;
  };
  timestamp: string;
  type: 'received' | 'sent';
}

interface FriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendsUpdated?: () => void;
}

export const FriendRequestsModal = ({ isOpen, onClose, onFriendsUpdated }: FriendRequestsModalProps) => {
  const { user, refetchCounts } = useAuth();
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const { toast } = useToast();

  // Fetch friend requests from database
  const fetchFriendRequests = async () => {
    if (!user || !isOpen) return;

    try {
      setLoading(true);

      // Get received requests (people who are following the current user)
      const { data: receivedData, error: receivedError } = await supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          follower_id,
          profiles!user_follows_follower_id_fkey (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('following_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      // Get sent requests (people the current user is following)
      const { data: sentData, error: sentError } = await supabase
        .from('user_follows')
        .select(`
          id,
          created_at,
          following_id,
          profiles!user_follows_following_id_fkey (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('follower_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Format received requests
      const receivedRequests: FriendRequest[] = receivedData?.map(follow => ({
        id: follow.id,
        user: {
          id: follow.profiles?.id || '',
          username: follow.profiles?.username || '',
          avatar_url: follow.profiles?.avatar_url || null,
          bio: follow.profiles?.bio || null,
          mutualFriends: 0 // TODO: Calculate mutual friends
        },
        timestamp: formatDistanceToNow(new Date(follow.created_at), { addSuffix: true }),
        type: 'received' as const
      })) || [];

      // Format sent requests
      const sentRequests: FriendRequest[] = sentData?.map(follow => ({
        id: follow.id,
        user: {
          id: follow.profiles?.id || '',
          username: follow.profiles?.username || '',
          avatar_url: follow.profiles?.avatar_url || null,
          bio: follow.profiles?.bio || null,
          mutualFriends: 0 // TODO: Calculate mutual friends
        },
        timestamp: formatDistanceToNow(new Date(follow.created_at), { addSuffix: true }),
        type: 'sent' as const
      })) || [];

      setRequests([...receivedRequests, ...sentRequests]);
    } catch (error) {
      console.error('Error fetching friend requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFriendRequests();
  }, [user, isOpen]);

  const receivedRequests = requests.filter(req => req.type === 'received');
  const sentRequests = requests.filter(req => req.type === 'sent');

  const handleAccept = async (requestId: string, username: string) => {
    try {
      // Get the request details first
      const { data: requestData, error: requestError } = await supabase
        .from('user_follows')
        .select('follower_id')
        .eq('id', requestId)
        .single();

      if (requestError) throw requestError;

      // Update the request status to 'accepted'
      const { error: updateError } = await supabase
        .from('user_follows')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Create activity notification for the requester
      const { error: activityError } = await supabase
        .from('user_activities')
        .insert({
          user_id: requestData.follower_id,
          activity_type: 'friend_request_accepted',
          activity_data: { accepter_username: user?.username },
          target_user_id: user?.id,
          points_awarded: 0
        });

      if (activityError) {
        console.error('Error creating friend request accepted activity:', activityError);
      }

      setRequests(prev => prev.filter(req => req.id !== requestId));
      refetchCounts(); // Update follower/following counts
      onFriendsUpdated?.(); // Notify parent to refresh friends list
      toast({
        title: "Friend request accepted!",
        description: `You and ${username} are now friends.`
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to accept friend request.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (requestId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: "Friend request declined",
        description: `You declined ${username}'s friend request.`
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Error",
        description: "Failed to decline friend request.",
        variant: "destructive"
      });
    }
  };

  const handleCancelSent = async (requestId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: "Friend request cancelled",
        description: `Your friend request to ${username} has been cancelled.`
      });
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast({
        title: "Error",
        description: "Failed to cancel friend request.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Friend Requests</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading friend requests...</p>
            </div>
          ) : (
            <>
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
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-white/5 rounded p-2 -m-2"
                      onClick={() => {
                        setSelectedUserId(request.user.id);
                        setShowProfilePreview(true);
                      }}
                    >
                      <Avatar>
                        <AvatarImage src={request.user.avatar_url || undefined} />
                        <AvatarFallback>{request.user.username[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-white">{request.user.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.user.bio || 'Aerial enthusiast'} • {request.timestamp}
                        </p>
                      </div>
                    </div>

                  <div className="flex space-x-2">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(request.id, request.user.username);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(request.id, request.user.username);
                      }}
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
                    <div 
                      className="flex items-center space-x-3 flex-1 cursor-pointer hover:bg-white/5 rounded p-2 -m-2"
                      onClick={() => {
                        setSelectedUserId(request.user.id);
                        setShowProfilePreview(true);
                      }}
                    >
                      <Avatar>
                        <AvatarImage src={request.user.avatar_url || undefined} />
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
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCancelSent(request.id, request.user.username);
                      }}
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
            </>
          )}
        </div>

        {/* Profile Preview Modal */}
        <ProfilePreviewModal
          isOpen={showProfilePreview}
          onClose={() => setShowProfilePreview(false)}
          userId={selectedUserId || ''}
        />
      </DialogContent>
    </Dialog>
  );
};