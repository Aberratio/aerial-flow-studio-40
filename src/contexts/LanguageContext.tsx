import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Language {
  id: string;
  name: string;
  native_name: string;
  is_default: boolean;
}

interface LanguageContextType {
  currentLanguage: string;
  setCurrentLanguage: (languageId: string) => void;
  languages: Language[];
  isLoading: boolean;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider = ({ children }: LanguageProviderProps) => {
  const [currentLanguage, setCurrentLanguage] = useState<string>('en');
  const [languages, setLanguages] = useState<Language[]>([]);
  const [uiStrings, setUiStrings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const initializeLanguage = async () => {
      try {
        // Fetch available languages
        const { data: languagesData, error: langError } = await supabase
          .from('languages')
          .select('*')
          .order('is_default', { ascending: false });

        if (langError) throw langError;
        setLanguages(languagesData || []);

        // Get user's language preference if logged in
        if (user) {
          const { data: settings, error: settingsError } = await supabase
            .from('user_settings')
            .select('language_preference')
            .eq('user_id', user.id)
            .single();

          if (!settingsError && settings) {
            setCurrentLanguage(settings.language_preference);
          } else {
            // Create default settings for new user
            await supabase
              .from('user_settings')
              .insert({
                user_id: user.id,
                language_preference: 'en'
              });
          }
        } else {
          // Use localStorage for non-logged in users
          const savedLanguage = localStorage.getItem('selectedLanguage');
          if (savedLanguage && languagesData?.some(lang => lang.id === savedLanguage)) {
            setCurrentLanguage(savedLanguage);
          }
        }
      } catch (error) {
        console.error('Error initializing language:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeLanguage();
  }, [user]);

  // Fetch UI strings when language changes
  useEffect(() => {
    const fetchUIStrings = async () => {
      try {
        const { data, error } = await supabase
          .from('ui_strings')
          .select('string_key, value')
          .eq('language_id', currentLanguage);

        if (error) throw error;

        const strings: Record<string, string> = {};
        data?.forEach(item => {
          strings[item.string_key] = item.value;
        });
        setUiStrings(strings);
      } catch (error) {
        console.error('Error fetching UI strings:', error);
      }
    };

    if (currentLanguage) {
      fetchUIStrings();
    }
  }, [currentLanguage]);

  const handleSetCurrentLanguage = async (languageId: string) => {
    setCurrentLanguage(languageId);
    
    if (user) {
      // Save to database for logged in users
      try {
        await supabase
          .from('user_settings')
          .upsert({
            user_id: user.id,
            language_preference: languageId
          });
      } catch (error) {
        console.error('Error saving language preference:', error);
      }
    } else {
      // Save to localStorage for non-logged in users
      localStorage.setItem('selectedLanguage', languageId);
    }
  };

  const t = (key: string): string => {
    return uiStrings[key] || key;
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        currentLanguage, 
        setCurrentLanguage: handleSetCurrentLanguage, 
        languages, 
        isLoading,
        t
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};