import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { PlayCircle, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { LazyVideoCard } from '@/components/LazyVideoCard';

interface GalleryMedia {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url: string | null;
  display_order: number;
}

export const GallerySection: React.FC = () => {
  const [mediaItems, setMediaItems] = useState<GalleryMedia[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<GalleryMedia | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGalleryMedia();
  }, []);

  const fetchGalleryMedia = async () => {
    try {
      const { data, error } = await supabase
        .from('gallery_media')
        .select('*')
        .eq('is_active', true)
        .order('display_order')
        .limit(12);

      if (error) throw error;
      setMediaItems((data || []) as GalleryMedia[]);
    } catch (error) {
      console.error('Error fetching gallery media:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {[...Array(12)].map((_, i) => (
          <div key={i} className="aspect-[4/5] bg-white/10 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (mediaItems.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-300 text-lg">No media content available yet.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {mediaItems.map((item, index) => (
        <LazyVideoCard key={item.id} item={item} />
      ))}
    </div>
  );
};