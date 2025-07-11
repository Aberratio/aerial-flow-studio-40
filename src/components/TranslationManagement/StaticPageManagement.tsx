import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Save } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface StaticPage {
  id: string;
  page_key: string;
  language_id: string;
  title: string;
  content: string;
}

interface Language {
  id: string;
  name: string;
  native_name: string;
  is_default: boolean;
}

interface StaticPageManagementProps {
  staticPages: StaticPage[];
  languages: Language[];
  onStaticPagesUpdate: () => void;
}

export function StaticPageManagement({ 
  staticPages, 
  languages, 
  onStaticPagesUpdate 
}: StaticPageManagementProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageForm, setPageForm] = useState({
    page_key: '',
    title: '',
    content: ''
  });
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  
  const { toast } = useToast();

  const saveStaticPage = async () => {
    if (!pageForm.page_key || !selectedLanguage || !pageForm.title || !pageForm.content) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingPageId) {
        const { error } = await supabase
          .from('static_pages')
          .update({
            title: pageForm.title,
            content: pageForm.content
          })
          .eq('id', editingPageId);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('static_pages')
          .upsert({
            page_key: pageForm.page_key,
            language_id: selectedLanguage,
            title: pageForm.title,
            content: pageForm.content
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "Static page saved successfully"
      });

      setPageForm({ page_key: '', title: '', content: '' });
      setEditingPageId(null);
      onStaticPagesUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save static page",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-sm text-muted-foreground">
        Manage content for static pages like Privacy Policy, Terms of Use, and About Us in multiple languages.
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Edit Page Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-white">Page</Label>
              <Select value={pageForm.page_key} onValueChange={(value) => {
                setPageForm(prev => ({ ...prev, page_key: value }));
                // Load existing content if available
                if (value && selectedLanguage) {
                  const existing = staticPages.find(p => p.page_key === value && p.language_id === selectedLanguage);
                  if (existing) {
                    setPageForm(prev => ({ ...prev, title: existing.title, content: existing.content }));
                    setEditingPageId(existing.id);
                  } else {
                    setPageForm(prev => ({ ...prev, title: '', content: '' }));
                    setEditingPageId(null);
                  }
                }
              }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="privacy-policy">Privacy Policy</SelectItem>
                  <SelectItem value="terms-of-use">Terms of Use</SelectItem>
                  <SelectItem value="about-us">About Us</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Language</Label>
              <Select value={selectedLanguage} onValueChange={(value) => {
                setSelectedLanguage(value);
                // Load existing content if available
                if (value && pageForm.page_key) {
                  const existing = staticPages.find(p => p.page_key === pageForm.page_key && p.language_id === value);
                  if (existing) {
                    setPageForm(prev => ({ ...prev, title: existing.title, content: existing.content }));
                    setEditingPageId(existing.id);
                  } else {
                    setPageForm(prev => ({ ...prev, title: '', content: '' }));
                    setEditingPageId(null);
                  }
                }
              }}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {languages.map(lang => (
                    <SelectItem key={lang.id} value={lang.id}>
                      {lang.native_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-white">Title</Label>
              <Input 
                placeholder="Page title"
                value={pageForm.title}
                onChange={(e) => setPageForm(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <Label className="text-white">Content (Markdown)</Label>
              <Textarea
                placeholder="Page content (Markdown supported)"
                value={pageForm.content}
                onChange={(e) => setPageForm(prev => ({ ...prev, content: e.target.value }))}
                className="bg-white/5 border-white/10 text-white"
                rows={10}
              />
            </div>

            <Button 
              variant="primary"
              onClick={saveStaticPage}
              disabled={isLoading}
              className="w-full"
            >
              <Save className="w-4 h-4 mr-2" />
              {editingPageId ? 'Update' : 'Save'} Page
            </Button>
          </CardContent>
        </Card>

        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white text-lg">Page Versions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['privacy-policy', 'terms-of-use', 'about-us'].map(pageKey => (
                <div key={pageKey} className="p-4 bg-white/5 rounded-lg">
                  <h4 className="text-white font-medium mb-2 capitalize">
                    {pageKey.replace('-', ' ')}
                  </h4>
                  <div className="flex space-x-2 mb-3">
                    {languages.map(lang => {
                      const page = staticPages.find(
                        page => page.page_key === pageKey && page.language_id === lang.id
                      );
                      return (
                        <Badge
                          key={lang.id}
                          variant={page ? "default" : "outline"}
                          className={`cursor-pointer ${page ? "bg-green-500 hover:bg-green-600" : "border-gray-500 hover:bg-white/10"}`}
                          onClick={() => {
                            if (page) {
                              setPageForm({
                                page_key: pageKey,
                                title: page.title,
                                content: page.content
                              });
                              setSelectedLanguage(lang.id);
                              setEditingPageId(page.id);
                            } else {
                              setPageForm({
                                page_key: pageKey,
                                title: '',
                                content: ''
                              });
                              setSelectedLanguage(lang.id);
                              setEditingPageId(null);
                            }
                          }}
                        >
                          {lang.id.toUpperCase()}
                        </Badge>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}