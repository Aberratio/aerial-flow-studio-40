import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const TermsOfUse = () => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('title, content')
          .eq('page_key', 'terms-of-use')
          .eq('language_id', currentLanguage)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setContent(data);
        } else {
          // Fallback to default content if no translation exists
          setContent({
            title: 'Terms of Use',
            content: `# Acceptance of Terms

By accessing and using AerialJourney, you accept and agree to be bound by the terms and provision of this agreement.

# Scoring System & Points

AerialJourney uses a scoring system to reward user engagement and progress. Points are awarded for various activities:

- Create Post: 10 points - Sharing your aerial journey with the community
- Receive Like: 2 points - When someone likes your post
- Write Comment: 5 points - Engaging with others' content
- Receive Comment: 3 points - When someone comments on your post
- Complete Challenge Day: 25 points - Finishing a day in any challenge
- Complete Figure: 15 points - Mastering a new aerial figure
- Send Friend Request: 2 points - Reaching out to new friends
- Accept Friend Request: 5 points - Welcoming new friends
- Friend Request Accepted: 5 points - When someone accepts your friend request
- Follow Someone: 1 point - Building your network
- Gain Follower: 5 points - When someone follows you
- Complete Training Session: 20 points - Finishing a custom training session

Points are automatically calculated and added to your total score. The scoring system is designed to encourage active participation and progress tracking.

# User Conduct

You agree not to:

- Post content that is illegal, harmful, or offensive
- Harass or intimidate other users
- Share false or misleading information
- Attempt to manipulate the scoring system
- Use the platform for commercial purposes without permission

# Content Ownership

You retain ownership of the content you post. By posting content, you grant us a non-exclusive license to use, display, and distribute your content on our platform.

# Limitation of Liability

AerialJourney is provided "as is" without warranties. We are not liable for any damages arising from your use of the platform.`
          });
        }
      } catch (error) {
        console.error('Error fetching terms of use:', error);
        setContent({
          title: 'Terms of Use',
          content: 'Unable to load terms of use content.'
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
        <p className="text-muted-foreground">Terms of use not available.</p>
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

export default TermsOfUse;