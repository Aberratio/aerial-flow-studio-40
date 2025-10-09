import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLandingSections = () => {
  return useQuery({
    queryKey: ['landing-sections'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('section_key, is_active');
      
      if (error) throw error;

      const sectionsMap = data?.reduce((acc, section) => {
        acc[section.section_key] = section;
        return acc;
      }, {} as Record<string, { section_key: string; is_active: boolean }>);

      return {
        features: sectionsMap?.['features'],
        gallery: sectionsMap?.['gallery'],
        pricing: sectionsMap?.['pricing'],
        cta: sectionsMap?.['cta'],
        instagram_feed: sectionsMap?.['instagram_feed'],
      };
    }
  });
};
