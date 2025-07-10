import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, Trophy, Star, Play, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ChallengeDay {
  day: number;
  dayId?: string;
  title: string;
  description: string;
  duration: string;
  completed: boolean;
  figures: string[];
  isRestDay?: boolean;
}

interface Challenge {
  id: number;
  title: string;
  description: string;
  level: string;
  totalDays: number;
  currentDay: number;
  completedDays: number;
  image: string;
  days: ChallengeDay[];
  training_days?: any[];
  start_date?: string;
}

interface ChallengeDetailsModalProps {
  challenge: Challenge | null;
  isOpen: boolean;
  onClose: () => void;
  onStart: () => void;
  onContinue: () => void;
}

export const ChallengeDetailsModal = ({ challenge, isOpen, onClose, onStart, onContinue }: ChallengeDetailsModalProps) => {
  const navigate = useNavigate();
  
  if (!challenge) return null;

  const isStarted = challenge.currentDay > 0;
  const progressPercentage = (challenge.completedDays / challenge.totalDays) * 100;

  const handleDayClick = (day: ChallengeDay) => {
    onClose();
    // Find the actual training day from the challenge data
    const trainingDay = challenge.training_days?.find((td: any, index: number) => {
      return index + 1 === day.day; // Match by position/order
    });
    
    if (trainingDay) {
      navigate(`/challenge/${challenge.id}/day/${trainingDay.id}`);
    } else {
      console.error('Could not find training day for day', day.day);
    }
  };

  const handleContinue = () => {
    onClose();
    const trainingDay = challenge.training_days?.find((td: any, index: number) => {
      return index + 1 === challenge.currentDay; // Match by position/order
    });
    
    if (trainingDay) {
      navigate(`/challenge/${challenge.id}/day/${trainingDay.id}`);
    } else {
      console.error('Could not find training day for current day', challenge.currentDay);
    }
  };

  const handleStart = () => {
    onClose();
    const firstTrainingDay = challenge.training_days?.[0];
    
    if (firstTrainingDay) {
      navigate(`/challenge/${challenge.id}/day/${firstTrainingDay.id}`);
    } else {
      console.error('No training days found for challenge');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">{challenge.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Challenge Header */}
          <div className="flex items-start space-x-4">
            <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img 
                src={challenge.image} 
                alt={challenge.title}
                className="w-full h-full object-cover"
              />
            </div>
            
            <div className="flex-1">
              <p className="text-muted-foreground mb-3">{challenge.description}</p>
              
              <div className="flex items-center space-x-4 mb-3">
                <Badge className="bg-gradient-to-r from-purple-500 to-pink-500">
                  {challenge.level}
                </Badge>
                <div className="flex items-center text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-1" />
                  {challenge.totalDays} days
                </div>
                <div className="flex items-center text-muted-foreground">
                  <Trophy className="w-4 h-4 mr-1" />
                  {challenge.completedDays}/{challenge.totalDays} completed
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-white/10 rounded-full h-2">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Daily Schedule */}
          <div>
            <h3 className="text-white font-semibold mb-4 flex items-center">
              <Calendar className="w-5 h-5 mr-2" />
              Daily Schedule
            </h3>
            
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {challenge.days.map((day) => (
                <div 
                  key={day.day}
                  className={`p-4 rounded-lg border transition-colors cursor-pointer hover:bg-white/10 ${
                    day.completed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : day.day === challenge.currentDay
                      ? 'bg-purple-500/10 border-purple-500/30'
                      : 'bg-white/5 border-white/10'
                  }`}
                  onClick={() => handleDayClick(day)}
                >
                   <div className="flex items-center justify-between mb-2">
                     <h4 className="text-white font-medium flex items-center">
                       {day.completed && <CheckCircle className="w-4 h-4 text-green-400 mr-2" />}
                       {day.day === challenge.currentDay && !day.completed && <Play className="w-4 h-4 text-purple-400 mr-2" />}
                       Day {day.day}: {day.title}
                       {day.isRestDay && <Badge variant="outline" className="ml-2 text-xs border-blue-500/30 text-blue-400">Rest Day</Badge>}
                     </h4>
                     <div className="flex items-center text-muted-foreground text-sm">
                       <Clock className="w-3 h-3 mr-1" />
                       {day.duration}
                     </div>
                   </div>
                   
                   <p className="text-muted-foreground text-sm mb-2">{day.description}</p>
                   
                   {!day.isRestDay && (
                     <div className="flex flex-wrap gap-2">
                       {day.figures.map((figure, index) => (
                         <Badge key={index} variant="outline" className="text-xs border-white/20 text-white/70">
                           {figure}
                         </Badge>
                       ))}
                     </div>
                   )}
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            {isStarted ? (
              <Button 
                onClick={handleContinue}
                className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Continue Challenge
              </Button>
            ) : (
              <Button 
                onClick={handleStart}
                className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
              >
                <Play className="w-4 h-4 mr-2" />
                Start Challenge
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={onClose}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};