import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

interface ProfilePreviewPostsProps {
  posts: any[];
}

export const ProfilePreviewPosts = ({ posts }: ProfilePreviewPostsProps) => {
  if (posts.length === 0) return null;

  return (
    <div>
      <h3 className="text-lg font-semibold text-white mb-3">Recent Posts</h3>
      <div className="grid grid-cols-2 gap-3">
        {posts.map((post) => (
          <Card key={post.id} className="glass-effect border-white/10">
            <CardContent className="p-3">
              {post.image_url && (
                <div className="mb-2">
                  <img 
                    src={post.image_url} 
                    alt="Post" 
                    className="w-full h-24 object-cover rounded"
                  />
                </div>
              )}
              <p className="text-sm text-white line-clamp-2">{post.content}</p>
              {post.figures && (
                <p className="text-xs text-purple-400 mt-1">#{post.figures.name}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};