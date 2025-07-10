import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Users, Check, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

interface ProfilePreviewHeaderProps {
  profile: any;
  userId: string;
  mutualFriends: any[];
  pendingFriendRequest: 'none' | 'sent' | 'received';
  friendshipLoading: boolean;
  onAcceptFriend: () => Promise<boolean>;
  onRejectFriend: () => Promise<boolean>;
}

export const ProfilePreviewHeader = ({
  profile,
  userId,
  mutualFriends,
  pendingFriendRequest,
  friendshipLoading,
  onAcceptFriend,
  onRejectFriend
}: ProfilePreviewHeaderProps) => {
  const { toast } = useToast();

  const handleAccept = async () => {
    const success = await onAcceptFriend();
    if (success) {
      toast({
        title: "Friend request accepted!",
        description: `You and ${profile.username} are now friends.`
      });
    }
  };

  const handleReject = async () => {
    const success = await onRejectFriend();
    if (success) {
      toast({
        title: "Friend request declined",
        description: `You declined ${profile.username}'s friend request.`
      });
    }
  };

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="w-20 h-20">
        <AvatarImage src={profile.avatar_url} />
        <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
      </Avatar>
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
        <p className="text-muted-foreground">{profile.bio || 'Aerial enthusiast'}</p>
        <div className="flex items-center space-x-4 mt-2">
          <Badge variant="secondary" className="bg-primary/20 text-primary">
            {profile.role === 'trainer' ? 'Trainer' : 'Member'}
          </Badge>
          {mutualFriends && mutualFriends.length > 0 && (
            <div className="flex items-center space-x-1 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              <span>{mutualFriends.length} mutual friends</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        {pendingFriendRequest === 'received' && (
          <>
            <Button
              size="sm"
              onClick={handleAccept}
              className="bg-green-600 hover:bg-green-700 text-white"
              disabled={friendshipLoading}
            >
              <Check className="w-4 h-4 mr-1" />
              Accept
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleReject}
              className="text-muted-foreground hover:text-white hover:bg-red-600/20"
              disabled={friendshipLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Decline
            </Button>
          </>
        )}
        <Link to={`/profile/${userId}`}>
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            View Full Profile
          </Button>
        </Link>
      </div>
    </div>
  );
};