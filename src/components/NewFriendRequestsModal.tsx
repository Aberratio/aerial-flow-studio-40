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
import { pl } from 'date-fns/locale';
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

interface NewFriendRequestsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFriendsUpdated?: () => void;
}

export const NewFriendRequestsModal = ({ isOpen, onClose, onFriendsUpdated }: NewFriendRequestsModalProps) => {
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

      // Get received requests (people who sent friend requests to current user)
      const { data: receivedData, error: receivedError } = await supabase
        .from('friendships')
        .select(`
          id,
          created_at,
          requester_id,
          profiles!friendships_requester_id_fkey (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('addressee_id', user.id)
        .eq('status', 'pending');

      if (receivedError) throw receivedError;

      // Get sent requests (people the current user sent requests to)
      const { data: sentData, error: sentError } = await supabase
        .from('friendships')
        .select(`
          id,
          created_at,
          addressee_id,
          profiles!friendships_addressee_id_fkey (
            id,
            username,
            avatar_url,
            bio
          )
        `)
        .eq('requester_id', user.id)
        .eq('status', 'pending');

      if (sentError) throw sentError;

      // Format received requests
      const receivedRequests: FriendRequest[] = receivedData?.map(friendship => ({
        id: friendship.id,
        user: {
          id: friendship.profiles?.id || '',
          username: friendship.profiles?.username || '',
          avatar_url: friendship.profiles?.avatar_url || null,
          bio: friendship.profiles?.bio || null,
          mutualFriends: 0 // TODO: Calculate mutual friends
        },
        timestamp: formatDistanceToNow(new Date(friendship.created_at), { addSuffix: true, locale: pl }),
        type: 'received' as const
      })) || [];

      // Format sent requests
      const sentRequests: FriendRequest[] = sentData?.map(friendship => ({
        id: friendship.id,
        user: {
          id: friendship.profiles?.id || '',
          username: friendship.profiles?.username || '',
          avatar_url: friendship.profiles?.avatar_url || null,
          bio: friendship.profiles?.bio || null,
          mutualFriends: 0 // TODO: Calculate mutual friends
        },
        timestamp: formatDistanceToNow(new Date(friendship.created_at), { addSuffix: true, locale: pl }),
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
      // Update the request status to 'accepted'
      const { error: updateError } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .eq('id', requestId);

      if (updateError) throw updateError;

      // Get the request details for notification
      const request = requests.find(r => r.id === requestId);
      if (request) {
        // Create activity notification for the requester
        await supabase
          .from('user_activities')
          .insert({
            user_id: request.user.id,
            activity_type: 'friend_request_accepted',
            activity_data: { accepter_username: user?.username },
            target_user_id: user?.id,
            points_awarded: 0
          });
      }

      setRequests(prev => prev.filter(req => req.id !== requestId));
      refetchCounts(); // Update follower/following counts
      onFriendsUpdated?.(); // Notify parent to refresh friends list
      toast({
        title: "Zaproszenie zaakceptowane!",
        description: `Ty i ${username} jesteście teraz znajomymi.`
      });
    } catch (error) {
      console.error('Error accepting friend request:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się zaakceptować zaproszenia.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (requestId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: "Zaproszenie odrzucone",
        description: `Odrzuciłeś zaproszenie od ${username}.`
      });
    } catch (error) {
      console.error('Error rejecting friend request:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się odrzucić zaproszenia.",
        variant: "destructive"
      });
    }
  };

  const handleCancelSent = async (requestId: string, username: string) => {
    try {
      const { error } = await supabase
        .from('friendships')
        .delete()
        .eq('id', requestId);

      if (error) throw error;

      setRequests(prev => prev.filter(req => req.id !== requestId));
      toast({
        title: "Zaproszenie anulowane",
        description: `Twoje zaproszenie do ${username} zostało anulowane.`
      });
    } catch (error) {
      console.error('Error cancelling friend request:', error);
      toast({
        title: "Błąd",
        description: "Nie udało się anulować zaproszenia.",
        variant: "destructive"
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px] max-h-[85vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Zaproszenia do znajomych</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
              <p className="text-muted-foreground mt-2">Ładowanie zaproszeń...</p>
            </div>
          ) : (
            <>
              {/* Received Requests */}
              {receivedRequests.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">Otrzymane zaproszenia</h3>
                <Badge variant="secondary" className="bg-primary/20 text-primary">
                  {receivedRequests.length}
                </Badge>
              </div>
              
              {receivedRequests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{request.user.username}</p>
                        <p className="text-sm text-muted-foreground">
                          {request.user.bio || 'Entuzjasta sportu'} • {request.timestamp}
                        </p>
                      </div>
                    </div>

                  <div className="flex space-x-2 sm:flex-shrink-0">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAccept(request.id, request.user.username);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white flex-1 sm:flex-none"
                    >
                      <Check className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Akceptuj</span>
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReject(request.id, request.user.username);
                      }}
                      className="text-muted-foreground hover:text-white hover:bg-red-600/20 flex-1 sm:flex-none"
                    >
                      <X className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">Odrzuć</span>
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
                <h3 className="text-sm font-medium text-white">Wysłane zaproszenia</h3>
                <Badge variant="secondary" className="bg-muted/20 text-muted-foreground">
                  {sentRequests.length}
                </Badge>
              </div>
              
              {sentRequests.map((request) => (
                  <div key={request.id} className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 bg-white/5 rounded-lg border border-white/10">
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
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-white truncate">{request.user.username}</p>
                        <p className="text-sm text-muted-foreground">
                          Wysłano {request.timestamp}
                        </p>
                      </div>
                    </div>

                  <div className="flex items-center space-x-2 sm:flex-shrink-0">
                    <div className="flex items-center space-x-1 text-yellow-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm">Oczekuje</span>
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
                  <p>Brak zaproszeń do znajomych</p>
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
