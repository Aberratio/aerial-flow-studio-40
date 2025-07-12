import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, User, Clock, Target, BookOpen, Edit, Trash2, CheckCircle, Bookmark, AlertCircle, Share, Users, Globe } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { ShareExerciseModal } from '@/components/ShareExerciseModal';
import { CreateExerciseModal } from '@/components/CreateExerciseModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';

const ExerciseDetail = () => {
  const { exerciseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [exercise, setExercise] = useState<any>(null);
  const [progress, setProgress] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [activeTab, setActiveTab] = useState('my-versions');
  const [myVersions, setMyVersions] = useState<any[]>([]);
  const [friendsVersions, setFriendsVersions] = useState<any[]>([]);
  const [communityVersions, setCommunityVersions] = useState<any[]>([]);
  const [showImagePreview, setShowImagePreview] = useState(false);

  // Fetch exercise details
  const fetchExerciseDetails = async () => {
    if (!exerciseId) return;

    try {
      setLoading(true);
      
      // Fetch exercise
      const { data: exerciseData, error: exerciseError } = await supabase
        .from('figures')
        .select(`
          *,
          profiles!figures_created_by_fkey (
            username
          )
        `)
        .eq('id', exerciseId)
        .single();

      if (exerciseError) throw exerciseError;
      setExercise(exerciseData);

      // Fetch user progress if logged in
      if (user && exerciseData) {
        const { data: progressData } = await supabase
          .from('figure_progress')
          .select('*')
          .eq('figure_id', exerciseId)
          .eq('user_id', user.id)
          .maybeSingle();

        setProgress(progressData);
      }

      // Fetch community versions (posts related to this exercise, excluding own and friends)
      if (exerciseData) {
        let communityQuery = supabase
          .from('posts')
          .select(`
            *,
            profiles:user_id (
              username,
              avatar_url
            )
          `)
          .eq('figure_id', exerciseId)
          .eq('privacy', 'public');

        // Exclude current user's posts
        if (user) {
          communityQuery = communityQuery.neq('user_id', user.id);
        }

        const { data: communityData } = await communityQuery
          .order('created_at', { ascending: false })
          .limit(10);

        setCommunityVersions(communityData || []);

        // Fetch friends versions if user is logged in
        if (user) {
          const { data: friendsData } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:user_id (
                username,
                avatar_url
              )
            `)
            .eq('figure_id', exerciseId)
            .eq('privacy', 'public')
            .in('user_id', []) // TODO: Add actual friends list
            .order('created_at', { ascending: false })
            .limit(10);

          setFriendsVersions(friendsData || []);

          // Fetch user's own versions
          const { data: myData } = await supabase
            .from('posts')
            .select(`
              *,
              profiles:user_id (
                username,
                avatar_url
              )
            `)
            .eq('figure_id', exerciseId)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          setMyVersions(myData || []);
        }
      }
    } catch (error) {
      console.error('Error fetching exercise:', error);
      toast({
        title: "Error",
        description: "Failed to load exercise details",
        variant: "destructive"
      });
      navigate('/library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExerciseDetails();
  }, [exerciseId, user]);

  const updateProgress = async (status: string) => {
    if (!user || !exercise) return;

    try {
      const { data, error } = await supabase
        .from('figure_progress')
        .upsert({
          user_id: user.id,
          figure_id: exercise.id,
          status: status,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,figure_id'
        })
        .select()
        .single();

      if (error) throw error;

      setProgress(data);
      toast({
        title: "Progress Updated",
        description: `Exercise marked as ${status.replace('_', ' ')}`
      });
    } catch (error) {
      console.error('Error updating progress:', error);
      toast({
        title: "Error",
        description: "Failed to update progress",
        variant: "destructive"
      });
    }
  };

  const deleteExercise = async () => {
    if (!exercise) return;

    try {
      const { error } = await supabase
        .from('figures')
        .delete()
        .eq('id', exercise.id);

      if (error) throw error;

      toast({
        title: "Exercise Deleted",
        description: "Exercise has been deleted successfully"
      });
      navigate('/library');
    } catch (error) {
      console.error('Error deleting exercise:', error);
      toast({
        title: "Error",
        description: "Failed to delete exercise",
        variant: "destructive"
      });
    }
  };

  const canModifyExercise = () => {
    if (!user || !exercise) return false;
    return user.role === 'admin' || user.role === 'trainer' || exercise.created_by === user.id;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'expert':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'for_later':
        return <Bookmark className="w-5 h-5 text-blue-400" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-lg mb-4">Exercise not found</p>
          <Button onClick={() => navigate('/library')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 lg:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0 mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/library')}
            className="text-white hover:bg-white/5 self-start"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Library
          </Button>

          <div className="flex items-center space-x-2 flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowShareModal(true)}
              className="border-white/20 text-white hover:bg-white/10 text-sm"
              size="sm"
            >
              <Share className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>

            {canModifyExercise() && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setShowEditModal(true)}
                  className="border-white/20 text-white hover:bg-white/10 text-sm"
                  size="sm"
                >
                  <Edit className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteModal(true)}
                  className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Media Section */}
          <div className="space-y-4">
            <Card className="glass-effect border-white/10 overflow-hidden">
              <div className="relative">
                <img
                  src={exercise.image_url || 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=600&fit=crop'}
                  alt={exercise.name}
                  className="w-full h-64 sm:h-80 object-cover cursor-pointer hover:scale-105 transition-transform duration-300"
                  onClick={() => setShowImagePreview(true)}
                />
                {exercise.video_url && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/20 transition-colors cursor-pointer">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                      <Play className="w-8 h-8 text-white" />
                    </div>
                  </div>
                )}
                
                {/* Progress Status Overlay */}
                {user && progress?.status && progress.status !== 'not_tried' && (
                  <div className="absolute top-4 left-4">
                    <div className="flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-full px-3 py-2">
                      {getStatusIcon(progress.status)}
                      <span className="text-white text-sm capitalize">{progress.status === 'failed' ? 'Practice' : progress.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Exercise Status */}
            {user && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-white font-semibold">Your Progress</h3>
                    {progress?.status && progress.status !== 'not_tried' && (
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(progress.status)}
                        <span className="text-sm text-muted-foreground capitalize">
                          {progress.status === 'failed' ? 'Practice' : progress.status.replace('_', ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={progress?.status === 'completed' ? 'primary' : 'outline'}
                      onClick={() => updateProgress('completed')}
                      className="flex-1 min-w-[120px]"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Completed
                    </Button>
                    <Button
                      size="sm"
                      variant={progress?.status === 'for_later' ? 'primary' : 'outline'}
                      onClick={() => updateProgress('for_later')}
                      className="flex-1 min-w-[120px]"
                    >
                      <Bookmark className="w-4 h-4 mr-2" />
                      For Later
                    </Button>
                    <Button
                      size="sm"
                      variant={progress?.status === 'failed' ? 'primary' : 'outline'}
                      onClick={() => updateProgress('failed')}
                      className="flex-1 min-w-[120px]"
                    >
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Practice
                    </Button>
                    <Button
                      size="sm"
                      variant={progress?.status === 'not_tried' ? 'primary' : 'outline'}
                      onClick={() => updateProgress('not_tried')}
                      className="flex-1 min-w-[120px]"
                    >
                      <Target className="w-4 h-4 mr-2" />
                      Not Tried
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-4">{exercise.name}</h1>
              
              {/* Metadata */}
              <div className="flex flex-wrap gap-3 mb-4">
                {exercise.difficulty_level && (
                  <Badge className={getDifficultyColor(exercise.difficulty_level)}>
                    {exercise.difficulty_level}
                  </Badge>
                )}
                {exercise.category && (
                  <Badge variant="outline" className="border-white/20 text-white">
                    {exercise.category}
                  </Badge>
                )}
                {exercise.type && (
                  <Badge variant="outline" className="border-white/20 text-white">
                    {exercise.type.replace('_', ' ')}
                  </Badge>
                )}
              </div>

              {/* Creator */}
              {exercise.profiles?.username && (
                <div className="flex items-center text-muted-foreground mb-4">
                  <User className="w-4 h-4 mr-2" />
                  Created by {exercise.profiles.username}
                </div>
              )}
            </div>

            {/* Description */}
            {exercise.description && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <BookOpen className="w-5 h-5 text-purple-400 mr-2" />
                    <h3 className="text-white font-semibold">Description</h3>
                  </div>
                  <p className="text-muted-foreground">{exercise.description}</p>
                </CardContent>
              </Card>
            )}

            {/* Instructions */}
            {exercise.instructions && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center mb-3">
                    <Target className="w-5 h-5 text-green-400 mr-2" />
                    <h3 className="text-white font-semibold">Instructions</h3>
                  </div>
                  <div className="text-muted-foreground whitespace-pre-line">
                    {exercise.instructions}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags */}
            {exercise.tags && exercise.tags.length > 0 && (
              <Card className="glass-effect border-white/10">
                <CardContent className="p-4">
                  <h3 className="text-white font-semibold mb-3">Tags</h3>
                  <div className="flex flex-wrap gap-2">
                    {exercise.tags.map((tag: string, index: number) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="border-white/20 text-white"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Versions Section */}
        <div className="mt-12">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full mb-6 bg-muted p-1">
              <TabsTrigger 
                value="my-versions" 
                className="flex-1 text-xs sm:text-sm"
              >
                <User className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">My Versions</span>
                <span className="sm:hidden">My</span>
                <span className="ml-1">({myVersions.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="friends-versions"
                className="flex-1 text-xs sm:text-sm"
              >
                <Users className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Friends</span>
                <span className="sm:hidden">Friends</span>
                <span className="ml-1">({friendsVersions.length})</span>
              </TabsTrigger>
              <TabsTrigger 
                value="community"
                className="flex-1 text-xs sm:text-sm"
              >
                <Globe className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Community</span>
                <span className="sm:hidden">All</span>
                <span className="ml-1">({communityVersions.length})</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-versions">
              {myVersions.length === 0 ? (
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No versions yet. Share your practice!</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {myVersions.map((post) => (
                    <Card key={post.id} className="glass-effect border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors" onClick={() => navigate(`/post/${post.id}`)}>
                      <CardContent className="p-4">
                        {post.image_url && (
                          <img src={post.image_url} alt="Version" className="w-full h-32 object-cover rounded mb-3" />
                        )}
                        <p className="text-white text-sm line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={post.profiles?.avatar_url} />
                              <AvatarFallback>{post.profiles?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{post.profiles?.username}</span>
                          </div>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="friends-versions">
              {friendsVersions.length === 0 ? (
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No friends' versions yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {friendsVersions.map((post) => (
                    <Card key={post.id} className="glass-effect border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors" onClick={() => navigate(`/post/${post.id}`)}>
                      <CardContent className="p-4">
                        {post.image_url && (
                          <img src={post.image_url} alt="Version" className="w-full h-32 object-cover rounded mb-3" />
                        )}
                        <p className="text-white text-sm line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={post.profiles?.avatar_url} />
                              <AvatarFallback>{post.profiles?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{post.profiles?.username}</span>
                          </div>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="community">
              {communityVersions.length === 0 ? (
                <Card className="glass-effect border-white/10">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No community versions yet.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {communityVersions.map((post) => (
                    <Card key={post.id} className="glass-effect border-white/10 cursor-pointer hover:border-purple-500/30 transition-colors" onClick={() => navigate(`/post/${post.id}`)}>
                      <CardContent className="p-4">
                        {post.image_url && (
                          <img src={post.image_url} alt="Version" className="w-full h-32 object-cover rounded mb-3" />
                        )}
                        <p className="text-white text-sm line-clamp-2 mb-2">{post.content}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <div className="flex items-center space-x-1">
                            <Avatar className="w-4 h-4">
                              <AvatarImage src={post.profiles?.avatar_url} />
                              <AvatarFallback>{post.profiles?.username?.[0]}</AvatarFallback>
                            </Avatar>
                            <span>{post.profiles?.username}</span>
                          </div>
                          <span>{new Date(post.created_at).toLocaleDateString()}</span>
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

      {/* Modals */}
      <ShareExerciseModal
        isOpen={showShareModal}
        onClose={() => setShowShareModal(false)}
        exerciseId={exercise.id}
        exerciseName={exercise.name}
      />

      <CreateExerciseModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onExerciseCreated={() => {
          setShowEditModal(false);
          fetchExerciseDetails();
        }}
        editingFigure={exercise}
      />

      <ConfirmDeleteModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={deleteExercise}
        title="Delete Exercise"
        description={`Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`}
      />

      {/* Image Preview Modal */}
      {showImagePreview && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setShowImagePreview(false)}
        >
          <div className="relative max-w-4xl max-h-full">
            <img
              src={exercise.image_url || 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=600&fit=crop'}
              alt={exercise.name}
              className="max-w-full max-h-full object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              onClick={() => setShowImagePreview(false)}
              className="absolute top-4 right-4 w-8 h-8 bg-black/50 text-white rounded-full flex items-center justify-center hover:bg-black/70 transition-colors"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExerciseDetail;