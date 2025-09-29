import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, CheckCircle, ExternalLink } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface FigurePreviewModalProps {
  figure: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
    instructions?: string;
    image_url?: string;
    description?: string;
    video_url?: string;
    type?: string;
    tags?: string[];
    hold_time_seconds?: number;
  } | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FigurePreviewModal: React.FC<FigurePreviewModalProps> = ({
  figure,
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [figureProgress, setFigureProgress] = useState<string>('not_tried');
  const [loading, setLoading] = useState(false);

  // Fetch figure progress
  const fetchFigureProgress = async () => {
    if (!figure || !user) return;

    try {
      const { data, error } = await supabase
        .from('figure_progress')
        .select('status')
        .eq('user_id', user.id)
        .eq('figure_id', figure.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      setFigureProgress(data?.status || 'not_tried');
    } catch (error) {
      console.error('Error fetching figure progress:', error);
    }
  };

  // Update figure status
  const updateFigureStatus = async (newStatus: string) => {
    if (!figure || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('figure_progress')
        .upsert({
          user_id: user.id,
          figure_id: figure.id,
          status: newStatus,
        });

      if (error) throw error;

      setFigureProgress(newStatus);
      toast.success(`Figure marked as ${newStatus.replace('_', ' ')}`);
    } catch (error) {
      console.error('Error updating figure status:', error);
      toast.error('Failed to update figure status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && figure) {
      fetchFigureProgress();
    }
  }, [isOpen, figure, user]);

  if (!figure) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty?.toLowerCase()) {
      case 'beginner':
        return 'bg-green-500/20 text-green-400 border-green-400/30';
      case 'intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-400/30';
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-400/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-400/30';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl w-full p-0 bg-black/95 border-white/10">
        <div className="relative">
          
          {/* Image */}
          <div className="w-full aspect-video bg-black/50 flex items-center justify-center">
            {figure.image_url ? (
              <img
                src={figure.image_url}
                alt={figure.name}
                className="w-full h-full object-cover"
              />
            ) : figure.video_url ? (
              <video
                src={figure.video_url}
                controls
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-6xl mb-4">📷</div>
                <p>No media available</p>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold text-white mb-2">{figure.name}</h2>
              <div className="flex items-center gap-2 mb-3">
                <Badge className={getDifficultyColor(figure.difficulty_level)}>
                  {figure.difficulty_level || 'Unknown'}
                </Badge>
                {figure.category === "core" && figure.hold_time_seconds && figure.hold_time_seconds > 0 && (
                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                    Hold {figure.hold_time_seconds}s
                  </Badge>
                )}
              </div>
            </div>

            {/* Completed Status Button */}
            {user && (
              <div className="mb-6">
                <Button
                  variant={figureProgress === 'completed' ? 'default' : 'outline'}
                  onClick={() => updateFigureStatus(figureProgress === 'completed' ? 'not_tried' : 'completed')}
                  disabled={loading}
                  className={cn(
                    "w-full flex items-center justify-center gap-2",
                    figureProgress === 'completed'
                      ? "bg-green-600 hover:bg-green-700 text-white"
                      : "border-green-400/30 text-green-400 hover:bg-green-400/10"
                  )}
                >
                  <CheckCircle className="w-4 h-4" />
                  {figureProgress === 'completed' ? 'Completed!' : 'Mark as Completed'}
                </Button>
              </div>
            )}

            {/* View Full Exercise Button */}
            <Button
              onClick={() => navigate(`/exercise/${figure.id}`)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View Full Exercise
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};