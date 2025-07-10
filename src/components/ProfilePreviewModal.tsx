import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Calendar, Users, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useMutualFriends } from '@/hooks/useMutualFriends';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

export const ProfilePreviewModal = ({ isOpen, onClose, userId }: ProfilePreviewModalProps) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { mutualFriends } = useMutualFriends(user?.id || '', userId);

  useEffect(() => {
    if (isOpen && userId) {
      fetchProfileData();
    }
  }, [isOpen, userId]);

  const fetchProfileData = async () => {
    if (!userId) return;

    try {
      setLoading(true);

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Fetch public posts
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey (
            username,
            avatar_url
          ),
          figures (
            name
          )
        `)
        .eq('user_id', userId)
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(6);

      if (postsError) throw postsError;
      setPosts(postsData || []);

      // Fetch achievements
      const { data: achievementsData, error: achievementsError } = await supabase
        .from('user_achievements')
        .select(`
          *,
          achievements (
            name,
            description,
            icon,
            points
          )
        `)
        .eq('user_id', userId)
        .order('earned_at', { ascending: false })
        .limit(4);

      if (achievementsError) throw achievementsError;
      setAchievements(achievementsData || []);

    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !userId) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Profile Preview</DialogTitle>
        </DialogHeader>
        
        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading profile...</p>
          </div>
        ) : profile ? (
          <div className="space-y-6">
            {/* Profile Header */}
            <div className="flex items-center space-x-4">
              <Avatar className="w-20 h-20">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback>{profile.username[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{profile.username}</h2>
                <p className="text-muted-foreground">{profile.bio || 'Aerial enthusiast'}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="secondary" className="bg-primary/20 text-primary">
                    {profile.role === 'trainer' ? 'Trainer' : 'Member'}
                  </Badge>
                  {mutualFriends && mutualFriends.length > 0 && (
                    <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>{mutualFriends.length} mutual friends</span>
                    </div>
                  )}
                </div>
              </div>
              <Link to={`/profile/${userId}`}>
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  View Full Profile
                </Button>
              </Link>
            </div>

            {/* Achievements */}
            {achievements.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-white mb-3">Recent Achievements</h3>
                <div className="grid grid-cols-2 gap-3">
                  {achievements.map((achievement) => (
                    <Card key={achievement.id} className="glass-effect border-white/10">
                      <CardContent className="p-3">
                        <div className="flex items-center space-x-2">
                          <span className="text-2xl">{achievement.achievements.icon}</span>
                          <div>
                            <p className="font-medium text-white text-sm">{achievement.achievements.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(achievement.earned_at), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Posts */}
            {posts.length > 0 && (
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
            )}

            {/* Empty State */}
            {posts.length === 0 && achievements.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p>No public content available</p>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>Profile not found</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};