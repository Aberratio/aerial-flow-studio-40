
import React, { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Send, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { usePostComments } from '@/hooks/usePostComments';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import type { FeedPost } from '@/hooks/useFeedPosts';

interface PostPreviewModalProps {
  post: FeedPost | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleLike?: (postId: string) => void;
}

export const PostPreviewModal = ({ post, isOpen, onClose, onToggleLike }: PostPreviewModalProps) => {
  const [newComment, setNewComment] = useState('');
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 bg-black/95 border-white/10 flex flex-col">
        <div className="flex h-full min-h-0">
          {/* Media Section */}
          <div className="flex-1 bg-black min-h-0">
            {post.image_url && (
              <img 
                src={post.image_url} 
                alt="Post content"
                className="w-full h-full object-contain"
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
          <div className="w-96 flex flex-col bg-black/50 backdrop-blur-sm">
            {/* Header */}
            <DialogHeader className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Avatar className={`w-10 h-10 ${post.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-2 ring-offset-black' : ''}`}>
                  <AvatarImage src={post.user.avatar_url || undefined} />
                  <AvatarFallback>{post.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{post.user.username}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                  </span>
                </div>
              </div>
            </DialogHeader>

            {/* Content */}
            <div className="p-4 border-b border-white/10">
              <p className="text-white">{post.content}</p>
            </div>

            {/* Actions */}
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleToggleLike}
                    className={`text-muted-foreground hover:text-white ${post.is_liked ? 'text-pink-400' : ''}`}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                    {post.likes_count || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {comments.length || 0}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                  <Bookmark className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Comments */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
              {commentsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No comments yet. Be the first to comment!
                </div>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex space-x-3">
                    <Avatar className={`w-8 h-8 ${comment.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-1 ring-offset-black' : ''}`}>
                      <AvatarImage src={comment.user.avatar_url || undefined} />
                      <AvatarFallback>{comment.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="bg-white/5 rounded-lg p-3">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-semibold text-white text-sm">{comment.user.username}</span>
                          <span className="text-muted-foreground text-xs">
                            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                          </span>
                        </div>
                        <p className="text-white text-sm">{comment.content}</p>
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
                  size="sm" 
                  onClick={handleSubmitComment}
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
