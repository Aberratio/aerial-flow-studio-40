import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Clock, Users, Music, Target, Zap, Heart, Play, Pause, X, Check, Volume2, VolumeX, Trophy, Star } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const phases = [
    {
      name: 'Warm-up',
      icon: Zap,
      color: 'text-yellow-500',
      exercises: session.warmup,
      duration: 10, // minutes
      media: [
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=600&h=400&fit=crop'
      ],
      instructions: [
        'Start with gentle shoulder rolls to warm up your upper body',
        'Focus on controlled movements and proper breathing',
        'Prepare your body for the main workout ahead'
      ]
    },
    {
      name: 'Figures & Combos',
      icon: Target,
      color: 'text-purple-500',
      exercises: session.figures,
      duration: 25, // minutes
      media: [
        'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=600&h=400&fit=crop'
      ],
      instructions: [
        'Engage your core and maintain proper form throughout',
        'Remember to breathe steadily during transitions',
        'Focus on quality over speed - precision is key'
      ]
    },
    {
      name: 'Stretching',
      icon: Heart,
      color: 'text-pink-500',
      exercises: session.stretching,
      duration: 10, // minutes
      media: [
        'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=400&fit=crop',
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop'
      ],
      instructions: [
        'Hold each stretch for at least 30 seconds',
        'Breathe deeply and relax into each position',
        'Never force a stretch - listen to your body'
      ]
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
    } else {
      // Training completed
      setIsCompleted(true);
      setIsPlaying(false);
      setShowCompletionModal(true);
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
  const currentMedia = phases[currentPhase].media[currentExercise] || phases[currentPhase].media[0];
  const currentInstruction = phases[currentPhase].instructions[currentExercise] || phases[currentPhase].instructions[0];

  const playAudioInstruction = () => {
    if (audioEnabled && 'speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(currentInstruction);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      speechSynthesis.speak(utterance);
    }
  };

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

        {/* Current Exercise with Media */}
        <Card className="glass-effect border-white/10 mb-8">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Exercise Media */}
              <div className="space-y-4">
                <img
                  src={currentMedia}
                  alt={phases[currentPhase].exercises[currentExercise]}
                  className="w-full h-64 object-cover rounded-lg"
                />
                <div className="flex items-center justify-between">
                  <Button
                    onClick={playAudioInstruction}
                    variant="outline"
                    size="sm"
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {audioEnabled ? <Volume2 className="w-4 h-4 mr-2" /> : <VolumeX className="w-4 h-4 mr-2" />}
                    Play Instructions
                  </Button>
                  <Button
                    onClick={() => setAudioEnabled(!audioEnabled)}
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground hover:text-white"
                  >
                    {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              {/* Exercise Details */}
              <div className="flex flex-col justify-center text-center lg:text-left">
                <CurrentPhaseIcon className={`w-16 h-16 mx-auto lg:mx-0 mb-4 ${phases[currentPhase].color}`} />
                <h2 className="text-2xl font-bold text-white mb-4">
                  {phases[currentPhase].exercises[currentExercise]}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {currentInstruction}
                </p>
                
                {/* Control Buttons */}
                <div className="flex justify-center lg:justify-start space-x-4">
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
                    className="border-white/20 text-white hover:bg-white/10"
                  >
                    {currentPhase === phases.length - 1 && currentExercise === phases[currentPhase].exercises.length - 1 ? 'Finish' : 'Next'}
                  </Button>
                </div>
              </div>
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

        {/* Completion Modal */}
        <Dialog open={showCompletionModal} onOpenChange={setShowCompletionModal}>
          <DialogContent className="glass-effect border-white/10 max-w-md">
            <DialogHeader>
              <DialogTitle className="text-white text-center">
                <Trophy className="w-12 h-12 mx-auto mb-4 text-yellow-500" />
                Congratulations!
              </DialogTitle>
            </DialogHeader>
            <div className="text-center space-y-4">
              <div className="flex justify-center space-x-2 mb-4">
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
                <Star className="w-6 h-6 text-yellow-500 fill-current" />
              </div>
              <h3 className="text-xl font-bold text-white">Training Complete!</h3>
              <p className="text-muted-foreground">
                You've successfully completed the {session.title} training session. 
                Your dedication and hard work are paying off!
              </p>
              <div className="bg-white/5 p-4 rounded-lg">
                <p className="text-white font-semibold">Session Summary:</p>
                <div className="text-sm text-muted-foreground mt-2 space-y-1">
                  <p>Duration: {formatTime(timer)}</p>
                  <p>Exercises Completed: {phases.reduce((total, phase) => total + phase.exercises.length, 0)}</p>
                  <p>Phases: {phases.length}</p>
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 p-4 rounded-lg">
                <p className="text-white font-semibold mb-2">✨ Motivational Message</p>
                <p className="text-sm text-muted-foreground">
                  "Every expert was once a beginner. Every pro was once an amateur. 
                  Keep pushing your limits and celebrating your progress. You're stronger than you think!"
                </p>
              </div>
              <div className="flex justify-center space-x-3">
                <Button
                  onClick={() => {
                    setShowCompletionModal(false);
                    onClose();
                  }}
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10"
                >
                  Close
                </Button>
                <Button
                  onClick={() => {
                    setShowCompletionModal(false);
                    // Reset session for replay
                    setCurrentPhase(0);
                    setCurrentExercise(0);
                    setTimer(0);
                    setProgress(0);
                    setIsCompleted(false);
                    setIsPlaying(false);
                  }}
                  className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  Train Again
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};