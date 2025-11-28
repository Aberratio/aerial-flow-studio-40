import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Trophy, TrendingUp, Bookmark, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YourSportsSection } from './YourSportsSection';
import { AchievementsSection } from './AchievementsSection';
import { FigureJourneySection } from './FigureJourneySection';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { EmptyStateCard } from './EmptyStateCard';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader 
        className="cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export const ActivityTab = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSavedPosts = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from('saved_posts')
        .select(`
          id,
          post_id,
          posts (
            id,
            content,
            image_url,
            video_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(6);

      if (!error && data) {
        setSavedPosts(data);
      }
      setLoading(false);
    };

    fetchSavedPosts();
  }, [user]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Your Sports - Always visible */}
      <YourSportsSection />

      {/* Achievements - Always visible */}
      <AchievementsSection />

      {/* Saved Posts - Collapsible */}
      <CollapsibleSection
        title="Zapisane posty"
        icon={<Bookmark className="h-5 w-5 text-pink-400" />}
        defaultOpen={false}
      >
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : savedPosts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
            {savedPosts.map((savedPost) => (
              <div
                key={savedPost.id}
                className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-black"
                onClick={() => navigate(`/post/${savedPost.post_id}`)}
              >
                {savedPost.posts?.video_url ? (
                  <video
                    src={savedPost.posts.video_url}
                    className="w-full h-full object-cover"
                    muted
                    playsInline
                  />
                ) : savedPost.posts?.image_url ? (
                  <img
                    src={savedPost.posts.image_url}
                    alt={savedPost.posts.content}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                    <FileText className="w-8 h-8 text-white/50" />
                  </div>
                )}
                
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center">
                  <Bookmark className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity fill-white" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            icon={Bookmark}
            title="Brak zapisanych postów"
            description="Zapisuj inspirujące posty, aby łatwo do nich wrócić później!"
            actionLabel="Przeglądaj feed"
            onAction={() => navigate('/feed')}
          />
        )}
      </CollapsibleSection>

      {/* Figure Journey - Collapsible */}
      <CollapsibleSection
        title="Postęp w figurach"
        icon={<TrendingUp className="h-5 w-5 text-green-400" />}
        defaultOpen={false}
      >
        <FigureJourneySection />
      </CollapsibleSection>
    </div>
  );
};
