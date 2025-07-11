import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Heart, MessageCircle, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ProfilePreviewPostsProps {
  posts: any[];
}

export const ProfilePreviewPosts = ({ posts }: ProfilePreviewPostsProps) => {
  const navigate = useNavigate();
  
  if (posts.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">Recent Posts</h3>
      <div className="grid grid-cols-2 gap-3">
        {posts.map((post) => (
          <Card 
            key={post.id} 
            className="glass-effect border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors"
            onClick={() => navigate(`/post/${post.id}`)}
          >
            <CardContent className="p-3">
              {/* Media Display */}
              {post.image_url && (
                <div className="mb-2 relative">
                  <img 
                    src={post.image_url} 
                    alt="Post" 
                    className="w-full h-24 object-cover rounded"
                  />
                </div>
              )}
              {post.video_url && !post.image_url && (
                <div className="mb-2 relative">
                  <video 
                    src={post.video_url}
                    className="w-full h-24 object-cover rounded"
                    poster={post.image_url || undefined}
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
                    <Play className="w-6 h-6 text-white" />
                  </div>
                </div>
              )}
              
              {/* Content */}
              <p className="text-sm text-white line-clamp-2 mb-2">{post.content}</p>
              
              {/* Figure tag */}
              {post.figures && (
                <p className="text-xs text-purple-400 mb-2">#{post.figures.name}</p>
              )}
              
              {/* Interaction stats */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Heart className="w-3 h-3" />
                    <span>{post.likes_count || 0}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <MessageCircle className="w-3 h-3" />
                    <span>{post.comments_count || 0}</span>
                  </div>
                </div>
                <span>
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};