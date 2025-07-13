import React from 'react';
import { useImageAspectRatio } from '@/hooks/useImageAspectRatio';

interface MediaContainerProps {
  imageUrl: string;
  onClick?: () => void;
  className?: string;
}

export const MediaContainer: React.FC<MediaContainerProps> = ({ 
  imageUrl, 
  onClick, 
  className = "" 
}) => {
  const { aspectRatio } = useImageAspectRatio(imageUrl);

  const getContainerClasses = () => {
    const baseClasses = "mb-4 rounded-lg overflow-hidden cursor-pointer";
    
    switch (aspectRatio) {
      case 'portrait':
        return `${baseClasses} max-w-sm mx-auto`;
      case 'landscape':
        return `${baseClasses} w-full`;
      default:
        return `${baseClasses} aspect-square max-w-md mx-auto`;
    }
  };

  const getImageClasses = () => {
    const baseClasses = "object-cover hover:scale-105 transition-transform duration-300";
    
    switch (aspectRatio) {
      case 'portrait':
        return `${baseClasses} w-full h-[500px]`;
      case 'landscape':
        return `${baseClasses} w-full h-80`;
      default:
        return `${baseClasses} w-full h-80`;
    }
  };

  return (
    <div className={`${getContainerClasses()} ${className}`} onClick={onClick}>
      <img 
        src={imageUrl} 
        alt="Post content" 
        className={getImageClasses()}
      />
    </div>
  );
};