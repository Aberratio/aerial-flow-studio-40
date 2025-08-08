import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Save, X, Users, Search, Filter } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface SportLevel {
  id: string;
  sport_category: string;
  level_number: number;
  level_name: string;
  point_limit: number;
  created_at: string;
  figure_count: number;
  challenge_id?: string;
}

interface Challenge {
  id: string;
  title: string;
  description: string;
  difficulty_level: string;
  status: string;
  premium: boolean;
}

interface Figure {
  id: string;
  name: string;
  description: string;
  difficulty_level: string;
  category: string;
  image_url: string;
}

interface LevelFigure {
  id: string;
  level_id: string;
  figure_id: string;
  order_index: number;
  figure: Figure;
}

interface SportLevelManagerProps {
  onClose: () => void;
}

const SPORT_CATEGORIES = [
  { value: 'hoop', label: 'Aerial Hoop' },
  { value: 'pole', label: 'Pole Dancing' },
  { value: 'silks', label: 'Aerial Silks' },
  { value: 'hammock', label: 'Aerial Hammock' },
  { value: 'core', label: 'Core Training' }
];

const SportLevelManager = ({ onClose }: SportLevelManagerProps) => {
  const { user } = useAuth();
  const [levels, setLevels] = useState<SportLevel[]>([]);
  const [figures, setFigures] = useState<Figure[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedSport, setSelectedSport] = useState<string>('');
  const [isCreateLevelOpen, setIsCreateLevelOpen] = useState(false);
  const [isEditFiguresOpen, setIsEditFiguresOpen] = useState(false);
  const [isEditLevelOpen, setIsEditLevelOpen] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<SportLevel | null>(null);
  const [levelFigures, setLevelFigures] = useState<LevelFigure[]>([]);
  const [loading, setLoading] = useState(false);

  // Form states
  const [levelName, setLevelName] = useState('');
  const [levelNumber, setLevelNumber] = useState<number>(0);
  const [pointLimit, setPointLimit] = useState<number>(0);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [selectedFigures, setSelectedFigures] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('current');
  const [usedFiguresInSport, setUsedFiguresInSport] = useState<string[]>([]);
  
  // Edit level states
  const [editLevelName, setEditLevelName] = useState('');
  const [editLevelNumber, setEditLevelNumber] = useState<number>(0);
  const [editPointLimit, setEditPointLimit] = useState<number>(0);
  const [editSelectedChallenge, setEditSelectedChallenge] = useState<string>('');

  useEffect(() => {
    if (user?.role !== 'admin') {
      toast.error('Access denied. Admin role required.');
      onClose();
      return;
    }
    
    fetchFigures();
    fetchChallenges();
    if (selectedSport) {
      fetchLevelsForSport();
      fetchUsedFiguresInSport();
    }
  }, [user, selectedSport]);

  const fetchFigures = async () => {
    try {
      const { data, error } = await supabase
        .from('figures')
        .select('id, name, description, difficulty_level, category, image_url')
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

  const fetchLevelsForSport = async () => {
    try {
      setLoading(true);
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
        .eq('sport_category', selectedSport)
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
          figure_count: count || 0
        };
      }));

      setLevels(levelsWithCount);
    } catch (error) {
      console.error('Error fetching levels:', error);
      toast.error('Failed to fetch levels');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsedFiguresInSport = async () => {
    try {
      // First get all level IDs for the current sport
      const { data: levelIds, error: levelError } = await supabase
        .from('sport_levels')
        .select('id')
        .eq('sport_category', selectedSport);

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
            image_url
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

  const createLevel = async () => {
    if (!user || !selectedSport || !levelName.trim()) return;

    try {
      const { error } = await supabase
        .from('sport_levels')
        .insert({
          sport_category: selectedSport,
          level_number: levelNumber,
          level_name: levelName.trim(),
          point_limit: pointLimit,
          challenge_id: selectedChallenge || null,
          created_by: user.id
        });

      if (error) throw error;

      toast.success('Level created successfully');
      setIsCreateLevelOpen(false);
      setLevelName('');
      setLevelNumber(0);
      setPointLimit(0);
      setSelectedChallenge('');
      fetchLevelsForSport();
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
      fetchLevelsForSport();
    } catch (error) {
      console.error('Error deleting level:', error);
      toast.error('Failed to delete level');
    }
  };

  const openEditLevel = (level: SportLevel) => {
    setSelectedLevel(level);
    setEditLevelName(level.level_name);
    setEditLevelNumber(level.level_number);
    setEditPointLimit(level.point_limit);
    setEditSelectedChallenge(level.challenge_id || '');
    setIsEditLevelOpen(true);
  };

  const updateLevel = async () => {
    if (!selectedLevel || !editLevelName.trim()) return;

    try {
      const { error } = await supabase
        .from('sport_levels')
        .update({
          level_name: editLevelName.trim(),
          level_number: editLevelNumber,
          point_limit: editPointLimit,
          challenge_id: editSelectedChallenge || null
        })
        .eq('id', selectedLevel.id);

      if (error) throw error;

      toast.success('Level updated successfully');
      setIsEditLevelOpen(false);
      fetchLevelsForSport();
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
      fetchLevelsForSport();
      fetchUsedFiguresInSport();
    } catch (error) {
      console.error('Error saving level figures:', error);
      toast.error('Failed to save level figures');
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
        (categoryFilter === 'current' && figure.category === selectedSport) ||
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
    if (levels.length === 0) return 0;
    return Math.max(...levels.map(l => l.level_number)) + 1;
  };

  const getAvailableCategories = () => {
    const categories = [...new Set(figures.map(f => f.category))].filter(Boolean);
    return categories.map(cat => SPORT_CATEGORIES.find(sc => sc.value === cat) || { value: cat, label: cat });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Sport Level Manager</h2>
        <Button onClick={onClose} variant="ghost" className="text-white">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Sport Selection as Panels */}
      <Card className="glass-effect border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Select Sport Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {SPORT_CATEGORIES.map(category => (
              <div
                key={category.value}
                onClick={() => setSelectedSport(category.value)}
                className={`
                  p-6 rounded-lg border cursor-pointer transition-all duration-200
                  ${selectedSport === category.value 
                    ? 'bg-primary/20 border-primary text-primary' 
                    : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }
                `}
              >
                <h3 className="font-semibold text-lg mb-2">{category.label}</h3>
                <p className="text-sm opacity-70">
                  Manage levels and figures for {category.label.toLowerCase()}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedSport && (
        <Card className="glass-effect border-white/10">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-white">
                Levels for {SPORT_CATEGORIES.find(c => c.value === selectedSport)?.label}
              </CardTitle>
              <Dialog open={isCreateLevelOpen} onOpenChange={setIsCreateLevelOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Level
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-900 border-white/10">
                  <DialogHeader>
                    <DialogTitle className="text-white">Create New Level</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="levelNumber" className="text-white">Level Number</Label>
                      <Input
                        id="levelNumber"
                        type="number"
                        value={levelNumber}
                        onChange={(e) => setLevelNumber(parseInt(e.target.value) || 0)}
                        placeholder={`Next: ${getNextLevelNumber()}`}
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="pointLimit" className="text-white">Point Limit</Label>
                      <Input
                        id="pointLimit"
                        type="number"
                        value={pointLimit}
                        onChange={(e) => setPointLimit(parseInt(e.target.value) || 0)}
                        placeholder="Points required to unlock"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="levelName" className="text-white">Level Name</Label>
                      <Input
                        id="levelName"
                        value={levelName}
                        onChange={(e) => setLevelName(e.target.value)}
                        placeholder="e.g., Beginner, Intermediate, Advanced"
                        className="bg-white/5 border-white/10 text-white"
                      />
                    </div>
                    <div>
                      <Label htmlFor="selectedChallenge" className="text-white">Associated Challenge (Optional)</Label>
                      <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                        <SelectTrigger className="bg-white/5 border-white/10 text-white">
                          <SelectValue placeholder="Select a challenge" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-900 border-white/10">
                          <SelectItem value="">No Challenge</SelectItem>
                          {challenges.map((challenge) => (
                            <SelectItem key={challenge.id} value={challenge.id}>
                              <div className="flex items-center gap-2">
                                <span>{challenge.title}</span>
                                {challenge.premium && <Badge variant="secondary" className="text-xs">Premium</Badge>}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={createLevel} className="flex-1">
                        <Save className="w-4 h-4 mr-2" />
                        Create Level
                      </Button>
                      <Button 
                        onClick={() => setIsCreateLevelOpen(false)} 
                        variant="outline"
                        className="border-white/10"
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : levels.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">
                No levels created yet. Add your first level to get started.
              </p>
            ) : (
              <div className="space-y-4">
                {levels.map((level) => (
                  <div
                    key={level.id}
                    className="flex items-center justify-between p-6 rounded-lg bg-gradient-to-r from-white/5 to-white/10 border border-white/20 hover:border-white/30 transition-all duration-200"
                  >
                    <div className="flex items-center space-x-4">
                      <Badge variant="secondary" className="text-lg font-bold bg-primary/20 text-primary">
                        Level {level.level_number}
                      </Badge>
                      <div>
                        <h4 className="font-semibold text-white text-lg">{level.level_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {level.figure_count} figures assigned
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-primary border-primary/50">
                        {level.point_limit} pts
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        onClick={() => openEditLevel(level)}
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-white hover:bg-white/10"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit Level
                      </Button>
                      <Button
                        onClick={() => openEditFigures(level)}
                        variant="outline"
                        size="sm"
                        className="border-white/10 text-white hover:bg-white/10"
                      >
                        <Users className="w-4 h-4 mr-1" />
                        Manage Figures ({level.figure_count})
                      </Button>
                      <Button
                        onClick={() => deleteLevel(level.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Level Dialog */}
      <Dialog open={isEditLevelOpen} onOpenChange={setIsEditLevelOpen}>
        <DialogContent className="bg-gray-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Level</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editLevelNumber" className="text-white">Level Number</Label>
              <Input
                id="editLevelNumber"
                type="number"
                value={editLevelNumber}
                onChange={(e) => setEditLevelNumber(parseInt(e.target.value) || 0)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="editPointLimit" className="text-white">Point Limit</Label>
              <Input
                id="editPointLimit"
                type="number"
                value={editPointLimit}
                onChange={(e) => setEditPointLimit(parseInt(e.target.value) || 0)}
                placeholder="Points required to unlock"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="editLevelName" className="text-white">Level Name</Label>
              <Input
                id="editLevelName"
                value={editLevelName}
                onChange={(e) => setEditLevelName(e.target.value)}
                placeholder="e.g., Beginner, Intermediate, Advanced"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="editSelectedChallenge" className="text-white">Associated Challenge (Optional)</Label>
              <Select value={editSelectedChallenge} onValueChange={setEditSelectedChallenge}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Select a challenge" />
                </SelectTrigger>
                <SelectContent className="bg-gray-900 border-white/10">
                  <SelectItem value="">No Challenge</SelectItem>
                  {challenges.map((challenge) => (
                    <SelectItem key={challenge.id} value={challenge.id}>
                      <div className="flex items-center gap-2">
                        <span>{challenge.title}</span>
                        {challenge.premium && <Badge variant="secondary" className="text-xs">Premium</Badge>}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <Button onClick={updateLevel} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Update Level
              </Button>
              <Button 
                onClick={() => setIsEditLevelOpen(false)} 
                variant="outline"
                className="border-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Figures Dialog */}
      <Dialog open={isEditFiguresOpen} onOpenChange={setIsEditFiguresOpen}>
        <DialogContent className="max-w-4xl bg-gray-900 border-white/10 max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              Assign Figures to {selectedLevel?.level_name} (Level {selectedLevel?.level_number})
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex-1">
                <Label className="text-white">Search Figures</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search by name or description..."
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>
              <div>
                <Label className="text-white">Sport Category</Label>
                <Select value={categoryFilter || undefined} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="current">Current Sport Only</SelectItem>
                    <SelectItem value="all">All Sports</SelectItem>
                    {getAvailableCategories().map(category => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-white">Difficulty</Label>
                <Select value={difficultyFilter || undefined} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue placeholder="All" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Levels</SelectItem>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-muted-foreground">
                Select figures for <span className="text-white font-medium">{selectedLevel?.level_name}</span>
              </p>
              <Badge variant="secondary" className="bg-purple-500/20 text-purple-300">
                {selectedFigures.length} selected of {getSportFigures().length} available
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto border border-white/10 rounded-lg p-4 bg-black/20">
              {getSportFigures().map((figure) => (
                <div
                  key={figure.id}
                  className={`group relative overflow-hidden rounded-lg border transition-all duration-300 cursor-pointer ${
                    selectedFigures.includes(figure.id)
                      ? 'border-purple-400 bg-purple-500/10 ring-2 ring-purple-400/30'
                      : 'border-white/20 bg-white/5 hover:border-purple-400/50 hover:bg-white/10'
                  }`}
                  onClick={() => handleFigureToggle(figure.id)}
                >
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedFigures.includes(figure.id)}
                        onCheckedChange={() => handleFigureToggle(figure.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 shrink-0"
                      />
                      
                      {figure.image_url && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-white/10 shrink-0">
                          <img 
                            src={figure.image_url} 
                            alt={figure.name}
                            className="w-full h-full object-cover transition-transform group-hover:scale-110"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      )}
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h4 className="font-semibold text-white text-sm leading-tight group-hover:text-purple-300 transition-colors">
                            {figure.name}
                          </h4>
                          {selectedFigures.includes(figure.id) && (
                            <div className="w-2 h-2 rounded-full bg-purple-400 shrink-0 mt-1" />
                          )}
                        </div>
                        
                        {figure.description && (
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2 leading-relaxed">
                            {figure.description}
                          </p>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant="outline" 
                            className={`text-xs px-2 py-1 ${
                              figure.difficulty_level === 'Beginner' ? 'border-green-400/50 text-green-300' :
                              figure.difficulty_level === 'Intermediate' ? 'border-yellow-400/50 text-yellow-300' :
                              'border-red-400/50 text-red-300'
                            }`}
                          >
                            {figure.difficulty_level}
                          </Badge>
                          
                          {figure.category !== selectedSport && (
                            <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-300 border-blue-400/30">
                              {SPORT_CATEGORIES.find(c => c.value === figure.category)?.label || figure.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {getSportFigures().length === 0 && (
                <div className="col-span-full text-center py-12">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground text-lg font-medium mb-2">No figures found</p>
                  <p className="text-muted-foreground text-sm">
                    Try adjusting your search criteria or filters
                  </p>
                </div>
              )}
            </div>
            
            <div className="flex gap-2 pt-4 border-t border-white/10">
              <Button onClick={saveLevelFigures} className="flex-1">
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
              <Button 
                onClick={() => setIsEditFiguresOpen(false)} 
                variant="outline"
                className="border-white/10"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SportLevelManager;