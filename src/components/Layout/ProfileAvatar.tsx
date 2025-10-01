import React from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";

const ProfileAvatar: React.FC = () => {
  const { user } = useAuth();

  if (!user) return null;

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <Link to="/profile" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
      <Avatar className="w-8 h-8 border-2 border-primary/50">
        <AvatarImage src={user.avatar_url} alt={user.username} />
        <AvatarFallback className="bg-primary/20 text-primary text-xs font-semibold">
          {getInitials(user.username)}
        </AvatarFallback>
      </Avatar>
    </Link>
  );
};

export default ProfileAvatar;
