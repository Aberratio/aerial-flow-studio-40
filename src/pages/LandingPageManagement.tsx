import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Upload, ImageIcon, Plus, PlayCircle, Trash2 } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';

interface LandingPageSection {
  id: string;
  section_key: string;
  section_type: string;
  display_order: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
  updated_at: string;
}

interface GalleryMedia {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url: string | null;
  display_order: number;
  is_active: boolean;
  created_by: string | null;
}

interface InstagramPost {
  url: string;
  embed_code?: string;
}

const LandingPageManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userRole, isLoading: roleLoading } = useUserRole();
  
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [galleryMedia, setGalleryMedia] = useState<GalleryMedia[]>([]);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaDescription, setNewMediaDescription] = useState('');
  const [newMediaType, setNewMediaType] = useState<'image' | 'video'>('image');
  
  // Instagram feed state
  const [instagramFeedActive, setInstagramFeedActive] = useState(false);
  const [instagramPosts, setInstagramPosts] = useState<InstagramPost[]>([]);
  const [newInstagramUrl, setNewInstagramUrl] = useState('');

  useEffect(() => {
    if (!roleLoading && userRole === 'admin') {
      fetchData();
      fetchGalleryMedia();
      fetchInstagramFeed();
    }
  }, [roleLoading, userRole]);

  // Show loading while checking role
  if (roleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  // Access control
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center text-white">
          <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
          <p>You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  const fetchData = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setSections(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch sections",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchGalleryMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_media')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setGalleryMedia((data || []) as GalleryMedia[]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch gallery media",
        variant: "destructive"
      });
    }
  };

  const fetchInstagramFeed = async () => {
    try {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('is_active, metadata')
        .eq('section_key', 'instagram_feed')
        .single();

      if (error) throw error;
      
      if (data) {
        setInstagramFeedActive(data.is_active || false);
        const metadata = data.metadata as { instagram_posts?: InstagramPost[] };
        setInstagramPosts(metadata?.instagram_posts || []);
      }
    } catch (error: any) {
      console.error('Error fetching Instagram feed:', error);
    }
  };

  const addInstagramPost = async () => {
    if (!newInstagramUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a valid Instagram post URL",
        variant: "destructive"
      });
      return;
    }

    if (instagramPosts.length >= 6) {
      toast({
        title: "Error",
        description: "Maximum 6 Instagram posts allowed",
        variant: "destructive"
      });
      return;
    }

    try {
      const newPosts = [...instagramPosts, { url: newInstagramUrl }];
      
      const { error } = await supabase
        .from('landing_page_sections')
        .update({ 
          metadata: { 
            instagram_posts: newPosts,
            max_posts: 6,
            display_mode: 'grid'
          } as any
        })
        .eq('section_key', 'instagram_feed');

      if (error) throw error;

      setInstagramPosts(newPosts);
      setNewInstagramUrl('');
      
      toast({
        title: "Success",
        description: "Instagram post added"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add Instagram post",
        variant: "destructive"
      });
    }
  };

  const removeInstagramPost = async (index: number) => {
    try {
      const newPosts = instagramPosts.filter((_, i) => i !== index);
      
      const { error } = await supabase
        .from('landing_page_sections')
        .update({ 
          metadata: { 
            instagram_posts: newPosts,
            max_posts: 6,
            display_mode: 'grid'
          } as any
        })
        .eq('section_key', 'instagram_feed');

      if (error) throw error;

      setInstagramPosts(newPosts);
      
      toast({
        title: "Success",
        description: "Instagram post removed"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to remove Instagram post",
        variant: "destructive"
      });
    }
  };

  const toggleInstagramFeed = async (isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('landing_page_sections')
        .update({ is_active: isActive })
        .eq('section_key', 'instagram_feed');

      if (error) throw error;

      setInstagramFeedActive(isActive);
      
      toast({
        title: "Success",
        description: `Instagram feed ${isActive ? 'activated' : 'deactivated'}`
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update Instagram feed",
        variant: "destructive"
      });
    }
  };

  const handleImageUpload = async (sectionId: string, file: File) => {
    try {
      setImageUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `landing-${sectionId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(`landing-page/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(`landing-page/${fileName}`);

      const { error: updateError } = await supabase
        .from('landing_page_sections')
        .update({ image_url: publicUrl })
        .eq('id', sectionId);

      if (updateError) throw updateError;

      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, image_url: publicUrl }
          : section
      ));

      toast({
        title: "Success",
        description: "Image uploaded successfully"
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to upload image",
        variant: "destructive"
      });
    } finally {
      setImageUploading(false);
    }
  };

  const handleAddMedia = async (file: File) => {
    if (!newMediaTitle.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title first",
        variant: "destructive"
      });
      return;
    }

    try {
      setImageUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `gallery/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(filePath);

      const { error: insertError } = await supabase
        .from('gallery_media')
        .insert({
          title: newMediaTitle,
          description: newMediaDescription || null,
          media_url: publicUrl,
          media_type: newMediaType,
          display_order: galleryMedia.length,
          created_by: user?.id
        });

      if (insertError) throw insertError;

      await fetchGalleryMedia();

      setNewMediaTitle('');
      setNewMediaDescription('');
      setNewMediaType('image');
      setShowAddMediaModal(false);

      toast({
        title: "Success",
        description: "Media added successfully"
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to add media",
        variant: "destructive"
      });
    } finally {
      setImageUploading(false);
    }
  };

  const deleteMedia = async (mediaId: string) => {
    try {
      const { error } = await supabase
        .from('gallery_media')
        .delete()
        .eq('id', mediaId);

      if (error) throw error;

      setGalleryMedia(prev => prev.filter(item => item.id !== mediaId));

      toast({
        title: "Success",
        description: "Media deleted successfully"
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete media",
        variant: "destructive"
      });
    }
  };

  const toggleMediaActive = async (mediaId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('gallery_media')
        .update({ is_active: isActive })
        .eq('id', mediaId);

      if (error) throw error;

      setGalleryMedia(prev => prev.map(item => 
        item.id === mediaId 
          ? { ...item, is_active: isActive }
          : item
      ));

      toast({
        title: "Success",
        description: `Media ${isActive ? 'activated' : 'deactivated'}`
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update media",
        variant: "destructive"
      });
    }
  };

  const toggleSectionActive = async (sectionId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('landing_page_sections')
        .update({ is_active: isActive })
        .eq('id', sectionId);

      if (error) throw error;

      setSections(prev => prev.map(section => 
        section.id === sectionId 
          ? { ...section, is_active: isActive }
          : section
      ));

      toast({
        title: "Success",
        description: `Section ${isActive ? 'activated' : 'deactivated'}`
      });

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update section",
        variant: "destructive"
      });
    }
  };

  const renderSectionEditor = (section: LandingPageSection) => {
    return (
      <Card key={section.id} className="glass-effect border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <CardTitle className="text-white capitalize">{section.section_key} Section</CardTitle>
              <Badge variant="outline" className="text-white border-white/20">
                {section.section_type}
              </Badge>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={section.is_active}
                onCheckedChange={(checked) => toggleSectionActive(section.id, checked)}
              />
              <span className="text-sm text-white/60">
                {section.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {(section.section_type === 'hero' || section.section_type === 'gallery' || section.section_type === 'challenges') && (
            <div className="space-y-4">
              <Label className="text-white">
                {section.section_type === 'hero' ? 'Hero Image' : 
                 section.section_type === 'challenges' ? 'Challenges Section Image' : 'Section Image'}
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {section.image_url ? (
                    <div className="relative">
                      <img
                        src={section.image_url}
                        alt={`${section.section_key} preview`}
                        className="w-full h-64 object-cover rounded-lg shadow-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
                      <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                        Current {section.section_key} Image
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-white/5 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-white/40 mx-auto mb-2" />
                        <p className="text-white/40 text-sm">No image uploaded</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleImageUpload(section.id, file);
                      }
                    }}
                    className="hidden"
                    id={`image-upload-${section.id}`}
                  />
                  <label htmlFor={`image-upload-${section.id}`}>
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white hover:bg-white/10"
                      disabled={imageUploading}
                      asChild
                    >
                      <span>
                        <Upload className="w-4 h-4 mr-2" />
                        {imageUploading ? 'Uploading...' : 'Upload New Image'}
                      </span>
                    </Button>
                  </label>
                  <p className="text-white/60 text-xs">
                    Recommended: 1200x800px, JPG or PNG
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Landing Page Management</h1>
            <p className="text-white/60 mt-2">
              Manage your landing page sections and gallery content
            </p>
          </div>
        </div>

        {/* Landing Page Sections */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Page Sections</h2>
          <div className="grid gap-6">
            {sections.map(renderSectionEditor)}
          </div>
        </div>

        {/* Instagram Feed Management Section */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">Instagram Feed</CardTitle>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={instagramFeedActive}
                  onCheckedChange={toggleInstagramFeed}
                />
                <span className="text-sm text-white/60">
                  {instagramFeedActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <Label className="text-white">Add Instagram Post URL (Max 6)</Label>
              <div className="flex gap-2">
                <Input
                  value={newInstagramUrl}
                  onChange={(e) => setNewInstagramUrl(e.target.value)}
                  placeholder="https://www.instagram.com/p/ABC123/"
                  className="bg-white/5 border-white/10 text-white"
                />
                <Button 
                  onClick={addInstagramPost}
                  disabled={instagramPosts.length >= 6}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </div>
            </div>

            {instagramPosts.length > 0 && (
              <div className="space-y-2">
                <Label className="text-white">Instagram Posts ({instagramPosts.length}/6)</Label>
                <div className="grid gap-2">
                  {instagramPosts.map((post, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-white/5 rounded-lg">
                      <span className="flex-1 text-white text-sm truncate">{post.url}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeInstagramPost(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {instagramPosts.length === 0 && (
              <div className="text-center py-8 border border-dashed border-white/10 rounded-lg">
                <p className="text-white/60">No Instagram posts added yet</p>
                <p className="text-white/40 text-sm mt-1">Add Instagram post URLs to display on the landing page</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Gallery Media Management Section */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Gallery Media Management</h2>
            <Dialog open={showAddMediaModal} onOpenChange={setShowAddMediaModal}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Media
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Media</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">Title</Label>
                    <Input
                      value={newMediaTitle}
                      onChange={(e) => setNewMediaTitle(e.target.value)}
                      placeholder="Enter media title"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Description (Optional)</Label>
                    <Textarea
                      value={newMediaDescription}
                      onChange={(e) => setNewMediaDescription(e.target.value)}
                      placeholder="Enter media description"
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Media Type</Label>
                    <Select value={newMediaType} onValueChange={(value: 'image' | 'video') => setNewMediaType(value)}>
                      <SelectTrigger className="bg-white/5 border-white/20 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="image">Image</SelectItem>
                        <SelectItem value="video">Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Upload File</Label>
                    <Input
                      type="file"
                      accept={newMediaType === 'image' ? "image/*" : "video/*"}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          handleAddMedia(file);
                        }
                      }}
                      className="bg-white/5 border-white/20 text-white"
                      disabled={imageUploading}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryMedia.map((media) => (
              <Card key={media.id} className="glass-effect border-white/10">
                <CardContent className="p-0">
                  <div className="relative aspect-video">
                    {media.media_type === 'video' ? (
                      <video
                        src={media.media_url}
                        className="w-full h-full object-cover rounded-t-lg"
                        muted
                      />
                    ) : (
                      <img
                        src={media.media_url}
                        alt={media.title}
                        className="w-full h-full object-cover rounded-t-lg"
                      />
                    )}
                    <div className="absolute top-2 right-2 bg-black/50 rounded-full p-1">
                      {media.media_type === 'video' ? (
                        <PlayCircle className="w-4 h-4 text-white" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-semibold truncate">{media.title}</h3>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={media.is_active}
                          onCheckedChange={(checked) => toggleMediaActive(media.id, checked)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteMedia(media.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {media.description && (
                      <p className="text-gray-300 text-sm line-clamp-2">{media.description}</p>
                    )}
                    <div className="flex items-center justify-between mt-2 text-xs text-gray-400">
                      <span>{media.is_active ? 'Active' : 'Inactive'}</span>
                      <span>Order: {media.display_order}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {galleryMedia.length === 0 && (
            <div className="text-center py-12">
              <ImageIcon className="w-12 h-12 text-white/40 mx-auto mb-4" />
              <p className="text-white/60">No gallery media added yet.</p>
              <p className="text-white/40 text-sm">Add images and videos to showcase your platform.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LandingPageManagement;