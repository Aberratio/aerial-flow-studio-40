
import React, { useState } from 'react';
import { X, Play, CheckCircle, Upload, Camera, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface Figure {
  id: number;
  name: string;
  category: string;
  difficulty: string;
  image: string;
  completed: boolean;
  description: string;
}

interface FigurePreviewModalProps {
  figure: Figure | null;
  isOpen: boolean;
  onClose: () => void;
}

export const FigurePreviewModal = ({ figure, isOpen, onClose }: FigurePreviewModalProps) => {
  const [showAddVersion, setShowAddVersion] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [isCompleted, setIsCompleted] = useState(figure?.completed || false);

  if (!figure) return null;

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const recentVersions = [
    {
      id: 1,
      user: {
        username: 'aerial_grace',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b589?w=150&h=150&fit=crop&crop=face'
      },
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=200&h=200&fit=crop',
      timeAgo: '2 days ago',
      rating: 4
    },
    {
      id: 2,
      user: {
        username: 'hoop_master',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face'
      },
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=200&h=200&fit=crop',
      timeAgo: '1 week ago',
      rating: 5
    }
  ];

  const handleAddVersion = () => {
    console.log('Adding user version with notes:', userNotes);
    setIsCompleted(true);
    setShowAddVersion(false);
    setUserNotes('');
  };

  const handleMarkComplete = () => {
    setIsCompleted(true);
    console.log('Marked figure as completed');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black/95 border-white/10">
        <div className="flex h-full">
          {/* Image Section */}
          <div className="flex-1 relative bg-black">
            <img 
              src={figure.image} 
              alt={figure.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
            
            {/* Play Button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <Button 
                size="lg"
                className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30"
              >
                <Play className="w-8 h-8 text-white" />
              </Button>
            </div>

            {/* Completion Status */}
            {isCompleted && (
              <div className="absolute top-4 right-4 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="w-96 flex flex-col bg-black/50 backdrop-blur-sm">
            {/* Header */}
            <DialogHeader className="p-6 border-b border-white/10">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <DialogTitle className="text-2xl font-bold text-white mb-2">
                    {figure.name}
                  </DialogTitle>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge className={`text-xs ${getDifficultyColor(figure.difficulty)}`}>
                      {figure.difficulty}
                    </Badge>
                    <Badge variant="outline" className="border-white/20 text-white/80">
                      {figure.category}
                    </Badge>
                  </div>
                  <DialogDescription className="text-muted-foreground">
                    {figure.description}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            {/* Action Buttons */}
            <div className="p-6 border-b border-white/10 space-y-3">
              {!isCompleted ? (
                <>
                  <Button 
                    onClick={() => setShowAddVersion(true)}
                    className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add My Version
                  </Button>
                  <Button 
                    onClick={handleMarkComplete}
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Mark as Completed
                  </Button>
                </>
              ) : (
                <div className="text-center">
                  <div className="text-green-400 font-semibold mb-2">✓ Completed</div>
                  <Button 
                    onClick={() => setShowAddVersion(true)}
                    variant="outline" 
                    className="w-full border-white/20 text-white hover:bg-white/10"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Add Another Version
                  </Button>
                </div>
              )}
            </div>

            {/* Add Version Form */}
            {showAddVersion && (
              <div className="p-6 border-b border-white/10 bg-white/5">
                <h3 className="text-white font-semibold mb-4">Add Your Version</h3>
                <div className="space-y-4">
                  <div className="flex space-x-2">
                    <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                      <Camera className="w-4 h-4 mr-2" />
                      Photo
                    </Button>
                    <Button variant="outline" className="flex-1 border-white/20 text-white hover:bg-white/10">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                  <Textarea
                    placeholder="Add notes about your experience with this figure..."
                    value={userNotes}
                    onChange={(e) => setUserNotes(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60 resize-none"
                    rows={3}
                  />
                  <div className="flex space-x-2">
                    <Button 
                      onClick={handleAddVersion}
                      className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500"
                    >
                      Save Version
                    </Button>
                    <Button 
                      onClick={() => setShowAddVersion(false)}
                      variant="outline"
                      className="border-white/20 text-white hover:bg-white/10"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Community Versions */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-white font-semibold mb-4">Community Versions</h3>
              <div className="space-y-4">
                {recentVersions.map((version) => (
                  <div key={version.id} className="flex space-x-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={version.user.avatar} />
                      <AvatarFallback>{version.user.username[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-white text-sm">{version.user.username}</span>
                        <div className="flex items-center space-x-1">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i}
                              className={`w-3 h-3 ${i < version.rating ? 'text-yellow-400 fill-current' : 'text-gray-600'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <img 
                          src={version.image} 
                          alt="User version"
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <span className="text-muted-foreground text-xs">{version.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
