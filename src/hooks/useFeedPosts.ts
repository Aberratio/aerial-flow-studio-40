import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface FeedPost {
  id: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    role?: string;
  };
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  is_saved: boolean;
}

export const useFeedPosts = () => {
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Fetch posts from current user and friends
  const fetchPosts = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's friends (people they follow)
      const { data: friendIds } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const friendIdList = friendIds?.map(f => f.following_id) || [];
      const userIds = [user.id, ...friendIdList];

      // Fetch posts from user and friends with user info and counts
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          created_at,
          user_id,
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .in('user_id', userIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get likes and comments counts for each post
      if (postsData) {
        const postsWithCounts = await Promise.all(
          postsData.map(async (post) => {
            // Get likes count
            const { count: likesCount } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Get comments count
            const { count: commentsCount } = await supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            // Check if current user liked this post
            const { data: userLike } = await supabase
              .from('post_likes')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();

            // Check if current user saved this post
            const { data: userSaved } = await supabase
              .from('saved_posts')
              .select('id')
              .eq('post_id', post.id)
              .eq('user_id', user.id)
              .maybeSingle();

            return {
              id: post.id,
              content: post.content,
              image_url: post.image_url,
              video_url: post.video_url,
              created_at: post.created_at,
              user_id: post.user_id,
              user: {
                id: post.profiles?.id || '',
                username: post.profiles?.username || '',
                avatar_url: post.profiles?.avatar_url || null,
                role: post.profiles?.role || 'free',
              },
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              is_liked: !!userLike,
              is_saved: !!userSaved,
            };
          })
        );

        setPosts(postsWithCounts);
      }
    } catch (error) {
      console.error('Error fetching feed posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Toggle like on a post
  const toggleLike = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      if (post.is_liked) {
        // Remove like
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, is_liked: false, likes_count: p.likes_count - 1 }
              : p
          )
        );
      } else {
        // Add like
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });

        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, is_liked: true, likes_count: p.likes_count + 1 }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  // Add new post to the feed
  const addPost = (newPost: FeedPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Toggle save on a post
  const toggleSave = async (postId: string) => {
    if (!user) return;

    try {
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // Don't allow saving own posts
      if (post.user_id === user.id) return;

      if (post.is_saved) {
        // Remove save
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, is_saved: false }
              : p
          )
        );
      } else {
        // Add save
        await supabase
          .from('saved_posts')
          .insert({ post_id: postId, user_id: user.id });

        setPosts(prevPosts =>
          prevPosts.map(p =>
            p.id === postId
              ? { ...p, is_saved: true }
              : p
          )
        );
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  // Update a post in the feed
  const updatePost = (updatedPost: FeedPost) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === updatedPost.id ? updatedPost : post
      )
    );
  };

  useEffect(() => {
    fetchPosts();
  }, [user]);

  return {
    posts,
    loading,
    fetchPosts,
    toggleLike,
    toggleSave,
    addPost,
    updatePost,
  };
};