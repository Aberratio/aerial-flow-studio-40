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
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="glass-effect border-white/10 animate-pulse">
            <CardContent className="p-0">
              <div className="aspect-video bg-white/10 rounded-t-lg"></div>
              <div className="p-4">
                <div className="h-4 bg-white/10 rounded mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
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
    <>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mediaItems.map((item) => (
          <Dialog key={item.id}>
            <DialogTrigger asChild>
              <Card className="glass-effect border-white/10 hover:border-white/20 transition-all duration-300 cursor-pointer group">
                <CardContent className="p-0">
                  <div className="relative aspect-video overflow-hidden rounded-t-lg">
                    <img
                      src={item.thumbnail_url || item.media_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                    
                    {/* Media Type Indicator */}
                    <div className="absolute top-2 right-2">
                      {item.media_type === 'video' ? (
                        <div className="bg-black/50 rounded-full p-1">
                          <PlayCircle className="w-6 h-6 text-white" />
                        </div>
                      ) : (
                        <div className="bg-black/50 rounded-full p-1">
                          <ImageIcon className="w-6 h-6 text-white" />
                        </div>
                      )}
                    </div>

                    {/* Play overlay for videos */}
                    {item.media_type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-white/20 rounded-full p-4 backdrop-blur-sm">
                          <PlayCircle className="w-12 h-12 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4">
                    <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                      {item.title}
                    </h3>
                    {item.description && (
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {item.description}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </DialogTrigger>
            
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle className="text-white">{item.title}</DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                {item.media_type === 'video' ? (
                  <video
                    src={item.media_url}
                    controls
                    className="w-full max-h-[60vh] rounded-lg"
                    autoPlay
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src={item.media_url}
                    alt={item.title}
                    className="w-full max-h-[60vh] object-contain rounded-lg"
                  />
                )}
                
                {item.description && (
                  <p className="text-gray-300">{item.description}</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        ))}
      </div>
    </>
  );
};