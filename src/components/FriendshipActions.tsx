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
        title: "Zaproszenie wysłane",
        description: `Twoje zaproszenie zostało wysłane do ${username}`
      });
    }
  };

  const handleAcceptFriend = async () => {
    const success = await acceptFriendRequest();
    if (success) {
      toast({
        title: "Zaproszenie zaakceptowane",
        description: `Ty i ${username} jesteście teraz znajomymi!`
      });
    }
  };

  const handleRejectFriend = async () => {
    const success = await rejectFriendRequest();
    if (success) {
      toast({
        title: "Zaproszenie odrzucone",
        description: `Odrzuciłeś zaproszenie od ${username}.`
      });
    }
  };

  const handleCancelRequest = async () => {
    const success = await cancelFriendRequest();
    if (success) {
      toast({
        title: "Zaproszenie anulowane",
        description: `Twoje zaproszenie do ${username} zostało anulowane.`
      });
    }
  };

  const handleRemoveFriend = async () => {
    const success = await removeFriend();
    if (success) {
      toast({
        title: "Znajomy usunięty",
        description: `${username} został usunięty z Twoich znajomych.`
      });
      setShowRemoveFriendModal(false);
    }
  };

  const handleFollow = async () => {
    const success = await followUser();
    if (success) {
      toast({
        title: "Obserwujesz",
        description: `Teraz obserwujesz ${username}.`
      });
    }
  };

  const handleUnfollow = async () => {
    const success = await unfollowUser();
    if (success) {
      toast({
        title: "Nie obserwujesz",
        description: `Nie obserwujesz już ${username}.`
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
          Znajomi
        </Button>

        <ConfirmDeleteModal
          isOpen={showRemoveFriendModal}
          onClose={() => setShowRemoveFriendModal(false)}
          onConfirm={handleRemoveFriend}
          title="Usuń znajomego"
          description={`Czy na pewno chcesz usunąć ${username} ze znajomych? Nie będziesz mógł widzieć treści tylko dla znajomych i oni też nie zobaczą Twoich.`}
        />
      </>
    );
  }

  // 2. If the viewed user has sent me a friend request and I do NOT follow them
  if (pendingFriendRequest === 'received' && !isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button  
          variant="primary"
          size={size}
          onClick={handleAcceptFriend}
        >
          <Check className="w-4 h-4 mr-2" />
          Akceptuj
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleRejectFriend}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10 w-full sm:w-auto px-3 py-2 text-sm"
        >
          <X className="w-4 h-4 mr-2" />
          Odrzuć
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleFollow}
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10 w-full sm:w-auto px-3 py-2 text-sm"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Obserwuj
        </Button>
      </div>
    );
  }

  // 3. If the viewed user has sent me a friend request and I ALREADY follow them
  if (pendingFriendRequest === 'received' && isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          variant="primary"
          size={size}
          onClick={handleAcceptFriend}
        >
          <Check className="w-4 h-4 mr-2" />
          Akceptuj
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleRejectFriend}
          className="border-red-500/30 text-red-400 hover:bg-red-500/10"
        >
          <X className="w-4 h-4 mr-2" />
          Odrzuć
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleUnfollow}
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Przestań obserwować
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
          Anuluj zaproszenie
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleUnfollow}
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Przestań obserwować
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
          Anuluj zaproszenie
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleFollow}
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Obserwuj
        </Button>
      </div>
    );
  }

  // 6. If there is NO friendship and I already follow the user
  if (pendingFriendRequest === 'none' && isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          variant="primary"
          size={size}
          onClick={handleSendFriendRequest}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Wyślij zaproszenie
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleUnfollow}
          className="border-gray-500/30 text-gray-400 hover:bg-gray-500/10"
        >
          <UserMinus className="w-4 h-4 mr-2" />
          Przestań obserwować
        </Button>
      </div>
    );
  }

  // 7. If there is NO friendship and I do NOT follow the user
  if (pendingFriendRequest === 'none' && !isFollowing) {
    return (
      <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
        <Button 
          variant="primary"
          size={size}
          onClick={handleSendFriendRequest}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Wyślij zaproszenie
        </Button>
        <Button 
          size={size}
          variant="outline" 
          onClick={handleFollow}
          className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Obserwuj
        </Button>
      </div>
    );
  }

  return null;
};
