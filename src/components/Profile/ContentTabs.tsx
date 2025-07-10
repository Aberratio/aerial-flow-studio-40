import React, { useState, useEffect } from 'react';
import { Grid, Award, Bookmark, Heart, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { supabase } from '@/integrations/supabase/client';

interface ContentTabsProps {
  onPostSelect: (post: any) => void;
}

export const ContentTabs: React.FC<ContentTabsProps> = ({ onPostSelect }) => {
  const { user } = useAuth();
  const { achievements, loading: achievementsLoading } = useUserAchievements();
  const { savedPosts, loading: savedPostsLoading } = useSavedPosts();
  const [activeTab, setActiveTab] = useState('posts');
  const [userPosts, setUserPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch user's posts from database
  const fetchUserPosts = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            avatar_url
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      // Get likes and comments counts for each post
      const postsWithCounts = await Promise.all(
        data?.map(async (post) => {
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
            image: post.image_url,
            video: post.video_url,
            likes: likesCount || 0,
            comments: commentsCount || 0,
            timeAgo: post.created_at,
            user: {
              username: post.profiles?.username || user.username,
              avatar: post.profiles?.avatar_url || user.avatar,
              verified: true
            }
          };
        }) || []
      );

      setUserPosts(postsWithCounts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserPosts();
  }, [user]);

  const tabs = [
    { id: 'posts', label: 'Posts', mobileLabel: 'Posts', icon: Grid },
    { id: 'achievements', label: 'All Achievements', mobileLabel: 'Awards', icon: Award },
    { id: 'saved', label: 'Saved', mobileLabel: 'Saved', icon: Bookmark }
  ];

  return (
    <>
      {/* Content Tabs */}
      <div className="flex space-x-1 mb-6 bg-white/5 rounded-lg p-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? "default" : "ghost"}
              className={`flex-1 ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500' 
                  : 'text-muted-foreground hover:text-white'
              }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon className="w-4 h-4 md:mr-2" />
              <span className="hidden sm:inline md:hidden">{tab.mobileLabel}</span>
              <span className="hidden md:inline">{tab.label}</span>
            </Button>
          );
        })}
      </div>

      {/* Content based on active tab */}
      {activeTab === 'posts' && (
        loading ? (
          <div className="text-center py-8 text-muted-foreground">Loading posts...</div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No posts yet!</p>
            <p className="text-sm mt-2">
              <Link to="/feed" className="text-purple-400 hover:text-purple-300">
                Share your first aerial moment
              </Link>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userPosts.map((post: any) => (
              <div 
                key={post.id} 
                className="relative group cursor-pointer"
                onClick={() => onPostSelect(post)}
              >
                <div className="aspect-square rounded-lg overflow-hidden">
                  {post.image ? (
                    <img 
                      src={post.image} 
                      alt="User post"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : post.video ? (
                    <div className="relative w-full h-full">
                      <video 
                        src={post.video}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-6">
                  <div className="flex items-center text-white">
                    <Heart className="w-5 h-5 mr-2" />
                    {post.likes}
                  </div>
                  <div className="flex items-center text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {post.comments}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'achievements' && (
        achievementsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading achievements...</div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No achievements earned yet!</p>
            <p className="text-sm mt-2">Start training to unlock your first achievement</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="text-4xl mb-3">{achievement.icon}</div>
                <div className="text-white font-semibold mb-2">{achievement.name}</div>
                <div className="text-muted-foreground text-sm mb-3">{achievement.description}</div>
                <div className="text-purple-400 font-bold text-lg">+{achievement.points} pts</div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'saved' && (
        savedPostsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Loading saved posts...</div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No saved posts yet!</p>
            <p className="text-sm mt-2">Save posts from other users to see them here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {savedPosts.map((post) => (
              <div 
                key={post.id} 
                className="relative group cursor-pointer"
                onClick={() => onPostSelect(post)}
              >
                <div className="aspect-square rounded-lg overflow-hidden">
                  {post.image_url ? (
                    <img 
                      src={post.image_url} 
                      alt="Saved post"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : post.video_url ? (
                    <div className="relative w-full h-full">
                      <video 
                        src={post.video_url}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <MessageCircle className="w-8 h-8 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-full bg-white/5 flex items-center justify-center">
                      <MessageCircle className="w-8 h-8 text-muted-foreground" />
                    </div>
                  )}
                </div>
                
                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-6">
                  <div className="flex items-center text-white">
                    <Heart className="w-5 h-5 mr-2" />
                    {post.likes_count}
                  </div>
                  <div className="flex items-center text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {post.comments_count}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </>
  );
};