import React from 'react';
import { useImageAspectRatio } from '@/hooks/useImageAspectRatio';

interface PostPreviewImageProps {
  imageUrl: string;
}

export const PostPreviewImage: React.FC<PostPreviewImageProps> = ({ imageUrl }) => {
  const { aspectRatio } = useImageAspectRatio(imageUrl);

  const getImageClasses = () => {
    const baseClasses = "object-contain cursor-zoom-in";
    
    switch (aspectRatio) {
      case 'portrait':
        return `${baseClasses} max-h-full w-auto mx-auto`;
      case 'landscape':
        return `${baseClasses} w-full h-auto max-h-full`;
      default:
        return `${baseClasses} max-w-full max-h-full w-full`;
    }
  };

  return (
    <img 
      src={imageUrl} 
      alt="Post content"
      className={getImageClasses()}
    />
  );
};