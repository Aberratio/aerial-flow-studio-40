import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data, error } = await supabase
          .from('languages')
          .select('*')
          .order('is_default', { ascending: false });

        if (error) throw error;

        setLanguages(data || []);
        
        // Set default language from localStorage or use the default one
        const savedLanguage = localStorage.getItem('selectedLanguage');
        if (savedLanguage && data?.some(lang => lang.id === savedLanguage)) {
          setCurrentLanguage(savedLanguage);
        } else {
          const defaultLang = data?.find(lang => lang.is_default);
          if (defaultLang) {
            setCurrentLanguage(defaultLang.id);
          }
        }
      } catch (error) {
        console.error('Error fetching languages:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLanguages();
  }, []);

  const handleSetCurrentLanguage = (languageId: string) => {
    setCurrentLanguage(languageId);
    localStorage.setItem('selectedLanguage', languageId);
  };

  return (
    <LanguageContext.Provider 
      value={{ 
        currentLanguage, 
        setCurrentLanguage: handleSetCurrentLanguage, 
        languages, 
        isLoading 
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};