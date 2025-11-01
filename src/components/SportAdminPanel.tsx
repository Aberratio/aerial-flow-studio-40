import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Breadcrumb, 
  BreadcrumbItem, 
  BreadcrumbLink, 
  BreadcrumbList, 
  BreadcrumbPage, 
  BreadcrumbSeparator 
} from "@/components/ui/breadcrumb";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Save, 
  X, 
  Users, 
  Search, 
  Filter, 
  ArrowLeft,
  Home,
  Settings,
  Target,
  Clock
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface SportCategory {
  id: string;
  key_name: string;
  name: string;
  description?: string;
  icon?: string;
  image_url?: string;
  is_published: boolean;
}

interface SportLevel {
  id: string;
  sport_category: string;
  level_number: number;
  level_name: string;
  point_limit: number;
  created_at: string;
  figure_count: number;
  challenge_id?: string;
  status: 'draft' | 'published';
}

interface Figure {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  category: string;
  image_url: string;
  hold_time_seconds?: number;
}

interface LevelFigure {
  id: string;
  level_id: string;
  figure_id: string;
  order_index: number;
  figure: Figure;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  status: string;
  premium: boolean;
}

interface SportAdminPanelProps {
  sportKey: string;
}

const SportAdminPanel = ({ sportKey }: SportAdminPanelProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [sportCategory, setSportCategory] = useState<SportCategory | null>(null);
  const [levels, setLevels] = useState<SportLevel[]>([]);
  const [figures, setFigures] = useState<Figure[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Sport info editing states
  const [isEditingSport, setIsEditingSport] = useState(false);
  const [sportForm, setSportForm] = useState({
    name: '',
    description: '',
    icon: '',
    image_url: '',
    is_published: false
  });
  
  // Level management states
  const [isCreateLevelOpen, setIsCreateLevelOpen] = useState(false);
  const [isEditFiguresOpen, setIsEditFiguresOpen] = useState(false);
  const [isEditLevelOpen, setIsEditLevelOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SportLevel | null>(null);
  const [levelFigures, setLevelFigures] = useState<LevelFigure[]>([]);
  
  // Level form states
  const [levelForm, setLevelForm] = useState({
    level_name: '',
    level_number: 0,
    point_limit: 0,
    challenge_id: 'none',
    status: 'draft' as 'draft' | 'published'
  });
  
  // Figure selection states
  const [selectedFigures, setSelectedFigures] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('current');
  const [usedFiguresInSport, setUsedFiguresInSport] = useState<string[]>([]);
  
  // Hold time editing
  const [isEditHoldTimeOpen, setIsEditHoldTimeOpen] = useState(false);
  const [editingFigure, setEditingFigure] = useState<Figure | null>(null);
  const [editHoldTime, setEditHoldTime] = useState<number>(0);

  useEffect(() => {
    if (!sportKey) return;
    fetchSportData();
  }, [sportKey]);

  const fetchSportData = async () => {
    try {
      setLoading(true);
      
      // Fetch sport category
      const { data: sportData, error: sportError } = await supabase
        .from("sport_categories")
        .select("*")
        .eq("key_name", sportKey)
        .single();
      
      if (sportError) throw sportError;
      setSportCategory(sportData);
      setSportForm({
        name: sportData.name,
        description: sportData.description || '',
        icon: sportData.icon || '',
        image_url: sportData.image_url || '',
        is_published: sportData.is_published
      });
      
      // Fetch levels for this sport
      await fetchLevels();
      
      // Fetch all figures
      await fetchFigures();
      
      // Fetch challenges
      await fetchChallenges();
      
    } catch (error) {
      console.error('Error fetching sport data:', error);
      toast.error('Failed to load sport data');
    } finally {
      setLoading(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const { data, error } = await supabase
        .from('sport_levels')
        .select(`
          *,
          challenges(
            id,
            title,
            description,
            difficulty_level,
            status,
            premium
          )
        `)
        .eq('sport_category', sportKey)
        .order('level_number');

      if (error) throw error;

      // Get figure counts separately
      const levelsWithCount = await Promise.all((data || []).map(async (level) => {
        const { count } = await supabase
          .from('level_figures')
          .select('*', { count: 'exact', head: true })
          .eq('level_id', level.id);
        
        return {
          ...level,
          figure_count: count || 0,
          status: level.status as 'draft' | 'published'
        };
      }));

      setLevels(levelsWithCount);
      await fetchUsedFigures();
    } catch (error) {
      console.error('Error fetching levels:', error);
      toast.error('Failed to fetch levels');
    }
  };

  const fetchFigures = async () => {
    try {
      const { data, error } = await supabase
        .from('figures')
        .select('id, name, description, difficulty_level, category, image_url, hold_time_seconds')
        .order('name');

      if (error) throw error;
      setFigures(data || []);
    } catch (error) {
      console.error('Error fetching figures:', error);
      toast.error('Failed to fetch figures');
    }
  };

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from('challenges')
        .select('id, title, description, difficulty_level, status, premium')
        .eq('status', 'published')
        .order('title');

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to fetch challenges');
    }
  };

  const fetchUsedFigures = async () => {
    try {
      // First get all level IDs for the current sport
      const { data: levelIds, error: levelError } = await supabase
        .from('sport_levels')
        .select('id')
        .eq('sport_category', sportKey);

      if (levelError) throw levelError;

      if (!levelIds || levelIds.length === 0) {
        setUsedFiguresInSport([]);
        return;
      }

      // Then get all figure IDs used in those levels
      const { data, error } = await supabase
        .from('level_figures')
        .select('figure_id')
        .in('level_id', levelIds.map(level => level.id));

      if (error) throw error;

      const usedFigureIds = data?.map(item => item.figure_id) || [];
      setUsedFiguresInSport(usedFigureIds);
    } catch (error) {
      console.error('Error fetching used figures:', error);
      setUsedFiguresInSport([]);
    }
  };

  const updateSportInfo = async () => {
    if (!sportCategory || !user) return;

    try {
      const { error } = await supabase
        .from('sport_categories')
        .update({
          name: sportForm.name.trim(),
          description: sportForm.description.trim() || null,
          icon: sportForm.icon.trim() || null,
          image_url: sportForm.image_url.trim() || null,
          is_published: sportForm.is_published
        })
        .eq('id', sportCategory.id);

      if (error) throw error;

      setSportCategory(prev => prev ? { ...prev, ...sportForm } : null);
      setIsEditingSport(false);
      toast.success('Sport information updated successfully');
    } catch (error) {
      console.error('Error updating sport:', error);
      toast.error('Failed to update sport information');
    }
  };

  const createLevel = async () => {
    if (!user || !sportKey || !levelForm.level_name.trim()) return;

    try {
      const { error } = await supabase
        .from('sport_levels')
        .insert({
          sport_category: sportKey,
          level_number: levelForm.level_number,
          level_name: levelForm.level_name.trim(),
          point_limit: levelForm.point_limit,
          challenge_id: levelForm.challenge_id === 'none' ? null : levelForm.challenge_id || null,
          status: levelForm.status,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Level created successfully');
      setIsCreateLevelOpen(false);
      setLevelForm({
        level_name: '',
        level_number: 0,
        point_limit: 0,
        challenge_id: 'none',
        status: 'draft'
      });
      fetchLevels();
    } catch (error) {
      console.error('Error creating level:', error);
      toast.error('Failed to create level');
    }
  };

  const deleteLevel = async (levelId: string) => {
    try {
      const { error } = await supabase
        .from('sport_levels')
        .delete()
        .eq('id', levelId);

      if (error) throw error;

      toast.success('Level deleted successfully');
      fetchLevels();
    } catch (error) {
      console.error('Error deleting level:', error);
      toast.error('Failed to delete level');
    }
  };

  const openEditLevel = (level: SportLevel) => {
    setSelectedLevel(level);
    setLevelForm({
      level_name: level.level_name,
      level_number: level.level_number,
      point_limit: level.point_limit,
      challenge_id: level.challenge_id || 'none',
      status: level.status
    });
    setIsEditLevelOpen(true);
  };

  const updateLevel = async () => {
    if (!selectedLevel || !levelForm.level_name.trim()) return;

    try {
      const { error } = await supabase
        .from('sport_levels')
        .update({
          level_name: levelForm.level_name.trim(),
          level_number: levelForm.level_number,
          point_limit: levelForm.point_limit,
          challenge_id: levelForm.challenge_id === 'none' ? null : levelForm.challenge_id || null,
          status: levelForm.status
        })
        .eq('id', selectedLevel.id);

      if (error) throw error;

      toast.success('Level updated successfully');
      setIsEditLevelOpen(false);
      fetchLevels();
    } catch (error) {
      console.error('Error updating level:', error);
      toast.error('Failed to update level');
    }
  };

  const openEditFigures = async (level: SportLevel) => {
    setSelectedLevel(level);
    await fetchLevelFigures(level.id);
    setIsEditFiguresOpen(true);
  };

  const fetchLevelFigures = async (levelId: string) => {
    try {
      const { data, error } = await supabase
        .from('level_figures')
        .select(`
          *,
          figures (
            id,
            name,
            description,
            difficulty_level,
            category,
            image_url,
            hold_time_seconds
          )
        `)
        .eq('level_id', levelId)
        .order('order_index');

      if (error) throw error;

      const formattedData = data?.map(item => ({
        id: item.id,
        level_id: item.level_id,
        figure_id: item.figure_id,
        order_index: item.order_index,
        figure: item.figures
      })) || [];

      setLevelFigures(formattedData);
      setSelectedFigures(formattedData.map(lf => lf.figure_id));
    } catch (error) {
      console.error('Error fetching level figures:', error);
      toast.error('Failed to fetch level figures');
    }
  };

  const saveLevelFigures = async () => {
    if (!selectedLevel || !user) return;

    try {
      // First, delete existing associations
      await supabase
        .from('level_figures')
        .delete()
        .eq('level_id', selectedLevel.id);

      // Then, insert new associations
      if (selectedFigures.length > 0) {
        const levelFigureData = selectedFigures.map((figureId, index) => ({
          level_id: selectedLevel.id,
          figure_id: figureId,
          order_index: index,
          created_by: user.id
        }));

        const { error } = await supabase
          .from('level_figures')
          .insert(levelFigureData);

        if (error) throw error;
      }

      toast.success('Level figures updated successfully');
      setIsEditFiguresOpen(false);
      fetchLevels();
      fetchUsedFigures();
    } catch (error) {
      console.error('Error saving level figures:', error);
      toast.error('Failed to save level figures');
    }
  };

  const openEditHoldTime = (figure: Figure) => {
    setEditingFigure(figure);
    setEditHoldTime(figure.hold_time_seconds || 0);
    setIsEditHoldTimeOpen(true);
  };

  const saveHoldTime = async () => {
    if (!editingFigure || !user) return;

    try {
      const { error } = await supabase
        .from('figures')
        .update({
          hold_time_seconds: editHoldTime > 0 ? editHoldTime : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingFigure.id);

      if (error) throw error;

      // Update local state
      setFigures(prevFigures => 
        prevFigures.map(fig => 
          fig.id === editingFigure.id 
            ? { ...fig, hold_time_seconds: editHoldTime > 0 ? editHoldTime : undefined }
            : fig
        )
      );

      toast.success('Hold time updated successfully');
      setIsEditHoldTimeOpen(false);
      setEditingFigure(null);
    } catch (error) {
      console.error('Error updating hold time:', error);
      toast.error('Failed to update hold time');
    }
  };

  const handleFigureToggle = (figureId: string) => {
    setSelectedFigures(prev => 
      prev.includes(figureId)
        ? prev.filter(id => id !== figureId)
        : [...prev, figureId]
    );
  };

  const getSportFigures = () => {
    return figures.filter(figure => {
      const matchesCategory = categoryFilter === 'all' || 
        (categoryFilter === 'current' && figure.category === sportKey) ||
        (categoryFilter !== 'current' && categoryFilter !== 'all' && figure.category === categoryFilter);
      const matchesSearch = searchTerm === '' || 
        figure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (figure.description && figure.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesDifficulty = difficultyFilter === 'all' || figure.difficulty_level === difficultyFilter;
      
      // Don't show figures that are already used in this sport category (except for the current level being edited)
      const isUsedInSport = usedFiguresInSport.includes(figure.id);
      const isCurrentlySelected = selectedFigures.includes(figure.id);
      const isAvailable = !isUsedInSport || isCurrentlySelected;
      
      return matchesCategory && matchesSearch && matchesDifficulty && isAvailable;
    });
  };

  const getNextLevelNumber = () => {
    if (levels.length === 0) return 1;
    return Math.max(...levels.map(l => l.level_number)) + 1;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!sportCategory) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-white mb-2">Sport nie znaleziony</h2>
          <p className="text-muted-foreground">Kategoria sportowa, której szukasz, nie istnieje.</p>
          <Button 
            onClick={() => navigate('/aerial-journey')} 
            className="mt-4"
            variant="outline"
          >
            Wróć do Podróży
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10">
      <div className="container mx-auto px-4 py-6 space-y-6 max-w-7xl">
        {/* Breadcrumbs */}
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                onClick={() => navigate('/aerial-journey')}
                className="text-white/70 hover:text-white cursor-pointer flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                Podróż
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="text-white font-medium">
                Zarządzanie {sportCategory.name}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
              {sportCategory.icon && <span className="text-4xl">{sportCategory.icon}</span>}
              {sportCategory.name}
              <Badge 
                className={`ml-2 ${
                  sportCategory.is_published 
                    ? "bg-green-500/20 text-green-400 border-green-400/30" 
                    : "bg-orange-500/20 text-orange-400 border-orange-400/30"
                }`}
              >
                {sportCategory.is_published ? "Published" : "Draft"}
              </Badge>
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage sport information and skill levels
            </p>
          </div>
        </div>

        {/* Sport Information Card */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Sport Information
              </CardTitle>
              <Button
                variant="outline"
                onClick={() => setIsEditingSport(!isEditingSport)}
                className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
              >
                <Edit className="w-4 h-4 mr-2" />
                {isEditingSport ? 'Cancel' : 'Edit Info'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditingSport ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-white">Display Name</Label>
                  <Input
                    value={sportForm.name}
                    onChange={(e) => setSportForm(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label className="text-white">Icon (Emoji)</Label>
                  <Input
                    value={sportForm.icon}
                    onChange={(e) => setSportForm(prev => ({ ...prev, icon: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="🪩"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label className="text-white">Description</Label>
                  <Textarea
                    value={sportForm.description}
                    onChange={(e) => setSportForm(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="Brief description of this sport category"
                  />
                </div>
                <div>
                  <Label className="text-white">Image URL</Label>
                  <Input
                    value={sportForm.image_url}
                    onChange={(e) => setSportForm(prev => ({ ...prev, image_url: e.target.value }))}
                    className="bg-white/5 border-white/20 text-white"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={sportForm.is_published}
                    onCheckedChange={(checked) => setSportForm(prev => ({ ...prev, is_published: checked }))}
                  />
                  <Label className="text-white">Published</Label>
                </div>
                <div className="md:col-span-2 flex gap-2">
                  <Button 
                    onClick={updateSportInfo}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsEditingSport(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-white">{sportCategory.description || 'No description'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Key Name</p>
                  <p className="text-white font-mono">{sportCategory.key_name}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Levels Management */}
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-white flex items-center gap-2">
                <Target className="w-5 h-5" />
                Skill Levels ({levels.length})
              </CardTitle>
              <Button
                onClick={() => {
                  setLevelForm({
                    level_name: '',
                    level_number: getNextLevelNumber(),
                    point_limit: 0,
                    challenge_id: 'none',
                    status: 'draft'
                  });
                  setIsCreateLevelOpen(true);
                }}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Level
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {levels.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No levels created yet for this sport.</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {levels.map((level) => (
                  <Card key={level.id} className="bg-white/5 border-white/10">
                    <CardContent className="p-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30">
                              Level {level.level_number}
                            </Badge>
                            <h3 className="text-lg font-semibold text-white">
                              {level.level_name}
                            </h3>
                            <Badge 
                              className={`${
                                level.status === 'published' 
                                  ? "bg-green-500/20 text-green-400 border-green-400/30" 
                                  : "bg-orange-500/20 text-orange-400 border-orange-400/30"
                              }`}
                            >
                              {level.status}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div>
                              <span className="text-white">Point Limit:</span> {level.point_limit}
                            </div>
                            <div>
                              <span className="text-white">Figures:</span> {level.figure_count}
                            </div>
                            <div>
                              <span className="text-white">Challenge:</span> {level.challenge_id ? 'Linked' : 'None'}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditLevel(level)}
                            className="border-blue-400/30 text-blue-400 hover:bg-blue-400/10"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditFigures(level)}
                            className="border-purple-400/30 text-purple-400 hover:bg-purple-400/10"
                          >
                            <Users className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              if (confirm(`Delete level "${level.level_name}"?`)) {
                                deleteLevel(level.id);
                              }
                            }}
                            className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Create Level Dialog */}
        <Dialog open={isCreateLevelOpen} onOpenChange={setIsCreateLevelOpen}>
          <DialogContent className="bg-black border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Level</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Level Name</Label>
                <Input
                  value={levelForm.level_name}
                  onChange={(e) => setLevelForm(prev => ({ ...prev, level_name: e.target.value }))}
                  placeholder="e.g., Beginner Foundation"
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Level Number</Label>
                  <Input
                    type="number"
                    value={levelForm.level_number}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, level_number: parseInt(e.target.value) || 0 }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label>Point Limit</Label>
                  <Input
                    type="number"
                    value={levelForm.point_limit}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, point_limit: parseInt(e.target.value) || 0 }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label>Challenge (Optional)</Label>
                <Select value={levelForm.challenge_id} onValueChange={(value) => setLevelForm(prev => ({ ...prev, challenge_id: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Challenge</SelectItem>
                    {challenges.map(challenge => (
                      <SelectItem key={challenge.id} value={challenge.id}>
                        {challenge.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={levelForm.status} onValueChange={(value: 'draft' | 'published') => setLevelForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={createLevel} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Create
                </Button>
                <Button variant="outline" onClick={() => setIsCreateLevelOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Level Dialog */}
        <Dialog open={isEditLevelOpen} onOpenChange={setIsEditLevelOpen}>
          <DialogContent className="bg-black border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Level</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Level Name</Label>
                <Input
                  value={levelForm.level_name}
                  onChange={(e) => setLevelForm(prev => ({ ...prev, level_name: e.target.value }))}
                  className="bg-white/5 border-white/20 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Level Number</Label>
                  <Input
                    type="number"
                    value={levelForm.level_number}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, level_number: parseInt(e.target.value) || 0 }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label>Point Limit</Label>
                  <Input
                    type="number"
                    value={levelForm.point_limit}
                    onChange={(e) => setLevelForm(prev => ({ ...prev, point_limit: parseInt(e.target.value) || 0 }))}
                    className="bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label>Challenge (Optional)</Label>
                <Select value={levelForm.challenge_id} onValueChange={(value) => setLevelForm(prev => ({ ...prev, challenge_id: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Challenge</SelectItem>
                    {challenges.map(challenge => (
                      <SelectItem key={challenge.id} value={challenge.id}>
                        {challenge.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={levelForm.status} onValueChange={(value: 'draft' | 'published') => setLevelForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="published">Published</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button onClick={updateLevel} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Update
                </Button>
                <Button variant="outline" onClick={() => setIsEditLevelOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Figures Dialog */}
        <Dialog open={isEditFiguresOpen} onOpenChange={setIsEditFiguresOpen}>
          <DialogContent className="bg-black border-white/10 text-white max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Edit Figures for {selectedLevel?.level_name}
              </DialogTitle>
            </DialogHeader>
            
            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-4 border-b border-white/10">
              <div>
                <Label>Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search figures..."
                    className="pl-10 bg-white/5 border-white/20 text-white"
                  />
                </div>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Difficulties</SelectItem>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-white/5 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Sport Only</SelectItem>
                    <SelectItem value="all">All Categories</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Figure Selection */}
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFigures.length} figures
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                {getSportFigures().map((figure) => (
                  <div
                    key={figure.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <Checkbox
                      checked={selectedFigures.includes(figure.id)}
                      onCheckedChange={() => handleFigureToggle(figure.id)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-white">{figure.name}</h4>
                        <Badge className="bg-blue-500/20 text-blue-400 border-blue-400/30 text-xs">
                          {figure.difficulty_level}
                        </Badge>
                        {figure.category === 'core' && figure.hold_time_seconds && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-400/30 text-xs flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {figure.hold_time_seconds}s
                          </Badge>
                        )}
                      </div>
                      {figure.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {figure.description}
                        </p>
                      )}
                      {figure.category === 'core' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditHoldTime(figure)}
                          className="text-orange-400 hover:bg-orange-400/10 p-1 mt-2"
                        >
                          <Clock className="w-3 h-3 mr-1" />
                          Edit Hold Time
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={saveLevelFigures} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                Save Figures
              </Button>
              <Button variant="outline" onClick={() => setIsEditFiguresOpen(false)}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Hold Time Dialog */}
        <Dialog open={isEditHoldTimeOpen} onOpenChange={setIsEditHoldTimeOpen}>
          <DialogContent className="bg-black border-white/10 text-white max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Hold Time</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Figure: {editingFigure?.name}</Label>
              </div>
              <div>
                <Label>Hold Time (seconds)</Label>
                <Input
                  type="number"
                  value={editHoldTime}
                  onChange={(e) => setEditHoldTime(parseInt(e.target.value) || 0)}
                  placeholder="Enter hold time in seconds"
                  className="bg-white/5 border-white/20 text-white"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Set to 0 to remove hold time requirement
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveHoldTime} className="bg-green-600 hover:bg-green-700">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" onClick={() => setIsEditHoldTimeOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default SportAdminPanel;