// Image optimization utilities

export const getOptimizedImageUrl = (originalUrl: string, options?: {
  width?: number;
  height?: number;
  format?: 'webp' | 'jpg' | 'png';
  quality?: number;
}) => {
  if (!originalUrl) return originalUrl;
  
  // If it's already a Supabase storage URL, use it as is
  if (originalUrl.includes('supabase.co/storage')) {
    return originalUrl;
  }
  
  // For Unsplash images, add optimization parameters
  if (originalUrl.includes('unsplash.com')) {
    const url = new URL(originalUrl);
    
    if (options?.width) url.searchParams.set('w', options.width.toString());
    if (options?.height) url.searchParams.set('h', options.height.toString());
    if (options?.format) url.searchParams.set('fm', options.format);
    if (options?.quality) url.searchParams.set('q', options.quality.toString());
    
    // Add auto optimization
    url.searchParams.set('auto', 'format');
    url.searchParams.set('fit', 'crop');
    
    return url.toString();
  }
  
  return originalUrl;
};

export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

export const generateImageSrcSet = (baseUrl: string, sizes: number[]) => {
  return sizes
    .map(size => `${getOptimizedImageUrl(baseUrl, { width: size })} ${size}w`)
    .join(', ');
};

export const getImageSizes = (breakpoints?: {
  mobile?: string;
  tablet?: string;
  desktop?: string;
}) => {
  const defaultBreakpoints = {
    mobile: '400px',
    tablet: '450px',
    desktop: '500px'
  };
  
  const bp = { ...defaultBreakpoints, ...breakpoints };
  
  return `(max-width: 640px) ${bp.mobile}, (max-width: 1024px) ${bp.tablet}, ${bp.desktop}`;
};