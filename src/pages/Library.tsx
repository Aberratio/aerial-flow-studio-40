import React, { useState, useEffect } from 'react';
import { Search, Filter, CheckCircle, Play, Plus, Edit, Trash2, X, Bookmark, AlertCircle, CircleMinus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FigurePreviewModal } from '@/components/FigurePreviewModal';
import { CreateExerciseModal } from '@/components/CreateExerciseModal';
import { ConfirmDeleteModal } from '@/components/ConfirmDeleteModal';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
const Library = () => {
  const {
    user
  } = useAuth();
  const { t } = useLanguage();
  const {
    toast
  } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedFigure, setSelectedFigure] = useState(null);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [editingFigure, setEditingFigure] = useState(null);
  const [figures, setFigures] = useState([]);
  const [figuresWithProgress, setFiguresWithProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    figure: null
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFigureSearch, setShowFigureSearch] = useState(false);
  const categories = ['all', 'silks', 'hoop', 'pole', 'straps'];
  const levels = ['all', 'beginner', 'intermediate', 'advanced', 'expert'];
  const types = ['all', 'single_figure', 'combo'];
  const statuses = ['all', 'completed', 'for_later', 'failed', 'not_tried'];

  // Fetch figures from database
  const fetchFigures = async () => {
    try {
      setLoading(true);
      const {
        data: figuresData,
        error
      } = await supabase.from('figures').select(`
          *,
          profiles!figures_created_by_fkey (
            username
          )
        `).order('created_at', {
        ascending: false
      });
      if (error) throw error;
      setFigures(figuresData || []);

      // Fetch progress for current user if logged in
      if (user && figuresData) {
        const {
          data: progressData
        } = await supabase.from('figure_progress').select('figure_id, status').eq('user_id', user.id);
        const progressMap = new Map(progressData?.map(p => [p.figure_id, p.status]) || []);
        const figuresWithProgressData = figuresData.map(figure => ({
          ...figure,
          progress_status: progressMap.get(figure.id) || 'not_tried'
        }));
        setFiguresWithProgress(figuresWithProgressData);
      } else {
        setFiguresWithProgress(figuresData?.map(figure => ({
          ...figure,
          progress_status: 'not_tried'
        })) || []);
      }

      // Extract unique tags for filtering
      const allTags = figuresData?.flatMap(figure => figure.tags || []) || [];
      const uniqueTags = [...new Set(allTags)].sort();
      setAvailableTags(uniqueTags);
    } catch (error) {
      console.error('Error fetching figures:', error);
      toast({
        title: "Error",
        description: t('library.error_load'),
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete figure
  const deleteFigure = async (figureId: string) => {
    try {
      const {
        error
      } = await supabase.from('figures').delete().eq('id', figureId);
      if (error) throw error;
      toast({
        title: "Success",
        description: t('library.success_deleted')
      });
      fetchFigures();
      setDeleteModal({
        isOpen: false,
        figure: null
      });
    } catch (error: any) {
      console.error('Error deleting figure:', error);
      toast({
        title: "Error",
        description: error.message || t('library.error_delete'),
        variant: "destructive"
      });
    }
  };

  // Check if user can edit/delete a figure
  const canModifyFigure = (figure: any) => {
    if (!user) return false;
    return user.role === 'admin' || user.role === 'trainer' || figure.created_by === user.id;
  };
  useEffect(() => {
    fetchFigures();
  }, [user]);
  const filteredFigures = figuresWithProgress.filter(figure => {
    const matchesSearch = figure.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || figure.category && figure.category.toLowerCase() === selectedCategory;
    const matchesLevel = selectedLevel === 'all' || figure.difficulty_level && figure.difficulty_level.toLowerCase() === selectedLevel;
    const matchesType = selectedType === 'all' || figure.type && figure.type === selectedType;
    const matchesTags = selectedTags.length === 0 || selectedTags.some(tag => figure.tags?.includes(tag));
    const matchesStatus = selectedStatus === 'all' || figure.progress_status === selectedStatus;
    return matchesSearch && matchesCategory && matchesLevel && matchesType && matchesTags && matchesStatus;
  });
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'Intermediate':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'Advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'Expert':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'for_later':
        return <Bookmark className="w-4 h-4 text-blue-400" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };
  if (loading) {
    return <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">{t('library.loading')}</div>
      </div>;
  }
  return <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2 my-[32px]">{t('library.title')}</h1>
              <p className="text-muted-foreground">{t('library.subtitle')}</p>
            </div>
            {(user?.role === 'trainer' || user?.role === 'admin') && <Button onClick={() => setShowCreateExercise(true)} className="bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600">
                <Plus className="w-4 h-4 mr-2" />
                {t('library.add_exercise')}
              </Button>}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input type="text" placeholder={t('library.search_placeholder')} value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60" />
          </div>
          
          <div className="sm:hidden">
            <Button variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 mb-4" onClick={() => setShowFigureSearch(!showFigureSearch)}>
              <Filter className="w-4 h-4 mr-2" />
              {t('library.filters')}
            </Button>
          </div>
          
          <div className={`space-y-3 ${showFigureSearch ? 'block' : 'hidden sm:block'}`}>
            {/* Category Filter */}
            <div>
              <p className="text-white text-sm font-medium mb-2">{t('library.category')}</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => <Button key={category} variant={selectedCategory === category ? "default" : "outline"} size="sm" onClick={() => setSelectedCategory(category)} className={selectedCategory === category ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" : "border-white/20 text-white hover:bg-white/10"}>
                    {t(`exercises.category.${category}`)}
                  </Button>)}
              </div>
            </div>

            {/* Level Filter */}
            <div>
              <p className="text-white text-sm font-medium mb-2">{t('library.level')}</p>
              <div className="flex flex-wrap gap-2">
                {levels.map(level => <Button key={level} variant={selectedLevel === level ? "default" : "outline"} size="sm" onClick={() => setSelectedLevel(level)} className={selectedLevel === level ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" : "border-white/20 text-white hover:bg-white/10"}>
                    {t(`exercises.difficulty.${level}`)}
                  </Button>)}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <p className="text-white text-sm font-medium mb-2">{t('library.type')}</p>
              <div className="flex flex-wrap gap-2">
                {types.map(type => <Button key={type} variant={selectedType === type ? "default" : "outline"} size="sm" onClick={() => setSelectedType(type)} className={selectedType === type ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" : "border-white/20 text-white hover:bg-white/10"}>
                    {t(`exercises.type.${type}`)}
                  </Button>)}
              </div>
            </div>

            {/* Tags Filter */}
            {availableTags.length > 0 && <div>
                <p className="text-white text-sm font-medium mb-2">{t('library.tags')}</p>
                <div className="flex flex-wrap gap-2">
                  {availableTags.map(tag => <Button key={tag} variant={selectedTags.includes(tag) ? "default" : "outline"} size="sm" onClick={() => {
                if (selectedTags.includes(tag)) {
                  setSelectedTags(selectedTags.filter(t => t !== tag));
                } else {
                  setSelectedTags([...selectedTags, tag]);
                }
              }} className={selectedTags.includes(tag) ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" : "border-white/20 text-white hover:bg-white/10"}>
                      {tag}
                      {selectedTags.includes(tag) && <X className="w-3 h-3 ml-1" />}
                    </Button>)}
                </div>
              </div>}

            {/* Status Filter */}
            {user && <div>
                <p className="text-white text-sm font-medium mb-2">{t('library.progress_status')}</p>
                <div className="flex flex-wrap gap-2">
                  {statuses.map(status => <Button key={status} variant={selectedStatus === status ? "default" : "outline"} size="sm" onClick={() => setSelectedStatus(status)} className={selectedStatus === status ? "bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500" : "border-white/20 text-white hover:bg-white/10"}>
                      {t(`exercises.status.${status}`)}
                    </Button>)}
                </div>
              </div>}
          </div>
        </div>

        {/* Figures Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredFigures.length === 0 ? <div className="col-span-full text-center py-12 text-muted-foreground">
              {t('library.no_exercises')}
            </div> : filteredFigures.map(figure => <Card key={figure.id} className="glass-effect border-white/10 hover-lift group overflow-hidden cursor-pointer relative" onClick={() => setSelectedFigure(figure)}>
                {/* Action buttons for owners/admins */}
                {canModifyFigure(figure) && <div className="absolute top-2 right-2 z-10 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button size="sm" variant="outline" className="w-8 h-8 p-0 bg-black/50 border-white/20 hover:bg-black/70" onClick={e => {
              e.stopPropagation();
              setEditingFigure(figure);
              setShowCreateExercise(true);
            }}>
                      <Edit className="w-3 h-3 text-white" />
                    </Button>
                    <Button size="sm" variant="outline" className="w-8 h-8 p-0 bg-black/50 border-red-500/20 hover:bg-red-500/20" onClick={e => {
              e.stopPropagation();
              setDeleteModal({
                isOpen: true,
                figure
              });
            }}>
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </Button>
                  </div>}

                <div className="relative">
                  <img src={figure.image_url || 'https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=300&h=300&fit=crop'} alt={figure.name} className="w-full h-48 object-cover group-hover:scale-110 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  
                  {/* Status Icon */}
                  {user && figure.progress_status && figure.progress_status !== 'not_tried' && <div className="absolute top-2 left-2 z-10">
                      <div className="w-8 h-8 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center">
                        {getStatusIcon(figure.progress_status)}
                      </div>
                    </div>}
                  
                  {/* Play Button - Only show for videos */}
                  {figure.video_url && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                        <Play className="w-8 h-8 text-white" />
                      </div>
                    </div>}
                </div>
                
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-lg">{figure.name}</h3>
                    {figure.difficulty_level && <Badge className={`text-xs ${getDifficultyColor(figure.difficulty_level)}`}>
                        {figure.difficulty_level}
                      </Badge>}
                  </div>
                  
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {figure.description || t('library.no_description')}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                      {figure.profiles?.username && <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                          by {figure.profiles.username}
                        </Badge>}
                      {figure.tags && figure.tags.length > 0 && <div className="flex flex-wrap gap-1">
                          {figure.tags.slice(0, 2).map((tag, index) => <Badge key={index} variant="outline" className="border-purple-500/30 text-purple-300 text-xs">
                              {tag}
                            </Badge>)}
                          {figure.tags.length > 2 && <Badge variant="outline" className="border-white/20 text-white/60 text-xs">
                              +{figure.tags.length - 2}
                            </Badge>}
                        </div>}
                    </div>
                    <Button size="sm" variant="ghost" className="text-purple-400 hover:text-purple-300" onClick={e => {
                e.stopPropagation();
                setSelectedFigure(figure);
              }}>
                      {t('library.view_details')}
                    </Button>
                  </div>
                </CardContent>
              </Card>)}
        </div>
      </div>

      <FigurePreviewModal figure={selectedFigure} isOpen={!!selectedFigure} onClose={() => setSelectedFigure(null)} />

      <CreateExerciseModal isOpen={showCreateExercise} onClose={() => {
      setShowCreateExercise(false);
      setEditingFigure(null);
    }} editingFigure={editingFigure} onExerciseCreated={() => {
      fetchFigures();
      toast({
        title: "Success",
        description: editingFigure ? "Exercise updated successfully!" : "Exercise added successfully!"
      });
    }} />

      <ConfirmDeleteModal isOpen={deleteModal.isOpen} onClose={() => setDeleteModal({
      isOpen: false,
      figure: null
    })} onConfirm={() => deleteModal.figure && deleteFigure(deleteModal.figure.id)} title={t('library.delete_exercise')} description={t('library.delete_confirm').replace('{name}', deleteModal.figure?.name || '')} />
    </div>;
};
export default Library;