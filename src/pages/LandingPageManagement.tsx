import React, { useState, useEffect } from 'react';
import { Camera, Save, Upload, Eye, EyeOff, Plus, Trash2, Move, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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

const LandingPageManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userRole } = useUserRole();
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);

  // Fetch data
  useEffect(() => {
    if (userRole === 'admin') {
      fetchData();
    } else {
      setIsLoading(false);
    }
  }, [userRole]);

  // Render access denied if not admin
  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8">
          <CardContent className="text-center">
            <h2 className="text-2xl font-bold mb-4">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch sections
      const { data: sectionsData, error: sectionsError } = await supabase
        .from('landing_page_sections')
        .select('*')
        .order('display_order');

      if (sectionsError) throw sectionsError;
      setSections(sectionsData || []);

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch data",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = async (sectionId: string, file: File) => {
    setImageUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `landing-${sectionId}-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(`landing-page/${fileName}`, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('posts')
        .getPublicUrl(`landing-page/${fileName}`);

      // Update section with new image URL
      const { error: updateError } = await supabase
        .from('landing_page_sections')
        .update({ image_url: publicUrl })
        .eq('id', sectionId);

      if (updateError) throw updateError;

      // Update local state
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
          {/* Image Upload */}
          {section.section_type === 'hero' && (
            <div className="space-y-4">
              <Label className="text-white">Hero Image</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  {section.image_url ? (
                    <div className="relative">
                      <img
                        src={section.image_url}
                        alt="Hero preview"
                        className="w-full h-64 object-cover rounded-lg shadow-lg"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent rounded-lg"></div>
                      <div className="absolute bottom-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                        Current Hero Image
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-white/5 border-2 border-dashed border-white/20 rounded-lg flex items-center justify-center">
                      <div className="text-center">
                        <Camera className="w-8 h-8 text-white/40 mx-auto mb-2" />
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
                        <Camera className="w-4 h-4 mr-2" />
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

          <div className="space-y-4">
            <p className="text-white/60 text-sm">
              Note: Landing page content is now hardcoded in English. To modify content, update the Landing.tsx component directly.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Landing Page Management</h1>
            <p className="text-muted-foreground mt-2">
              Manage your landing page sections and content
            </p>
          </div>
        </div>

        <Separator className="bg-white/10" />

        {/* Sections List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Landing Page Sections
            </h2>
          </div>

          <div className="space-y-6">
            {sections.map(renderSectionEditor)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPageManagement;