import React, { useState, useEffect } from 'react';
import { X, Play, Clock, Target, User, Tag, Plus, CheckCircle, Bookmark, AlertCircle, CircleMinus, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PostPreviewModal } from '@/components/PostPreviewModal';
import { CreatePostModal } from '@/components/CreatePostModal';
import { ShareExerciseModal } from '@/components/ShareExerciseModal';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface FigurePreviewModalProps {
  figure: any;
  isOpen: boolean;
  onClose: () => void;
}

export const FigurePreviewModal = ({ figure, isOpen, onClose }: FigurePreviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [communityPosts, setCommunityPosts] = useState([]);
  const [friendsPosts, setFriendsPosts] = useState([]);
  const [myPosts, setMyPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [figureProgress, setFigureProgress] = useState<any>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  // Fetch posts related to this figure
  const fetchFigurePosts = async () => {
    if (!figure || !user) return;

    try {
      setLoading(true);
      
      // Get user's friends (people they follow)
      const { data: friendIds } = await supabase
        .from('user_follows')
        .select('following_id')
        .eq('follower_id', user.id);

      const friendIdList = friendIds?.map(f => f.following_id) || [];
      
      // Fetch all posts related to this figure
      const { data: postsData, error } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            id,
            username,
            avatar_url,
            role
          )
        `)
        .eq('figure_id', figure.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (postsData) {
        // Get likes and comments counts for each post
        const postsWithCounts = await Promise.all(
          postsData.map(async (post) => {
            const { count: likesCount } = await supabase
              .from('post_likes')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            const { count: commentsCount } = await supabase
              .from('post_comments')
              .select('*', { count: 'exact', head: true })
              .eq('post_id', post.id);

            const { data: userLike } = await supabase
              .from('post_likes')
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
              user: {
                id: post.profiles?.id || '',
                username: post.profiles?.username || '',
                avatar_url: post.profiles?.avatar_url || null,
                role: post.profiles?.role || 'free',
              },
              likes_count: likesCount || 0,
              comments_count: commentsCount || 0,
              is_liked: !!userLike,
            };
          })
        );

        // Separate posts into different categories
        const community = postsWithCounts.filter(post => 
          post.user_id !== user.id && !friendIdList.includes(post.user_id)
        );
        const friends = postsWithCounts.filter(post => 
          friendIdList.includes(post.user_id)
        );
        const mine = postsWithCounts.filter(post => post.user_id === user.id);
        
        setCommunityPosts(community);
        setFriendsPosts(friends);
        setMyPosts(mine);
      }
    } catch (error) {
      console.error('Error fetching figure posts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch figure progress
  const fetchFigureProgress = async () => {
    if (!figure || !user) return;

    try {
      const { data, error } = await supabase
        .from('figure_progress')
        .select('*')
        .eq('user_id', user.id)
        .eq('figure_id', figure.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      setFigureProgress(data);
    } catch (error) {
      console.error('Error fetching figure progress:', error);
    }
  };

  // Update figure progress status
  const updateFigureStatus = async (status: string) => {
    if (!figure || !user) return;

    try {
      setUpdatingStatus(true);
      
      // Use upsert with proper conflict resolution
      const { data, error } = await supabase
        .from('figure_progress')
        .upsert({
          user_id: user.id,
          figure_id: figure.id,
          status: status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,figure_id'
        })
        .select()
        .single();

      if (error) throw error;
      
      setFigureProgress(data);
      toast({
        title: "Status updated!",
        description: `Exercise marked as ${status.replace('_', ' ')}.`,
      });
    } catch (error) {
      console.error('Error updating figure status:', error);
      toast({
        title: "Error",
        description: "Failed to update exercise status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen && figure) {
      fetchFigurePosts();
      fetchFigureProgress();
    }
  }, [isOpen, figure, user]);

  if (!figure) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Expert': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'for_later': return <Bookmark className="w-4 h-4 text-blue-400" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-400" />;
      default: return <CircleMinus className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'for_later': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto glass-effect border-white/10 p-0">
          <DialogTitle className="sr-only">{figure?.name}</DialogTitle>
          <DialogDescription className="sr-only">
            {figure?.description || `Details and progress tracking for ${figure?.name}`}
          </DialogDescription>
          <div className="flex flex-col lg:flex-row min-h-[80vh]">
            {/* Media Section */}
            <div className="lg:w-1/2 bg-black relative">
              
              {figure.video_url ? (
                <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
                  <video 
                    src={figure.video_url} 
                    className="w-full h-full object-contain"
                    controls
                    autoPlay={false}
                  />
                </div>
              ) : figure.image_url ? (
                <div className="relative w-full h-full min-h-[400px] flex items-center justify-center">
                  <img 
                    src={figure.image_url} 
                    alt={figure.name}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-full h-full min-h-[400px] flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <Target className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <p>No media available</p>
                  </div>
                </div>
              )}
            </div>

            {/* Details Section */}
            <div className="lg:w-1/2 flex flex-col bg-black/50 backdrop-blur-sm">
              {/* Header */}
              <div className="p-6 border-b border-white/10">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-2xl font-bold text-white">{figure.name}</h2>
                  <div className="flex items-center space-x-2">
                    {figure.difficulty_level && (
                      <Badge className={`${getDifficultyColor(figure.difficulty_level)}`}>
                        {figure.difficulty_level}
                      </Badge>
                    )}
                    <Button
                      onClick={() => setShowShareModal(true)}
                      size="sm"
                      variant="ghost"
                      className="text-muted-foreground hover:text-white"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={onClose}
                      className="w-8 h-8 p-0 bg-black/50 hover:bg-black/70"
                      variant="ghost"
                    >
                      <X className="w-4 h-4 text-white" />
                    </Button>
                  </div>
                </div>
                
                {figure.description && (
                  <p className="text-muted-foreground mb-4">{figure.description}</p>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  {figure.category && (
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {figure.category}
                    </Badge>
                  )}
                  {figure.type && (
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {figure.type}
                    </Badge>
                  )}
                  {figure.tags && figure.tags.map((tag, index) => (
                    <Badge key={index} variant="outline" className="border-purple-500/30 text-purple-300">
                      <Tag className="w-3 h-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>

                {figure.profiles?.username && (
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <User className="w-4 h-4" />
                    <span>Created by {figure.profiles.username}</span>
                  </div>
                )}
              </div>

              {/* Progress Status Section */}
              <div className="p-6 border-b border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">My Progress</h3>
                <div className="space-y-3">
                  {/* Current Status */}
                  {figureProgress && (
                    <div className="flex items-center space-x-2 mb-4">
                      <span className="text-muted-foreground">Current status:</span>
                      <Badge className={getStatusColor(figureProgress.status)}>
                        {getStatusIcon(figureProgress.status)}
                        <span className="ml-1 capitalize">{figureProgress.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  )}
                  
                  {/* Status Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFigureStatus('completed')}
                      disabled={updatingStatus}
                      className={`border-green-500/30 text-green-400 hover:bg-green-500/20 ${
                        figureProgress?.status === 'completed' ? 'bg-green-500/20' : ''
                      }`}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFigureStatus('for_later')}
                      disabled={updatingStatus}
                      className={`border-blue-500/30 text-blue-400 hover:bg-blue-500/20 ${
                        figureProgress?.status === 'for_later' ? 'bg-blue-500/20' : ''
                      }`}
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      For Later
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFigureStatus('failed')}
                      disabled={updatingStatus}
                      className={`border-red-500/30 text-red-400 hover:bg-red-500/20 ${
                        figureProgress?.status === 'failed' ? 'bg-red-500/20' : ''
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Failed
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateFigureStatus('not_tried')}
                      disabled={updatingStatus}
                      className={`border-gray-500/30 text-gray-400 hover:bg-gray-500/20 ${
                        figureProgress?.status === 'not_tried' || !figureProgress ? 'bg-gray-500/20' : ''
                      }`}
                    >
                      <CircleMinus className="w-4 h-4 mr-2" />
                      Not Tried
                    </Button>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              {figure.instructions && (
                <div className="p-6 border-b border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-2">Instructions</h3>
                  <p className="text-muted-foreground whitespace-pre-wrap">{figure.instructions}</p>
                </div>
              )}

              {/* Community Posts Tabs */}
              <div className="flex-1 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-white">Posts about this figure</h3>
                  <Button
                    onClick={() => setShowCreatePost(true)}
                    size="sm"
                    className="bg-primary hover:bg-primary/90"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add My Version
                  </Button>
                </div>
                
                <Tabs defaultValue="community" className="w-full">
                  <TabsList className="grid w-full grid-cols-3 bg-white/5">
                    <TabsTrigger value="community" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
                      Community ({communityPosts.length})
                    </TabsTrigger>
                    <TabsTrigger value="friends" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
                      Friends ({friendsPosts.length})
                    </TabsTrigger>
                    <TabsTrigger value="mine" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-pink-500">
                      My Posts ({myPosts.length})
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="community" className="mt-4">
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : communityPosts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No community posts yet for this figure
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {communityPosts.map((post) => (
                          <Card 
                            key={post.id} 
                            className="glass-effect border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => {
                              setSelectedPost(post);
                              setIsPostModalOpen(true);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <Avatar className={`w-10 h-10 ${post.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-2 ring-offset-black' : ''}`}>
                                  <AvatarImage src={post.user.avatar_url || undefined} />
                                  <AvatarFallback>{post.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-white text-sm">{post.user.username}</span>
                                    <span className="text-muted-foreground text-xs">
                                      {post.created_at && !isNaN(new Date(post.created_at).getTime()) 
                                        ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                                        : 'Recently'
                                      }
                                    </span>
                                  </div>
                                  <p className="text-white text-sm line-clamp-2">{post.content}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-muted-foreground text-xs">
                                    <span>{post.likes_count} likes</span>
                                    <span>{post.comments_count} comments</span>
                                  </div>
                                </div>
                                {(post.image_url || post.video_url) && (
                                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                    {post.video_url ? (
                                      <div className="w-full h-full bg-black/50 flex items-center justify-center">
                                        <Play className="w-4 h-4 text-white" />
                                      </div>
                                    ) : (
                                      <img 
                                        src={post.image_url} 
                                        alt="Post content"
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="friends" className="mt-4">
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : friendsPosts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Your friends haven't posted about this figure yet
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {friendsPosts.map((post) => (
                          <Card 
                            key={post.id} 
                            className="glass-effect border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => {
                              setSelectedPost(post);
                              setIsPostModalOpen(true);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <Avatar className={`w-10 h-10 ${post.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-2 ring-offset-black' : ''}`}>
                                  <AvatarImage src={post.user.avatar_url || undefined} />
                                  <AvatarFallback>{post.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-white text-sm">{post.user.username}</span>
                                    <span className="text-muted-foreground text-xs">
                                      {post.created_at && !isNaN(new Date(post.created_at).getTime()) 
                                        ? formatDistanceToNow(new Date(post.created_at), { addSuffix: true })
                                        : 'Recently'
                                      }
                                    </span>
                                  </div>
                                  <p className="text-white text-sm line-clamp-2">{post.content}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-muted-foreground text-xs">
                                    <span>{post.likes_count} likes</span>
                                    <span>{post.comments_count} comments</span>
                                  </div>
                                </div>
                                {(post.image_url || post.video_url) && (
                                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                    {post.video_url ? (
                                      <div className="w-full h-full bg-black/50 flex items-center justify-center">
                                        <Play className="w-4 h-4 text-white" />
                                      </div>
                                    ) : (
                                      <img 
                                        src={post.image_url} 
                                        alt="Post content"
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="mine" className="mt-4">
                    {loading ? (
                      <div className="text-center py-8 text-muted-foreground">Loading...</div>
                    ) : myPosts.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        You haven't posted about this figure yet
                      </div>
                    ) : (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {myPosts.map((post) => (
                          <Card 
                            key={post.id} 
                            className="glass-effect border-white/10 cursor-pointer hover:bg-white/5 transition-colors"
                            onClick={() => {
                              setSelectedPost(post);
                              setIsPostModalOpen(true);
                            }}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start space-x-3">
                                <Avatar className={`w-10 h-10 ${post.user.role === 'trainer' ? 'ring-2 ring-gradient-to-r from-yellow-400 to-orange-500 ring-offset-2 ring-offset-black' : ''}`}>
                                  <AvatarImage src={post.user.avatar_url || undefined} />
                                  <AvatarFallback>{post.user.username[0]?.toUpperCase() || 'U'}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-white text-sm">{post.user.username}</span>
                                    <span className="text-muted-foreground text-xs">
                                      {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                                    </span>
                                  </div>
                                  <p className="text-white text-sm line-clamp-2">{post.content}</p>
                                  <div className="flex items-center space-x-4 mt-2 text-muted-foreground text-xs">
                                    <span>{post.likes_count} likes</span>
                                    <span>{post.comments_count} comments</span>
                                  </div>
                                </div>
                                {(post.image_url || post.video_url) && (
                                  <div className="w-12 h-12 rounded overflow-hidden flex-shrink-0">
                                    {post.video_url ? (
                                      <div className="w-full h-full bg-black/50 flex items-center justify-center">
                                        <Play className="w-4 h-4 text-white" />
                                      </div>
                                    ) : (
                                      <img 
                                        src={post.image_url} 
                                        alt="Post content"
                                        className="w-full h-full object-cover"
                                      />
                                    )}
                                  </div>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Post Preview Modal */}
      <PostPreviewModal 
        post={selectedPost}
        isOpen={isPostModalOpen}
        onClose={() => {
          setIsPostModalOpen(false);
          setSelectedPost(null);
        }}
      />

      {/* Create Post Modal */}
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
        onPostCreated={(newPost) => {
          // Add the new post to the appropriate list and refresh
          fetchFigurePosts();
          setShowCreatePost(false);
        }}
        preselectedFigure={figure}
      />

      {/* Share Exercise Modal */}
      <ShareExerciseModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        exerciseId={figure?.id || ''}
        exerciseName={figure?.name || ''}
      />
    </>
  );
};