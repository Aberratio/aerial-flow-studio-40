import React, { useState, useEffect } from "react";
import { X, Image, Video, Loader2, Users, Lock, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
interface EditPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: any;
  onPostUpdated: (updatedPost: any) => void;
}
export const EditPostModal = ({
  isOpen,
  onClose,
  post,
  onPostUpdated,
}: EditPostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(
    null
  );
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  useEffect(() => {
    if (post && isOpen) {
      setContent(post.content || "");
      setPrivacy(post.privacy || "public");
      setSelectedFilePreview(post.image_url || post.video_url || null);
      setMediaType(post.image_url ? "image" : "video");
    }
  }, [post, isOpen]);
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedFilePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleSubmit = async () => {
    if (!content.trim()) {
      toast({
        title: "Error",
        description: "Please add some content to your post",
        variant: "destructive",
      });
      return;
    }
    if (!user || !post) {
      toast({
        title: "Error",
        description: "You must be logged in to edit a post",
        variant: "destructive",
      });
      return;
    }
    setIsLoading(true);
    try {
      let mediaUrl = post.image_url || post.video_url;

      // Upload new media file if selected
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, selectedFile);
        if (uploadError) {
          throw uploadError;
        } else {
          const { data } = supabase.storage
            .from("posts")
            .getPublicUrl(fileName);
          mediaUrl = data.publicUrl;
        }
      }

      // Update post in database
      const { data: updatedPost, error } = await supabase
        .from("posts")
        .update({
          content,
          privacy,
          image_url: mediaType === "image" ? mediaUrl : null,
          video_url: mediaType === "video" ? mediaUrl : null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", post.id)
        .select()
        .single();
      if (error) {
        throw error;
      }

      // Update the post in the parent component
      onPostUpdated({
        ...post,
        content,
        privacy,
        image_url: mediaType === "image" ? mediaUrl : null,
        video_url: mediaType === "video" ? mediaUrl : null,
      });
      onClose();
      toast({
        title: "Post updated!",
        description: "Your post has been updated successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update post",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  const getPrivacyIcon = () => {
    switch (privacy) {
      case "friends":
        return <Users className="w-4 h-4" />;
      case "private":
        return <Lock className="w-4 h-4" />;
      default:
        return <Globe className="w-4 h-4" />;
    }
  };
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Edytuj post</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Zaktualizuj treść i ustawienia prywatności posta.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Privacy Setting */}
          <div>
            <label className="text-white text-sm font-medium mb-2 block">
              Ustawienia prywatności
            </label>
            <Select value={privacy} onValueChange={setPrivacy}>
              <SelectTrigger className="w-full h-10 bg-white/5 border-white/10 text-white">
                <SelectValue>
                  <div className="flex items-center space-x-2">
                    {getPrivacyIcon()}
                    <span className="capitalize">
                      {privacy === "friends"
                        ? "Tylko znajomi"
                        : privacy === "private"
                        ? "Tylko ja"
                        : "Publiczny"}
                    </span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background/95 border-white/10 z-50">
                <SelectItem value="public">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <span>Publiczny</span>
                  </div>
                </SelectItem>
                <SelectItem value="friends">
                  <div className="flex items-center space-x-2">
                    <Users className="w-4 h-4" />
                    <span>Tylko znajomi</span>
                  </div>
                </SelectItem>
                <SelectItem value="private">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <span>Tylko ja</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Textarea
            placeholder="Co słychać?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground resize-none"
          />

          {/* Media Preview and Upload */}
          {selectedFilePreview && mediaType === "image" && (
            <div className="relative">
              <img
                src={selectedFilePreview}
                alt="Selected"
                className="w-full max-h-48 sm:max-h-64 object-cover rounded-lg"
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFilePreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {selectedFilePreview && mediaType === "video" && (
            <div className="relative">
              <video
                src={selectedFilePreview}
                className="w-full max-h-48 sm:max-h-64 object-cover rounded-lg"
                controls
              />
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white"
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFilePreview(null);
                }}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            {/* Media Upload */}
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload-edit"
              />
              <label htmlFor="image-upload-edit">
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-white text-sm"
                  asChild
                  onClick={() => setMediaType("image")}
                >
                  <span className="flex items-center space-x-2 cursor-pointer">
                    <Image className="w-4 h-4" />
                    <span className="hidden sm:inline">Zmień zdjęcie</span>
                    <span className="sm:hidden">Zdjęcie</span>
                  </span>
                </Button>
              </label>
            </div>

            {/* Cancel and Update Buttons */}
            <div className="flex space-x-2 justify-end w-full sm:w-auto">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-white hover:bg-white/5 text-sm flex-1 sm:flex-none"
              >
                Anuluj
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                variant="primary"
                className="text-sm flex-1 sm:flex-none"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Aktualizacja...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  "Zaktualizuj"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
