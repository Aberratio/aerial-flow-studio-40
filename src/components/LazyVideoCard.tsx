import React from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';

interface GalleryMedia {
  id: string;
  title: string;
  description: string | null;
  media_url: string;
  media_type: 'image' | 'video';
  thumbnail_url: string | null;
  display_order: number;
}

interface LazyVideoCardProps {
  item: GalleryMedia;
}

export const LazyVideoCard: React.FC<LazyVideoCardProps> = ({ item }) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px',
  });

  return (
    <div ref={ref} className="group relative aspect-[4/6] overflow-hidden rounded-2xl">
      {!isIntersecting ? (
        <Skeleton className="w-full h-full rounded-2xl" />
      ) : (
        <>
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
              alt={item.title || 'Gallery image'}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
            />
          )}
          
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          
          {/* Subtle glow effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/20 via-transparent to-teal-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
          
          {/* Hover zoom indicator */}
          <div className="absolute inset-0 border-2 border-white/0 group-hover:border-white/20 transition-colors duration-300 rounded-2xl" />
        </>
      )}
    </div>
  );
};