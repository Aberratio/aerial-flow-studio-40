import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export const LanguageSelector = () => {
  const { currentLanguage, setCurrentLanguage, languages, isLoading } = useLanguage();

  if (isLoading || languages.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <Globe className="w-4 h-4 text-muted-foreground" />
      <Select value={currentLanguage} onValueChange={setCurrentLanguage}>
        <SelectTrigger className="w-auto min-w-[100px] bg-white/5 border-white/10 text-white">
          <SelectValue>
            {languages.find(lang => lang.id === currentLanguage)?.native_name}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {languages.map(language => (
            <SelectItem key={language.id} value={language.id}>
              {language.native_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};