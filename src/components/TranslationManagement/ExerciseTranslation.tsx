import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Search, Save, Languages } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
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

interface ExerciseTranslationProps {
  figures: Figure[];
  translations: Translation[];
  languages: Language[];
  onTranslationsUpdate: () => void;
}

export function ExerciseTranslation({ 
  figures, 
  translations, 
  languages, 
  onTranslationsUpdate 
}: ExerciseTranslationProps) {
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
  
  const { toast } = useToast();

  const saveTranslation = async () => {
    if (!selectedFigure || !selectedLanguage || !translationForm.name) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('figure_translations')
        .upsert({
          figure_id: selectedFigure.id,
          language_id: selectedLanguage,
          name: translationForm.name,
          description: translationForm.description || null,
          instructions: translationForm.instructions || null,
          tags: translationForm.tags.length > 0 ? translationForm.tags : null
        }, {
          onConflict: 'figure_id,language_id'
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Exercise translation saved successfully"
      });

      setTranslationForm({ name: '', description: '', instructions: '', tags: [] });
      onTranslationsUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save translation",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load existing translation when figure/language changes
  useEffect(() => {
    if (selectedFigure && selectedLanguage) {
      const existingTranslation = translations.find(
        t => t.figure_id === selectedFigure.id && t.language_id === selectedLanguage
      );
      
      if (existingTranslation) {
        setTranslationForm({
          name: existingTranslation.name,
          description: existingTranslation.description || '',
          instructions: existingTranslation.instructions || '',
          tags: existingTranslation.tags || []
        });
      } else {
        // Load default language content
        setTranslationForm({
          name: selectedFigure.name,
          description: selectedFigure.description || '',
          instructions: selectedFigure.instructions || '',
          tags: selectedFigure.tags || []
        });
      }
    }
  }, [selectedFigure, selectedLanguage, translations]);

  return (
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
            <CardContent className="space-y-4">
              <div>
                <Label className="text-white">Target Language</Label>
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

              {selectedLanguage && (
                <>
                  <div>
                    <Label className="text-white">Exercise Name *</Label>
                    <Input
                      placeholder="Translated exercise name"
                      value={translationForm.name}
                      onChange={(e) => setTranslationForm(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-white">Description</Label>
                    <Textarea
                      placeholder="Translated description"
                      value={translationForm.description}
                      onChange={(e) => setTranslationForm(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Instructions</Label>
                    <Textarea
                      placeholder="Translated instructions"
                      value={translationForm.instructions}
                      onChange={(e) => setTranslationForm(prev => ({ ...prev, instructions: e.target.value }))}
                      className="bg-white/5 border-white/10 text-white"
                      rows={4}
                    />
                  </div>

                  <div>
                    <Label className="text-white">Tags (comma separated)</Label>
                    <Input
                      placeholder="tag1, tag2, tag3"
                      value={translationForm.tags.join(', ')}
                      onChange={(e) => setTranslationForm(prev => ({ 
                        ...prev, 
                        tags: e.target.value.split(',').map(tag => tag.trim()).filter(tag => tag) 
                      }))}
                      className="bg-white/5 border-white/10 text-white"
                    />
                  </div>

                  <Button 
                    onClick={saveTranslation} 
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Translation
                  </Button>
                </>
              )}
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
  );
}