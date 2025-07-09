
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Plus, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostPreviewModal } from '@/components/PostPreviewModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { Link } from 'react-router-dom';
import { useFeedPosts } from '@/hooks/useFeedPosts';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

const Feed = () => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const { posts, loading, toggleLike, addPost } = useFeedPosts();
  const { user } = useAuth();

  const handlePostCreated = (newPost: any) => {
    // Convert the new post to match our FeedPost interface
    const feedPost = {
      id: newPost.id,
      content: newPost.content,
      image_url: newPost.image_url,
      video_url: newPost.video_url,
      created_at: newPost.created_at,
      user_id: newPost.user_id,
      user: {
        id: user?.id || '',
        username: user?.username || '',
        avatar_url: user?.avatar_url || null,
      },
      likes_count: 0,
      comments_count: 0,
      is_liked: false,
    };
    addPost(feedPost);
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Your Feed</h1>
              <p className="text-muted-foreground">See what your fellow aerial athletes are up to</p>
            </div>
          </div>
        </div>

        {/* Create Post Section */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Avatar>
                <AvatarImage src={user?.avatar_url || undefined} />
                <AvatarFallback>{user?.username?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
              </Avatar>
              <Button
                onClick={() => setShowCreatePost(true)}
                variant="ghost"
                className="flex-1 justify-start text-muted-foreground hover:text-white bg-white/5 hover:bg-white/10 h-12"
              >
                <Plus className="w-5 h-5 mr-2" />
                What's on your mind?
              </Button>
            </div>
          </CardContent>
        </Card>

        {posts.length === 0 ? (
          <Card className="glass-effect border-white/10">
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">No posts yet. Follow some users or create your first post!</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post.id} className="glass-effect border-white/10">
              <CardContent className="p-6">
                {/* User Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <Link to={`/profile/${post.user.id}`} className="cursor-pointer">
                    <Avatar className={`w-10 h-10 hover:scale-110 transition-transform ${post.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-2 ring-offset-black' : ''}`}>
                      <AvatarImage src={post.user.avatar_url || undefined} />
                      <AvatarFallback>{post.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <Link to={`/profile/${post.user.id}`} className="cursor-pointer hover:text-primary transition-colors">
                        <span className="font-semibold text-white">{post.user.username}</span>
                      </Link>
                    </div>
                    <span className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <p className="text-white mb-4">{post.content}</p>

                {/* Media */}
                {post.image_url && (
                  <div 
                    className="mb-4 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <img 
                      src={post.image_url} 
                      alt="Post content"
                      className="w-full h-80 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {post.video_url && (
                  <div 
                    className="mb-4 rounded-lg overflow-hidden cursor-pointer"
                    onClick={() => setSelectedPost(post)}
                  >
                    <video 
                      src={post.video_url} 
                      className="w-full h-80 object-cover"
                      controls
                    />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => toggleLike(post.id)}
                      className={`text-muted-foreground hover:text-white ${post.is_liked ? 'text-pink-400' : ''}`}
                    >
                      <Heart className={`w-5 h-5 mr-2 ${post.is_liked ? 'fill-current' : ''}`} />
                      {post.likes_count}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-muted-foreground hover:text-white"
                      onClick={() => setSelectedPost(post)}
                    >
                      <MessageCircle className="w-5 h-5 mr-2" />
                      {post.comments_count}
                    </Button>
                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                      <Share2 className="w-5 h-5" />
                    </Button>
                  </div>
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-white">
                    <Bookmark className="w-5 h-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <PostPreviewModal 
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        onToggleLike={toggleLike}
      />

      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={handlePostCreated}
      />
    </div>
  );
};

export default Feed;
