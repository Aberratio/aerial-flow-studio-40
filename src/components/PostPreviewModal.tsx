
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Send, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

interface Comment {
  id: number;
  user: {
    username: string;
    avatar: string;
  };
  content: string;
  timeAgo: string;
  likes: number;
}

interface Post {
  id: number;
  user: {
    username: string;
    avatar: string;
    verified: boolean;
  };
  content: string;
  image: string;
  likes: number;
  comments: number;
  timeAgo: string;
  isLiked: boolean;
}

interface PostPreviewModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
}

export const PostPreviewModal = ({ post, isOpen, onClose }: PostPreviewModalProps) => {
  const [newComment, setNewComment] = useState('');
  const [isLiked, setIsLiked] = useState(post?.isLiked || false);

  if (!post) return null;

  const comments: Comment[] = [
    {
      id: 1,
      user: {
        username: 'flexibility_queen',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Amazing progress! Your form is getting so much better 🔥',
      timeAgo: '2h ago',
      likes: 12
    },
    {
      id: 2,
      user: {
        username: 'aerial_coach',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      content: 'Keep focusing on engaging your core during the transition. You got this! 💪',
      timeAgo: '1h ago',
      likes: 8
    },
    {
      id: 3,
      user: {
        username: 'hoop_lover',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
      },
      content: 'This is goals! How long did it take you to master this?',
      timeAgo: '45m ago',
      likes: 3
    }
  ];

  const handleSubmitComment = () => {
    if (newComment.trim()) {
      console.log('Submitting comment:', newComment);
      setNewComment('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-white/10">
        <div className="flex h-full">
          {/* Image Section */}
          <div className="flex-1 bg-black">
            <img 
              src={post.image} 
              alt="Post content"
              className="w-full h-full object-contain"
            />
          </div>

          {/* Details Section */}
          <div className="w-96 flex flex-col bg-black/50 backdrop-blur-sm">
            {/* Header */}
            <DialogHeader className="p-4 border-b border-white/10">
              <div className="flex items-center space-x-3">
                <Avatar className="w-10 h-10">
                  <AvatarImage src={post.user.avatar} />
                  <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-semibold text-white">{post.user.username}</span>
                    {post.user.verified && (
                      <Badge className="bg-gradient-to-r from-purple-500 to-blue-500 text-xs">
                        ✓
                      </Badge>
                    )}
                  </div>
                  <span className="text-muted-foreground text-sm">{post.timeAgo}</span>
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
                    onClick={() => setIsLiked(!isLiked)}
                    className={`text-muted-foreground hover:text-white ${isLiked ? 'text-pink-400' : ''}`}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${isLiked ? 'fill-current' : ''}`} />
                    {post.likes + (isLiked && !post.isLiked ? 1 : 0)}
                  </Button>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {post.comments}
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
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex space-x-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={comment.user.avatar} />
                    <AvatarFallback>{comment.user.username[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="bg-white/5 rounded-lg p-3">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-semibold text-white text-sm">{comment.user.username}</span>
                        <span className="text-muted-foreground text-xs">{comment.timeAgo}</span>
                      </div>
                      <p className="text-white text-sm">{comment.content}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white text-xs mt-1">
                      <Heart className="w-3 h-3 mr-1" />
                      {comment.likes}
                    </Button>
                  </div>
                </div>
              ))}
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
