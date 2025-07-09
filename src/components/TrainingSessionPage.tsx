import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Music, Target, Zap, Heart, Play, Pause, X, Check } from 'lucide-react';

interface TrainingSessionPageProps {
  session: any;
  onClose: () => void;
}

export const TrainingSessionPage: React.FC<TrainingSessionPageProps> = ({ session, onClose }) => {
  const [currentPhase, setCurrentPhase] = useState(0);
  const [currentExercise, setCurrentExercise] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timer, setTimer] = useState(0);
  const [progress, setProgress] = useState(0);

  const phases = [
    {
      name: 'Warm-up',
      icon: Zap,
      color: 'text-yellow-500',
      exercises: session.warmup,
      duration: 10 // minutes
    },
    {
      name: 'Figures & Combos',
      icon: Target,
      color: 'text-purple-500',
      exercises: session.figures,
      duration: 25 // minutes
    },
    {
      name: 'Stretching',
      icon: Heart,
      color: 'text-pink-500',
      exercises: session.stretching,
      duration: 10 // minutes
    }
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimer(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  useEffect(() => {
    const totalDuration = session.duration * 60; // Convert to seconds
    const currentProgress = (timer / totalDuration) * 100;
    setProgress(Math.min(currentProgress, 100));
  }, [timer, session.duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const nextExercise = () => {
    const currentPhaseExercises = phases[currentPhase].exercises;
    if (currentExercise < currentPhaseExercises.length - 1) {
      setCurrentExercise(prev => prev + 1);
    } else if (currentPhase < phases.length - 1) {
      setCurrentPhase(prev => prev + 1);
      setCurrentExercise(0);
    }
  };

  const prevExercise = () => {
    if (currentExercise > 0) {
      setCurrentExercise(prev => prev - 1);
    } else if (currentPhase > 0) {
      setCurrentPhase(prev => prev - 1);
      setCurrentExercise(phases[currentPhase - 1].exercises.length - 1);
    }
  };

  const CurrentPhaseIcon = phases[currentPhase].icon;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{session.title}</h1>
            <p className="text-muted-foreground">with {session.instructor}</p>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </Button>
        </div>

        {/* Progress Bar */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <CurrentPhaseIcon className={`w-6 h-6 ${phases[currentPhase].color}`} />
                <span className="text-white font-semibold">{phases[currentPhase].name}</span>
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center text-white">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatTime(timer)}
                </div>
                <Badge variant="outline" className="text-white border-white/20">
                  {currentExercise + 1} / {phases[currentPhase].exercises.length}
                </Badge>
              </div>
            </div>
            <Progress value={progress} className="h-2" />
          </CardContent>
        </Card>

        {/* Current Exercise */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardContent className="p-8 text-center">
            <CurrentPhaseIcon className={`w-16 h-16 mx-auto mb-4 ${phases[currentPhase].color}`} />
            <h2 className="text-2xl font-bold text-white mb-4">
              {phases[currentPhase].exercises[currentExercise]}
            </h2>
            <p className="text-muted-foreground mb-6">
              Focus on proper form and breathing. Take your time with each movement.
            </p>
            
            {/* Control Buttons */}
            <div className="flex justify-center space-x-4">
              <Button
                onClick={prevExercise}
                variant="outline"
                disabled={currentPhase === 0 && currentExercise === 0}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Previous
              </Button>
              <Button
                onClick={() => setIsPlaying(!isPlaying)}
                className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
              >
                {isPlaying ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isPlaying ? 'Pause' : 'Play'}
              </Button>
              <Button
                onClick={nextExercise}
                variant="outline"
                disabled={currentPhase === phases.length - 1 && currentExercise === phases[currentPhase].exercises.length - 1}
                className="border-white/20 text-white hover:bg-white/10"
              >
                Next
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Phase Overview */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {phases.map((phase, index) => (
            <Card 
              key={index} 
              className={`glass-effect border-white/10 ${index === currentPhase ? 'ring-2 ring-purple-500' : ''}`}
            >
              <CardContent className="p-4 text-center">
                <phase.icon className={`w-8 h-8 mx-auto mb-2 ${phase.color}`} />
                <h3 className="font-semibold text-white mb-1">{phase.name}</h3>
                <p className="text-muted-foreground text-sm">{phase.exercises.length} exercises</p>
                <div className="mt-2">
                  {index < currentPhase ? (
                    <Check className="w-4 h-4 mx-auto text-green-500" />
                  ) : index === currentPhase ? (
                    <div className="w-4 h-4 mx-auto bg-purple-500 rounded-full animate-pulse" />
                  ) : (
                    <div className="w-4 h-4 mx-auto bg-gray-500 rounded-full" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Music Player */}
        <Card className="glass-effect border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Music className="w-6 h-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-white">Now Playing</h3>
                  <p className="text-muted-foreground">{session.playlist}</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Play className="w-4 h-4 mr-2" />
                Play Music
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};