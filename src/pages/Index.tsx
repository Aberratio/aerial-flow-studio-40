import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Trophy,
  BookOpen,
  Dumbbell,
  Users,
  Home,
  CheckCircle,
  ArrowRight,
  Target,
  Play,
  Library,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const SPORT_OPTIONS = [
  { value: 'hoop', label: 'Aerial Hoop', emoji: '🪩' },
  { value: 'pole', label: 'Pole Dancing', emoji: '💃' },
  { value: 'silks', label: 'Aerial Silks', emoji: '🎭' },
  { value: 'hammock', label: 'Aerial Hammock', emoji: '🛏️' },
  { value: 'core', label: 'Core Training', emoji: '💪' }
];

const ACTIVITY_OPTIONS = [
  {
    id: 'challenge',
    title: 'Challenge',
    description: 'Join a structured challenge',
    icon: Trophy,
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-500/20',
    link: '/challenges'
  },
  {
    id: 'figure-of-day',
    title: 'Figure of the Day',
    description: 'Practice today\'s featured figure',
    icon: Target,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    link: '/library'
  },
  {
    id: 'training',
    title: 'Training Session',
    description: 'Create your own workout',
    icon: Dumbbell,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    link: '/training'
  },
  {
    id: 'aerial-journey',
    title: 'Aerial Journey',
    description: 'Follow your skill progression',
    icon: Play,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    link: '/aerial-journey'
  },
  {
    id: 'library',
    title: 'Explore Library',
    description: 'Browse all exercises',
    icon: Library,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    link: '/library'
  },
  {
    id: 'feed',
    title: 'Social Feed',
    description: 'See what others are doing',
    icon: Home,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    link: '/feed'
  }
];

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [userSports, setUserSports] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('sports')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const sports = data?.sports || [];
      setUserSports(sports);
      setSelectedSports(sports);
    } catch (error) {
      console.error('Error fetching user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSportToggle = (sportValue: string) => {
    setSelectedSports(prev => 
      prev.includes(sportValue)
        ? prev.filter(s => s !== sportValue)
        : [...prev, sportValue]
    );
  };

  const saveSports = async () => {
    if (!user) return;

    try {
      setSaving(true);
      const { error } = await supabase
        .from('profiles')
        .update({ sports: selectedSports })
        .eq('id', user.id);

      if (error) throw error;

      setUserSports(selectedSports);
      toast({
        title: "Success",
        description: "Your sports preferences have been saved!",
      });
    } catch (error) {
      console.error('Error saving sports:', error);
      toast({
        title: "Error",
        description: "Failed to save sports preferences",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  // Show sport selection if user has no sports selected
  if (userSports.length === 0) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Welcome to IguanaFlow! 🎭
            </h1>
            <p className="text-xl text-muted-foreground mb-2">
              Let's get started by choosing the sports you want to train
            </p>
            <p className="text-muted-foreground">
              You can always change these later in your profile settings
            </p>
          </div>

          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white text-center">
                Choose Your Sports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {SPORT_OPTIONS.map((sport) => (
                  <div
                    key={sport.value}
                    onClick={() => handleSportToggle(sport.value)}
                    className={`
                      p-6 rounded-lg border cursor-pointer transition-all duration-200
                      ${selectedSports.includes(sport.value)
                        ? 'bg-primary/20 border-primary text-primary' 
                        : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                      }
                    `}
                  >
                    <div className="flex items-center space-x-3">
                      <Checkbox 
                        checked={selectedSports.includes(sport.value)}
                        onChange={() => handleSportToggle(sport.value)}
                        className="pointer-events-none"
                      />
                      <div className="text-3xl">{sport.emoji}</div>
                      <div>
                        <h3 className="font-semibold text-lg">{sport.label}</h3>
                        <p className="text-sm opacity-70">
                          Aerial fitness and artistry
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center">
                <Button 
                  onClick={saveSports}
                  disabled={selectedSports.length === 0 || saving}
                  size="lg"
                  className="min-w-32"
                >
                  {saving ? "Saving..." : `Save ${selectedSports.length} Sport${selectedSports.length === 1 ? '' : 's'}`}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show activity options if user has sports selected
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            What would you like to do today? 🌟
          </h1>
          <p className="text-muted-foreground">
            Choose your next step in your aerial journey
          </p>
          
          <div className="flex flex-wrap gap-2 mt-4">
            <span className="text-sm text-muted-foreground">Your sports:</span>
            {userSports.map((sport) => {
              const sportOption = SPORT_OPTIONS.find(s => s.value === sport);
              return (
                <Badge key={sport} variant="secondary" className="bg-primary/20 text-primary">
                  {sportOption?.emoji} {sportOption?.label}
                </Badge>
              );
            })}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setUserSports([])}
              className="text-muted-foreground hover:text-white"
            >
              Change sports
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {ACTIVITY_OPTIONS.map((activity) => {
            const Icon = activity.icon;
            return (
              <Link key={activity.id} to={activity.link}>
                <Card className="glass-effect border-white/10 hover-lift group cursor-pointer h-full">
                  <CardContent className="p-6 text-center h-full flex flex-col">
                    <div className={`w-16 h-16 rounded-full ${activity.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-8 h-8 ${activity.color}`} />
                    </div>
                    
                    <h3 className="font-semibold text-white mb-2 text-lg">
                      {activity.title}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm mb-4 flex-grow">
                      {activity.description}
                    </p>
                    
                    <div className="flex items-center justify-center text-primary group-hover:translate-x-1 transition-transform">
                      <span className="text-sm font-medium mr-2">Get started</span>
                      <ArrowRight className="w-4 h-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Quick Stats */}
        <Card className="glass-effect border-white/10 mt-8">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-2xl font-bold text-primary mb-1">
                  {userSports.length}
                </div>
                <div className="text-sm text-muted-foreground">
                  Sports Selected
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-green-400 mb-1">
                  0
                </div>
                <div className="text-sm text-muted-foreground">
                  Challenges Completed
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  0
                </div>
                <div className="text-sm text-muted-foreground">
                  Training Sessions
                </div>
              </div>
              
              <div>
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  0
                </div>
                <div className="text-sm text-muted-foreground">
                  Total Points
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;