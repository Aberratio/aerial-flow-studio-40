import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points: number;
  rule_type: string;
  rule_value: number;
  created_at: string;
}

const AchievementManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '',
    points: 0,
    rule_type: '',
    rule_value: 0
  });

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  if (!isAdmin) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <Card className="glass-effect border-white/10">
          <CardContent className="p-8 text-center">
            <h2 className="text-2xl font-bold text-white mb-4">Access Denied</h2>
            <p className="text-muted-foreground">You need admin privileges to access this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('achievements')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAchievements(data || []);
    } catch (error) {
      console.error('Error fetching achievements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch achievements",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingAchievement) {
        // Update existing achievement
        const { error } = await supabase
          .from('achievements')
          .update({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            points: formData.points,
            rule_type: formData.rule_type,
            rule_value: formData.rule_value,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingAchievement.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Achievement updated successfully"
        });
      } else {
        // Create new achievement
        const { error } = await supabase
          .from('achievements')
          .insert({
            name: formData.name,
            description: formData.description,
            icon: formData.icon,
            points: formData.points,
            rule_type: formData.rule_type,
            rule_value: formData.rule_value,
            created_by: user?.id
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Achievement created successfully"
        });
      }

      setIsModalOpen(false);
      setEditingAchievement(null);
      resetForm();
      fetchAchievements();
    } catch (error) {
      console.error('Error saving achievement:', error);
      toast({
        title: "Error",
        description: "Failed to save achievement",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (achievement: Achievement) => {
    setEditingAchievement(achievement);
    setFormData({
      name: achievement.name,
      description: achievement.description,
      icon: achievement.icon,
      points: achievement.points,
      rule_type: achievement.rule_type,
      rule_value: achievement.rule_value
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (achievementId: string) => {
    if (!confirm('Are you sure you want to delete this achievement?')) return;

    try {
      const { error } = await supabase
        .from('achievements')
        .delete()
        .eq('id', achievementId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Achievement deleted successfully"
      });
      
      fetchAchievements();
    } catch (error) {
      console.error('Error deleting achievement:', error);
      toast({
        title: "Error",
        description: "Failed to delete achievement",
        variant: "destructive"
      });
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      points: 0,
      rule_type: '',
      rule_value: 0
    });
  };

  const openCreateModal = () => {
    setEditingAchievement(null);
    resetForm();
    setIsModalOpen(true);
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  const ruleTypes = [
    { value: 'posts_count', label: 'Posts Count' },
    { value: 'figures_completed', label: 'Figures Completed' },
    { value: 'post_likes', label: 'Post Likes Received' },
    { value: 'training_sessions', label: 'Training Sessions' },
    { value: 'challenges_completed', label: 'Challenges Completed' }
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-center text-muted-foreground">Loading achievements...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-white">Achievement Management</h1>
            <p className="text-muted-foreground">Create and manage achievements for users</p>
          </div>
          <Button onClick={openCreateModal} className="bg-gradient-to-r from-purple-500 to-pink-500">
            <Plus className="w-4 h-4 mr-2" />
            Create Achievement
          </Button>
        </div>

        {/* Achievements Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {achievements.map((achievement) => (
            <Card key={achievement.id} className="glass-effect border-white/10">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="text-4xl">{achievement.icon}</div>
                  <div className="flex space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(achievement)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleDelete(achievement.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <CardTitle className="text-white">{achievement.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground text-sm mb-4">{achievement.description}</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Points:</span>
                    <span className="text-purple-400 font-semibold">{achievement.points}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rule:</span>
                    <span className="text-white">{achievement.rule_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Threshold:</span>
                    <span className="text-white">{achievement.rule_value}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {achievements.length === 0 && (
          <Card className="glass-effect border-white/10">
            <CardContent className="p-12 text-center">
              <h3 className="text-xl font-bold text-white mb-2">No Achievements</h3>
              <p className="text-muted-foreground mb-4">Create your first achievement to get started</p>
              <Button onClick={openCreateModal} className="bg-gradient-to-r from-purple-500 to-pink-500">
                <Plus className="w-4 h-4 mr-2" />
                Create Achievement
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-black/95 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">
              {editingAchievement ? 'Edit Achievement' : 'Create Achievement'}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {editingAchievement ? 'Update the achievement details' : 'Create a new achievement for users to earn'}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Name</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Achievement name"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Achievement description"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Icon (Emoji)</label>
              <Input
                value={formData.icon}
                onChange={(e) => setFormData({...formData, icon: e.target.value})}
                placeholder="🏆"
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Points</label>
              <Input
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({...formData, points: Number(e.target.value)})}
                placeholder="100"
                required
                min="0"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Rule Type</label>
              <Select value={formData.rule_type} onValueChange={(value) => setFormData({...formData, rule_type: value})}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select rule type" />
                </SelectTrigger>
                <SelectContent className="bg-black/95 border-white/10">
                  {ruleTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white hover:bg-white/10">
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-white mb-2">Threshold Value</label>
              <Input
                type="number"
                value={formData.rule_value}
                onChange={(e) => setFormData({...formData, rule_value: Number(e.target.value)})}
                placeholder="1"
                required
                min="1"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>

            <div className="flex space-x-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1 border-white/20 text-white hover:bg-white/10"
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-gradient-to-r from-purple-500 to-pink-500"
              >
                <Save className="w-4 h-4 mr-2" />
                {editingAchievement ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AchievementManagement;