import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Music, Target, Zap, Heart, Play } from 'lucide-react';

interface TrainingDetailsModalProps {
  session: any;
  isOpen: boolean;
  onClose: () => void;
  onStartTraining: (sessionId: string) => void;
}

export const TrainingDetailsModal: React.FC<TrainingDetailsModalProps> = ({
  session,
  isOpen,
  onClose,
  onStartTraining
}) => {
  if (!session) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="glass-effect border-white/10 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">{session.title}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Session Image */}
          <div className="relative">
            <img
              src={session.thumbnail_url || "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=300&fit=crop"}
              alt={session.title}
              className="w-full h-48 object-cover rounded-lg"
            />
            <Badge className={`absolute top-2 right-2 ${getDifficultyColor(session.difficulty_level || 'Beginner')} text-white`}>
              {session.difficulty_level || 'Beginner'}
            </Badge>
          </div>

          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-white">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              <span>{session.duration_minutes || 45} minutes</span>
            </div>
            {session.playlist && (
              <div className="flex items-center text-white">
                <Music className="w-5 h-5 mr-2 text-primary" />
                <span>{session.playlist}</span>
              </div>
            )}
          </div>

          {/* Session Description */}
          {session.description && (
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-muted-foreground">{session.description}</p>
            </div>
          )}

          {/* Session Structure */}
          <div className="space-y-4">
            {session.warmup_exercises && session.warmup_exercises.length > 0 && (
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                  <h3 className="font-semibold text-white">Warm-up</h3>
                </div>
                 <ul className="text-muted-foreground space-y-1">
                   {session.warmup_exercises.map((item: any, index: number) => (
                     <li key={index} className="flex items-center justify-between">
                       <div className="flex items-center">
                         <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                         <span>{typeof item === 'string' ? item : item.name}</span>
                       </div>
                       {typeof item === 'object' && (
                         <div className="text-xs text-white/60">
                           {item.sets} sets × {item.reps} reps ({item.hold_time_seconds}s hold)
                         </div>
                       )}
                     </li>
                   ))}
                 </ul>
              </div>
            )}

            {session.figures && session.figures.length > 0 && (
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Target className="w-5 h-5 mr-2 text-purple-500" />
                  <h3 className="font-semibold text-white">Figures & Combos</h3>
                </div>
                 <ul className="text-muted-foreground space-y-1">
                   {session.figures.map((item: any, index: number) => (
                     <li key={index} className="flex items-center justify-between">
                       <div className="flex items-center">
                         <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                         <span>{typeof item === 'string' ? item : item.name}</span>
                       </div>
                       {typeof item === 'object' && (
                         <div className="text-xs text-white/60">
                           {item.sets} sets × {item.reps} reps ({item.hold_time_seconds}s hold)
                         </div>
                       )}
                     </li>
                   ))}
                 </ul>
              </div>
            )}

            {session.stretching_exercises && session.stretching_exercises.length > 0 && (
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Heart className="w-5 h-5 mr-2 text-pink-500" />
                  <h3 className="font-semibold text-white">Stretching</h3>
                </div>
                 <ul className="text-muted-foreground space-y-1">
                   {session.stretching_exercises.map((item: any, index: number) => (
                     <li key={index} className="flex items-center justify-between">
                       <div className="flex items-center">
                         <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                         <span>{typeof item === 'string' ? item : item.name}</span>
                       </div>
                       {typeof item === 'object' && (
                         <div className="text-xs text-white/60">
                           {item.sets} sets × {item.reps} reps ({item.hold_time_seconds}s hold)
                         </div>
                       )}
                     </li>
                   ))}
                 </ul>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button 
              onClick={() => onStartTraining(session.id)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Start Training
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};