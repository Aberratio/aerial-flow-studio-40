import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, MessageCircle, Share2, Bookmark, Send, Loader2, ArrowLeft, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePostComments } from '@/hooks/usePostComments';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { SharePostModal } from '@/components/SharePostModal';
import { PricingModal } from '@/components/PricingModal';

const PostDetail = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [post, setPost] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const { comments, loading: commentsLoading, addComment } = usePostComments(postId || null);
  const { hasPremiumAccess } = useSubscriptionStatus();

  useEffect(() => {
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select(`
          *,
          user:profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url,
            role
          ),
          figure:figures (
            id,
            name
          )
        `)
        .eq('id', postId)
        .single();

      if (error) throw error;

      // Get likes count and check if current user liked it
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('user_id')
        .eq('post_id', postId);

      // Check if current user saved this post
      const { data: savedData } = await supabase
        .from('saved_posts')
        .select('user_id')
        .eq('post_id', postId)
        .eq('user_id', user?.id || '');

      // Process the data to get proper counts and flags
      const processedPost = {
        ...data,
        likes_count: likesData?.length || 0,
        is_liked: likesData?.some((like: any) => like.user_id === user?.id) || false,
        is_saved: savedData && savedData.length > 0
      };

      setPost(processedPost);
    } catch (error: any) {
      console.error('Error fetching post:', error);
      toast({
        title: "Error",
        description: "Failed to load post",
        variant: "destructive"
      });
      navigate('/feed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async () => {
    if (newComment.trim()) {
      const success = await addComment(newComment);
      if (success) {
        setNewComment('');
      }
    }
  };

  const toggleLike = async () => {
    if (!user || !post) return;

    try {
      if (post.is_liked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        setPost(prev => ({
          ...prev,
          is_liked: false,
          likes_count: prev.likes_count - 1
        }));
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: post.id, user_id: user.id });

        setPost(prev => ({
          ...prev,
          is_liked: true,
          likes_count: prev.likes_count + 1
        }));
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const toggleSave = async () => {
    if (!user || !post) return;

    try {
      if (post.is_saved) {
        await supabase
          .from('saved_posts')
          .delete()
          .eq('post_id', post.id)
          .eq('user_id', user.id);

        setPost(prev => ({
          ...prev,
          is_saved: false
        }));
      } else {
        await supabase
          .from('saved_posts')
          .insert({ post_id: post.id, user_id: user.id });

        setPost(prev => ({
          ...prev,
          is_saved: true
        }));
      }
    } catch (error) {
      console.error('Error toggling save:', error);
    }
  };

  const handleExerciseClick = (figureId: string) => {
    if (hasPremiumAccess) {
      navigate(`/library/${figureId}`);
    } else {
      setShowPricingModal(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Post not found</h2>
          <Button onClick={() => navigate('/feed')} variant="primary">
            Back to Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-3 sm:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/feed')}
          variant="ghost"
          className="mb-6 text-white hover:text-white/80"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Feed
        </Button>

        {/* Post Content */}
        <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-lg overflow-hidden">
          {/* Header */}
          <div className="p-4 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <Avatar className={`w-10 h-10 ${post.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-2 ring-offset-black' : ''}`}>
                <AvatarImage src={post.user.avatar_url || undefined} />
                <AvatarFallback>{post.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-white">{post.user.username}</span>
                  {post.user.role === 'trainer' && (
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs">
                      Trainer
                    </Badge>
                  )}
                </div>
                <span className="text-muted-foreground text-sm">
                  {post.created_at && !isNaN(new Date(post.created_at).getTime()) 
                    ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                    : 'Recently'
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-white mb-4">{post.content}</p>
            
            {/* Figure Info */}
            {post.figure && (
              <div className="mb-4 p-3 bg-white/5 border border-white/10 rounded-lg cursor-pointer hover:bg-white/10 transition-colors"
                   onClick={() => handleExerciseClick(post.figure.id)}>
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-purple-400 font-medium">Exercise:</span>
                  <span className="text-sm text-white underline hover:text-purple-300">{post.figure.name}</span>
                </div>
              </div>
            )}
            
            {/* Media */}
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post content"
                className="w-full rounded-lg mb-4"
              />
            )}
            {post.video_url && (
              <video 
                src={post.video_url} 
                className="w-full rounded-lg mb-4"
                controls
              />
            )}
          </div>

          {/* Actions */}
          <div className="p-4 border-t border-white/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={toggleLike}
                  className={`text-muted-foreground hover:text-white ${post.is_liked ? 'text-pink-400' : ''} px-3`}
                >
                  <Heart className={`w-5 h-5 mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                  <span>{post.likes_count || 0}</span>
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white px-3">
                  <MessageCircle className="w-5 h-5 mr-2" />
                  <span>{comments.length || 0}</span>
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowShareModal(true)}
                  className="text-muted-foreground hover:text-white px-3"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
              {post.user_id !== user?.id && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={toggleSave}
                  className={`text-muted-foreground hover:text-white ${post.is_saved ? 'text-blue-400' : ''} px-3`}
                  title="Save for later"
                >
                  <Bookmark className={`w-5 h-5 ${post.is_saved ? 'fill-current' : ''}`} />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="mt-6 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg">
          <div className="p-4 border-b border-white/10">
            <h3 className="text-white font-semibold">Comments</h3>
          </div>
          
          {/* Comments List */}
          <div className="p-4 space-y-4 max-h-96 overflow-y-auto">
            {commentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : comments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No comments yet. Be the first to comment!</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar 
                    className={`w-8 h-8 flex-shrink-0 cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all ${comment.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-1 ring-offset-black' : ''}`}
                    onClick={() => {
                      navigate(`/profile/${comment.user.id}`, { 
                        state: { openProfilePreview: true } 
                      });
                    }}
                  >
                    <AvatarImage src={comment.user.avatar_url || undefined} />
                    <AvatarFallback>{comment.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span 
                          className="font-semibold text-white text-sm truncate cursor-pointer hover:text-primary transition-colors"
                          onClick={() => {
                            navigate(`/profile/${comment.user.id}`, { 
                              state: { openProfilePreview: true } 
                            });
                          }}
                        >
                          {comment.user.username}
                        </span>
                        <span className="text-muted-foreground text-xs flex-shrink-0">
                          {comment.created_at && !isNaN(new Date(comment.created_at).getTime()) 
                            ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                            : 'Recently'
                          }
                        </span>
                      </div>
                      <p className="text-white text-sm break-words">{comment.content}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-white/10">
            <div className="flex space-x-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
              />
              <Button 
                variant="primary"
                size="sm" 
                onClick={handleSubmitComment}
                className="flex-shrink-0"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <SharePostModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post?.id || ''}
        userName={post?.user?.username || ''}
        post={post}
      />

      <PricingModal isOpen={showPricingModal} onClose={() => setShowPricingModal(false)} onUpgrade={() => {}} />
    </div>
  );
};

export default PostDetail;