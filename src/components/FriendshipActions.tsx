import React, { useState } from 'react';
import { UserPlus, UserMinus, Check, X, UserCheck, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFriendshipStatus } from '@/hooks/useFriendshipStatus';
import { useToast } from '@/hooks/use-toast';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

interface FriendshipActionsProps {
  userId: string;
  username: string;
  size?: 'sm' | 'default' | 'lg';
}

export const FriendshipActions = ({ userId, username, size = 'default' }: FriendshipActionsProps) => {
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
        title: "Friend Request Sent",
        description: `Your friend request has been sent to ${username}`
      });
    }
  };

  const handleAcceptFriend = async () => {
    const success = await acceptFriendRequest();
    if (success) {
      toast({
        title: "Friend Request Accepted",
        description: `You and ${username} are now friends!`
      });
    }
  };

  const handleRejectFriend = async () => {
    const success = await rejectFriendRequest();
    if (success) {
      toast({
        title: "Friend Request Rejected",
        description: `You rejected ${username}'s friend request.`
      });
    }
  };

  const handleCancelRequest = async () => {
    const success = await cancelFriendRequest();
    if (success) {
      toast({
        title: "Request Cancelled",
        description: `Your friend request to ${username} has been cancelled.`
      });
    }
  };

  const handleRemoveFriend = async () => {
    const success = await removeFriend();
    if (success) {
      toast({
        title: "Friend Removed",
        description: `${username} has been removed from your friends.`
      });
      setShowRemoveFriendModal(false);
    }
  };

  const handleFollow = async () => {
    const success = await followUser();
    if (success) {
      toast({
        title: "Now Following",
        description: `You are now following ${username}.`
      });
    }
  };

  const handleUnfollow = async () => {
    const success = await unfollowUser();
    if (success) {
      toast({
        title: "Unfollowed",
        description: `You are no longer following ${username}.`
      });
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-white/10 h-10 w-32 rounded"></div>;
  }

  // 1. If the viewed user is an accepted friend
  if (isFriend) {
    return (
      <>
        <Button 
          size={size}
          variant="outline" 
          onClick={() => setShowRemoveFriendModal(true)}
          className="border-green-500/30 text-green-400 hover:bg-green-500/10"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Friends
        </Button>

        <ConfirmDeleteModal
          isOpen={showRemoveFriendModal}
          onClose={() => setShowRemoveFriendModal(false)}
          onConfirm={handleRemoveFriend}
          title="Remove Friend"
          description={`Are you sure you want to remove ${username} from your friends? You will no longer be able to see their friends-only content and they won't see yours.`}
        />
      </>
    );
  }

  // 2. If the viewed user has sent me a friend request and I do NOT follow them
  if (pendingFriendRequest === 'received' && !isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          size={size}
          onClick={handleAcceptFriend}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 w-full sm:w-auto px-3 py-2 text-sm"
        >
          <Check className="w-4 h-4 mr-2" />
          Accept
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleRejectFriend}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full sm:w-auto px-3 py-2 text-sm"
        >
          <X className="w-4 h-4 mr-2" />
          Decline
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleFollow}
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 w-full sm:w-auto px-3 py-2 text-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </Button>
      </div>
    );
  }

  // 3. If the viewed user has sent me a friend request and I ALREADY follow them
  if (pendingFriendRequest === 'received' && isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          size={size}
          onClick={handleAcceptFriend}
          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600"
        >
          <Check className="w-4 h-4 mr-2" />
          Accept
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleRejectFriend}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <X className="w-4 h-4 mr-2" />
          Decline
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleUnfollow}
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </Button>
      </div>
    );
  }

  // 4. If I have sent a friend request and I already follow them
  if (pendingFriendRequest === 'sent' && isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          size={size}
          variant="outline" 
          onClick={handleCancelRequest}
          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
        >
          <UserX className="w-4 h-4 mr-2" />
          Cancel Request
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleUnfollow}
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </Button>
      </div>
    );
  }

  // 5. If I have sent a friend request and I do NOT follow the user
  if (pendingFriendRequest === 'sent' && !isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          size={size}
          variant="outline" 
          onClick={handleCancelRequest}
          className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
        >
          <UserX className="w-4 h-4 mr-2" />
          Cancel Request
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleFollow}
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </Button>
      </div>
    );
  }

  // 6. If there is NO friendship and I already follow the user
  if (pendingFriendRequest === 'none' && isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          size={size}
          onClick={handleSendFriendRequest}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Send Friend Request
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleUnfollow}
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Unfollow
        </Button>
      </div>
    );
  }

  // 7. If there is NO friendship and I do NOT follow the user
  if (pendingFriendRequest === 'none' && !isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          size={size}
          variant="primary"
          onClick={handleSendFriendRequest}
          className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Send Friend Request
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleFollow}
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Follow
        </Button>
      </div>
    );
  }

  return null;
};