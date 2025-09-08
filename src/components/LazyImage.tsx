import React, { useState } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton } from '@/components/ui/skeleton';
import { getOptimizedImageUrl, generateImageSrcSet, getImageSizes } from '@/utils/imageOptimization';

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  className?: string;
  skeletonClassName?: string;
  fallbackSrc?: string;
  optimizationOptions?: {
    width?: number;
    height?: number;
    format?: 'webp' | 'jpg' | 'png';
    quality?: number;
  };
  responsive?: boolean;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  skeletonClassName,
  fallbackSrc,
  optimizationOptions,
  responsive = true,
  ...props
}) => {
  const { ref, isIntersecting } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '200px', // Increased for better preloading
  });
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [imageStartedLoading, setImageStartedLoading] = useState(false);

  const handleLoad = () => {
    setIsLoaded(true);
  };

  const handleError = () => {
    setHasError(true);
    if (fallbackSrc) {
      setIsLoaded(true);
    }
  };

  // Get optimized image sources
  const optimizedSrc = getOptimizedImageUrl(src, optimizationOptions);
  const optimizedFallback = fallbackSrc ? getOptimizedImageUrl(fallbackSrc, optimizationOptions) : undefined;
  
  // Generate responsive sources if enabled
  const srcSet = responsive && optimizationOptions?.width 
    ? generateImageSrcSet(src, [400, 450, 500, 600, 800])
    : undefined;
  
  const sizes = responsive ? getImageSizes() : undefined;

  return (
    <div ref={ref} className="relative">
      {(!isLoaded || !imageStartedLoading) && (
        <div className="absolute inset-0 z-10">
          <Skeleton className={`${skeletonClassName || className} animate-pulse`} />
          {imageStartedLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-900/20 to-blue-900/20 backdrop-blur-sm">
              <div className="flex flex-col items-center space-y-3">
                <div className="w-8 h-8 border-2 border-purple-400/30 border-t-purple-400 rounded-full animate-spin"></div>
                <p className="text-white/60 text-sm">Loading image...</p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {isIntersecting && (
        <img
          src={hasError && optimizedFallback ? optimizedFallback : optimizedSrc}
          srcSet={srcSet}
          sizes={sizes}
          alt={alt}
          className={`${className} ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          } transition-opacity duration-500`}
          onLoad={handleLoad}
          onError={handleError}
          onLoadStart={() => setImageStartedLoading(true)}
          loading="eager"
          decoding="async"
          {...props}
        />
      )}
    </div>
  );
};