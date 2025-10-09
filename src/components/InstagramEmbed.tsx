import React, { useEffect, useRef } from 'react';
import { Instagram } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface InstagramEmbedProps {
  url: string;
  embedCode?: string;
}

export const InstagramEmbed: React.FC<InstagramEmbedProps> = ({ url, embedCode }) => {
  const embedRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load Instagram embed script
    if (embedCode && embedRef.current) {
      if (window.instgrm) {
        window.instgrm.Embeds.process();
      } else {
        const script = document.createElement('script');
        script.src = '//www.instagram.com/embed.js';
        script.async = true;
        document.body.appendChild(script);
      }
    }
  }, [embedCode]);

  if (embedCode) {
    return (
      <div className="instagram-embed-wrapper w-full max-w-full overflow-hidden">
        <style>{`
          .instagram-embed-wrapper iframe,
          .instagram-embed-wrapper blockquote.instagram-media {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 auto !important;
          }
        `}</style>
        <div 
          ref={embedRef}
          className="instagram-embed-container"
          dangerouslySetInnerHTML={{ __html: embedCode }}
        />
      </div>
    );
  }

  // Fallback if no embed code
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <CardContent className="p-6">
        <a 
          href={url} 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-4 text-center group"
        >
          <Instagram className="w-12 h-12 text-primary group-hover:scale-110 transition-transform" />
          <div>
            <p className="font-medium mb-1">View on Instagram</p>
            <p className="text-sm text-muted-foreground">Click to open post</p>
          </div>
        </a>
      </CardContent>
    </Card>
  );
};

// Extend window interface for Instagram embed script
declare global {
  interface Window {
    instgrm?: {
      Embeds: {
        process: () => void;
      };
    };
  }
}
