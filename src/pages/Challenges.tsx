import React, { useState } from 'react';
import { Calendar, Trophy, Users, Clock, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import ChallengePreviewModal from '@/components/ChallengePreviewModal';

const Challenges = () => {
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const challenges = [
    {
      id: 1,
      title: '28-Day Flexibility Challenge',
      description: 'Improve your flexibility with daily stretching routines designed for aerial athletes.',
      duration: '28 days',
      participants: 1247,
      difficulty: 'Beginner',
      progress: 65,
      status: 'in-progress',
      image: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=400&h=200&fit=crop',
      category: 'Flexibility'
    },
    {
      id: 2,
      title: 'Strength Building Bootcamp',
      description: 'Build the foundational strength needed for advanced aerial movements.',
      duration: '21 days',
      participants: 892,
      difficulty: 'Intermediate',
      progress: 0,
      status: 'available',
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=200&fit=crop',
      category: 'Strength'
    },
    {
      id: 3,
      title: 'Master Your Drops',
      description: 'Learn and perfect various drop techniques across different aerial disciplines.',
      duration: '14 days',
      participants: 456,
      difficulty: 'Advanced',
      progress: 100,
      status: 'completed',
      image: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=200&fit=crop',
      category: 'Technique'
    },
    {
      id: 4,
      title: 'Flow and Grace',
      description: 'Develop smooth transitions and graceful movements in your aerial practice.',
      duration: '30 days',
      participants: 634,
      difficulty: 'Intermediate',
      progress: 0,
      status: 'available',
      image: 'https://images.unsplash.com/photo-1518611012118-696072aa579a?w=400&h=200&fit=crop',
      category: 'Flow'
    }
  ];

  const openChallengeModal = (challenge) => {
    setSelectedChallenge(challenge);
    setIsModalOpen(true);
  };

  const closeChallengeModal = () => {
    setIsModalOpen(false);
    setSelectedChallenge(null);
  };

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
      case 'in-progress': return 'Continue';
      case 'completed': return 'View Results';
      default: return 'View';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Challenges</h1>
          <p className="text-muted-foreground">Push your limits with structured training programs</p>
        </div>

        {/* Stats Overview */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Active Challenges', value: '1', icon: Trophy },
            { label: 'Completed', value: '3', icon: Calendar },
            { label: 'Total Participants', value: '3.2K', icon: Users },
            { label: 'Average Duration', value: '23 days', icon: Clock }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="glass-effect border-white/10">
                <CardContent className="p-6 text-center">
                  <Icon className="w-8 h-8 text-purple-400 mx-auto mb-3" />
                  <div className="gradient-text text-2xl font-bold">{stat.value}</div>
                  <div className="text-muted-foreground text-sm">{stat.label}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Challenges Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {challenges.map((challenge) => (
            <Card 
              key={challenge.id} 
              className="glass-effect border-white/10 hover-lift overflow-hidden cursor-pointer"
              onClick={() => openChallengeModal(challenge)}
            >
              <div className="relative h-48">
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
                  <Badge variant="outline" className="border-white/30 text-white/90 mb-2">
                    {challenge.category}
                  </Badge>
                </div>
              </div>

              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-white text-xl mb-2">{challenge.title}</CardTitle>
                    <p className="text-muted-foreground text-sm">{challenge.description}</p>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Progress Bar (only show for in-progress challenges) */}
                {challenge.status === 'in-progress' && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-white">Progress</span>
                      <span className="text-muted-foreground">{challenge.progress}% complete</span>
                    </div>
                    <Progress value={challenge.progress} className="h-2" />
                  </div>
                )}

                {/* Challenge Details */}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center text-muted-foreground">
                      <Clock className="w-4 h-4 mr-1" />
                      {challenge.duration}
                    </div>
                    <div className="flex items-center text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      {challenge.participants.toLocaleString()}
                    </div>
                  </div>
                  <Badge className={getDifficultyColor(challenge.difficulty)}>
                    {challenge.difficulty}
                  </Badge>
                </div>

                {/* Action Button */}
                <Button 
                  className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    openChallengeModal(challenge);
                  }}
                >
                  {getButtonText(challenge.status)}
                  <ChevronRight className="ml-2 w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Challenge Preview Modal */}
      <ChallengePreviewModal
        challenge={selectedChallenge}
        isOpen={isModalOpen}
        onClose={closeChallengeModal}
      />
    </div>
  );
};

export default Challenges;
