import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Search, Plus, Save, Trash2, Languages } from 'lucide-react';
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

export default function TranslationManagement() {
  const [figures, setFigures] = useState<Figure[]>([]);
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [languages, setLanguages] = useState<Language[]>([]);
  const [selectedFigure, setSelectedFigure] = useState<Figure | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [translationForm, setTranslationForm] = useState({
    name: '',
    description: '',
    instructions: '',
    tags: [] as string[]
  });
  const [tagInput, setTagInput] = useState('');
  
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
  }, []);

  useEffect(() => {
    if (selectedFigure) {
      fetchTranslations(selectedFigure.id);
    }
  }, [selectedFigure]);

  useEffect(() => {
    if (selectedFigure && selectedLanguage) {
      loadTranslationForLanguage();
    }
  }, [selectedFigure, selectedLanguage]);

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

  const fetchTranslations = async (figureId: string) => {
    try {
      const { data, error } = await supabase
        .from('figure_translations')
        .select('*')
        .eq('figure_id', figureId);

      if (error) throw error;
      setTranslations(data || []);
    } catch (error) {
      console.error('Error fetching translations:', error);
    }
  };

  const loadTranslationForLanguage = () => {
    const translation = translations.find(t => t.language_id === selectedLanguage);
    
    if (translation) {
      setTranslationForm({
        name: translation.name || '',
        description: translation.description || '',
        instructions: translation.instructions || '',
        tags: translation.tags || []
      });
    } else {
      // Load default values from the original figure
      setTranslationForm({
        name: selectedFigure?.name || '',
        description: selectedFigure?.description || '',
        instructions: selectedFigure?.instructions || '',
        tags: selectedFigure?.tags || []
      });
    }
    setTagInput('');
  };

  const saveTranslation = async () => {
    if (!selectedFigure || !selectedLanguage) return;

    setIsLoading(true);
    try {
      const existingTranslation = translations.find(t => t.language_id === selectedLanguage);
      
      const translationData = {
        figure_id: selectedFigure.id,
        language_id: selectedLanguage,
        name: translationForm.name.trim(),
        description: translationForm.description.trim() || null,
        instructions: translationForm.instructions.trim() || null,
        tags: translationForm.tags.length > 0 ? translationForm.tags : null
      };

      if (existingTranslation) {
        // Update existing translation
        const { error } = await supabase
          .from('figure_translations')
          .update(translationData)
          .eq('id', existingTranslation.id);

        if (error) throw error;
      } else {
        // Create new translation
        const { error } = await supabase
          .from('figure_translations')
          .insert(translationData);

        if (error) throw error;
      }

      toast({
        title: "Translation Saved",
        description: "The translation has been successfully saved."
      });

      // Refresh translations
      fetchTranslations(selectedFigure.id);
    } catch (error: any) {
      console.error('Error saving translation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to save translation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTranslation = async () => {
    if (!selectedFigure || !selectedLanguage) return;

    const existingTranslation = translations.find(t => t.language_id === selectedLanguage);
    if (!existingTranslation) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('figure_translations')
        .delete()
        .eq('id', existingTranslation.id);

      if (error) throw error;

      toast({
        title: "Translation Deleted",
        description: "The translation has been successfully deleted."
      });

      // Refresh translations and clear form
      fetchTranslations(selectedFigure.id);
      setTranslationForm({
        name: '',
        description: '',
        instructions: '',
        tags: []
      });
    } catch (error: any) {
      console.error('Error deleting translation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete translation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !translationForm.tags.includes(tag)) {
      setTranslationForm(prev => ({ ...prev, tags: [...prev.tags, tag] }));
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTranslationForm(prev => ({ 
      ...prev, 
      tags: prev.tags.filter(tag => tag !== tagToRemove) 
    }));
  };

  const filteredFigures = figures.filter(figure =>
    figure.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTranslationStatus = (figureId: string, languageId: string) => {
    return translations.some(t => t.figure_id === figureId && t.language_id === languageId);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center">
            <Languages className="w-8 h-8 mr-3" />
            Translation Management
          </h1>
          <p className="text-muted-foreground">Manage exercise translations for different languages</p>
        </div>

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
                {filteredFigures.map(figure => (
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
                      {languages.map(lang => (
                        <div
                          key={lang.id}
                          className={`w-2 h-2 rounded-full ${
                            getTranslationStatus(figure.id, lang.id)
                              ? 'bg-green-500'
                              : 'bg-gray-500'
                          }`}
                          title={`${lang.native_name} ${getTranslationStatus(figure.id, lang.id) ? 'translated' : 'not translated'}`}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Translation Form */}
          <div className="lg:col-span-2">
            {selectedFigure ? (
              <Card className="glass-effect border-white/10">
                <CardHeader>
                  <CardTitle className="text-white">
                    Translate: {selectedFigure.name}
                  </CardTitle>
                  <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                    <SelectTrigger className="bg-white/5 border-white/10 text-white">
                      <SelectValue placeholder="Select language to translate" />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map(lang => (
                        <SelectItem key={lang.id} value={lang.id}>
                          <div className="flex items-center space-x-2">
                            <span>{lang.native_name}</span>
                            {getTranslationStatus(selectedFigure.id, lang.id) && (
                              <Badge variant="outline" className="text-xs">Translated</Badge>
                            )}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardHeader>

                {selectedLanguage && (
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-white">Exercise Name *</Label>
                      <Input
                        value={translationForm.name}
                        onChange={(e) => setTranslationForm(prev => ({ ...prev, name: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        placeholder="Exercise name in selected language"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Description</Label>
                      <Textarea
                        value={translationForm.description}
                        onChange={(e) => setTranslationForm(prev => ({ ...prev, description: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        rows={3}
                        placeholder="Description in selected language"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Instructions</Label>
                      <Textarea
                        value={translationForm.instructions}
                        onChange={(e) => setTranslationForm(prev => ({ ...prev, instructions: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                        rows={4}
                        placeholder="Instructions in selected language"
                      />
                    </div>

                    <div>
                      <Label className="text-white">Tags</Label>
                      <div className="flex space-x-2 mt-2">
                        <Input
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                          className="bg-white/5 border-white/10 text-white"
                          placeholder="Add a tag (press Enter)"
                        />
                        <Button onClick={addTag} disabled={!tagInput.trim()}>
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      {translationForm.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {translationForm.tags.map((tag, index) => (
                            <Badge 
                              key={index} 
                              variant="outline" 
                              className="border-purple-500/30 text-purple-300"
                            >
                              {tag}
                              <button
                                onClick={() => removeTag(tag)}
                                className="ml-1 hover:text-red-400"
                              >
                                ×
                              </button>
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <Button
                        onClick={saveTranslation}
                        disabled={isLoading || !translationForm.name.trim()}
                        className="bg-gradient-to-r from-purple-500 to-pink-500"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {isLoading ? 'Saving...' : 'Save Translation'}
                      </Button>
                      
                      {translations.some(t => t.language_id === selectedLanguage) && (
                        <Button
                          variant="destructive"
                          onClick={deleteTranslation}
                          disabled={isLoading}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Translation
                        </Button>
                      )}
                    </div>
                  </CardContent>
                )}
              </Card>
            ) : (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-8 text-center">
                  <Languages className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-white mb-2">Select an Exercise</h3>
                  <p className="text-muted-foreground">Choose an exercise from the list to start translating</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}