import React, { useState } from 'react';
import { Plus, Play, Clock, Users, Music, Target, Zap, Heart } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const Training = () => {
  const { user } = useAuth();
  const [showCreateSession, setShowCreateSession] = useState(false);
  const [sessions] = useState([
    {
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
    },
    {
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
    },
    {
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
    }
  ]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'bg-green-500';
      case 'Intermediate': return 'bg-yellow-500';
      case 'Advanced': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">Training Sessions</h1>
              <p className="text-muted-foreground">Join or create aerial training sessions</p>
            </div>
            {user?.role === 'trainer' || user?.role === 'admin' ? (
              <Dialog open={showCreateSession} onOpenChange={setShowCreateSession}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                    <Plus className="w-5 h-5 mr-2" />
                    Create Session
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass-effect border-white/10 max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create Training Session</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="title" className="text-white">Session Title</Label>
                        <Input id="title" placeholder="Enter session title" className="bg-white/5 border-white/10 text-white" />
                      </div>
                      <div>
                        <Label htmlFor="duration" className="text-white">Duration (minutes)</Label>
                        <Input id="duration" type="number" placeholder="45" className="bg-white/5 border-white/10 text-white" />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="difficulty" className="text-white">Difficulty Level</Label>
                      <Select>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="warmup" className="text-white">Warm-up Exercises</Label>
                      <Textarea id="warmup" placeholder="List warm-up exercises..." className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="figures" className="text-white">Figures/Combos</Label>
                      <Textarea id="figures" placeholder="List figures and combos..." className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="stretching" className="text-white">Stretching Routine</Label>
                      <Textarea id="stretching" placeholder="List stretching exercises..." className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div>
                      <Label htmlFor="playlist" className="text-white">Recommended Playlist</Label>
                      <Input id="playlist" placeholder="Playlist name or link" className="bg-white/5 border-white/10 text-white" />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button variant="outline" onClick={() => setShowCreateSession(false)}>
                        Cancel
                      </Button>
                      <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                        Create Session
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            ) : null}
          </div>
        </div>

        {/* Training Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <Target className="w-8 h-8 mx-auto mb-2 text-primary" />
              <h3 className="text-2xl font-bold text-white">{sessions.length}</h3>
              <p className="text-muted-foreground">Available Sessions</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <h3 className="text-2xl font-bold text-white">35</h3>
              <p className="text-muted-foreground">Total Participants</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <Clock className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <h3 className="text-2xl font-bold text-white">45</h3>
              <p className="text-muted-foreground">Avg Duration (min)</p>
            </CardContent>
          </Card>
          <Card className="glass-effect border-white/10">
            <CardContent className="p-6 text-center">
              <Heart className="w-8 h-8 mx-auto mb-2 text-pink-500" />
              <h3 className="text-2xl font-bold text-white">12</h3>
              <p className="text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.map((session) => (
            <Card key={session.id} className="glass-effect border-white/10 hover:border-white/20 transition-all">
              <div className="relative">
                <img
                  src={session.thumbnail}
                  alt={session.title}
                  className="w-full h-48 object-cover rounded-t-lg"
                />
                <Badge className={`absolute top-2 right-2 ${getDifficultyColor(session.difficulty)} text-white`}>
                  {session.difficulty}
                </Badge>
              </div>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-white mb-2">{session.title}</h3>
                <p className="text-muted-foreground mb-4">by {session.instructor}</p>
                
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="w-4 h-4 mr-2" />
                    {session.duration} minutes
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Users className="w-4 h-4 mr-2" />
                    {session.participants} participants
                  </div>
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Music className="w-4 h-4 mr-2" />
                    {session.playlist}
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Warm-up</h4>
                    <p className="text-xs text-muted-foreground">{session.warmup.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Figures</h4>
                    <p className="text-xs text-muted-foreground">{session.figures.join(', ')}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-1">Stretching</h4>
                    <p className="text-xs text-muted-foreground">{session.stretching.join(', ')}</p>
                  </div>
                </div>

                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600">
                  <Play className="w-4 h-4 mr-2" />
                  Start Training
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Training;