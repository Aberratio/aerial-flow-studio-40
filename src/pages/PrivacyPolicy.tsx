import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';

const PrivacyPolicy = () => {
  const { currentLanguage } = useLanguage();
  const [content, setContent] = useState<{ title: string; content: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { data, error } = await supabase
          .from('static_pages')
          .select('title, content')
          .eq('page_key', 'privacy-policy')
          .eq('language_id', currentLanguage)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          setContent(data);
        } else {
          // Fallback to default content if no translation exists
          setContent({
            title: 'Privacy Policy',
            content: `# Information We Collect

We collect information you provide directly to us, such as when you create an account, update your profile, post content, or communicate with us.

- Account information (username, email, profile picture)
- Content you create (posts, comments, progress tracking)
- Usage data and analytics
- Device and technical information

# How We Use Your Information

We use the information we collect to:

- Provide and maintain our services
- Personalize your experience
- Enable social features and community interaction
- Track your progress and achievements
- Send you notifications and updates
- Improve our services and develop new features

# Information Sharing

We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:

- With your consent
- To comply with legal obligations
- To protect our rights and prevent fraud
- With service providers who assist us in operating our platform

# Data Security

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.

# Contact Us

If you have any questions about this Privacy Policy, please contact us at privacy@aerialjourney.com`
          });
        }
      } catch (error) {
        console.error('Error fetching privacy policy:', error);
        setContent({
          title: 'Privacy Policy',
          content: 'Unable to load privacy policy content.'
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
        <p className="text-muted-foreground">Privacy policy not available.</p>
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
                
                return contentLines.map((contentLine, idx) => {
                  if (contentLine.startsWith('- ')) {
                    return <li key={idx} className="ml-6">{contentLine.substring(2)}</li>;
                  } else {
                    return <p key={idx}>{contentLine}</p>;
                  }
                });
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

export default PrivacyPolicy;