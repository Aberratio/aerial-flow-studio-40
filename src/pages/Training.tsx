import React, { useState } from 'react';
import { Plus, Play, Clock, Users, Music, Target, Zap, Heart, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { TrainingDetailsModal } from '@/components/TrainingDetailsModal';
import { TrainingSessionPage } from '@/components/TrainingSessionPage';
import { CreateTrainingModal } from '@/components/CreateTrainingModal';
import { useToast } from '@/hooks/use-toast';
const Training = () => {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<any>(null);
  const [showSessionDetails, setShowSessionDetails] = useState(false);
  const [showTrainingSession, setShowTrainingSession] = useState(false);
  const [editingSession, setEditingSession] = useState<any>(null);
  const [sessions, setSessions] = useState([{
    id: 1,
    title: 'Beginner Aerial Hoop Flow',
    instructor: 'aerial_grace',
    duration: 45,
    difficulty: 'Beginner',
    participants: 12,
    warmup: ['Shoulder rolls', 'Wrist circles', 'Hip circles'],
    figures: ['Basic mount', 'Back attitude', 'Stag hang'],
    stretching: ['Shoulder stretch', 'Hip flexor stretch', 'Backbend prep'],
    playlist: 'Chill Aerial Vibes',
    thumbnail: 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=300&fit=crop'
  }, {
    id: 2,
    title: 'Advanced Silk Combos',
    instructor: 'silk_master',
    duration: 60,
    difficulty: 'Advanced',
    participants: 8,
    warmup: ['Dynamic stretching', 'Core activation', 'Arm circles'],
    figures: ['Catchers', 'Foot locks', 'Attitude drops'],
    stretching: ['Deep hip stretch', 'Shoulder opening', 'Spinal twist'],
    playlist: 'Epic Aerial Beats',
    thumbnail: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop'
  }, {
    id: 3,
    title: 'Flexibility & Conditioning',
    instructor: 'pole_phoenix',
    duration: 30,
    difficulty: 'Intermediate',
    participants: 15,
    warmup: ['Joint mobility', 'Light cardio', 'Breath work'],
    figures: ['Split prep', 'Backbend variations', 'Shoulder flexibility'],
    stretching: ['Deep splits', 'Chest opening', 'Hip flexor release'],
    playlist: 'Relaxing Stretch Mix',
    thumbnail: 'https://images.unsplash.com/photo-1506629905496-4d3e5b9e7e59?w=400&h=300&fit=crop'
  }]);
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-500';
      case 'Intermediate':
        return 'bg-yellow-500';
      case 'Advanced':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  const handleSessionClick = (session: any) => {
    setSelectedSession(session);
    setShowSessionDetails(true);
  };
  const handleStartTraining = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setSelectedSession(session);
      setShowSessionDetails(false);
      setShowTrainingSession(true);
    }
  };
  const handleCreateSession = (newSession: any) => {
    if (editingSession) {
      setSessions(prev => prev.map(s => s.id === editingSession.id ? newSession : s));
      toast({
        title: "Session Updated",
        description: "Your training session has been updated successfully."
      });
      setEditingSession(null);
    } else {
      setSessions(prev => [...prev, newSession]);
      toast({
        title: "Session Created",
        description: "Your training session has been created successfully."
      });
    }
  };
  const handleEditSession = (session: any) => {
    setEditingSession(session);
    setShowCreateSession(true);
  };
  const handleDeleteSession = (sessionId: number) => {
    setSessions(prev => prev.filter(s => s.id !== sessionId));
    toast({
      title: "Session Deleted",
      description: "The training session has been deleted."
    });
  };
  if (showTrainingSession && selectedSession) {
    return <TrainingSessionPage session={selectedSession} onClose={() => {
      setShowTrainingSession(false);
      setSelectedSession(null);
    }} />;
  }
  return <div className="min-h-screen p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-4 sm:space-y-6">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Training Sessions</h1>
              <p className="text-muted-foreground text-sm sm:text-base">Join or create aerial training sessions</p>
            </div>
            {user?.role === 'trainer' || user?.role === 'admin' ? <Button onClick={() => setShowCreateSession(true)} className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto">
                <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Create Session
              </Button> : null}
          </div>
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Card className="glass-effect border-white/10">
            <CardContent className="p-3 sm:p-6 text-center">
              <Target className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-lg sm:text-2xl font-bold text-white">{sessions.length}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">Available Sessions</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-3 sm:p-6 text-center">
              <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-green-500" />
              <h3 className="text-lg sm:text-2xl font-bold text-white">35</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">Total Participants</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-3 sm:p-6 text-center">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="text-lg sm:text-2xl font-bold text-white">45</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">Avg Duration (min)</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-3 sm:p-6 text-center">
              <Heart className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 text-pink-500" />
              <h3 className="text-lg sm:text-2xl font-bold text-white">12</h3>
              <p className="text-muted-foreground text-xs sm:text-sm">Completed</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sessions.map(session => <Card key={session.id} className="glass-effect border-white/10 hover:border-white/20 transition-all group">
              <div className="relative">
                <img src={session.thumbnail} alt={session.title} className="w-full h-32 sm:h-48 object-cover rounded-t-lg cursor-pointer" onClick={() => handleSessionClick(session)} />
                <Badge className={`absolute top-2 right-2 ${getDifficultyColor(session.difficulty)} text-white text-xs`}>
                  {session.difficulty}
                </Badge>
                
                {/* Trainer Actions */}
                {(user?.role === 'trainer' || user?.role === 'admin') && <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1 sm:space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEditSession(session)} className="bg-black/50 border-white/20 text-white hover:bg-white/10 w-8 h-8 p-0">
                      <Edit className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDeleteSession(session.id)} className="bg-black/50 border-red-500/50 text-red-400 hover:bg-red-500/10 w-8 h-8 p-0">
                      <Trash2 className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>}
              </div>
              <CardContent className="p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-bold text-white mb-2 cursor-pointer hover:text-primary transition-colors" onClick={() => handleSessionClick(session)}>
                  {session.title}
                </h3>
                <p className="text-muted-foreground mb-3 sm:mb-4 text-sm">by {session.instructor}</p>
                
                <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4">
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {session.duration} minutes
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {session.participants} participants
                  </div>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
                    <Music className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                    {session.playlist}
                  </div>
                </div>

                <div className="space-y-2 mb-3 sm:mb-4">
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">Warm-up</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{session.warmup.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">Figures</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{session.figures.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-semibold text-white mb-1">Stretching</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{session.stretching.join(', ')}</p>
                  </div>
                </div>

                <Button variant="primary" className="w-full text-sm" onClick={() => handleSessionClick(session)}>
                  <Play className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>)}
        </div>
      </div>

      <TrainingDetailsModal session={selectedSession} isOpen={showSessionDetails} onClose={() => {
      setShowSessionDetails(false);
      setSelectedSession(null);
    }} onStartTraining={handleStartTraining} />

      <CreateTrainingModal isOpen={showCreateSession} onClose={() => {
      setShowCreateSession(false);
      setEditingSession(null);
    }} onSave={handleCreateSession} editingSession={editingSession} />
    </div>;
};
export default Training;