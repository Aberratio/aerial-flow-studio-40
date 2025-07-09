import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Play, Clock, Trophy, CheckCircle, Star, Volume2, VolumeX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const ChallengeDayOverview = () => {
  const { challengeId, dayId } = useParams();
  const navigate = useNavigate();
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Mock challenge day data
  const challengeDay = {
    day: 7,
    title: 'Advanced Flow Sequence',
    description: 'Master the connection between basic moves to create a beautiful flowing sequence that demonstrates your progress.',
    duration: '45 minutes',
    completed: false,
    difficulty: 'Intermediate',
    exercises: [
      {
        id: 1,
        name: 'Warm-up Stretches',
        duration: '10 minutes',
        type: 'warmup',
        media: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=600&h=400&fit=crop',
        instructions: 'Start with gentle neck rolls and shoulder shrugs. Focus on breathing deeply.',
        audioInstructions: 'Begin with slow, controlled movements. Listen to your body.',
        completed: false
      },
      {
        id: 2,
        name: 'Silk Climb Sequence',
        duration: '15 minutes',
        type: 'technique',
        media: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=600&h=400&fit=crop',
        instructions: 'Practice the basic climb with proper foot locks. Maintain consistent rhythm.',
        audioInstructions: 'Remember to engage your core and keep your movements smooth.',
        completed: false
      },
      {
        id: 3,
        name: 'Flow Transitions',
        duration: '15 minutes',
        type: 'flow',
        media: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop',
        instructions: 'Connect your moves with graceful transitions. Focus on fluidity over speed.',
        audioInstructions: 'Each movement should flow into the next like water.',
        completed: false
      },
      {
        id: 4,
        name: 'Cool Down',
        duration: '5 minutes',
        type: 'cooldown',
        media: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=600&h=400&fit=crop',
        instructions: 'Gentle stretching to release tension and prevent injury.',
        audioInstructions: 'Take deep breaths and allow your body to relax.',
        completed: false
      }
    ],
    figures: ['Silk Climb', 'Foot Lock', 'Basic Pose', 'Flow Transition'],
    tips: [
      'Focus on breath control throughout the sequence',
      'Quality over quantity - perfect each move before speeding up',
      'Listen to your body and rest when needed',
      'Visualize the flow before starting'
    ],
    challenge: {
      title: '28-Day Flexibility Challenge',
      currentDay: 7,
      totalDays: 28
    }
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'warmup': return '🔥';
      case 'technique': return '🎯';
      case 'flow': return '💫';
      case 'cooldown': return '🌿';
      default: return '📋';
    }
  };

  const getExerciseColor = (type: string) => {
    switch (type) {
      case 'warmup': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'technique': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'flow': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'cooldown': return 'bg-green-500/20 text-green-400 border-green-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const handleStartDay = () => {
    navigate('/training-session', { 
      state: { 
        type: 'challenge-day',
        challengeId,
        dayId,
        exercises: challengeDay.exercises,
        title: challengeDay.title
      }
    });
  };

  const completedExercises = challengeDay.exercises.filter(ex => ex.completed).length;
  const progressPercentage = (completedExercises / challengeDay.exercises.length) * 100;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/challenges')}
            className="mr-4 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Challenges
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white">Day {challengeDay.day}</h1>
            <p className="text-muted-foreground">{challengeDay.challenge.title}</p>
          </div>
        </div>

        {/* Day Overview */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-white text-2xl mb-2">{challengeDay.title}</CardTitle>
                <p className="text-muted-foreground mb-4">{challengeDay.description}</p>
                <div className="flex items-center space-x-4">
                  <Badge className={getExerciseColor('technique')}>
                    {challengeDay.difficulty}
                  </Badge>
                  <div className="flex items-center text-muted-foreground">
                    <Clock className="w-4 h-4 mr-1" />
                    {challengeDay.duration}
                  </div>
                  <div className="flex items-center text-muted-foreground">
                    <Trophy className="w-4 h-4 mr-1" />
                    {completedExercises}/{challengeDay.exercises.length} completed
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => setIsAudioEnabled(!isAudioEnabled)}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white">Progress</span>
                  <span className="text-muted-foreground">{Math.round(progressPercentage)}% complete</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
              
              <div className="flex flex-wrap gap-2">
                {challengeDay.figures.map((figure, index) => (
                  <Badge key={index} variant="outline" className="border-white/20 text-white/70">
                    {figure}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exercises */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white">Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {challengeDay.exercises.map((exercise, index) => (
                <div 
                  key={exercise.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    exercise.completed 
                      ? 'bg-green-500/10 border-green-500/30' 
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-start space-x-4">
                    <div className="w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                      <img 
                        src={exercise.media} 
                        alt={exercise.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-white font-semibold flex items-center">
                          <span className="text-lg mr-2">{getExerciseIcon(exercise.type)}</span>
                          {exercise.name}
                          {exercise.completed && <CheckCircle className="w-4 h-4 text-green-400 ml-2" />}
                        </h3>
                        <div className="flex items-center space-x-2">
                          <Badge className={getExerciseColor(exercise.type)}>
                            {exercise.type}
                          </Badge>
                          <div className="flex items-center text-muted-foreground text-sm">
                            <Clock className="w-3 h-3 mr-1" />
                            {exercise.duration}
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-muted-foreground text-sm mb-2">{exercise.instructions}</p>
                      
                      {isAudioEnabled && (
                        <div className="bg-white/5 rounded-lg p-3 mb-2">
                          <div className="flex items-center text-purple-400 text-sm mb-1">
                            <Volume2 className="w-3 h-3 mr-1" />
                            Audio Instructions
                          </div>
                          <p className="text-white text-sm">{exercise.audioInstructions}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="glass-effect border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center">
              <Star className="w-5 h-5 mr-2" />
              Pro Tips
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {challengeDay.tips.map((tip, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <p className="text-muted-foreground">{tip}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Button 
            onClick={handleStartDay}
            className="flex-1 bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
          >
            <Play className="w-4 h-4 mr-2" />
            Start Day {challengeDay.day}
          </Button>
          
          <Button 
            variant="outline"
            onClick={() => navigate('/challenges')}
            className="border-white/20 text-white hover:bg-white/10"
          >
            Back to Challenge
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChallengeDayOverview;