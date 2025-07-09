
import React from 'react';
import { Calendar, Trophy, Users, Clock, ChevronRight, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Challenge {
  id: number;
  title: string;
  description: string;
  duration: string;
  participants: number;
  difficulty: string;
  progress: number;
  status: string;
  image: string;
  category: string;
}

interface ChallengePreviewModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
}

const ChallengePreviewModal: React.FC<ChallengePreviewModalProps> = ({
  challenge,
  isOpen,
  onClose
}) => {
  if (!challenge) return null;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'in-progress': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400';
      case 'Advanced': return 'bg-red-500/20 text-red-400';
      default: return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getButtonText = (status: string) => {
    switch (status) {
      case 'available': return 'Start Challenge';
      case 'in-progress': return 'Continue Challenge';
      case 'completed': return 'View Results';
      default: return 'View Challenge';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl glass-effect border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl gradient-text">{challenge.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Image */}
          <div className="relative h-64 rounded-lg overflow-hidden">
            <img 
              src={challenge.image} 
              alt={challenge.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            <div className="absolute top-4 right-4">
              <Badge className={getStatusColor(challenge.status)}>
                {challenge.status.replace('-', ' ')}
              </Badge>
            </div>
            <div className="absolute bottom-4 left-4">
              <Badge variant="outline" className="border-white/30 text-white/90">
                {challenge.category}
              </Badge>
            </div>
          </div>

          {/* Challenge Details */}
          <div className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">
              {challenge.description}
            </p>

            {/* Progress Bar (only show for in-progress challenges) */}
            {challenge.status === 'in-progress' && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white">Progress</span>
                  <span className="text-muted-foreground">{challenge.progress}% complete</span>
                </div>
                <Progress value={challenge.progress} className="h-3" />
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="glass-effect border-white/10 p-4 text-center">
                <Clock className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Duration</div>
                <div className="text-white font-semibold">{challenge.duration}</div>
              </Card>
              
              <Card className="glass-effect border-white/10 p-4 text-center">
                <Users className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Participants</div>
                <div className="text-white font-semibold">{challenge.participants.toLocaleString()}</div>
              </Card>
              
              <Card className="glass-effect border-white/10 p-4 text-center">
                <Trophy className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Difficulty</div>
                <Badge className={getDifficultyColor(challenge.difficulty)}>
                  {challenge.difficulty}
                </Badge>
              </Card>
              
              <Card className="glass-effect border-white/10 p-4 text-center">
                <Calendar className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                <div className="text-sm text-muted-foreground">Status</div>
                <div className="text-white font-semibold capitalize">{challenge.status.replace('-', ' ')}</div>
              </Card>
            </div>

            {/* Challenge Description */}
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white">What you'll achieve</h3>
              <div className="space-y-2 text-muted-foreground">
                {challenge.category === 'Flexibility' && (
                  <ul className="space-y-1">
                    <li>• Improve overall flexibility and range of motion</li>
                    <li>• Reduce muscle tension and prevent injuries</li>
                    <li>• Enhance your aerial performance capabilities</li>
                    <li>• Build a consistent stretching routine</li>
                  </ul>
                )}
                {challenge.category === 'Strength' && (
                  <ul className="space-y-1">
                    <li>• Build foundational strength for aerial movements</li>
                    <li>• Increase core stability and control</li>
                    <li>• Develop grip strength and endurance</li>
                    <li>• Progress to more advanced aerial techniques</li>
                  </ul>
                )}
                {challenge.category === 'Technique' && (
                  <ul className="space-y-1">
                    <li>• Master advanced aerial drop techniques</li>
                    <li>• Improve execution and form</li>
                    <li>• Build confidence in complex movements</li>
                    <li>• Learn safety and proper technique</li>
                  </ul>
                )}
                {challenge.category === 'Flow' && (
                  <ul className="space-y-1">
                    <li>• Develop smooth, graceful transitions</li>
                    <li>• Improve rhythm and musicality</li>
                    <li>• Create beautiful aerial sequences</li>
                    <li>• Express artistry through movement</li>
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              Close
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
            >
              {getButtonText(challenge.status)}
              <ChevronRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengePreviewModal;
