import { useState, useEffect } from 'react';

export const useImageAspectRatio = (imageUrl: string | null) => {
  const [aspectRatio, setAspectRatio] = useState<'portrait' | 'landscape' | 'square'>('square');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!imageUrl) {
      setIsLoading(false);
      return;
    }

    const img = new Image();
    
    img.onload = () => {
      const ratio = img.width / img.height;
      
      if (ratio > 1.1) {
        setAspectRatio('landscape');
      } else if (ratio < 0.9) {
        setAspectRatio('portrait');
      } else {
        setAspectRatio('square');
      }
      
      setIsLoading(false);
    };

    img.onerror = () => {
      setAspectRatio('square');
      setIsLoading(false);
    };

    img.src = imageUrl;
  }, [imageUrl]);

  return { aspectRatio, isLoading };
};