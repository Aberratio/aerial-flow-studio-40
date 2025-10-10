import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { InstagramEmbed } from './InstagramEmbed';
import { Instagram } from 'lucide-react';
import { Skeleton } from './ui/skeleton';

interface InstagramPost {
  url: string;
  embed_code?: string;
}

export const InstagramFeedSection: React.FC = () => {
  // Lazy load Instagram embed script only when section is visible
  React.useEffect(() => {
    if (typeof window !== 'undefined' && !(window as any).instgrm) {
      const script = document.createElement('script');
      script.src = '//www.instagram.com/embed.js';
      script.async = true;
      document.body.appendChild(script);
    }
  }, []);

  const { data: sectionData, isLoading } = useQuery({
    queryKey: ['instagram-feed-section'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('landing_page_sections')
        .select('metadata, is_active')
        .eq('section_key', 'instagram_feed')
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return (
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <Skeleton className="h-10 w-64 mx-auto mb-4" />
            <Skeleton className="h-6 w-96 mx-auto" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!sectionData?.is_active) {
    return null;
  }

  const metadata = sectionData.metadata as { instagram_posts?: InstagramPost[] };
  const posts = metadata?.instagram_posts || [];

  if (posts.length === 0) {
    return null;
  }

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-background to-background/50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Instagram className="w-8 h-8 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold">Follow Our Journey</h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join our community on Instagram for daily inspiration, tips, and behind-the-scenes content
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.slice(0, 6).map((post, index) => (
            <InstagramEmbed 
              key={index} 
              url={post.url} 
              embedCode={post.embed_code}
            />
          ))}
        </div>

        <div className="text-center mt-12">
          <a
            href="https://instagram.com/iguana.flow"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-primary/80 text-white rounded-full font-medium hover:shadow-lg transition-all hover:scale-105"
          >
            <Instagram className="w-5 h-5" />
            Follow Us on Instagram
          </a>
        </div>
      </div>
    </section>
  );
};
