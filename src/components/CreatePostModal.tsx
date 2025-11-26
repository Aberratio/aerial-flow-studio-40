import React, { useState, useEffect } from "react";
import {
  X,
  Image,
  Users,
  Lock,
  Globe,
  Video,
  Loader2,
  Target,
  Instagram,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPostCreated: (post: any) => void;
  preselectedFigure?: any;
  initialContent?: string;
  onBeforeSubmit?: () => Promise<void>;
}

export const CreatePostModal = ({
  isOpen,
  onClose,
  onPostCreated,
  preselectedFigure,
  initialContent,
  onBeforeSubmit,
}: CreatePostModalProps) => {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [privacy, setPrivacy] = useState("public");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFilePreview, setSelectedFilePreview] = useState<string | null>(
    null
  );
  const [mediaType, setMediaType] = useState<"image" | "video">("image");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFigure, setSelectedFigure] = useState<any>(null);
  const [figureSearchTerm, setFigureSearchTerm] = useState("");
  const [availableFigures, setAvailableFigures] = useState([]);
  const [showFigureSearch, setShowFigureSearch] = useState(false);
  const [instagramUrl, setInstagramUrl] = useState("");
  const [instagramEmbedHtml, setInstagramEmbedHtml] = useState<string | null>(null);
  const [loadingInstagram, setLoadingInstagram] = useState(false);
  const { toast } = useToast();

  // Instagram embed handler - using official Instagram embed script
  const handleInstagramFetch = React.useCallback(async () => {
    if (!instagramUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter an Instagram URL",
        variant: "destructive",
      });
      return;
    }

    // Extract post ID from URL (remove query parameters)
    const instagramRegex = /instagram\.com\/(p|reel|tv)\/([A-Za-z0-9_-]+)/;
    const match = instagramUrl.match(instagramRegex);
    
    if (!match) {
      toast({
        title: "Error",
        description: "Invalid Instagram URL format",
        variant: "destructive",
      });
      return;
    }

    const postId = match[2];
    const cleanUrl = `https://www.instagram.com/${match[1]}/${postId}/`;

    // Generate Instagram blockquote embed HTML
    const embedHtml = `<blockquote class="instagram-media" data-instgrm-permalink="${cleanUrl}" data-instgrm-version="14" style="background:#FFF; border:0; border-radius:3px; box-shadow:0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15); margin: 1px; max-width:540px; min-width:326px; padding:0; width:99.375%; width:-webkit-calc(100% - 2px); width:calc(100% - 2px);"><div style="padding:16px;"><a href="${cleanUrl}" style="background:#FFFFFF; line-height:0; padding:0 0; text-align:center; text-decoration:none; width:100%;" target="_blank">View this post on Instagram</a></div></blockquote>`;

    setInstagramEmbedHtml(embedHtml);
    
    // Trigger Instagram embed script to process the embed
    setTimeout(() => {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      }
    }, 100);

    toast({
      title: "Success",
      description: "Instagram post loaded successfully",
    });
  }, [instagramUrl, toast]);

  // Fetch available figures for selection
  const fetchFigures = async () => {
    try {
      const { data: figures, error } = await supabase
        .from("figures")
        .select("id, name, difficulty_level, category, image_url")
        .order("name", { ascending: true });

      if (error) throw error;
      setAvailableFigures(figures || []);
    } catch (error) {
      console.error("Error fetching figures:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFigures();
      if (preselectedFigure) {
        setSelectedFigure(preselectedFigure);
        setShowFigureSearch(false);
      }
      // Set initial content if provided
      if (initialContent) {
        setContent(initialContent);
      }
    } else {
      // Reset form when modal closes
      setContent("");
      setSelectedFile(null);
      setSelectedFilePreview(null);
      setPrivacy("public");
      setInstagramUrl("");
      setInstagramEmbedHtml(null);
      setSelectedFigure(null);
      setShowFigureSearch(false);
    }
  }, [isOpen, preselectedFigure, initialContent]);

  const filteredFigures = availableFigures.filter((figure) =>
    figure.name.toLowerCase().includes(figureSearchTerm.toLowerCase())
  );

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

    // If Instagram URL is provided but not loaded, show error
    if (instagramUrl.trim() && !instagramEmbedHtml) {
      toast({
        title: "Error",
        description: "Please click the Instagram button to load the post before publishing",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to create a post",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    console.log("Starting post creation...", { user, content, selectedFile });
    try {
      // Call onBeforeSubmit callback if provided (e.g., to mark challenge day complete)
      if (onBeforeSubmit) {
        await onBeforeSubmit();
      }
      let mediaUrl = null;

      // Upload media file if selected
      if (selectedFile) {
        console.log("Uploading media file...", selectedFile);
        const fileExt = selectedFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("posts")
          .upload(fileName, selectedFile);

        if (uploadError) {
          console.error("Error uploading file:", uploadError);
          throw uploadError;
        } else {
          const { data } = supabase.storage
            .from("posts")
            .getPublicUrl(fileName);
          mediaUrl = data.publicUrl;
          console.log("Media uploaded successfully:", mediaUrl);
        }
      }

      console.log("Creating post in database...");
      // Create post in database
      const { data: newPost, error } = await supabase
        .from("posts")
        .insert({
          user_id: user.id,
          content,
          privacy,
          image_url: mediaType === "image" ? mediaUrl : null,
          video_url: mediaType === "video" ? mediaUrl : null,
          instagram_url: instagramUrl || null,
          instagram_embed_html: instagramEmbedHtml || null,
          figure_id: selectedFigure?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select(
          `
          *,
          profiles (
            id,
            username,
            avatar_url
          )
        `
        )
        .single();

      if (error) {
        throw error;
      }

      // Pass the raw post data to the callback
      onPostCreated(newPost);

      // Reset form
      setContent("");
      setSelectedFile(null);
      setSelectedFilePreview(null);
      setPrivacy("public");
      setInstagramUrl("");
      setInstagramEmbedHtml(null);
      onClose();

      toast({
        title: "Post created!",
        description: "Your post has been shared successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create post",
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
          <DialogTitle className="text-white">Utwórz nowy post</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.avatar_url} />
              <AvatarFallback>
                {user?.username?.[0]?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold text-white">{user?.username}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="w-10"></div> {/* Spacer to align with avatar */}
            <div>
              <Select value={privacy} onValueChange={setPrivacy}>
                <SelectTrigger className="w-40 h-8 bg-white/5 border-white/10 text-white">
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
          </div>

          <Textarea
            placeholder={
              preselectedFigure
                ? `Podziel się swoją wersją ${preselectedFigure.name}...`
                : "Co u Ciebie słychać?"
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="min-h-[120px] bg-white/5 border-white/10 text-white placeholder:text-muted-foreground resize-none"
          />

          {/* Selected Figure Display */}
          {selectedFigure && (
            <div className="p-3 bg-white/5 rounded-lg border border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedFigure.image_url && (
                    <img
                      src={selectedFigure.image_url}
                      alt={selectedFigure.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div>
                    <p className="text-white font-medium">
                      {selectedFigure.name}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {selectedFigure.difficulty_level}
                    </p>
                  </div>
                </div>
                {!preselectedFigure && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFigure(null)}
                    className="text-muted-foreground hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          )}

          {/* Figure Selection */}
          {!selectedFigure && !preselectedFigure && (
            <div className="space-y-2">
              <Button
                variant="outline"
                onClick={() => setShowFigureSearch(!showFigureSearch)}
                className="w-full justify-start border-white/20 text-white hover:bg-white/10"
              >
                <Target className="w-4 h-4 mr-2" />
                {showFigureSearch
                  ? "Ukryj wybór figury"
                  : "Połącz z figurą (opcjonalnie)"}
              </Button>

              {showFigureSearch && (
                <div className="space-y-3 p-4 bg-white/5 rounded-lg border border-white/10">
                  <input
                    type="text"
                    placeholder="Szukaj figur..."
                    value={figureSearchTerm}
                    onChange={(e) => setFigureSearchTerm(e.target.value)}
                    className="w-full p-3 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-white/60 focus:border-primary focus:outline-none"
                  />
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredFigures.slice(0, 5).map((figure) => (
                      <div
                        key={figure.id}
                        onClick={() => {
                          setSelectedFigure(figure);
                          setShowFigureSearch(false);
                          setFigureSearchTerm("");
                        }}
                        className="p-3 hover:bg-white/10 rounded-md cursor-pointer flex items-center space-x-3 transition-colors"
                      >
                        {figure.image_url && (
                          <img
                            src={figure.image_url}
                            alt={figure.name}
                            className="w-10 h-10 rounded object-cover flex-shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-white font-medium truncate">
                            {figure.name}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {figure.difficulty_level}
                          </p>
                        </div>
                      </div>
                    ))}
                    {filteredFigures.length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Nie znaleziono figur
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

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

          {/* Instagram URL Input */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-white">
              Post Instagram (opcjonalnie)
            </label>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2">
              <input
                type="text"
                placeholder="Paste Instagram post URL here..."
                value={instagramUrl}
                onChange={(e) => {
                  setInstagramUrl(e.target.value);
                  // Clear embed if URL changes
                  if (instagramEmbedHtml) {
                    setInstagramEmbedHtml(null);
                  }
                }}
                className="flex-1 p-3 bg-white/5 border border-white/10 rounded-md text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                disabled={!!instagramEmbedHtml}
              />
              <Button
                onClick={handleInstagramFetch}
                disabled={loadingInstagram || !instagramUrl.trim() || !!instagramEmbedHtml}
                className="w-full sm:w-auto flex-shrink-0"
                variant={instagramEmbedHtml ? "secondary" : "default"}
              >
                {loadingInstagram ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : instagramEmbedHtml ? (
                  <>
                    <Instagram className="w-4 h-4 mr-2" />
                    Loaded ✓
                  </>
                ) : (
                  <>
                    <Instagram className="w-4 h-4 mr-2" />
                    Załaduj Instagram
                  </>
                )}
              </Button>
            </div>
            {instagramEmbedHtml && (
              <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center justify-between">
                <p className="text-green-400 text-sm flex items-center">
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram post loaded successfully
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setInstagramEmbedHtml(null);
                    setInstagramUrl("");
                  }}
                  className="text-muted-foreground hover:text-white"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            )}
            {instagramUrl.trim() && !instagramEmbedHtml && (
              <p className="text-amber-400 text-xs flex items-center">
                ⚠️ Click "Load Instagram Post" button to embed this post
              </p>
            )}
          </div>

          {/* Add Photo Button - disabled when Instagram URL is present */}
          {!instagramEmbedHtml && (
            <div className="flex items-center space-x-2">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
                id="image-upload"
                disabled={!!instagramUrl.trim()}
              />
              <label htmlFor="image-upload" className={instagramUrl.trim() ? 'cursor-not-allowed opacity-50' : ''}>
                <Button
                  variant="ghost"
                  className="text-muted-foreground hover:text-white text-sm"
                  asChild
                  onClick={() => setMediaType("image")}
                  disabled={!!instagramUrl.trim()}
                >
                  <span className="flex items-center space-x-2 cursor-pointer">
                    <Image className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="hidden sm:inline">
                      {instagramUrl.trim() ? 'Photo (disabled - Instagram URL present)' : 'Add Photo'}
                    </span>
                    <span className="sm:hidden">Photo</span>
                  </span>
                </Button>
              </label>
            </div>
          )}

          <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">{instagramEmbedHtml && (
              <div className="text-sm text-muted-foreground">
                Instagram post selected - photo upload disabled
              </div>
            )}
            <div className="flex-1"></div>

            <div className="flex space-x-2 justify-end">
              <Button
                variant="ghost"
                onClick={onClose}
                className="text-muted-foreground hover:text-white hover:bg-white/5 text-sm"
              >
                Anuluj
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isLoading}
                className="text-sm"
                variant="primary"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    <span className="hidden sm:inline">Publikowanie...</span>
                    <span className="sm:hidden">...</span>
                  </>
                ) : (
                  "Opublikuj"
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
