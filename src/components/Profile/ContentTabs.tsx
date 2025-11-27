import React, { useState, useEffect } from 'react';
import { Grid, Award, Bookmark, Heart, MessageCircle, Camera, Trophy, Dumbbell, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserAchievements } from '@/hooks/useUserAchievements';
import { useSavedPosts } from '@/hooks/useSavedPosts';
import { supabase } from '@/integrations/supabase/client';

interface ContentTabsProps {
  onPostSelect?: (post: any) => void; // Make it optional since we're not using it anymore
  privacyFilter?: string;
  isOwnProfile?: boolean;
}

export const ContentTabs: React.FC<ContentTabsProps> = ({ onPostSelect, privacyFilter = 'all', isOwnProfile = true }) => {
  const navigate = useNavigate();
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
      let query = supabase
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
            image_url: post.image_url,
            video_url: post.video_url,
            likes_count: likesCount || 0,
            comments_count: commentsCount || 0,
            created_at: post.created_at,
            user: {
              username: post.profiles?.username || user.username,
              avatar_url: post.profiles?.avatar_url || user.avatar,
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
  }, [user, privacyFilter]);

  const tabs = [
    { id: 'posts', label: 'Posty', mobileLabel: 'Posty', icon: Grid },
    { id: 'achievements', label: 'Wszystkie osiągnięcia', mobileLabel: 'Nagrody', icon: Award },
    { id: 'saved', label: 'Zapisane', mobileLabel: 'Zapisane', icon: Bookmark }
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
              variant="ghost"
              className={`flex-1 transition-all ${
                activeTab === tab.id 
                  ? 'bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-blue-500/20 text-white' 
                  : 'text-muted-foreground hover:text-white hover:bg-white/5'
              } ${activeTab === tab.id ? 'hover:bg-gradient-to-r hover:from-purple-500/20 hover:via-pink-500/20 hover:to-blue-500/20' : ''}`}
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
          <div className="text-center py-8 text-muted-foreground">Ładowanie postów...</div>
        ) : userPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              <Grid className="w-10 h-10 sm:w-12 sm:h-12 text-purple-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Jeszcze brak postów
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm mx-auto px-4">
              Podziel się swoimi treningami, postępami i inspiracjami ze społecznością!
            </p>
            <Button asChild className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
              <Link to="/feed">
                <Camera className="w-4 h-4 mr-2" />
                Dodaj pierwszy post
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {userPosts.map((post: any) => (
              <div 
                key={post.id} 
                className="relative group cursor-pointer"
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <div className="aspect-square rounded-lg overflow-hidden">
                  {post.image_url ? (
                    <img 
                      src={post.image_url} 
                      alt="User post"
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
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 flex flex-col items-center justify-center p-4">
                      <MessageCircle className="w-8 h-8 text-purple-400 mb-2" />
                      <p className="text-xs text-center text-white/70 leading-tight">
                        {post.content.length > 60 ? `${post.content.substring(0, 60)}...` : post.content}
                      </p>
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

      {activeTab === 'achievements' && (
        achievementsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Ładowanie osiągnięć...</div>
        ) : achievements.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
              <Trophy className="w-10 h-10 sm:w-12 sm:h-12 text-yellow-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Jeszcze brak osiągnięć
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm mx-auto px-4">
              Zacznij trenować i wykonuj wyzwania, aby odblokować swoje pierwsze osiągnięcie!
            </p>
            <Button asChild className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600">
              <Link to="/challenges">
                <Dumbbell className="w-4 h-4 mr-2" />
                Zobacz wyzwania
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {achievements.map((achievement, index) => (
              <div key={index} className="text-center p-6 rounded-lg bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
                <div className="text-4xl mb-3">{achievement.icon}</div>
                <div className="text-white font-semibold mb-2">{achievement.name}</div>
                <div className="text-muted-foreground text-sm mb-3">{achievement.description}</div>
                <div className="text-purple-400 font-bold text-lg">+{achievement.points} pkt</div>
              </div>
            ))}
          </div>
        )
      )}

      {activeTab === 'saved' && (
        savedPostsLoading ? (
          <div className="text-center py-8 text-muted-foreground">Ładowanie zapisanych postów...</div>
        ) : savedPosts.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-20 h-20 sm:w-24 sm:h-24 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <Bookmark className="w-10 h-10 sm:w-12 sm:h-12 text-blue-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
              Jeszcze brak zapisanych postów
            </h3>
            <p className="text-sm sm:text-base text-muted-foreground mb-6 max-w-sm mx-auto px-4">
              Zapisuj inspirujące posty innych użytkowników, aby mieć do nich szybki dostęp!
            </p>
            <Button asChild className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600">
              <Link to="/feed">
                <Grid className="w-4 h-4 mr-2" />
                Przeglądaj feed
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {savedPosts.map((post) => (
              <div 
                key={post.id} 
                className="relative group cursor-pointer"
                onClick={() => navigate(`/post/${post.id}`)}
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
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-white/10 flex flex-col items-center justify-center p-4">
                      <MessageCircle className="w-8 h-8 text-purple-400 mb-2" />
                      <p className="text-xs text-center text-white/70 leading-tight">
                        {post.content.length > 60 ? `${post.content.substring(0, 60)}...` : post.content}
                      </p>
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