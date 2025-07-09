import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Users, Music, Target, Zap, Heart, Play } from 'lucide-react';

interface TrainingDetailsModalProps {
  session: any;
  isOpen: boolean;
  onClose: () => void;
  onStartTraining: (sessionId: number) => void;
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
              src={session.thumbnail}
              alt={session.title}
              className="w-full h-48 object-cover rounded-lg"
            />
            <Badge className={`absolute top-2 right-2 ${getDifficultyColor(session.difficulty)} text-white`}>
              {session.difficulty}
            </Badge>
          </div>

          {/* Session Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center text-white">
              <Users className="w-5 h-5 mr-2 text-primary" />
              <span>Instructor: {session.instructor}</span>
            </div>
            <div className="flex items-center text-white">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              <span>{session.duration} minutes</span>
            </div>
            <div className="flex items-center text-white">
              <Target className="w-5 h-5 mr-2 text-primary" />
              <span>{session.participants} participants</span>
            </div>
            <div className="flex items-center text-white">
              <Music className="w-5 h-5 mr-2 text-primary" />
              <span>{session.playlist}</span>
            </div>
          </div>

          {/* Session Structure */}
          <div className="space-y-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Zap className="w-5 h-5 mr-2 text-yellow-500" />
                <h3 className="font-semibold text-white">Warm-up</h3>
              </div>
              <ul className="text-muted-foreground space-y-1">
                {session.warmup.map((item: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Target className="w-5 h-5 mr-2 text-purple-500" />
                <h3 className="font-semibold text-white">Figures & Combos</h3>
              </div>
              <ul className="text-muted-foreground space-y-1">
                {session.figures.map((item: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white/5 p-4 rounded-lg">
              <div className="flex items-center mb-2">
                <Heart className="w-5 h-5 mr-2 text-pink-500" />
                <h3 className="font-semibold text-white">Stretching</h3>
              </div>
              <ul className="text-muted-foreground space-y-1">
                {session.stretching.map((item: string, index: number) => (
                  <li key={index} className="flex items-center">
                    <span className="w-2 h-2 bg-pink-500 rounded-full mr-2"></span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
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