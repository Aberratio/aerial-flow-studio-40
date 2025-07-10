import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const AboutUs = () => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('title, content')
          .eq('page_key', 'about-us')
          .eq('language_id', currentLanguage)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setContent(data);
        } else {
          // Fallback to default content if no translation exists
          setContent({
            title: 'About Us',
            content: `# Our Mission

AerialJourney is dedicated to creating a supportive community for aerial athletes of all levels. We believe that aerial arts should be accessible, safe, and inspiring for everyone.

# What We Offer

- Comprehensive figure library with detailed instructions
- Progress tracking to monitor your aerial journey
- Social features to connect with fellow aerial athletes
- Challenges to push your limits and stay motivated
- Training sessions tailored to your skill level

# Our Community

Join thousands of aerial enthusiasts who are passionate about silk, lyra, straps, and more. Whether you're a beginner taking your first steps into the air or an advanced practitioner perfecting complex sequences, AerialJourney is here to support your growth.

# Safety First

We prioritize safety in all our content and encourage proper training, warm-up routines, and working with qualified instructors. Always practice aerial arts in a safe environment with proper equipment.

# Contact Us

Have questions or feedback? We'd love to hear from you! Reach out to us at hello@aerialjourney.com`
          });
        }
      } catch (error) {
        console.error('Error fetching about us content:', error);
        setContent({
          title: 'About Us',
          content: 'Unable to load about us content.'
        });
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [currentLanguage]);

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <p className="text-muted-foreground">About us content not available.</p>
      </div>
    );
  }

  // Simple markdown-like rendering for basic formatting
  const renderContent = (text: string) => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('# ')) {
        elements.push(
          <Card key={key++} className="glass-effect border-white/10 mb-6">
            <CardHeader>
              <CardTitle className="text-white">{line.substring(2)}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground space-y-4">
              {/* Collect content until next heading */}
              {(() => {
                const contentLines: string[] = [];
                let j = i + 1;
                while (j < lines.length && !lines[j].trim().startsWith('# ')) {
                  if (lines[j].trim()) {
                    contentLines.push(lines[j].trim());
                  }
                  j++;
                }
                i = j - 1; // Update outer loop counter
                
                const processedContent: JSX.Element[] = [];
                let listItems: string[] = [];
                
                for (let k = 0; k < contentLines.length; k++) {
                  const contentLine = contentLines[k];
                  
                  if (contentLine.startsWith('- ')) {
                    listItems.push(contentLine.substring(2));
                  } else {
                    // If we have accumulated list items, render them first
                    if (listItems.length > 0) {
                      processedContent.push(
                        <ul key={`list-${k}`} className="list-disc pl-6 space-y-2">
                          {listItems.map((item, itemIdx) => (
                            <li key={itemIdx}>{item}</li>
                          ))}
                        </ul>
                      );
                      listItems = [];
                    }
                    
                    // Render the paragraph
                    processedContent.push(<p key={k}>{contentLine}</p>);
                  }
                }
                
                // Handle any remaining list items
                if (listItems.length > 0) {
                  processedContent.push(
                    <ul key={`list-final`} className="list-disc pl-6 space-y-2">
                      {listItems.map((item, itemIdx) => (
                        <li key={itemIdx}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                
                return processedContent;
              })()}
            </CardContent>
          </Card>
        );
      }
    }

    return elements;
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8">{content.title}</h1>
        
        {renderContent(content.content)}
      </div>
    </div>
  );
};

export default AboutUs;