import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export interface PostComment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  user: {
    id: string;
    username: string;
    avatar_url: string | null;
    role?: string;
  };
}

export const usePostComments = (postId: string | null) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  // Fetch comments for a post
  const fetchComments = async () => {
    if (!postId) return;

    try {
      setLoading(true);

      const { data: commentsData, error } = await supabase
        .from('post_comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!post_comments_user_id_fkey (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (commentsData) {
        const formattedComments = commentsData.map(comment => ({
          id: comment.id,
          content: comment.content,
          created_at: comment.created_at,
          user_id: comment.user_id,
          user: {
            id: comment.profiles?.id || '',
            username: comment.profiles?.username || '',
            avatar_url: comment.profiles?.avatar_url || null,
            role: comment.profiles?.role || 'free',
          },
        }));

        setComments(formattedComments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  // Add a new comment
  const addComment = async (content: string) => {
    if (!user || !postId || !content.trim()) return;

    try {
      const { data: newComment, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
        })
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles!post_comments_user_id_fkey (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .single();

      if (error) throw error;

      if (newComment) {
        const formattedComment = {
          id: newComment.id,
          content: newComment.content,
          created_at: newComment.created_at,
          user_id: newComment.user_id,
          user: {
            id: newComment.profiles?.id || user.id,
            username: newComment.profiles?.username || user.username,
            avatar_url: newComment.profiles?.avatar_url || user.avatar_url,
            role: newComment.profiles?.role || user.role,
          },
        };

        setComments(prevComments => [...prevComments, formattedComment]);
        return true;
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      return false;
    }
  };

  useEffect(() => {
    fetchComments();
  }, [postId]);

  return {
    comments,
    loading,
    addComment,
    fetchComments,
  };
};