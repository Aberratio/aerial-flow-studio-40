import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SportCategory {
  id: string;
  key_name?: string;
  name: string;
  description?: string;
  icon?: string;
}

export const YourSportsSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userSports, setUserSports] = useState<string[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>([]);
  const [availableSports, setAvailableSports] = useState<SportCategory[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

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

  const getSportIcon = (sport: SportCategory) => {
    if (sport.icon) return sport.icon;
    
    const iconMap: Record<string, string> = {
      'hoop': '🪩',
      'pole': '💃',
      'core': '💪'
    };
    return iconMap[sport.key_name || ''] || '🏃';
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
      setIsEditing(false);
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
      <Card className="glass-effect border-white/10">
        <CardContent className="p-6">
          <div className="text-white text-center">Loading sports...</div>
        </CardContent>
      </Card>
    );
  }

  // Editing mode
  if (isEditing) {
    return (
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Choose Your Sports</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {availableSports.map(sport => (
              <Card 
                key={sport.id} 
                className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                  selectedSports.includes(sport.id) 
                    ? 'ring-2 ring-primary bg-primary/10' 
                    : 'bg-white/5 hover:bg-white/10'
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
                  <h3 className="font-semibold text-lg text-white">{sport.name}</h3>
                  {sport.description && (
                    <p className="text-sm text-muted-foreground mt-1">{sport.description}</p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="flex gap-2 justify-center">
            <Button 
              onClick={saveSports} 
              disabled={saving || selectedSports.length === 0}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              {saving ? 'Saving...' : 'Save Sports'}
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                setSelectedSports(userSports);
                setIsEditing(false);
              }}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Display mode
  return (
    <Card className="glass-effect border-white/10">
      <CardHeader>
        <CardTitle className="text-white">Your Sports</CardTitle>
      </CardHeader>
      <CardContent>
        {userSports.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-3 mb-4">
              {userSports.map(sportId => {
                const sport = availableSports.find(s => s.id === sportId);
                return (
                  <Badge key={sportId} variant="secondary" className="bg-primary/20 text-primary flex items-center gap-2 px-3 py-2">
                    {sport?.icon && <span className="text-lg">{sport.icon}</span>}
                    {sport?.name || sportId}
                  </Badge>
                );
              })}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsEditing(true)}
              className="border-white/20 text-white hover:bg-white/10"
            >
              Change Sports
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <p className="text-muted-foreground mb-4">You haven't selected any sports yet</p>
            <Button 
              onClick={() => setIsEditing(true)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              Choose Sports
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
