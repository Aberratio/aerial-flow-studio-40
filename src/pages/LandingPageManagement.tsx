import React, { useState, useEffect } from 'react';
import { Camera, Save, Upload, Eye, EyeOff, Plus, Trash2, Move, Languages, Settings, Globe } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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

interface LandingPageContent {
  id: string;
  section_id: string;
  language_id: string;
  content_key: string;
  content_value: string;
}

interface Language {
  id: string;
  name: string;
  native_name: string;
  is_default: boolean;
}

const LandingPageManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { userRole } = useUserRole();
  const [sections, setSections] = useState<LandingPageSection[]>([]);
  const [content, setContent] = useState<Record<string, Record<string, Record<string, LandingPageContent>>>>({});
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedSection, setSelectedSection] = useState<LandingPageSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
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

      // Fetch content
      const { data: contentData, error: contentError } = await supabase
        .from('landing_page_content')
        .select('*');

      if (contentError) throw contentError;

      // Organize content by section and language
      const organizedContent: Record<string, Record<string, Record<string, LandingPageContent>>> = {};
      contentData?.forEach(item => {
        if (!organizedContent[item.section_id]) {
          organizedContent[item.section_id] = {};
        }
        if (!organizedContent[item.section_id][item.language_id]) {
          organizedContent[item.section_id][item.language_id] = {};
        }
        organizedContent[item.section_id][item.language_id][item.content_key] = item;
      });
      setContent(organizedContent);

      // Fetch languages
      const { data: languagesData, error: languagesError } = await supabase
        .from('languages')
        .select('*')
        .order('is_default', { ascending: false });

      if (languagesError) throw languagesError;
      setLanguages(languagesData || []);

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

  const handleContentUpdate = async (sectionId: string, languageId: string, contentKey: string, value: string) => {
    try {
      const existingContent = content[sectionId]?.[languageId]?.[contentKey];
      
      if (existingContent) {
        // Update existing content
        const { error } = await supabase
          .from('landing_page_content')
          .update({ content_value: value })
          .eq('id', existingContent.id);

        if (error) throw error;
      } else {
        // Create new content
        const { data, error } = await supabase
          .from('landing_page_content')
          .insert({
            section_id: sectionId,
            language_id: languageId,
            content_key: contentKey,
            content_value: value
          })
          .select()
          .single();

        if (error) throw error;

        // Update local state with new content
        setContent(prev => ({
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            [languageId]: {
              ...prev[sectionId]?.[languageId],
              [contentKey]: data
            }
          }
        }));
      }

      // Update local state for existing content
      if (existingContent) {
        setContent(prev => ({
          ...prev,
          [sectionId]: {
            ...prev[sectionId],
            [languageId]: {
              ...prev[sectionId][languageId],
              [contentKey]: {
                ...existingContent,
                content_value: value
              }
            }
          }
        }));
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update content",
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

  const getContentValue = (sectionId: string, languageId: string, contentKey: string) => {
    return content[sectionId]?.[languageId]?.[contentKey]?.content_value || '';
  };

  const renderSectionEditor = (section: LandingPageSection) => {
    const sectionContent = content[section.id] || {};
    
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
                <div>
                  {section.image_url && (
                    <img
                      src={section.image_url}
                      alt="Hero"
                      className="w-full h-48 object-cover rounded-lg"
                    />
                  )}
                </div>
                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(section.id, file);
                    }}
                    className="hidden"
                    id={`image-upload-${section.id}`}
                  />
                  <label htmlFor={`image-upload-${section.id}`}>
                    <Button
                      variant="outline"
                      className="w-full border-white/20 text-white"
                      disabled={imageUploading}
                      asChild
                    >
                      <span>
                        <Camera className="w-4 h-4 mr-2" />
                        {imageUploading ? 'Uploading...' : 'Upload Image'}
                      </span>
                    </Button>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Language Tabs for Content */}
          <Tabs value={selectedLanguage} onValueChange={setSelectedLanguage}>
            <TabsList className="grid grid-cols-2 w-full max-w-md">
              {languages.map(language => (
                <TabsTrigger 
                  key={language.id} 
                  value={language.id}
                  className="flex items-center space-x-2"
                >
                  <Globe className="w-4 h-4" />
                  <span>{language.native_name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {languages.map(language => (
              <TabsContent key={language.id} value={language.id} className="space-y-4 mt-6">
                {renderContentFields(section, language.id)}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>
    );
  };

  const renderContentFields = (section: LandingPageSection, languageId: string) => {
    const getContentFields = () => {
      switch (section.section_key) {
        case 'hero':
          return [
            { key: 'title', label: 'Main Title', type: 'input' },
            { key: 'subtitle', label: 'Subtitle', type: 'textarea' },
            { key: 'button_text', label: 'Button Text', type: 'input' },
            { key: 'stat_1_value', label: 'Stat 1 Value', type: 'input' },
            { key: 'stat_1_label', label: 'Stat 1 Label', type: 'input' },
            { key: 'stat_2_value', label: 'Stat 2 Value', type: 'input' },
            { key: 'stat_2_label', label: 'Stat 2 Label', type: 'input' },
            { key: 'stat_3_value', label: 'Stat 3 Value', type: 'input' },
            { key: 'stat_3_label', label: 'Stat 3 Label', type: 'input' },
            { key: 'stat_4_value', label: 'Stat 4 Value', type: 'input' },
            { key: 'stat_4_label', label: 'Stat 4 Label', type: 'input' },
          ];
        case 'features':
          return [
            { key: 'title', label: 'Section Title', type: 'input' },
            { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
            { key: 'feature_1_title', label: 'Feature 1 Title', type: 'input' },
            { key: 'feature_1_description', label: 'Feature 1 Description', type: 'textarea' },
            { key: 'feature_2_title', label: 'Feature 2 Title', type: 'input' },
            { key: 'feature_2_description', label: 'Feature 2 Description', type: 'textarea' },
            { key: 'feature_3_title', label: 'Feature 3 Title', type: 'input' },
            { key: 'feature_3_description', label: 'Feature 3 Description', type: 'textarea' },
            { key: 'feature_4_title', label: 'Feature 4 Title', type: 'input' },
            { key: 'feature_4_description', label: 'Feature 4 Description', type: 'textarea' },
          ];
        case 'pricing':
          return [
            { key: 'title', label: 'Section Title', type: 'input' },
            { key: 'subtitle', label: 'Section Subtitle', type: 'textarea' },
            { key: 'free_plan_title', label: 'Free Plan Title', type: 'input' },
            { key: 'free_plan_price', label: 'Free Plan Price', type: 'input' },
            { key: 'free_plan_description', label: 'Free Plan Description', type: 'textarea' },
            { key: 'premium_plan_title', label: 'Premium Plan Title', type: 'input' },
            { key: 'premium_plan_price', label: 'Premium Plan Price', type: 'input' },
            { key: 'premium_plan_description', label: 'Premium Plan Description', type: 'textarea' },
          ];
        case 'cta':
          return [
            { key: 'title', label: 'CTA Title', type: 'input' },
            { key: 'subtitle', label: 'CTA Subtitle', type: 'textarea' },
            { key: 'button_text', label: 'Button Text', type: 'input' },
          ];
        default:
          return [];
      }
    };

    const fields = getContentFields();

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(field => (
          <div key={field.key} className="space-y-2">
            <Label className="text-white">{field.label}</Label>
            {field.type === 'input' ? (
              <Input
                value={getContentValue(section.id, languageId, field.key)}
                onChange={(e) => handleContentUpdate(section.id, languageId, field.key, e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder={`Enter ${field.label.toLowerCase()}`}
              />
            ) : (
              <Textarea
                value={getContentValue(section.id, languageId, field.key)}
                onChange={(e) => handleContentUpdate(section.id, languageId, field.key, e.target.value)}
                className="bg-white/5 border-white/10 text-white"
                placeholder={`Enter ${field.label.toLowerCase()}`}
                rows={3}
              />
            )}
          </div>
        ))}
      </div>
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
    <div className="min-h-screen p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Landing Page Management</h1>
          <p className="text-white/60">Manage your landing page content and translations</p>
        </div>
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="text-emerald-400 border-emerald-400">
            <Languages className="w-4 h-4 mr-2" />
            {languages.length} Languages
          </Badge>
          <Badge variant="outline" className="text-purple-400 border-purple-400">
            <Settings className="w-4 h-4 mr-2" />
            {sections.filter(s => s.is_active).length} Active Sections
          </Badge>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {sections.map(section => (
          <Card key={section.id} className="glass-effect border-white/10 hover:border-white/20 transition-colors">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-white font-medium capitalize">{section.section_key}</h3>
                {section.is_active ? (
                  <Eye className="w-4 h-4 text-emerald-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-red-400" />
                )}
              </div>
              <p className="text-white/60 text-sm mb-3">Order: {section.display_order}</p>
              <div className="text-xs text-white/40">
                Updated: {new Date(section.updated_at).toLocaleDateString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Section Editors */}
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white">Section Editors</h2>
        {sections
          .sort((a, b) => a.display_order - b.display_order)
          .map(section => renderSectionEditor(section))}
      </div>
    </div>
  );
};

export default LandingPageManagement;