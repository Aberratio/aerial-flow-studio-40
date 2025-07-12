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
  privacy: string;
  figure?: {
    id: string;
    name: string;
  } | null;
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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const { user } = useAuth();
  const POSTS_PER_PAGE = 10;

  // Fetch posts from current user and friends/followers
  const fetchPosts = async (isLoadMore = false) => {
    if (!user) return;

    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
        setOffset(0);
        setHasMore(true);
      }

      // Get user's friends (accepted friendships)
      const { data: friendships } = await supabase
        .from('friendships')
        .select('requester_id, addressee_id')
        .eq('status', 'accepted')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      // Get user's follows
      const { data: follows } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      // Extract friend IDs (people who are actual friends)
      const friendIds = new Set<string>();
      friendships?.forEach(friendship => {
        if (friendship.requester_id === user.id) {
          friendIds.add(friendship.addressee_id);
        } else {
          friendIds.add(friendship.requester_id);
        }
      });

      // Extract follow IDs (people user follows but aren't friends with)
      const followIds = new Set<string>();
      follows?.forEach(follow => {
        if (!friendIds.has(follow.following_id)) {
          followIds.add(follow.following_id);
        }
      });

      // Build query conditions
      const conditions = [`user_id.eq.${user.id}`]; // User's own posts

      // Add friends' posts (both public and friends-only)
      if (friendIds.size > 0) {
        const friendIdsArray = Array.from(friendIds);
        friendIdsArray.forEach(friendId => {
          conditions.push(`and(user_id.eq.${friendId},privacy.in.(public,friends))`);
        });
      }

      // Add followed users' public posts only
      if (followIds.size > 0) {
        const followIdsArray = Array.from(followIds);
        followIdsArray.forEach(followId => {
          conditions.push(`and(user_id.eq.${followId},privacy.eq.public)`);
        });
      }

      // Fetch posts with the conditions and pagination
      const currentOffset = isLoadMore ? offset : 0;
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          id,
          content,
          image_url,
          video_url,
          created_at,
          user_id,
          privacy,
          figure_id,
          figures (
            id,
            name
          ),
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .or(conditions.join(','))
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + POSTS_PER_PAGE - 1);

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
              privacy: post.privacy,
              figure: post.figures ? {
                id: post.figures.id,
                name: post.figures.name
              } : null,
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

        if (isLoadMore) {
          setPosts(prevPosts => [...prevPosts, ...postsWithCounts]);
          setOffset(prev => prev + POSTS_PER_PAGE);
        } else {
          setPosts(postsWithCounts);
          setOffset(POSTS_PER_PAGE);
        }
        
        // Check if there are more posts to load
        setHasMore(postsWithCounts.length === POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching feed posts:', error);
    } finally {
      if (isLoadMore) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
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

  // Delete a post
  const deletePost = async (postId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id); // Ensure user can only delete their own posts

      if (error) throw error;

      // Remove post from local state
      setPosts(prevPosts => prevPosts.filter(p => p.id !== postId));
      return true;
    } catch (error) {
      console.error('Error deleting post:', error);
      return false;
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

  const loadMorePosts = () => {
    fetchPosts(true);
  };

  return {
    posts,
    loading,
    loadingMore,
    hasMore,
    fetchPosts,
    loadMorePosts,
    toggleLike,
    toggleSave,
    addPost,
    updatePost,
    deletePost,
  };
};