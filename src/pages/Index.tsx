import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Trophy, BookOpen, Dumbbell, Users, Home, CheckCircle, ArrowRight, Target, Play, Library, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

const ACTIVITY_OPTIONS = [{
  id: 'challenge',
  title: 'Challenge',
  description: 'Join a structured challenge',
  icon: Trophy,
  color: 'text-yellow-400',
  bgColor: 'bg-yellow-500/20',
  link: '/challenges'
}, {
  id: 'figure-of-day',
  title: 'Figure of the Day',
  description: 'Practice today\'s featured figure',
  icon: Target,
  color: 'text-purple-400',
  bgColor: 'bg-purple-500/20',
  link: '/figure-of-the-day'
}, {
  id: 'training',
  title: 'Training Session',
  description: 'Create your own workout',
  icon: Dumbbell,
  color: 'text-green-400',
  bgColor: 'bg-green-500/20',
  link: '/training'
}, {
  id: 'aerial-journey',
  title: 'Aerial Journey',
  description: 'Follow your skill progression',
  icon: Play,
  color: 'text-blue-400',
  bgColor: 'bg-blue-500/20',
  link: '/aerial-journey'
}, {
  id: 'library',
  title: 'Explore Library',
  description: 'Browse all exercises',
  icon: Library,
  color: 'text-teal-400',
  bgColor: 'bg-teal-500/20',
  link: '/library'
}, {
  id: 'feed',
  title: 'Social Feed',
  description: 'See what others are doing',
  icon: Home,
  color: 'text-pink-400',
  bgColor: 'bg-pink-500/20',
  link: '/feed'
}];

interface SportCategory {
  id: string;
  key_name?: string;
  name: string;
  description?: string;
  icon?: string;
}

const Index = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  const [userSports, setUserSports] = useState<string[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [availableSports, setAvailableSports] = useState<SportCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      fetchAvailableSports();
    }
  }, [user]);

  const fetchAvailableSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sport_categories')
        .select('id, key_name, name, description, icon')
        .eq('is_published', true)
        .order('name');
      
      if (error) throw error;
      setAvailableSports(data || []);
    } catch (error) {
      console.error('Error fetching available sports:', error);
    }
  };

  const getSportIcon = (sport: SportCategory) => {
    // Use icon from database if available, otherwise fallback to default icons
    if (sport.icon) {
      return sport.icon;
    }
    
    // Fallback icons based on key_name or name
    const iconMap: Record<string, string> = {
      'hoop': '🪩',
      'aerial_hoop': '🪩',
      'pole': '💃',
      'pole_dancing': '💃', 
      'silks': '🎪',
      'aerial_silks': '🎪',
      'hammock': '🏺',
      'aerial_hammock': '🏺',
      'core': '💪',
      'core_training': '💪'
    };
    return iconMap[sport.key_name] || iconMap[sport.name.toLowerCase().replace(/\s+/g, '_')] || '🏃';
  };

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

  const handleSportToggle = (sportId: string) => {
    setSelectedSports(prev => 
      prev.includes(sportId) 
        ? prev.filter(s => s !== sportId) 
        : [...prev, sportId]
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
        description: "Your sports preferences have been saved!"
      });
    } catch (error) {
      console.error('Error saving sports:', error);
      toast({
        title: "Error",
        description: "Failed to save sports preferences",
        variant: "destructive"
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
  if (userSports.length === 0 && availableSports.length > 0) {
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
            <p className="text-muted-foreground">Choose the sports you want to train in from our available categories:</p>
          </div>

          <Card className="glass-effect border-white/10 mb-8">
            <CardHeader>
              <CardTitle className="text-white text-center">
                Choose Your Sports
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                {availableSports.map(sport => (
                  <Card 
                    key={sport.id} 
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                      selectedSports.includes(sport.id) 
                        ? 'ring-2 ring-primary bg-primary/10' 
                        : 'bg-background/50 hover:bg-background/70'
                    }`}
                    onClick={() => handleSportToggle(sport.id)}
                  >
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">{getSportIcon(sport)}</div>
                      <div className="mb-2">
                        <Checkbox 
                          checked={selectedSports.includes(sport.id)} 
                          className="pointer-events-none" 
                        />
                      </div>
                      <h3 className="font-semibold text-lg">{sport.name}</h3>
                      {sport.description && (
                        <p className="text-sm text-muted-foreground mt-1">{sport.description}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
              
              {availableSports.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  <p>No sports are currently available. Please check back later!</p>
                </div>
              )}
              
              {availableSports.length > 0 && (
                <div className="flex justify-center">
                  <Button 
                    onClick={saveSports} 
                    disabled={saving || selectedSports.length === 0} 
                    className="px-8"
                  >
                    {saving ? 'Saving...' : 'Save Sports Preferences'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show message if no sports are available
  if (userSports.length === 0 && availableSports.length === 0) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white mb-4">
            Welcome to IguanaFlow! 🎭
          </h1>
          <p className="text-muted-foreground">
            No sports are currently available. Please check back later!
          </p>
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
            {userSports.map(sportId => {
              const sport = availableSports.find(s => s.id === sportId);
              return (
                <Badge key={sportId} variant="secondary" className="bg-primary/20 text-primary flex items-center gap-1">
                  {sport?.icon && <span>{sport.icon}</span>}
                  {sport?.name || sportId}
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

        <div className={`grid gap-6 ${isMobile ? 'grid-cols-2' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'}`}>
          {ACTIVITY_OPTIONS.map(activity => {
            const Icon = activity.icon;
            const isTraining = activity.id === 'training';
            const isLocked = isTraining; // Training is locked (in development)
            
            if (isLocked) {
              return (
                <Card key={activity.id} className="glass-effect border-white/10 cursor-not-allowed h-full opacity-60 relative">
                  <CardContent className={`text-center h-full flex flex-col ${isMobile ? 'p-3' : 'p-6'}`}>
                    <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full ${activity.bgColor} flex items-center justify-center mx-auto mb-4 relative`}>
                      <Icon className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${activity.color}`} />
                      <div className="absolute -top-1 -right-1 bg-muted rounded-full p-1">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                      </div>
                    </div>
                    
                    <h3 className={`font-semibold text-white mb-2 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                      {activity.title}
                    </h3>
                    
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'} mb-4 flex-grow`}>
                      Coming Soon
                    </p>
                  </CardContent>
                </Card>
              );
            }

            return (
              <Link key={activity.id} to={activity.link}>
                <Card className="glass-effect border-white/10 hover-lift group cursor-pointer h-full">
                  <CardContent className={`text-center h-full flex flex-col ${isMobile ? 'p-3' : 'p-6'}`}>
                    <div className={`${isMobile ? 'w-12 h-12' : 'w-16 h-16'} rounded-full ${activity.bgColor} flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                      <Icon className={`${isMobile ? 'w-6 h-6' : 'w-8 h-8'} ${activity.color}`} />
                    </div>
                    
                    <h3 className={`font-semibold text-white mb-2 ${isMobile ? 'text-sm' : 'text-lg'}`}>
                      {activity.title}
                    </h3>
                    
                    <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'} mb-4 flex-grow`}>
                      {activity.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Index;