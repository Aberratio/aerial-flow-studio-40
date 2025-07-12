import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import ReactMarkdown from 'react-markdown';

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

  const renderMarkdown = (content: string) => {
    return (
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          components={{
          h1: ({ children }) => (
            <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-2xl font-semibold mb-4 mt-8 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">{children}</h2>
          ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-white mb-3">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="text-muted-foreground mb-4">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">{children}</ol>
            ),
            li: ({ children }) => (
              <li className="text-muted-foreground">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="text-white font-semibold">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="text-primary">{children}</em>
            ),
            code: ({ children }) => (
              <code className="bg-white/10 text-primary px-1 py-0.5 rounded text-sm">{children}</code>
            ),
            pre: ({ children }) => (
              <pre className="bg-white/10 p-4 rounded-lg overflow-x-auto mb-4">{children}</pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Back Button */}
      <div className="p-6 pb-0">
        <Link to="/">
          <Button variant="ghost" className="text-white hover:bg-white/10 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      <div className="p-6 pt-0">
        <div className="max-w-4xl mx-auto">
          {renderMarkdown(content.content)}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="border-t border-white/10 py-8 px-6 mt-12">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 IguanaFlow. All rights reserved.
          </p>
          <div className="flex justify-center space-x-6 mt-4">
            <Link to="/privacy-policy" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-use" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
              Terms of Use
            </Link>
            <Link to="/about-us" className="text-sm text-muted-foreground hover:text-purple-400 transition-colors">
              About Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;