import React, { useState, useEffect } from "react";
import {
  Search,
  Filter,
  CheckCircle,
  Play,
  Plus,
  Edit,
  Trash2,
  X,
  Bookmark,
  AlertCircle,
  CircleMinus,
  Crown,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateExerciseModal } from "@/components/CreateExerciseModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";

import { PricingModal } from "@/components/PricingModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";

const Library = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { isPremium, isTrainer, isAdmin, isLoading: roleLoading } = useUserRole();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [showCreateExercise, setShowCreateExercise] = useState(false);
  const [editingFigure, setEditingFigure] = useState(null);
  const [figures, setFigures] = useState([]);
  const [figuresWithProgress, setFiguresWithProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    figure: null,
  });
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [showFigureSearch, setShowFigureSearch] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const categories = ["all", "silks", "hoop", "pole", "straps"];
  const levels = ["all", "beginner", "intermediate", "advanced", "expert"];
  const types = ["all", "single_figure", "combo"];
  const statuses = ["all", "completed", "for_later", "failed", "not_tried"];

  // Fetch figures from database
  const fetchFigures = async () => {
    try {
      setLoading(true);
      const { data: figuresData, error } = await supabase
        .from("figures")
        .select(
          `
          *,
          profiles!figures_created_by_fkey (
            username
          )
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      setFigures(figuresData || []);

      // Fetch progress for current user if logged in
      if (user && figuresData) {
        const { data: progressData } = await supabase
          .from("figure_progress")
          .select("figure_id, status")
          .eq("user_id", user.id);

        const progressMap = new Map(
          progressData?.map((p) => [p.figure_id, p.status]) || []
        );
        const figuresWithProgressData = figuresData.map((figure) => ({
          ...figure,
          progress_status: progressMap.get(figure.id) || "not_tried",
        }));
        setFiguresWithProgress(figuresWithProgressData);
      } else {
        setFiguresWithProgress(
          figuresData?.map((figure) => ({
            ...figure,
            progress_status: "not_tried",
          })) || []
        );
      }

      // Extract unique tags for filtering
      const allTags = figuresData?.flatMap((figure) => figure.tags || []) || [];
      const uniqueTags = [...new Set(allTags)].sort();
      setAvailableTags(uniqueTags);
    } catch (error) {
      console.error("Error fetching figures:", error);
      toast({
        title: "Error",
        description: "Failed to load exercises",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete figure
  const deleteFigure = async (figureId: string) => {
    try {
      const { error } = await supabase
        .from("figures")
        .delete()
        .eq("id", figureId);
      if (error) throw error;
      toast({
        title: "Success",
        description: "Exercise deleted successfully",
      });
      fetchFigures();
      setDeleteModal({ isOpen: false, figure: null });
    } catch (error: any) {
      console.error("Error deleting figure:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete exercise",
        variant: "destructive",
      });
    }
  };

  // Check if user can edit/delete a figure
  const canModifyFigure = (figure: any) => {
    if (!user) return false;
    return (
      user.role === "admin" ||
      user.role === "trainer" ||
      figure.created_by === user.id
    );
  };

  useEffect(() => {
    fetchFigures();
  }, [user]);

  const filteredFigures = figuresWithProgress.filter((figure) => {
    const matchesSearch = figure.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategories.length === 0 ||
      selectedCategories.includes("all") ||
      (figure.category && selectedCategories.includes(figure.category.toLowerCase()));
    const matchesLevel =
      selectedLevels.length === 0 ||
      selectedLevels.includes("all") ||
      (figure.difficulty_level &&
        selectedLevels.includes(figure.difficulty_level.toLowerCase()));
    const matchesType =
      selectedTypes.length === 0 ||
      selectedTypes.includes("all") ||
      (figure.type && selectedTypes.includes(figure.type));
    const matchesTags =
      selectedTags.length === 0 ||
      selectedTags.some((tag) => figure.tags?.includes(tag));
    const matchesStatus =
      selectedStatuses.length === 0 ||
      selectedStatuses.includes("all") ||
      selectedStatuses.includes(figure.progress_status);
    return (
      matchesSearch &&
      matchesCategory &&
      matchesLevel &&
      matchesType &&
      matchesTags &&
      matchesStatus
    );
  });

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Beginner":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Intermediate":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "Advanced":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "Expert":
        return "bg-purple-500/20 text-purple-400 border-purple-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case "for_later":
        return <Bookmark className="w-4 h-4 text-blue-400" />;
      case "failed":
        return <AlertCircle className="w-4 h-4 text-red-400" />;
      default:
        return null;
    }
  };

  if (loading || roleLoading) {
    return (
      <div className="min-h-screen p-6 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const hasFullAccess = isPremium || isTrainer || isAdmin;

  const handleFigureClick = (figure: any) => {
    // Check if figure is locked for free users
    if (!hasFullAccess && figure.difficulty_level?.toLowerCase() !== 'beginner') {
      setShowPricingModal(true);
      return;
    }
    
    navigate(`/exercise/${figure.id}`);
  };

  const handleViewDetails = (e: React.MouseEvent, figure: any) => {
    e.stopPropagation();
    
    // Check if figure is locked for free users
    if (!hasFullAccess && figure.difficulty_level?.toLowerCase() !== 'beginner') {
      setShowPricingModal(true);
      return;
    }
    
    navigate(`/exercise/${figure.id}`);
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
                Exercise Library
              </h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Discover and master aerial exercises
              </p>
            </div>
            {(user?.role === "trainer" || user?.role === "admin") && (
              <Button
                onClick={() => setShowCreateExercise(true)}
                variant="primary"
                className="w-full sm:w-auto"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Exercise
              </Button>
            )}
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Search exercises..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {/* Category Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between">
                  <span>Categories ({selectedCategories.length})</span>
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-categories"
                      checked={selectedCategories.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedCategories(["all"]);
                        } else {
                          setSelectedCategories([]);
                        }
                      }}
                    />
                    <label htmlFor="all-categories" className="text-white">All Categories</label>
                  </div>
                  {categories.slice(1).map((category) => (
                    <div key={category} className="flex items-center space-x-2">
                      <Checkbox
                        id={category}
                        checked={selectedCategories.includes(category)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedCategories(prev => [...prev.filter(c => c !== "all"), category]);
                          } else {
                            setSelectedCategories(prev => prev.filter(c => c !== category));
                          }
                        }}
                      />
                      <label htmlFor={category} className="text-white capitalize">{category}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Level Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between">
                  <span>Difficulty ({selectedLevels.length})</span>
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-levels"
                      checked={selectedLevels.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedLevels(["all"]);
                        } else {
                          setSelectedLevels([]);
                        }
                      }}
                    />
                    <label htmlFor="all-levels" className="text-white">All Difficulties</label>
                  </div>
                  {levels.slice(1).map((level) => (
                    <div key={level} className="flex items-center space-x-2">
                      <Checkbox
                        id={level}
                        checked={selectedLevels.includes(level)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedLevels(prev => [...prev.filter(l => l !== "all"), level]);
                          } else {
                            setSelectedLevels(prev => prev.filter(l => l !== level));
                          }
                        }}
                      />
                      <label htmlFor={level} className="text-white capitalize">{level}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Type Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between">
                  <span>Types ({selectedTypes.length})</span>
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-types"
                      checked={selectedTypes.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedTypes(["all"]);
                        } else {
                          setSelectedTypes([]);
                        }
                      }}
                    />
                    <label htmlFor="all-types" className="text-white">All Types</label>
                  </div>
                  {types.slice(1).map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={type}
                        checked={selectedTypes.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedTypes(prev => [...prev.filter(t => t !== "all"), type]);
                          } else {
                            setSelectedTypes(prev => prev.filter(t => t !== type));
                          }
                        }}
                      />
                      <label htmlFor={type} className="text-white capitalize">{type.replace('_', ' ')}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Status Filter */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between">
                  <span>Status ({selectedStatuses.length})</span>
                  <Filter className="w-4 h-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="all-statuses"
                      checked={selectedStatuses.includes("all")}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStatuses(["all"]);
                        } else {
                          setSelectedStatuses([]);
                        }
                      }}
                    />
                    <label htmlFor="all-statuses" className="text-white">All Statuses</label>
                  </div>
                  {statuses.slice(1).map((status) => (
                    <div key={status} className="flex items-center space-x-2">
                      <Checkbox
                        id={status}
                        checked={selectedStatuses.includes(status)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedStatuses(prev => [...prev.filter(s => s !== "all"), status]);
                          } else {
                            setSelectedStatuses(prev => prev.filter(s => s !== status));
                          }
                        }}
                      />
                      <label htmlFor={status} className="text-white capitalize">{status.replace('_', ' ')}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Figures Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading && <div className="text-center py-8">Loading...</div>}
          {!loading && filteredFigures.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No exercises found matching your criteria.
            </p>
          ) : (
            filteredFigures.map((figure) => {
              const isLocked = !hasFullAccess && figure.difficulty_level?.toLowerCase() !== 'beginner';
              
              return (
                <Card
                  key={figure.id}
                  className={`glass-effect border-white/10 hover-lift group overflow-hidden cursor-pointer relative ${
                    isLocked ? 'opacity-75' : ''
                  }`}
                  onClick={() => handleFigureClick(figure)}
                >
                  <div className="relative overflow-hidden">
                    <div className="w-full h-56 md:h-64 overflow-hidden">
                      <img
                        src={
                          figure.image_url ||
                          "https://images.unsplash.com/photo-1518594023387-5565c8f3d1ce?w=400&h=400&fit=crop"
                        }
                        alt={figure.name}
                        className={`w-full h-full object-cover group-hover:scale-110 transition-transform duration-300 ${
                          isLocked ? 'filter grayscale' : ''
                        }`}
                      />
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent group-hover:scale-110 transition-transform duration-300" />
                    
                    {isLocked && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-black/80 rounded-full p-3">
                          <Crown className="w-8 h-8 text-yellow-400" />
                        </div>
                      </div>
                    )}
                  </div>

                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-white text-lg">
                      {figure.name}
                    </h3>
                    {figure.difficulty_level && (
                      <Badge
                        className={`text-xs ${getDifficultyColor(
                          figure.difficulty_level
                        )}`}
                      >
                        {figure.difficulty_level}
                      </Badge>
                    )}
                  </div>

                  {figure.description && (
                    <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                      {figure.description}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-2 mb-4">
                    {getStatusIcon(figure.progress_status)}
                    <span className="text-sm text-muted-foreground capitalize">
                      {figure.progress_status.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-col space-y-1">
                    </div>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={(e) => handleViewDetails(e, figure)}
                      className={isLocked ? 'opacity-75' : ''}
                    >
                      {isLocked ? (
                        <>
                          <Crown className="w-4 h-4 mr-1" />
                          Premium
                        </>
                      ) : (
                        "View Details"
                      )}
                    </Button>
                  </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>


        {/* Create Exercise Modal */}
        <CreateExerciseModal
          isOpen={showCreateExercise}
          onClose={() => {
            setShowCreateExercise(false);
            setEditingFigure(null);
          }}
          onExerciseCreated={() => {
            fetchFigures();
            setEditingFigure(null);
          }}
          editingFigure={editingFigure}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDeleteModal
          isOpen={deleteModal.isOpen}
          onClose={() => setDeleteModal({ isOpen: false, figure: null })}
          onConfirm={() => deleteFigure(deleteModal.figure?.id)}
          title="Delete Exercise"
          description={`Are you sure you want to delete "${deleteModal.figure?.name}"? This action cannot be undone.`}
        />

        {/* Pricing Modal */}
        <PricingModal
          isOpen={showPricingModal}
          onClose={() => setShowPricingModal(false)}
          onUpgrade={() => setShowPricingModal(false)}
        />
      </div>
    </div>
  );
};

export default Library;
