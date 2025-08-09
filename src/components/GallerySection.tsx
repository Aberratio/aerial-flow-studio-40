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
        .order('display_order');

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
        {[...Array(8)].map((_, i) => (
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
      {mediaItems.map((item) => (
        <Dialog key={item.id}>
          <DialogTrigger asChild>
            <div className="group relative aspect-[4/6] overflow-hidden rounded-2xl cursor-pointer">
              {item.media_type === 'video' ? (
                <video
                  src={item.media_url}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  autoPlay
                  muted
                  loop
                  playsInline
                />
              ) : (
                <img
                  src={item.thumbnail_url || item.media_url}
                  alt=""
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              )}
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              {/* Subtle glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
              
              {/* Floating play icon for videos */}
              {item.media_type === 'video' && (
                <div className="absolute top-3 right-3 opacity-70 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <PlayCircle className="w-5 h-5 text-white" />
                  </div>
                </div>
              )}
              
              {/* Hover zoom indicator */}
              <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 transition-colors duration-300 rounded-2xl" />
            </div>
          </DialogTrigger>
          
          <DialogContent className="max-w-5xl max-h-[90vh] bg-black/95 border-white/10">
            <div className="space-y-4">
              {item.media_type === 'video' ? (
                <video
                  src={item.media_url}
                  controls
                  className="w-full max-h-[80vh] rounded-xl object-contain"
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <img
                  src={item.media_url}
                  alt=""
                  className="w-full max-h-[80vh] object-contain rounded-xl"
                />
              )}
              
              {item.description && (
                <p className="text-gray-300 text-center px-4">{item.description}</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      ))}
    </div>
  );
};