import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Search, Plus, Save, Trash2, Languages, Type, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Figure {
  id: string;
  name: string;
  description?: string;
  instructions?: string;
  tags?: string[];
  category?: string;
  difficulty_level?: string;
}

interface Translation {
  id: string;
  figure_id: string;
  language_id: string;
  name: string;
  description?: string;
  instructions?: string;
  tags?: string[];
}

interface Language {
  id: string;
  name: string;
  native_name: string;
  is_default: boolean;
}

interface UIString {
  id: string;
  string_key: string;
  language_id: string;
  value: string;
  category?: string;
}

interface StaticPage {
  id: string;
  page_key: string;
  language_id: string;
  title: string;
  content: string;
}

export default function TranslationManagement() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [uiStrings, setUIStrings] = useState<UIString[]>([]);
  const [staticPages, setStaticPages] = useState<StaticPage[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedFigure, setSelectedFigure] = useState<Figure | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('exercises');
  
  const { user } = useAuth();
  const { toast } = useToast();

  // Check if user is admin
  const isAdmin = user?.role === 'admin';
  
  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="glass-effect border-white/10">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchLanguages();
    fetchFigures();
    fetchUIStrings();
    fetchStaticPages();
  }, []);

  const fetchLanguages = async () => {
    try {
      const { data, error } = await supabase
        .from('languages')
        .select('*')
        .order('is_default', { ascending: false });

      if (error) throw error;
      setLanguages(data || []);
    } catch (error) {
      console.error('Error fetching languages:', error);
    }
  };

  const fetchFigures = async () => {
    try {
      const { data, error } = await supabase
        .from('figures')
        .select('id, name, description, instructions, tags, category, difficulty_level')
        .order('name');

      if (error) throw error;
      setFigures(data || []);
    } catch (error) {
      console.error('Error fetching figures:', error);
    }
  };

  const fetchUIStrings = async () => {
    try {
      const { data, error } = await supabase
        .from('ui_strings')
        .select('*')
        .order('string_key');

      if (error) throw error;
      setUIStrings(data || []);
    } catch (error) {
      console.error('Error fetching UI strings:', error);
    }
  };

  const fetchStaticPages = async () => {
    try {
      const { data, error } = await supabase
        .from('static_pages')
        .select('*')
        .order('page_key');

      if (error) throw error;
      setStaticPages(data || []);
    } catch (error) {
      console.error('Error fetching static pages:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Languages className="w-8 h-8 mr-3" />
            Translation Management
          </h1>
          <p className="text-muted-foreground">Manage translations for exercises, UI strings, and static pages</p>
        </div>

        <Card className="glass-effect border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Translation Management</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="exercises">
                  <Languages className="w-4 h-4 mr-2" />
                  Exercises
                </TabsTrigger>
                <TabsTrigger value="ui-strings">
                  <Type className="w-4 h-4 mr-2" />
                  UI Strings
                </TabsTrigger>
                <TabsTrigger value="pages">
                  <FileText className="w-4 h-4 mr-2" />
                  Static Pages
                </TabsTrigger>
              </TabsList>

              <TabsContent value="exercises" className="mt-6">
                <div className="text-center py-8">
                  <Languages className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Exercise Translations</h3>
                  <p className="text-muted-foreground">Exercise translation management will be available here</p>
                </div>
              </TabsContent>

              <TabsContent value="ui-strings" className="mt-6">
                <div className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    Manage translations for UI elements like buttons, labels, messages, and alerts.
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Add/Edit UI String</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <Label className="text-white">String Key</Label>
                          <Input 
                            placeholder="e.g., button.save, alert.success"
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>
                        
                        <div>
                          <Label className="text-white">Category</Label>
                          <Select>
                            <SelectTrigger className="bg-white/5 border-white/10 text-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="buttons">Buttons</SelectItem>
                              <SelectItem value="labels">Labels</SelectItem>
                              <SelectItem value="messages">Messages</SelectItem>
                              <SelectItem value="alerts">Alerts</SelectItem>
                              <SelectItem value="navigation">Navigation</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-white">Language</Label>
                          <Select>
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
                          <Label className="text-white">Translation</Label>
                          <Textarea
                            placeholder="Enter the translated text"
                            className="bg-white/5 border-white/10 text-white"
                            rows={3}
                          />
                        </div>

                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                          <Save className="w-4 h-4 mr-2" />
                          Save Translation
                        </Button>
                      </CardContent>
                    </Card>

                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">Existing Strings</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-96 overflow-y-auto">
                          <div className="text-sm text-muted-foreground">
                            No UI strings found. Add some translations to get started.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="pages" className="mt-6">
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
                          <Select>
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
                          <Select>
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
                            className="bg-white/5 border-white/10 text-white"
                          />
                        </div>

                        <div>
                          <Label className="text-white">Content</Label>
                          <Textarea
                            placeholder="Page content (Markdown supported)"
                            className="bg-white/5 border-white/10 text-white"
                            rows={10}
                          />
                        </div>

                        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                          <Save className="w-4 h-4 mr-2" />
                          Save Page
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
                              <div className="flex space-x-2">
                                {languages.map(lang => {
                                  const hasTranslation = staticPages.some(
                                    page => page.page_key === pageKey && page.language_id === lang.id
                                  );
                                  return (
                                    <Badge
                                      key={lang.id}
                                      variant={hasTranslation ? "default" : "outline"}
                                      className={hasTranslation ? "bg-green-500" : "border-gray-500"}
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
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}