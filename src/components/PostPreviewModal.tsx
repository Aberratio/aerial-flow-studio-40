
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Send, Loader2, Target } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePostComments } from '@/hooks/usePostComments';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import type { FeedPost } from '@/hooks/useFeedPosts';
import { SharePostModal } from '@/components/SharePostModal';

interface PostPreviewModalProps {
  post: FeedPost | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleLike?: (postId: string) => void;
  onToggleSave?: (postId: string) => void;
}

export const PostPreviewModal = ({ post, isOpen, onClose, onToggleLike, onToggleSave }: PostPreviewModalProps) => {
  const [newComment, setNewComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useAuth();
  const { comments, loading: commentsLoading, addComment } = usePostComments(post?.id || null);

  if (!post) return null;

  const handleSubmitComment = async () => {
    if (newComment.trim()) {
      const success = await addComment(newComment);
      if (success) {
        setNewComment('');
      }
    }
  };

  const handleToggleLike = () => {
    if (onToggleLike) {
      onToggleLike(post.id);
    }
  };

  const handleToggleSave = () => {
    if (onToggleSave) {
      onToggleSave(post.id);
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl h-[90vh] sm:h-[90vh] p-0 bg-black/95 border-white/10 flex flex-col">
        <DialogTitle className="sr-only">Post by {post?.user?.username}</DialogTitle>
        <DialogDescription className="sr-only">
          {post?.content || 'View post details and comments'}
        </DialogDescription>
        <div className="flex flex-col sm:flex-row h-full min-h-0">
          {/* Media Section */}
          <div className="flex-1 bg-black min-h-0 h-[50vh] sm:h-full flex items-center justify-center">
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post content"
                className="max-w-full max-h-full object-contain cursor-zoom-in w-full"
              />
            )}
            {post.video_url && (
              <video 
                src={post.video_url} 
                className="w-full h-full object-contain"
                controls
                autoPlay={false}
              />
            )}
            {!post.image_url && !post.video_url && (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                No media available
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="w-full sm:w-96 flex flex-col bg-black/50 backdrop-blur-sm">
            {/* Header */}
            <DialogHeader className="p-3 sm:p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center space-x-3">
                <Avatar className={`w-8 h-8 sm:w-10 sm:h-10 ${post.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-2 ring-offset-black' : ''}`}>
                  <AvatarImage src={post.user.avatar_url || undefined} />
                  <AvatarFallback>{post.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white text-sm sm:text-base">{post.user.username}</span>
                  </div>
                  <span className="text-muted-foreground text-xs sm:text-sm">
                    {post.created_at && !isNaN(new Date(post.created_at).getTime()) 
                      ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                      : 'Recently'
                    }
                  </span>
                </div>
              </div>
            </DialogHeader>

            {/* Content */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex-shrink-0">
              <p className="text-white text-sm sm:text-base">{post.content}</p>
              
              {/* Figure Info */}
              {post.figure && (
                <div className="mt-3 p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center space-x-2">
                    <Target className="w-4 h-4 text-purple-400" />
                    <span className="text-sm text-purple-400 font-medium">Exercise:</span>
                    <span className="text-sm text-white">{post.figure.name}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-3 sm:p-4 border-b border-white/10 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 sm:space-x-6">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleToggleLike}
                    className={`text-muted-foreground hover:text-white ${post.is_liked ? 'text-pink-400' : ''} px-2 sm:px-3`}
                  >
                    <Heart className={`w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                    <span className="text-xs sm:text-sm">{post.likes_count || 0}</span>
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white px-2 sm:px-3">
                    <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
                    <span className="text-xs sm:text-sm">{comments.length || 0}</span>
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleShare}
                    className="text-muted-foreground hover:text-white px-2 sm:px-3"
                  >
                    <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
                {post.user_id !== user?.id && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleToggleSave}
                    className={`text-muted-foreground hover:text-white ${post.is_saved ? 'text-blue-400' : ''} px-2 sm:px-3`}
                    title="Save for later"
                  >
                    <Bookmark className={`w-4 h-4 sm:w-5 sm:h-5 ${post.is_saved ? 'fill-current' : ''}`} />
                  </Button>
                )}
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4 min-h-0">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="text-sm">No comments yet. Be the first to comment!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-2 sm:space-x-3">
                    <Avatar className={`w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0 ${comment.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-1 ring-offset-black' : ''}`}>
                      <AvatarImage src={comment.user.avatar_url || undefined} />
                      <AvatarFallback>{comment.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-white/5 rounded-lg p-2 sm:p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-white text-xs sm:text-sm truncate">{comment.user.username}</span>
                          <span className="text-muted-foreground text-xs flex-shrink-0">
                            {comment.created_at && !isNaN(new Date(comment.created_at).getTime()) 
                              ? formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })
                              : 'Recently'
                            }
                          </span>
                        </div>
                        <p className="text-white text-xs sm:text-sm break-words">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comment Input */}
            <div className="p-3 sm:p-4 border-t border-white/10 flex-shrink-0">
              <div className="flex space-x-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/60 text-sm"
                  onKeyPress={(e) => e.key === 'Enter' && handleSubmitComment()}
                />
                <Button 
                  variant="primary"
                  size="sm" 
                  onClick={handleSubmitComment}
                  className="flex-shrink-0"
                >
                  <Send className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>

      <SharePostModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        postId={post?.id || ''}
        userName={post?.user?.username || ''}
      />
    </Dialog>
  );
};
