import React, { useState } from 'react';
import { UserPlus, UserCheck, UserX, Clock, Heart, HeartOff, UserMinus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';

interface FriendshipActionsProps {
  userId: string;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export const FriendshipActions = ({ userId, size = 'default', variant = 'default' }: FriendshipActionsProps) => {
  const { toast } = useToast();
  const [showRemoveFriendModal, setShowRemoveFriendModal] = useState(false);
  const {
    isFriend,
    isFollowing,
    pendingFriendRequest,
    loading,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    removeFriend,
    followUser,
    unfollowUser
  } = useFriendshipStatus(userId);

  const handleSendFriendRequest = async () => {
    const success = await sendFriendRequest();
    if (success) {
      toast({
        title: "Friend request sent!",
        description: "Your friend request has been sent."
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to send friend request.",
        variant: "destructive"
      });
    }
  };

  const handleAcceptFriendRequest = async () => {
    const success = await acceptFriendRequest();
    if (success) {
      toast({
        title: "Friend request accepted!",
        description: "You are now friends."
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to accept friend request.",
        variant: "destructive"
      });
    }
  };

  const handleRejectFriendRequest = async () => {
    const success = await rejectFriendRequest();
    if (success) {
      toast({
        title: "Friend request declined",
        description: "The friend request has been declined."
      });
    }
  };

  const handleCancelFriendRequest = async () => {
    const success = await cancelFriendRequest();
    if (success) {
      toast({
        title: "Friend request cancelled",
        description: "Your friend request has been cancelled."
      });
    }
  };

  const handleFollow = async () => {
    const success = await followUser();
    if (success) {
      toast({
        title: "Now following!",
        description: "You are now following this user."
      });
    } else {
      toast({
        title: "Error",
        description: "Failed to follow user.",
        variant: "destructive"
      });
    }
  };

  const handleUnfollow = async () => {
    const success = await unfollowUser();
    if (success) {
      toast({
        title: "Unfollowed",
        description: "You are no longer following this user."
      });
    }
  };

  const handleRemoveFriend = async () => {
    const success = await removeFriend();
    if (success) {
      toast({
        title: "Friend removed",
        description: "You are no longer friends with this user."
      });
      setShowRemoveFriendModal(false);
    } else {
      toast({
        title: "Error",
        description: "Failed to remove friend.",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex space-x-2">
        <Button size={size} variant={variant} disabled>
          Loading...
        </Button>
      </div>
    );
  }

  return (
    <div className="flex space-x-2">
      {/* Follow/Unfollow Button */}
      <Button
        size={size}
        variant={isFollowing ? "outline" : variant}
        onClick={isFollowing ? handleUnfollow : handleFollow}
      >
        {isFollowing ? (
          <>
            <HeartOff className="w-4 h-4 mr-2" />
            Unfollow
          </>
        ) : (
          <>
            <Heart className="w-4 h-4 mr-2" />
            Follow
          </>
        )}
      </Button>

      {/* Friendship Button */}
      {isFriend ? (
        <Button size={size} variant="outline" onClick={() => setShowRemoveFriendModal(true)}>
          <UserMinus className="w-4 h-4 mr-2" />
          Remove Friend
        </Button>
      ) : pendingFriendRequest === 'sent' ? (
        <Button size={size} variant="outline" onClick={handleCancelFriendRequest}>
          <Clock className="w-4 h-4 mr-2" />
          Cancel Request
        </Button>
      ) : pendingFriendRequest === 'received' ? (
        <div className="flex space-x-1">
          <Button size={size} onClick={handleAcceptFriendRequest}>
            <UserCheck className="w-4 h-4 mr-2" />
            Accept
          </Button>
          <Button size={size} variant="outline" onClick={handleRejectFriendRequest}>
            <UserX className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <Button size={size} variant="outline" onClick={handleSendFriendRequest}>
          <UserPlus className="w-4 h-4 mr-2" />
          Add Friend
        </Button>
      )}

      <ConfirmDeleteModal
        isOpen={showRemoveFriendModal}
        onClose={() => setShowRemoveFriendModal(false)}
        onConfirm={handleRemoveFriend}
        title="Remove Friend"
        description="Are you sure you want to remove this friend? You will no longer be able to see their friends-only content and they won't see yours."
      />
    </div>
  );
};