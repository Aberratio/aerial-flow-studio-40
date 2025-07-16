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
  pendingFriendRequest: 'none' | 'sent' | 'received';
  friendshipLoading: boolean;
  onAcceptFriend: () => Promise<boolean>;
  onRejectFriend: () => Promise<boolean>;
}

export const ProfilePreviewHeader = ({
  profile,
  userId,
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
        {profile.bio && <p className="text-muted-foreground">{profile.bio}</p>}
        {profile.sports && profile.sports.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {profile.sports.slice(0, 3).map((sport: string) => (
              <Badge key={sport} variant="secondary" className="text-xs">
                {sport}
              </Badge>
            ))}
            {profile.sports.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{profile.sports.length - 3} more
              </Badge>
            )}
          </div>
        )}
        <div className="flex items-center space-x-4 mt-2">
          {profile.role === 'trainer' && (
            <Badge variant="secondary" className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black">
              Trainer
            </Badge>
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
              variant="outline"
              onClick={handleReject}
              className="border-red-500/30 text-red-400 hover:bg-red-500/10"
              disabled={friendshipLoading}
            >
              <X className="w-4 h-4 mr-1" />
              Reject
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