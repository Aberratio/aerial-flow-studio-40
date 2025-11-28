import React from 'react';
import { Edit, Share2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface ProfileHeaderCompactProps {
  onEditProfile: () => void;
  onShare: () => void;
  pendingRequestsCount?: number;
  onViewRequests?: () => void;
}

export const ProfileHeaderCompact = ({ 
  onEditProfile, 
  onShare,
  pendingRequestsCount = 0,
  onViewRequests
}: ProfileHeaderCompactProps) => {
  const { user } = useAuth();
  const isMobile = useIsMobile();

  if (!user) return null;

  return (
    <div className="bg-card/50 backdrop-blur-sm border-b border-white/10 p-4 sm:p-6 sticky top-0 z-40">
      <div className="max-w-4xl mx-auto flex items-center gap-4 sm:gap-6">
        {/* Avatar - larger on mobile */}
        <Avatar className="h-20 w-20 sm:h-24 sm:w-24 border-2 border-primary/50 flex-shrink-0">
          <AvatarImage src={user.avatar_url || undefined} />
          <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-2xl sm:text-3xl">
            {user.username?.[0]?.toUpperCase()}
          </AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground truncate">
              {user.username}
            </h1>
            {user.role === 'trainer' && (
              <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                Trener
              </Badge>
            )}
          </div>
          
          {/* Bio - Show more lines */}
          {user.bio && (
            <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 sm:line-clamp-3">
              {user.bio}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* Pending Requests Badge */}
          {pendingRequestsCount > 0 && (
            <Button
              onClick={onViewRequests}
              variant="outline"
              size={isMobile ? "icon" : "sm"}
              className="relative border-primary/30 hover:bg-primary/10"
            >
              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                {pendingRequestsCount}
              </div>
              <Settings className="h-4 w-4" />
              {!isMobile && <span className="ml-2">Zaproszenia</span>}
            </Button>
          )}

          {/* Edit & Share - Icons only on mobile */}
          {isMobile ? (
            <>
              <Button
                onClick={onEditProfile}
                variant="outline"
                size="icon"
                className="border-white/20 hover:bg-white/10"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                onClick={onShare}
                variant="outline"
                size="icon"
                className="border-white/20 hover:bg-white/10"
              >
                <Share2 className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={onEditProfile}
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-white/10"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edytuj profil
              </Button>
              <Button
                onClick={onShare}
                variant="outline"
                size="sm"
                className="border-white/20 hover:bg-white/10"
              >
                <Share2 className="h-4 w-4 mr-2" />
                Udostępnij
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
