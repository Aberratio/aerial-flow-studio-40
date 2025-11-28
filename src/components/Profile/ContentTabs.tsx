import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Camera, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { EmptyStateCard } from './EmptyStateCard';

interface ContentTabsProps {
  privacyFilter?: string;
  isOwnProfile?: boolean;
}

export const ContentTabs: React.FC<ContentTabsProps> = ({ privacyFilter = 'all' }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's posts from database
  const fetchPosts = async () => {
    if (!user) return;

    try {
      let query = supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      // Apply privacy filter if not viewing all content
      if (privacyFilter === 'public') {
        query = query.eq('privacy', 'public');
      } else if (privacyFilter === 'friends') {
        query = query.eq('privacy', 'friends');
      }

      const { data, error } = await query;

      if (error) throw error;

      // Get likes and comments counts for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const { count: likesCount } = await supabase
            .from('post_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          const { count: commentsCount } = await supabase
            .from('post_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', post.id);

          return {
            id: post.id,
            content: post.content,
            image_url: post.image_url,
            video_url: post.video_url,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            created_at: post.created_at,
          };
        })
      );

      setPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [privacyFilter]);

  return (
    <div className="w-full">
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="aspect-square bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : posts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4">
          {posts.map((post) => (
            <div
              key={post.id}
              className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group bg-black"
              onClick={() => navigate(`/post/${post.id}`)}
            >
              {/* Image or Video */}
              {post.video_url ? (
                <video
                  src={post.video_url}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : post.image_url ? (
                <img
                  src={post.image_url}
                  alt={post.content}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-500/20 to-pink-500/20">
                  <FileText className="w-8 h-8 text-white/50" />
                </div>
              )}
              
              {/* Overlay with stats */}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/60 transition-all duration-300 flex items-center justify-center gap-6">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Heart className="w-5 h-5 text-white fill-white" />
                  <span className="text-white font-medium">{post.likes_count || 0}</span>
                </div>
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MessageCircle className="w-5 h-5 text-white fill-white" />
                  <span className="text-white font-medium">{post.comments_count || 0}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyStateCard
          icon={Camera}
          title="Jeszcze brak postów"
          description="Podziel się swoimi treningami, postępami i inspiracjami ze społecznością!"
          actionLabel="Dodaj pierwszy post"
          onAction={() => navigate('/feed')}
        />
      )}
    </div>
  );
};
