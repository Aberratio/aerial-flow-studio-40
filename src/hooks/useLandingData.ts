import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export const useLandingData = () => {
  return useQuery({
    queryKey: ['landing-all-data'],
    queryFn: async () => {
      const [sectionsResult, galleryResult, pricingResult] = await Promise.all([
        supabase
          .from('landing_page_sections')
          .select('*')
          .order('display_order'),
        supabase
          .from('gallery_media')
          .select('*')
          .eq('is_active', true)
          .order('display_order')
          .limit(12),
        supabase
          .from('pricing_plans')
          .select(`
            *,
            pricing_plan_features (
              feature_key,
              is_included,
              display_order
            )
          `)
          .order('display_order'),
      ]);

      if (sectionsResult.error) throw sectionsResult.error;
      if (galleryResult.error) throw galleryResult.error;
      if (pricingResult.error) throw pricingResult.error;

      // Parse sections into easy-to-use format
      const sections = sectionsResult.data?.reduce((acc, section) => {
        acc[section.section_key] = section;
        return acc;
      }, {} as Record<string, any>);

      return {
        sections,
        gallery: galleryResult.data || [],
        pricing: pricingResult.data || [],
      };
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
