import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X, 
  Eye, 
  EyeOff,
  Upload,
  ArrowLeft
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface SportCategory {
  id: string;
  name: string;
  description?: string;
  image_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

interface SportCategoryManagerProps {
  onClose: () => void;
}

const SportCategoryManager: React.FC<SportCategoryManagerProps> = ({ onClose }) => {
  const { user } = useAuth();
  const [sports, setSports] = useState<SportCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image_url: '',
    is_published: false
  });

  useEffect(() => {
    fetchSports();
  }, []);

  const fetchSports = async () => {
    try {
      const { data, error } = await supabase
        .from('sport_categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setSports(data || []);
    } catch (error) {
      console.error('Error fetching sports:', error);
      toast.error('Failed to load sports');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Sport name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sport_categories')
        .insert({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          is_published: formData.is_published,
          created_by: user?.id
        })
        .select()
        .single();

      if (error) throw error;

      setSports(prev => [...prev, data]);
      setIsCreating(false);
      setFormData({ name: '', description: '', image_url: '', is_published: false });
      toast.success('Sport category created successfully');
    } catch (error) {
      console.error('Error creating sport:', error);
      toast.error('Failed to create sport category');
    }
  };

  const handleUpdate = async (id: string) => {
    if (!formData.name.trim()) {
      toast.error('Sport name is required');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('sport_categories')
        .update({
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          image_url: formData.image_url.trim() || null,
          is_published: formData.is_published
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      setSports(prev => prev.map(sport => sport.id === id ? data : sport));
      setEditingId(null);
      setFormData({ name: '', description: '', image_url: '', is_published: false });
      toast.success('Sport category updated successfully');
    } catch (error) {
      console.error('Error updating sport:', error);
      toast.error('Failed to update sport category');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('sport_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSports(prev => prev.filter(sport => sport.id !== id));
      toast.success('Sport category deleted successfully');
    } catch (error) {
      console.error('Error deleting sport:', error);
      toast.error('Failed to delete sport category');
    }
  };

  const handlePublishToggle = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('sport_categories')
        .update({ is_published: !currentStatus })
        .eq('id', id);

      if (error) throw error;

      setSports(prev => prev.map(sport => 
        sport.id === id ? { ...sport, is_published: !currentStatus } : sport
      ));

      toast.success(`Sport ${!currentStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Error updating sport status:', error);
      toast.error('Failed to update sport status');
    }
  };

  const startEdit = (sport: SportCategory) => {
    setEditingId(sport.id);
    setFormData({
      name: sport.name,
      description: sport.description || '',
      image_url: sport.image_url || '',
      is_published: sport.is_published
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    setFormData({ name: '', description: '', image_url: '', is_published: false });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Sport Categories Management</h2>
          <p className="text-muted-foreground">
            Manage which sports are available for users to choose from
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setIsCreating(true)}
            disabled={isCreating || editingId !== null}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Sport
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            className="border-white/20 text-white hover:bg-white/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {isCreating && (
        <Card className="glass-effect border-green-400/20">
          <CardHeader>
            <CardTitle className="text-white">Create New Sport Category</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm text-white font-medium">Name *</label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="e.g., Aerial Hoop, Pole Dancing"
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white font-medium">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this sport category"
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white font-medium">Image URL</label>
              <Input
                value={formData.image_url}
                onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                placeholder="https://example.com/image.jpg"
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
              <label className="text-sm text-white">Publish immediately</label>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Create
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sports List */}
      <div className="grid gap-4">
        {sports.map((sport) => (
          <Card key={sport.id} className="glass-effect border-white/10">
            <CardContent className="p-6">
              {editingId === sport.id ? (
                // Edit Form
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-white font-medium">Name *</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white font-medium">Description</label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-white font-medium">Image URL</label>
                    <Input
                      value={formData.image_url}
                      onChange={(e) => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                      className="bg-white/5 border-white/20 text-white"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.is_published}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                    />
                    <label className="text-sm text-white">Published</label>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => handleUpdate(sport.id)} className="bg-blue-600 hover:bg-blue-700">
                      <Save className="w-4 h-4 mr-2" />
                      Save
                    </Button>
                    <Button variant="outline" onClick={cancelEdit}>
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-white">{sport.name}</h3>
                      <Badge
                        variant={sport.is_published ? "default" : "secondary"}
                        className={sport.is_published ? "bg-green-500/20 text-green-400 border-green-400/30" : "bg-orange-500/20 text-orange-400 border-orange-400/30"}
                      >
                        {sport.is_published ? (
                          <>
                            <Eye className="w-3 h-3 mr-1" />
                            Published
                          </>
                        ) : (
                          <>
                            <EyeOff className="w-3 h-3 mr-1" />
                            Draft
                          </>
                        )}
                      </Badge>
                    </div>
                    {sport.description && (
                      <p className="text-muted-foreground">{sport.description}</p>
                    )}
                    {sport.image_url && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Image: {sport.image_url}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={sport.is_published}
                      onCheckedChange={() => handlePublishToggle(sport.id, sport.is_published)}
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(sport)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(sport.id, sport.name)}
                      disabled={editingId !== null || isCreating}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {sports.length === 0 && (
        <Card className="glass-effect border-white/10">
          <CardContent className="p-8 text-center">
            <div className="text-muted-foreground mb-4">
              <Plus className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-semibold text-white mb-2">No Sport Categories</h3>
              <p>Create your first sport category to get started.</p>
            </div>
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Sport
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SportCategoryManager;