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
  const [selectedUIString, setSelectedUIString] = useState<UIString | null>(null);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [uiSearchTerm, setUISearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('exercises');
  const [uiStringForm, setUIStringForm] = useState({
    string_key: '',
    category: '',
    value: ''
  });
  const [editingStringId, setEditingStringId] = useState<string | null>(null);
  
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
    fetchTranslations();
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

  const fetchTranslations = async () => {
    try {
      const { data, error } = await supabase
        .from('figure_translations')
        .select('*');

      if (error) throw error;
      setTranslations(data || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
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

  const saveUIString = async () => {
    if (!uiStringForm.string_key || !selectedLanguage || !uiStringForm.value) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      if (editingStringId) {
        // Update existing string
        const { error } = await supabase
          .from('ui_strings')
          .update({
            value: uiStringForm.value,
            category: uiStringForm.category || null
          })
          .eq('id', editingStringId);

        if (error) throw error;
      } else {
        // Create new string
        const { error } = await supabase
          .from('ui_strings')
          .insert({
            string_key: uiStringForm.string_key,
            language_id: selectedLanguage,
            value: uiStringForm.value,
            category: uiStringForm.category || null
          });

        if (error) throw error;
      }

      toast({
        title: "Success",
        description: "UI string saved successfully"
      });

      // Reset form
      setUIStringForm({ string_key: '', category: '', value: '' });
      setEditingStringId(null);
      fetchUIStrings();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save UI string",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
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
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Figures List */}
                  <Card className="glass-effect border-white/10">
                    <CardHeader>
                      <CardTitle className="text-white">Exercises</CardTitle>
                      <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search exercises..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 bg-white/5 border-white/10 text-white"
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="max-h-96 overflow-y-auto">
                      <div className="space-y-2">
                        {figures.filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase())).map(figure => (
                          <div
                            key={figure.id}
                            onClick={() => setSelectedFigure(figure)}
                            className={`p-3 rounded-lg cursor-pointer transition-colors ${
                              selectedFigure?.id === figure.id
                                ? 'bg-purple-500/20 border border-purple-500/30'
                                : 'bg-white/5 hover:bg-white/10'
                            }`}
                          >
                            <div className="font-medium text-white">{figure.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {figure.category} • {figure.difficulty_level}
                            </div>
                            <div className="flex space-x-1 mt-2">
                              {languages.map(lang => {
                                const hasTranslation = translations.some(t => t.figure_id === figure.id && t.language_id === lang.id);
                                return (
                                  <div
                                    key={lang.id}
                                    className={`w-2 h-2 rounded-full ${
                                      hasTranslation ? 'bg-green-500' : 'bg-gray-500'
                                    }`}
                                    title={`${lang.native_name} ${hasTranslation ? 'translated' : 'not translated'}`}
                                  />
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2">
                    {selectedFigure ? (
                      <Card className="glass-effect border-white/10">
                        <CardHeader>
                          <CardTitle className="text-white">Translate: {selectedFigure.name}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-muted-foreground">Exercise translation interface would go here</p>
                        </CardContent>
                      </Card>
                    ) : (
                      <Card className="glass-effect border-white/10">
                        <CardContent className="p-8 text-center">
                          <Languages className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-xl font-semibold text-white mb-2">Select an Exercise</h3>
                          <p className="text-muted-foreground">Choose an exercise to translate</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="ui-strings" className="mt-6">
                <div className="space-y-6">
                  <div className="text-sm text-muted-foreground">
                    Manage translations for UI elements. Total strings: {uiStrings.length}
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
                            value={uiStringForm.string_key}
                            onChange={(e) => setUIStringForm(prev => ({ ...prev, string_key: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white"
                            disabled={!!editingStringId}
                          />
                        </div>
                        
                        <div>
                          <Label className="text-white">Category</Label>
                          <Select 
                            value={uiStringForm.category} 
                            onValueChange={(value) => setUIStringForm(prev => ({ ...prev, category: value }))}
                          >
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
                          <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
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
                            value={uiStringForm.value}
                            onChange={(e) => setUIStringForm(prev => ({ ...prev, value: e.target.value }))}
                            className="bg-white/5 border-white/10 text-white"
                            rows={3}
                          />
                        </div>

                        <div className="flex space-x-2">
                          <Button 
                            onClick={saveUIString} 
                            disabled={isLoading}
                            className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            {editingStringId ? 'Update' : 'Save'} Translation
                          </Button>
                          {editingStringId && (
                            <Button 
                              variant="outline"
                              onClick={() => {
                                setEditingStringId(null);
                                setUIStringForm({ string_key: '', category: '', value: '' });
                              }}
                              className="border-white/20 text-white"
                            >
                              Cancel
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass-effect border-white/10">
                      <CardHeader>
                        <CardTitle className="text-white text-lg">UI Strings</CardTitle>
                        <div className="relative">
                          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Search strings..."
                            value={uiSearchTerm}
                            onChange={(e) => setUISearchTerm(e.target.value)}
                            className="pl-10 bg-white/5 border-white/10 text-white"
                          />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3 max-h-96 overflow-y-auto">
                          {uiStrings
                            .filter(str => 
                              str.string_key.toLowerCase().includes(uiSearchTerm.toLowerCase()) ||
                              str.value.toLowerCase().includes(uiSearchTerm.toLowerCase())
                            )
                            .map(string => (
                            <div key={string.id} className="p-3 bg-white/5 rounded-lg">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="text-white font-medium text-sm">{string.string_key}</div>
                                  <div className="text-muted-foreground text-xs mb-1">
                                    {string.language_id.toUpperCase()} • {string.category}
                                  </div>
                                  <div className="text-white text-sm">{string.value}</div>
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => {
                                    setUIStringForm({
                                      string_key: string.string_key,
                                      category: string.category || '',
                                      value: string.value
                                    });
                                    setSelectedLanguage(string.language_id);
                                    setEditingStringId(string.id);
                                  }}
                                  className="text-white hover:bg-white/10"
                                >
                                  Edit
                                </Button>
                              </div>
                            </div>
                          ))}
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