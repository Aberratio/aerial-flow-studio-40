import React, { useState, useEffect } from "react";
import { Camera, Settings, Share2, Eye, Edit } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ImageCropModal } from "@/components/ImageCropModal";

interface ProfileHeaderProps {
  onEditProfile: () => void;
  onSettings: () => void;
  onShare?: () => void;
  isOwnProfile?: boolean;
  onPrivacyChange?: (privacy: string) => void;
  privacyFilter?: string;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  onEditProfile,
  onSettings,
  onShare,
  isOwnProfile = true,
  onPrivacyChange,
  privacyFilter = "all",
}) => {
  const { user, refreshUser } = useAuth();
  const { toast } = useToast();
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isCropModalOpen, setIsCropModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    posts: 0,
    followers: 0,
    following: 0,
  });

  const handleAvatarSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageSrc = e.target?.result as string;
      setSelectedImage(imageSrc);
      setIsCropModalOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageFile: File) => {
    if (!user) return;

    setIsUploadingAvatar(true);
    console.log("Starting avatar upload...", croppedImageFile);

    try {
      const fileName = `${user.id}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(fileName, croppedImageFile, { upsert: true });

      if (uploadError) {
        console.error("Error uploading avatar:", uploadError);
        throw uploadError;
      }

      const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const avatarUrl = data.publicUrl;
      console.log("Avatar uploaded successfully:", avatarUrl);

      // Update profile in database
      const { error } = await supabase
        .from("profiles")
        .update({
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (error) {
        console.error("Database update error:", error);
        throw error;
      }

      console.log("Profile avatar updated successfully!");

      toast({
        title: "Profile Photo Updated",
        description: "Your profile photo has been successfully updated.",
      });

      // Refresh user data to show new avatar
      await refreshUser();
    } catch (error: any) {
      console.error("Avatar upload error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to update profile photo",
        variant: "destructive",
      });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Fetch posts count
        const { count: postsCount } = await supabase
          .from("posts")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Fetch followers count (people following this user)
        const { count: followersCount } = await supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("following_id", user.id);

        // Fetch following count (people this user follows)
        const { count: followingCount } = await supabase
          .from("user_follows")
          .select("*", { count: "exact", head: true })
          .eq("follower_id", user.id);

        setStats({
          posts: postsCount || 0,
          followers: followersCount || 0,
          following: followingCount || 0,
        });
      } catch (error) {
        console.error("Error fetching stats:", error);
      }
    };

    fetchStats();
  }, [user]);

  const displayStats = [
    { label: "Posts", value: stats.posts.toLocaleString() },
    { label: "Followers", value: stats.followers.toLocaleString() },
    { label: "Following", value: stats.following.toLocaleString() },
  ];

  return (
    <Card className="glass-effect border-white/10 mb-6">
      <CardContent className="p-8">
        <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
          {/* Avatar */}
          <div className="relative">
            <Avatar
              className={`w-32 h-32 ${
                user?.role === "trainer"
                  ? "ring-4 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-4 ring-offset-black"
                  : ""
              }`}
            >
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-4xl">
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarSelect}
              className="hidden"
              id="avatar-upload"
            />
            <label htmlFor="avatar-upload">
              <Button
                size="sm"
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-10 h-10 rounded-full cursor-pointer"
                variant="primary"
                asChild
              >
                <span>
                  {isUploadingAvatar ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </span>
              </Button>
            </label>
          </div>

          {/* Profile Info */}
          <div className="flex-1 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-center md:space-x-4 mb-4">
              <h1 className="text-3xl font-bold text-white">
                {user?.username}
              </h1>
              <div className="flex items-center justify-center md:justify-start space-x-2 mt-2 md:mt-0">
                {user?.role && (
                  <Badge
                    className={
                      user.role === "trainer"
                        ? "bg-gradient-to-r from-yellow-400 to-orange-500 text-black font-semibold"
                        : user.role === "premium"
                        ? "bg-gradient-to-r from-purple-400 to-pink-400 text-white"
                        : "bg-white/10 text-white"
                    }
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Badge>
                )}
              </div>
            </div>

            <p className="text-muted-foreground mb-6">{user?.bio}</p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              {displayStats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="gradient-text text-2xl font-bold">
                    {stat.value}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Privacy Selector for Own Profile */}
            {isOwnProfile && onPrivacyChange && (
              <div className="mb-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Eye className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    View as:
                  </span>
                </div>
                <Select value={privacyFilter} onValueChange={onPrivacyChange}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-white/20">
                    <SelectItem
                      value="all"
                      className="text-white hover:bg-white/10"
                    >
                      All Content (Private View)
                    </SelectItem>
                    <SelectItem
                      value="public"
                      className="text-white hover:bg-white/10"
                    >
                      Public Only
                    </SelectItem>
                    <SelectItem
                      value="friends"
                      className="text-white hover:bg-white/10"
                    >
                      Friends Only
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 justify-center md:justify-start">
              {isOwnProfile ? (
                <>
                  <Button
                    variant="primary"
                    onClick={onEditProfile}
                    className="hidden sm:flex"
                  >
                    Edit Profile
                  </Button>
                  <div className="flex flex-col items-center sm:hidden">
                    <Button
                      variant="primary"
                      onClick={onEditProfile}
                      size="icon"
                      className="w-12 h-12"
                    >
                      <Edit className="w-5 h-5" />
                    </Button>
                    <span className="text-xs text-white/80 mt-1">Edit</span>
                  </div>
                  <Button
                    variant="outline"
                    onClick={onSettings}
                    className="border-white/20 text-white hover:bg-white/10 hidden sm:flex"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                  <div className="flex flex-col items-center sm:hidden">
                    <Button
                      variant="outline"
                      onClick={onSettings}
                      size="icon"
                      className="border-white/20 text-white hover:bg-white/10 w-12 h-12"
                    >
                      <Settings className="w-5 h-5" />
                    </Button>
                    <span className="text-xs text-white/80 mt-1">Settings</span>
                  </div>
                </>
              ) : null}

              {onShare && (
                <>
                  <Button
                    variant="outline"
                    onClick={onShare}
                    className="border-white/20 text-white hover:bg-white/10 hidden sm:flex"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                  <div className="flex flex-col items-center sm:hidden">
                    <Button
                      variant="outline"
                      onClick={onShare}
                      size="icon"
                      className="border-white/20 text-white hover:bg-white/10 w-12 h-12"
                    >
                      <Share2 className="w-5 h-5" />
                    </Button>
                    <span className="text-xs text-white/80 mt-1">Share</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Image Crop Modal */}
        {selectedImage && (
          <ImageCropModal
            isOpen={isCropModalOpen}
            onClose={() => {
              setIsCropModalOpen(false);
              setSelectedImage(null);
            }}
            imageSrc={selectedImage}
            onCropComplete={handleCropComplete}
          />
        )}
      </CardContent>
    </Card>
  );
};
