import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, BookOpen, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Figure {
  id: string;
  name: string;
  description: string | null;
  difficulty_level: string | null;
  image_url: string | null;
  video_url: string | null;
  category: string | null;
  instructions: string | null;
}

const FigureOfTheDay = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [figure, setFigure] = useState<Figure | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchFigureOfTheDay();
    }
  }, [user]);

  const fetchFigureOfTheDay = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Get user's sports preferences
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('sports')
        .eq('id', user.id)
        .single();

      if (profileError) throw profileError;

      const userSports = profile?.sports || [];
      
      if (userSports.length === 0) {
        toast({
          title: "No sports selected",
          description: "Please select your sports preferences first",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      // Fetch random figure from user's sports categories
      const { data: figures, error: figuresError } = await supabase
        .from('figures')
        .select('*')
        .in('category', userSports);

      if (figuresError) throw figuresError;

      if (!figures || figures.length === 0) {
        toast({
          title: "No figures available",
          description: "No figures found for your selected sports",
          variant: "destructive"
        });
        navigate('/');
        return;
      }

      // Select random figure
      const randomIndex = Math.floor(Math.random() * figures.length);
      setFigure(figures[randomIndex]);

    } catch (error) {
      console.error('Error fetching figure of the day:', error);
      toast({
        title: "Error",
        description: "Failed to load figure of the day",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading your figure of the day...</div>
      </div>
    );
  }

  if (!figure) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">No Figure Available</h1>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button 
            onClick={() => navigate('/')} 
            variant="ghost" 
            size="sm"
            className="text-white hover:text-primary"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <Target className="w-8 h-8 text-purple-400" />
              Figure of the Day
            </h1>
            <p className="text-muted-foreground">Perfect your technique with today's featured move</p>
          </div>
        </div>

        {/* Figure Card */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-2xl mb-2">{figure.name}</CardTitle>
                <div className="flex gap-2 mb-4">
                  {figure.category && (
                    <Badge variant="secondary" className="bg-purple-500/20 text-purple-400">
                      {figure.category}
                    </Badge>
                  )}
                  {figure.difficulty_level && (
                    <Badge variant="outline" className="border-white/20 text-white">
                      {figure.difficulty_level}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Image/Video */}
            <div className="aspect-video bg-black/20 rounded-lg overflow-hidden">
              {figure.image_url ? (
                <img 
                  src={figure.image_url} 
                  alt={figure.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-white/60">
                  <BookOpen className="w-16 h-16" />
                </div>
              )}
            </div>

            {/* Description */}
            {figure.description && (
              <div>
                <h3 className="text-white font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{figure.description}</p>
              </div>
            )}

            {/* Instructions */}
            {figure.instructions && (
              <div>
                <h3 className="text-white font-semibold mb-2">Instructions</h3>
                <p className="text-muted-foreground whitespace-pre-line">{figure.instructions}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4 pt-4">
              {figure.video_url && (
                <Button className="flex-1" asChild>
                  <a href={figure.video_url} target="_blank" rel="noopener noreferrer">
                    <Play className="w-4 h-4 mr-2" />
                    Watch Video
                  </a>
                </Button>
              )}
              <Button 
                variant="outline" 
                onClick={() => navigate('/library')}
                className="flex-1"
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Explore More Figures
              </Button>
              <Button 
                variant="secondary" 
                onClick={fetchFigureOfTheDay}
                className="bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
              >
                <Target className="w-4 h-4 mr-2" />
                New Figure
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FigureOfTheDay;