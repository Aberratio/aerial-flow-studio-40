import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Upload, Save, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

const formSchema = z.object({
  logo: z.any().optional(),
});

type FormData = z.infer<typeof formSchema>;

const SiteSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [currentLogo, setCurrentLogo] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Fetch current logo
  useEffect(() => {
    const fetchCurrentLogo = async () => {
      try {
        const { data, error } = await supabase
          .from('site_settings')
          .select('file_url')
          .eq('setting_key', 'site_logo')
          .single();

        if (error) throw error;
        if (data?.file_url) {
          setCurrentLogo(data.file_url);
        }
      } catch (error) {
        console.error('Error fetching current logo:', error);
      }
    };

    fetchCurrentLogo();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!logoFile) {
      toast({
        title: "Error",
        description: "Please select a logo file",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Upload logo to storage
      const fileExt = logoFile.name.split('.').pop();
      const fileName = `site-logo-${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('posts')
        .upload(fileName, logoFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('posts')
        .getPublicUrl(fileName);

      // Update site settings
      const { error: updateError } = await supabase
        .from('site_settings')
        .update({
          file_url: urlData.publicUrl,
          created_by: user?.id,
        })
        .eq('setting_key', 'site_logo');

      if (updateError) throw updateError;

      setCurrentLogo(urlData.publicUrl);
      setLogoFile(null);
      setLogoPreview(null);
      form.reset();

      toast({
        title: "Success",
        description: "Site logo updated successfully",
      });
    } catch (error) {
      console.error('Error updating logo:', error);
      toast({
        title: "Error",
        description: "Failed to update site logo",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Site Settings</h1>
          <p className="text-muted-foreground">Manage basic site information and branding</p>
        </div>

        <Card className="glass-card border-white/10">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              Site Logo
            </CardTitle>
            <CardDescription>
              Upload and manage your site logo. This will be displayed in the navigation.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Current Logo Display */}
            {currentLogo && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Current Logo</label>
                <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                  <img 
                    src={currentLogo} 
                    alt="Current site logo" 
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white">Upload New Logo</FormLabel>
                      <FormControl>
                        <div className="space-y-4">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="bg-white/5 border-white/10 text-white file:bg-white/10 file:border-0 file:text-white file:mr-4 file:py-2 file:px-4 file:rounded-md"
                          />
                          
                          {/* Logo Preview */}
                          {logoPreview && (
                            <div className="space-y-2">
                              <label className="text-sm font-medium text-white">Preview</label>
                              <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-lg flex items-center justify-center">
                                <img 
                                  src={logoPreview} 
                                  alt="Logo preview" 
                                  className="max-w-full max-h-full object-contain rounded-lg"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button 
                  type="submit" 
                  disabled={isLoading || !logoFile}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                >
                  {isLoading ? (
                    "Uploading..."
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Update Logo
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SiteSettings;