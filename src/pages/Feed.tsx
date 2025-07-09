
import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostPreviewModal } from '@/components/PostPreviewModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { Link } from 'react-router-dom';

const Feed = () => {
  const [selectedPost, setSelectedPost] = useState(null);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [posts, setPosts] = useState([

    {
      id: 1,
      user: {
        id: 1,
        username: 'aerial_grace',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=150&h=150&fit=crop&crop=face',
        verified: true
      },
      content: 'Finally nailed my first scorpion on the hoop! 🦂✨ Months of practice paying off!',
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=600&fit=crop',
      likes: 127,
      comments: 23,
      timeAgo: '2h ago',
      isLiked: false
    },
    {
      id: 2,
      user: {
        id: 2,
        username: 'silk_master',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        verified: false
      },
      content: 'Working on my drops today. The key is trusting the silk and your technique! 💪',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=600&fit=crop',
      likes: 89,
      comments: 15,
      timeAgo: '4h ago',
      isLiked: true
    },
    {
      id: 3,
      user: {
        id: 3,
        username: 'pole_phoenix',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
        verified: true
      },
      content: 'Day 15 of the flexibility challenge! My splits are getting so much better 🔥',
      image: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=600&h=600&fit=crop',
      likes: 203,
      comments: 31,
      timeAgo: '6h ago',
      isLiked: false
    }
  ]);

  const handlePostCreated = (newPost: any) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

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
                <AvatarImage src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face" />
                <AvatarFallback>You</AvatarFallback>
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

        {posts.map((post) => (
          <Card key={post.id} className="glass-effect border-white/10">
            <CardContent className="p-6">
               {/* User Header */}
               <div className="flex items-center space-x-3 mb-4">
                 <Link to={`/profile/${post.user.id}`} className="cursor-pointer">
                   <Avatar className="w-10 h-10 hover:scale-110 transition-transform">
                     <AvatarImage src={post.user.avatar} />
                     <AvatarFallback>{post.user.username[0].toUpperCase()}</AvatarFallback>
                   </Avatar>
                 </Link>
                 <div className="flex-1">
                   <div className="flex items-center space-x-2">
                     <Link to={`/profile/${post.user.id}`} className="cursor-pointer hover:text-primary transition-colors">
                       <span className="font-semibold text-white">{post.user.username}</span>
                     </Link>
                     {post.user.verified && (
                       <div className="w-4 h-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                         <span className="text-white text-xs">✓</span>
                       </div>
                     )}
                   </div>
                   <span className="text-muted-foreground text-sm">{post.timeAgo}</span>
                 </div>
               </div>

              {/* Content */}
              <p className="text-white mb-4">{post.content}</p>

              {/* Image */}
              <div 
                className="mb-4 rounded-lg overflow-hidden cursor-pointer"
                onClick={() => setSelectedPost(post)}
              >
                <img 
                  src={post.image} 
                  alt="Post content"
                  className="w-full h-80 object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className={`text-muted-foreground hover:text-white ${post.isLiked ? 'text-pink-400' : ''}`}
                  >
                    <Heart className={`w-5 h-5 mr-2 ${post.isLiked ? 'fill-current' : ''}`} />
                    {post.likes}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-white"
                    onClick={() => setSelectedPost(post)}
                  >
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
            </CardContent>
          </Card>
        ))}
      </div>

      <PostPreviewModal 
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
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
