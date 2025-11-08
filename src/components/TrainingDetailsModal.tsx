import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Music, Target, Zap, Heart, Play } from 'lucide-react';
import { useDictionary } from '@/contexts/DictionaryContext';

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

  const { getDifficultyLabel, getDifficultyColor } = useDictionary();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto glass-effect border-white/10 mx-4">
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
            <Badge className={`absolute top-2 right-2 ${getDifficultyColor(session.difficulty_level || 'beginner')} text-white`}>
              {getDifficultyLabel(session.difficulty_level) || getDifficultyLabel('beginner')}
            </Badge>
          </div>

          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-white">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              <span>{session.duration_minutes || 45} minut</span>
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
                  <h3 className="font-semibold text-white">Rozgrzewka</h3>
                </div>
                 <div className="grid grid-cols-1 gap-2">
                   {session.warmup_exercises.map((item: any, index: number) => (
                     <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-md">
                       <span className="w-5 h-5 bg-yellow-500 rounded-full flex items-center justify-center text-xs text-white shrink-0">
                         {index + 1}
                       </span>
                       
                       {/* Exercise Image */}
                       {item.figure?.image_url && (
                         <div className="w-8 h-8 rounded-md overflow-hidden shrink-0">
                           <img
                             src={item.figure.image_url}
                             alt={item.figure.name || 'Exercise'}
                             className="w-full h-full object-cover"
                           />
                         </div>
                       )}
                       
                       <div className="flex-1 min-w-0">
                         <div className="text-white text-sm font-medium truncate">
                           {typeof item === 'string' ? item : item.figure?.name || item.name || 'Exercise'}
                         </div>
                          {typeof item === 'object' && item.sets && (
                            <div className="text-xs text-white/60">
                              {item.sets} serie × {item.reps} powt.
                              {item.hold_time_seconds && ` (${item.hold_time_seconds}s przytrzymanie)`}
                            </div>
                          )}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {session.figures && session.figures.length > 0 && (
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Target className="w-5 h-5 mr-2 text-purple-500" />
                  <h3 className="font-semibold text-white">Figury i kombo</h3>
                </div>
                 <div className="grid grid-cols-1 gap-2">
                   {session.figures.map((item: any, index: number) => (
                     <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-md">
                       <span className="w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center text-xs text-white shrink-0">
                         {index + 1}
                       </span>
                       
                       {/* Exercise Image */}
                       {item.figure?.image_url && (
                         <div className="w-8 h-8 rounded-md overflow-hidden shrink-0">
                           <img
                             src={item.figure.image_url}
                             alt={item.figure.name || 'Exercise'}
                             className="w-full h-full object-cover"
                           />
                         </div>
                       )}
                       
                       <div className="flex-1 min-w-0">
                         <div className="text-white text-sm font-medium truncate">
                           {typeof item === 'string' ? item : item.figure?.name || item.name || 'Exercise'}
                         </div>
                          {typeof item === 'object' && item.sets && (
                            <div className="text-xs text-white/60">
                              {item.sets} serie × {item.reps} powt.
                              {item.hold_time_seconds && ` (${item.hold_time_seconds}s przytrzymanie)`}
                            </div>
                          )}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}

            {session.stretching_exercises && session.stretching_exercises.length > 0 && (
              <div className="bg-white/5 p-4 rounded-lg">
                <div className="flex items-center mb-2">
                  <Heart className="w-5 h-5 mr-2 text-pink-500" />
                  <h3 className="font-semibold text-white">Rozciąganie</h3>
                </div>
                 <div className="grid grid-cols-1 gap-2">
                   {session.stretching_exercises.map((item: any, index: number) => (
                     <div key={index} className="flex items-center space-x-3 p-2 bg-white/5 rounded-md">
                       <span className="w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center text-xs text-white shrink-0">
                         {index + 1}
                       </span>
                       
                       {/* Exercise Image */}
                       {item.figure?.image_url && (
                         <div className="w-8 h-8 rounded-md overflow-hidden shrink-0">
                           <img
                             src={item.figure.image_url}
                             alt={item.figure.name || 'Exercise'}
                             className="w-full h-full object-cover"
                           />
                         </div>
                       )}
                       
                       <div className="flex-1 min-w-0">
                         <div className="text-white text-sm font-medium truncate">
                           {typeof item === 'string' ? item : item.figure?.name || item.name || 'Exercise'}
                         </div>
                          {typeof item === 'object' && item.sets && (
                            <div className="text-xs text-white/60">
                              {item.sets} serie × {item.reps} powt.
                              {item.hold_time_seconds && ` (${item.hold_time_seconds}s przytrzymanie)`}
                            </div>
                          )}
                       </div>
                     </div>
                   ))}
                 </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={onClose}>
              Zamknij
            </Button>
            <Button 
              onClick={() => onStartTraining(session.id)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
            >
              <Play className="w-4 h-4 mr-2" />
              Rozpocznij trening
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};