import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Languages, Type, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { ExerciseTranslation, UIStringManagement, StaticPageManagement } from '@/components/TranslationManagement';

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
  const [activeTab, setActiveTab] = useState('exercises');
  
  const { user } = useAuth();

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
                <ExerciseTranslation
                  figures={figures}
                  translations={translations}
                  languages={languages}
                  onTranslationsUpdate={fetchTranslations}
                />
              </TabsContent>

              <TabsContent value="ui-strings" className="mt-6">
                <UIStringManagement
                  uiStrings={uiStrings}
                  languages={languages}
                  onUIStringsUpdate={fetchUIStrings}
                />
              </TabsContent>

              <TabsContent value="pages" className="mt-6">
                <StaticPageManagement
                  staticPages={staticPages}
                  languages={languages}
                  onStaticPagesUpdate={fetchStaticPages}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}