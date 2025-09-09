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
  ChevronDown,
  ChevronUp,
  Video,
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { CreateExerciseModal } from "@/components/CreateExerciseModal";
import { ConfirmDeleteModal } from "@/components/ConfirmDeleteModal";
import { PricingModal } from "@/components/PricingModal";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMobile } from "@/hooks/use-mobile";

const Library = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const {
    isPremium,
    isTrainer,
    isAdmin,
    isLoading: roleLoading,
  } = useUserRole();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedExperts, setSelectedExperts] = useState<string[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>(
    []
  );
  const [selectedVideoTypes, setSelectedVideoTypes] = useState<string[]>([]);
  const [extendedFiltersOpen, setExtendedFiltersOpen] = useState(false);
  const [filtersCollapsed, setFiltersCollapsed] = useState(isMobile);
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
  const [availableExperts, setAvailableExperts] = useState<
    { id: string; username: string }[]
  >([]);
  const [showFigureSearch, setShowFigureSearch] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  const EXERCISES_PER_PAGE = 40;

  const categories = ["all", "silks", "hoop", "pole", "hammock"];
  const levels = ["all", "beginner", "intermediate", "advanced", "expert"];
  const types = ["all", "single_figure", "combo"];
  const statuses = ["all", "completed", "for_later", "failed", "not_tried"];
  const contentTypes = ["all", "free", "premium"];
  const videoTypes = ["all", "with_video", "without_video"];

  // Fetch user profile to get sports preferences
  const fetchUserProfile = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("sports")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      setUserProfile(data);

      // Preselect categories based on user's sports
      if (data?.sports && data.sports.length > 0) {
        const userSports = data.sports.filter(
          (sport) => categories.includes(sport) && sport !== "all"
        );
        if (userSports.length > 0) {
          setSelectedCategories(userSports);
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    }
  };

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
          ),
          figure_experts (
            expert_user_id,
            profiles!figure_experts_expert_user_id_fkey (
              id,
              username
            )
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

      // Extract unique experts for filtering
      const allExperts =
        figuresData?.flatMap(
          (figure) =>
            figure.figure_experts?.map((expert) => expert.profiles) || []
        ) || [];
      const uniqueExperts = allExperts.filter(
        (expert, index, self) =>
          expert && self.findIndex((e) => e?.id === expert.id) === index
      );
      setAvailableExperts(uniqueExperts);
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
    fetchUserProfile();
    loadFiltersFromLocalStorage();
    loadSearchFromLocalStorage();
  }, [user]);

  // Save filters to localStorage whenever they change
  useEffect(() => {
    const filters = {
      selectedCategories,
      selectedLevels,
      selectedTypes,
      selectedTags,
      selectedStatuses,
      selectedExperts,
      selectedContentTypes,
      selectedVideoTypes,
      extendedFiltersOpen,
    };
    localStorage.setItem("libraryFilters", JSON.stringify(filters));
  }, [
    selectedCategories,
    selectedLevels,
    selectedTypes,
    selectedTags,
    selectedStatuses,
    selectedExperts,
    selectedContentTypes,
    selectedVideoTypes,
    extendedFiltersOpen,
  ]);

  // Save search term to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("librarySearchTerm", searchTerm);
  }, [searchTerm]);

  // Load filters from localStorage
  const loadFiltersFromLocalStorage = () => {
    try {
      const savedFilters = localStorage.getItem("libraryFilters");
      if (savedFilters) {
        const filters = JSON.parse(savedFilters);
        setSelectedCategories(filters.selectedCategories || []);
        setSelectedLevels(filters.selectedLevels || []);
        setSelectedTypes(filters.selectedTypes || []);
        setSelectedTags(filters.selectedTags || []);
        setSelectedStatuses(filters.selectedStatuses || []);
        setSelectedExperts(filters.selectedExperts || []);
        setSelectedContentTypes(filters.selectedContentTypes || []);
        setSelectedVideoTypes(filters.selectedVideoTypes || []);
        setExtendedFiltersOpen(filters.extendedFiltersOpen || false);
      }
    } catch (error) {
      console.error("Error loading filters from localStorage:", error);
    }
  };

  // Load search term from localStorage
  const loadSearchFromLocalStorage = () => {
    try {
      const savedSearchTerm = localStorage.getItem("librarySearchTerm");
      if (savedSearchTerm) {
        setSearchTerm(savedSearchTerm);
      }
    } catch (error) {
      console.error("Error loading search term from localStorage:", error);
    }
  };

  // Clear search term
  const clearSearchTerm = () => {
    setSearchTerm("");
    localStorage.removeItem("librarySearchTerm");
  };

  const filteredFigures = figuresWithProgress
    .filter((figure) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        figure.name.toLowerCase().includes(searchLower) ||
        (figure.synonyms &&
          figure.synonyms.some((synonym) =>
            synonym.toLowerCase().includes(searchLower)
          ));
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes("all") ||
        (figure.category &&
          selectedCategories.includes(figure.category.toLowerCase()));
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
      const matchesExpert =
        selectedExperts.length === 0 ||
        selectedExperts.includes("all") ||
        (selectedExperts.includes("no_expert") &&
          (!figure.figure_experts || figure.figure_experts.length === 0)) ||
        figure.figure_experts?.some((expert) =>
          selectedExperts.includes(expert.expert_user_id)
        );
      const matchesContentType =
        selectedContentTypes.length === 0 ||
        selectedContentTypes.includes("all") ||
        (selectedContentTypes.includes("free") && !figure.premium) ||
        (selectedContentTypes.includes("premium") && figure.premium);
      const matchesVideoType =
        selectedVideoTypes.length === 0 ||
        selectedVideoTypes.includes("all") ||
        (selectedVideoTypes.includes("with_video") && figure.video_url) ||
        (selectedVideoTypes.includes("without_video") && !figure.video_url);
      return (
        matchesSearch &&
        matchesCategory &&
        matchesLevel &&
        matchesType &&
        matchesTags &&
        matchesStatus &&
        matchesExpert &&
        matchesContentType &&
        matchesVideoType
      );
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  // Pagination logic
  const totalPages = Math.ceil(filteredFigures.length / EXERCISES_PER_PAGE);
  const startIndex = (currentPage - 1) * EXERCISES_PER_PAGE;
  const endIndex = startIndex + EXERCISES_PER_PAGE;
  const paginatedFigures = filteredFigures.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategories, selectedLevels, selectedTypes, selectedTags, selectedStatuses, selectedExperts, selectedContentTypes, selectedVideoTypes]);

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
    if (!hasFullAccess && figure.premium) {
      setShowPricingModal(true);
      return;
    }

    navigate(`/exercise/${figure.id}`);
  };

  const handleViewDetails = (e: React.MouseEvent, figure: any) => {
    e.stopPropagation();

    // Check if figure is locked for free users
    if (!hasFullAccess && figure.premium) {
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
              className="pl-10 pr-10 bg-white/5 border-white/10 text-white placeholder:text-white/60"
            />
            {searchTerm && (
              <Button
                onClick={clearSearchTerm}
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-white/10 text-muted-foreground hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            )}
          </div>

          {/* Filters Section */}
          <Collapsible open={isMobile ? !filtersCollapsed : true} onOpenChange={isMobile ? (open) => setFiltersCollapsed(!open) : undefined}>
            {isMobile && (
              <div className="border border-white/10 rounded-lg bg-white/5 mb-3">
                <CollapsibleTrigger asChild>
                  <div className="w-full p-4 cursor-pointer hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Filter className="w-5 h-5 text-white" />
                        <span className="text-white font-medium">Filters</span>
                      </div>
                      {filtersCollapsed ? <ChevronDown className="w-5 h-5 text-white" /> : <ChevronUp className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                </CollapsibleTrigger>
              </div>
            )}
            <CollapsibleContent>
              <div className={`grid gap-3 ${isMobile ? 'grid-cols-1' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4'}`}>
                {/* Category Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-9"
                    >
                      <span className="truncate">
                        {selectedCategories.length === 0
                          ? "Categories"
                          : selectedCategories.includes("all")
                          ? "All Categories"
                          : selectedCategories.length === 1
                          ? selectedCategories[0].charAt(0).toUpperCase() +
                            selectedCategories[0].slice(1)
                          : `${selectedCategories.length} Categories`}
                      </span>
                      <div className="flex items-center gap-1">
                        {selectedCategories.length > 0 &&
                          !selectedCategories.includes("all") && (
                            <span className="bg-purple-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                              {selectedCategories.length}
                            </span>
                          )}
                        <Filter className="w-3 h-3 ml-1" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-56">
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
                        <label
                          htmlFor="all-categories"
                          className="text-white font-medium"
                        >
                          All Categories
                        </label>
                      </div>
                      {categories.slice(1).map((category) => (
                        <div key={category} className="flex items-center space-x-2">
                          <Checkbox
                            id={category}
                            checked={selectedCategories.includes(category)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCategories((prev) => [
                                  ...prev.filter((c) => c !== "all"),
                                  category,
                                ]);
                              } else {
                                setSelectedCategories((prev) =>
                                  prev.filter((c) => c !== category)
                                );
                              }
                            }}
                          />
                          <label
                            htmlFor={category}
                            className="text-white capitalize"
                          >
                            {category}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Level Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-9"
                    >
                      <span className="truncate">
                        {selectedLevels.length === 0
                          ? "Difficulty"
                          : selectedLevels.includes("all")
                          ? "All Difficulties"
                          : selectedLevels.length === 1
                          ? selectedLevels[0].charAt(0).toUpperCase() +
                            selectedLevels[0].slice(1)
                          : `${selectedLevels.length} Difficulties`}
                      </span>
                      <div className="flex items-center gap-1">
                        {selectedLevels.length > 0 &&
                          !selectedLevels.includes("all") && (
                            <span className="bg-purple-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                              {selectedLevels.length}
                            </span>
                          )}
                        <Filter className="w-3 h-3 ml-1" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-56">
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
                        <label
                          htmlFor="all-levels"
                          className="text-white font-medium"
                        >
                          All Difficulties
                        </label>
                      </div>
                      {levels.slice(1).map((level) => (
                        <div key={level} className="flex items-center space-x-2">
                          <Checkbox
                            id={level}
                            checked={selectedLevels.includes(level)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedLevels((prev) => [
                                  ...prev.filter((l) => l !== "all"),
                                  level,
                                ]);
                              } else {
                                setSelectedLevels((prev) =>
                                  prev.filter((l) => l !== level)
                                );
                              }
                            }}
                          />
                          <label htmlFor={level} className="text-white capitalize">
                            {level}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Type Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-9"
                    >
                      <span className="truncate">
                        {selectedTypes.length === 0
                          ? "Types"
                          : selectedTypes.includes("all")
                          ? "All Types"
                          : selectedTypes.length === 1
                          ? selectedTypes[0]
                              .replace("_", " ")
                              .split(" ")
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(" ")
                          : `${selectedTypes.length} Types`}
                      </span>
                      <div className="flex items-center gap-1">
                        {selectedTypes.length > 0 &&
                          !selectedTypes.includes("all") && (
                            <span className="bg-purple-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                              {selectedTypes.length}
                            </span>
                          )}
                        <Filter className="w-3 h-3 ml-1" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-56">
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
                        <label
                          htmlFor="all-types"
                          className="text-white font-medium"
                        >
                          All Types
                        </label>
                      </div>
                      {types.slice(1).map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                          <Checkbox
                            id={type}
                            checked={selectedTypes.includes(type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedTypes((prev) => [
                                  ...prev.filter((t) => t !== "all"),
                                  type,
                                ]);
                              } else {
                                setSelectedTypes((prev) =>
                                  prev.filter((t) => t !== type)
                                );
                              }
                            }}
                          />
                          <label htmlFor={type} className="text-white capitalize">
                            {type.replace("_", " ")}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>

                {/* Status Filter */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-9"
                    >
                      <span className="truncate">
                        {selectedStatuses.length === 0
                          ? "Status"
                          : selectedStatuses.includes("all")
                          ? "All Statuses"
                          : selectedStatuses.length === 1
                          ? selectedStatuses[0]
                              .replace("_", " ")
                              .split(" ")
                              .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                              .join(" ")
                          : `${selectedStatuses.length} Statuses`}
                      </span>
                      <div className="flex items-center gap-1">
                        {selectedStatuses.length > 0 &&
                          !selectedStatuses.includes("all") && (
                            <span className="bg-purple-500 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center">
                              {selectedStatuses.length}
                            </span>
                          )}
                        <Filter className="w-3 h-3 ml-1" />
                      </div>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-56">
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
                        <label
                          htmlFor="all-statuses"
                          className="text-white font-medium"
                        >
                          All Statuses
                        </label>
                      </div>
                      {statuses.slice(1).map((status) => (
                        <div key={status} className="flex items-center space-x-2">
                          <Checkbox
                            id={status}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatuses((prev) => [
                                  ...prev.filter((s) => s !== "all"),
                                  status,
                                ]);
                              } else {
                                setSelectedStatuses((prev) =>
                                  prev.filter((s) => s !== status)
                                );
                              }
                            }}
                          />
                          <label htmlFor={status} className="text-white capitalize">
                            {status.replace("_", " ")}
                          </label>
                        </div>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Extended Filters - Show directly on mobile, collapsible on desktop */}
              {isMobile ? (
                <div className="space-y-4 mt-4 p-4 bg-white/5 rounded-lg">
                  {/* Expert Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">
                      Experts
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-10"
                        >
                          <span className="truncate">
                            {selectedExperts.length === 0
                              ? "All Experts"
                              : selectedExperts.includes("all")
                              ? "All Experts"
                              : selectedExperts.includes("no_expert")
                              ? "No Expert"
                              : selectedExperts.length === 1
                              ? availableExperts.find(e => e.id === selectedExperts[0])?.username || "Selected"
                              : `${selectedExperts.length} Selected`}
                          </span>
                          <div className="flex items-center gap-1">
                            {selectedExperts.length > 0 &&
                              !selectedExperts.includes("all") && (
                                <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                  {selectedExperts.length}
                                </span>
                              )}
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-64 p-3">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Checkbox
                              id="all-experts"
                              checked={selectedExperts.includes("all")}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setSelectedExperts(["all"]);
                                } else {
                                  setSelectedExperts([]);
                                }
                              }}
                            />
                            <label
                              htmlFor="all-experts"
                              className="text-white font-medium text-sm"
                            >
                              All Experts
                            </label>
                          </div>
                          <div className="border-t border-white/10 pt-2 space-y-2 max-h-40 overflow-y-auto">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id="no-expert"
                                checked={selectedExperts.includes("no_expert")}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedExperts((prev) => [
                                      ...prev.filter((e) => e !== "all"),
                                      "no_expert",
                                    ]);
                                  } else {
                                    setSelectedExperts((prev) =>
                                      prev.filter((e) => e !== "no_expert")
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor="no-expert"
                                className="text-white text-sm"
                              >
                                No Expert
                              </label>
                            </div>
                            {availableExperts.map((expert) => (
                              <div
                                key={expert.id}
                                className="flex items-center space-x-2"
                              >
                                <Checkbox
                                  id={`expert-${expert.id}`}
                                  checked={selectedExperts.includes(expert.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedExperts((prev) => [
                                        ...prev.filter((e) => e !== "all"),
                                        expert.id,
                                      ]);
                                    } else {
                                      setSelectedExperts((prev) =>
                                        prev.filter((e) => e !== expert.id)
                                      );
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`expert-${expert.id}`}
                                  className="text-white text-sm"
                                >
                                  {expert.username}
                                </label>
                              </div>
                            ))}
                          </div>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Tags Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">
                      Tags
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-10"
                        >
                          <span className="truncate">
                            {selectedTags.length === 0
                              ? "All Tags"
                              : selectedTags.length === 1
                              ? selectedTags[0]
                              : `${selectedTags.length} Selected`}
                          </span>
                          <div className="flex items-center gap-1">
                            {selectedTags.length > 0 && (
                              <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                {selectedTags.length}
                              </span>
                            )}
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-64 p-3">
                        <div className="space-y-2 max-h-40 overflow-y-auto">
                          {availableTags.map((tag) => (
                            <div key={tag} className="flex items-center space-x-2">
                              <Checkbox
                                id={`tag-${tag}`}
                                checked={selectedTags.includes(tag)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedTags((prev) => [...prev, tag]);
                                  } else {
                                    setSelectedTags((prev) =>
                                      prev.filter((t) => t !== tag)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`tag-${tag}`}
                                className="text-white text-sm"
                              >
                                {tag}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Content Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">
                      Content Type
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-10"
                        >
                          <span className="truncate">
                            {selectedContentTypes.length === 0 ||
                            selectedContentTypes.includes("all")
                              ? "All Content"
                              : selectedContentTypes.length === 1
                              ? selectedContentTypes[0].charAt(0).toUpperCase() +
                                selectedContentTypes[0].slice(1)
                              : `${selectedContentTypes.length} Selected`}
                          </span>
                          <div className="flex items-center gap-1">
                            {selectedContentTypes.length > 0 &&
                              !selectedContentTypes.includes("all") && (
                                <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                  {selectedContentTypes.length}
                                </span>
                              )}
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-64 p-3">
                        <div className="space-y-2">
                          {contentTypes.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`content-${type}`}
                                checked={selectedContentTypes.includes(type)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    if (type === "all") {
                                      setSelectedContentTypes(["all"]);
                                    } else {
                                      setSelectedContentTypes((prev) => [
                                        ...prev.filter((t) => t !== "all"),
                                        type,
                                      ]);
                                    }
                                  } else {
                                    setSelectedContentTypes((prev) =>
                                      prev.filter((t) => t !== type)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`content-${type}`}
                                className="text-white text-sm capitalize flex items-center gap-2"
                              >
                                {type === "premium" && (
                                  <Crown className="w-3 h-3 text-yellow-400" />
                                )}
                                {type === "all" ? "All Content" : type}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Video Type Filter */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-white/80">
                      Video Availability
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-10"
                        >
                          <span className="truncate">
                            {selectedVideoTypes.length === 0 ||
                            selectedVideoTypes.includes("all")
                              ? "All Videos"
                              : selectedVideoTypes.length === 1
                              ? selectedVideoTypes[0].replace("_", " ")
                              : `${selectedVideoTypes.length} Selected`}
                          </span>
                          <div className="flex items-center gap-1">
                            {selectedVideoTypes.length > 0 &&
                              !selectedVideoTypes.includes("all") && (
                                <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                  {selectedVideoTypes.length}
                                </span>
                              )}
                            <ChevronDown className="w-4 h-4" />
                          </div>
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-64 p-3">
                        <div className="space-y-2">
                          {videoTypes.map((type) => (
                            <div key={type} className="flex items-center space-x-2">
                              <Checkbox
                                id={`video-${type}`}
                                checked={selectedVideoTypes.includes(type)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    if (type === "all") {
                                      setSelectedVideoTypes(["all"]);
                                    } else {
                                      setSelectedVideoTypes((prev) => [
                                        ...prev.filter((t) => t !== "all"),
                                        type,
                                      ]);
                                    }
                                  } else {
                                    setSelectedVideoTypes((prev) =>
                                      prev.filter((t) => t !== type)
                                    );
                                  }
                                }}
                              />
                              <label
                                htmlFor={`video-${type}`}
                                className="text-white text-sm capitalize flex items-center gap-2"
                              >
                                {type === "with_video" && (
                                  <Play className="w-3 h-3 text-blue-400" />
                                )}
                                {type.replace("_", " ")}
                              </label>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              ) : (
                // Desktop extended filters
                <Collapsible open={extendedFiltersOpen} onOpenChange={setExtendedFiltersOpen}>
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full text-white hover:bg-white/10 justify-center mt-4"
                    >
                      <span className="flex items-center gap-2">
                        Extended Filters
                        {extendedFiltersOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </span>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="space-y-4 mt-4 p-4 bg-white/5 rounded-lg">
                      {/* Expert Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">
                          Experts
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-10"
                            >
                              <span className="truncate">
                                {selectedExperts.length === 0
                                  ? "All Experts"
                                  : selectedExperts.includes("all")
                                  ? "All Experts"
                                  : selectedExperts.includes("no_expert")
                                  ? "No Expert"
                                  : selectedExperts.length === 1
                                  ? availableExperts.find(e => e.id === selectedExperts[0])?.username || "Selected"
                                  : `${selectedExperts.length} Selected`}
                              </span>
                              <div className="flex items-center gap-1">
                                {selectedExperts.length > 0 &&
                                  !selectedExperts.includes("all") && (
                                    <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                      {selectedExperts.length}
                                    </span>
                                  )}
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-64 p-3">
                            <div className="space-y-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id="all-experts-desktop"
                                  checked={selectedExperts.includes("all")}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      setSelectedExperts(["all"]);
                                    } else {
                                      setSelectedExperts([]);
                                    }
                                  }}
                                />
                                <label
                                  htmlFor="all-experts-desktop"
                                  className="text-white font-medium text-sm"
                                >
                                  All Experts
                                </label>
                              </div>
                              <div className="border-t border-white/10 pt-2 space-y-2 max-h-40 overflow-y-auto">
                                <div className="flex items-center space-x-2">
                                  <Checkbox
                                    id="no-expert-desktop"
                                    checked={selectedExperts.includes("no_expert")}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedExperts((prev) => [
                                          ...prev.filter((e) => e !== "all"),
                                          "no_expert",
                                        ]);
                                      } else {
                                        setSelectedExperts((prev) =>
                                          prev.filter((e) => e !== "no_expert")
                                        );
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor="no-expert-desktop"
                                    className="text-white text-sm"
                                  >
                                    No Expert
                                  </label>
                                </div>
                                {availableExperts.map((expert) => (
                                  <div
                                    key={expert.id}
                                    className="flex items-center space-x-2"
                                  >
                                    <Checkbox
                                      id={`expert-desktop-${expert.id}`}
                                      checked={selectedExperts.includes(expert.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedExperts((prev) => [
                                            ...prev.filter((e) => e !== "all"),
                                            expert.id,
                                          ]);
                                        } else {
                                          setSelectedExperts((prev) =>
                                            prev.filter((e) => e !== expert.id)
                                          );
                                        }
                                      }}
                                    />
                                    <label
                                      htmlFor={`expert-desktop-${expert.id}`}
                                      className="text-white text-sm"
                                    >
                                      {expert.username}
                                    </label>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Tags Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">
                          Tags
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-10"
                            >
                              <span className="truncate">
                                {selectedTags.length === 0
                                  ? "All Tags"
                                  : selectedTags.length === 1
                                  ? selectedTags[0]
                                  : `${selectedTags.length} Selected`}
                              </span>
                              <div className="flex items-center gap-1">
                                {selectedTags.length > 0 && (
                                  <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                    {selectedTags.length}
                                  </span>
                                )}
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-64 p-3">
                            <div className="space-y-2 max-h-40 overflow-y-auto">
                              {availableTags.map((tag) => (
                                <div key={tag} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`tag-desktop-${tag}`}
                                    checked={selectedTags.includes(tag)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        setSelectedTags((prev) => [...prev, tag]);
                                      } else {
                                        setSelectedTags((prev) =>
                                          prev.filter((t) => t !== tag)
                                        );
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`tag-desktop-${tag}`}
                                    className="text-white text-sm"
                                  >
                                    {tag}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Content Type Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">
                          Content Type
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-10"
                            >
                              <span className="truncate">
                                {selectedContentTypes.length === 0 ||
                                selectedContentTypes.includes("all")
                                  ? "All Content"
                                  : selectedContentTypes.length === 1
                                  ? selectedContentTypes[0].charAt(0).toUpperCase() +
                                    selectedContentTypes[0].slice(1)
                                  : `${selectedContentTypes.length} Selected`}
                              </span>
                              <div className="flex items-center gap-1">
                                {selectedContentTypes.length > 0 &&
                                  !selectedContentTypes.includes("all") && (
                                    <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                      {selectedContentTypes.length}
                                    </span>
                                  )}
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-64 p-3">
                            <div className="space-y-2">
                              {contentTypes.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`content-desktop-${type}`}
                                    checked={selectedContentTypes.includes(type)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        if (type === "all") {
                                          setSelectedContentTypes(["all"]);
                                        } else {
                                          setSelectedContentTypes((prev) => [
                                            ...prev.filter((t) => t !== "all"),
                                            type,
                                          ]);
                                        }
                                      } else {
                                        setSelectedContentTypes((prev) =>
                                          prev.filter((t) => t !== type)
                                        );
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`content-desktop-${type}`}
                                    className="text-white text-sm capitalize flex items-center gap-2"
                                  >
                                    {type === "premium" && (
                                      <Crown className="w-3 h-3 text-yellow-400" />
                                    )}
                                    {type === "all" ? "All Content" : type}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Video Type Filter */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-white/80">
                          Video Availability
                        </label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className="w-full bg-white/5 border-white/10 text-white hover:bg-white/10 justify-between h-10"
                            >
                              <span className="truncate">
                                {selectedVideoTypes.length === 0 ||
                                selectedVideoTypes.includes("all")
                                  ? "All Videos"
                                  : selectedVideoTypes.length === 1
                                  ? selectedVideoTypes[0].replace("_", " ")
                                  : `${selectedVideoTypes.length} Selected`}
                              </span>
                              <div className="flex items-center gap-1">
                                {selectedVideoTypes.length > 0 &&
                                  !selectedVideoTypes.includes("all") && (
                                    <span className="bg-purple-500 text-white rounded-full w-5 h-5 text-xs flex items-center justify-center">
                                      {selectedVideoTypes.length}
                                    </span>
                                  )}
                                <ChevronDown className="w-4 h-4" />
                              </div>
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="bg-slate-900/95 border-white/20 backdrop-blur-sm w-64 p-3">
                            <div className="space-y-2">
                              {videoTypes.map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`video-desktop-${type}`}
                                    checked={selectedVideoTypes.includes(type)}
                                    onCheckedChange={(checked) => {
                                      if (checked) {
                                        if (type === "all") {
                                          setSelectedVideoTypes(["all"]);
                                        } else {
                                          setSelectedVideoTypes((prev) => [
                                            ...prev.filter((t) => t !== "all"),
                                            type,
                                          ]);
                                        }
                                      } else {
                                        setSelectedVideoTypes((prev) =>
                                          prev.filter((t) => t !== type)
                                        );
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`video-desktop-${type}`}
                                    className="text-white text-sm capitalize flex items-center gap-2"
                                  >
                                    {type === "with_video" && (
                                      <Play className="w-3 h-3 text-blue-400" />
                                    )}
                                    {type.replace("_", " ")}
                                  </label>
                                </div>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
              )}
            </CollapsibleContent>
          </Collapsible>

          {/* Active Filters Summary */}
          {(selectedCategories.length > 0 ||
             selectedLevels.length > 0 ||
             selectedTypes.length > 0 ||
             selectedStatuses.length > 0 ||
             selectedExperts.length > 0 ||
             selectedContentTypes.length > 0 ||
             selectedVideoTypes.length > 0) && (
            <div className="flex flex-wrap gap-2 pt-2">
              {selectedCategories
                .filter((c) => c !== "all")
                .map((category) => (
                  <Badge
                    key={category}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                  >
                    {category}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSelectedCategories((prev) =>
                          prev.filter((c) => c !== category)
                        )
                      }
                    />
                  </Badge>
                ))}
              {selectedLevels
                .filter((l) => l !== "all")
                .map((level) => (
                  <Badge
                    key={level}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                  >
                    {level}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSelectedLevels((prev) =>
                          prev.filter((l) => l !== level)
                        )
                      }
                    />
                  </Badge>
                ))}
              {selectedTypes
                .filter((t) => t !== "all")
                .map((type) => (
                  <Badge
                    key={type}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                  >
                    {type.replace("_", " ")}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSelectedTypes((prev) =>
                          prev.filter((t) => t !== type)
                        )
                      }
                    />
                  </Badge>
                ))}
              {selectedStatuses
                .filter((s) => s !== "all")
                .map((status) => (
                  <Badge
                    key={status}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                  >
                    {status.replace("_", " ")}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSelectedStatuses((prev) =>
                          prev.filter((s) => s !== status)
                        )
                      }
                    />
                  </Badge>
                ))}
              {selectedTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                >
                  {tag}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.filter((t) => t !== tag)
                      )
                    }
                  />
                </Badge>
              ))}
              {selectedExperts
                .filter((e) => e !== "all")
                .map((expertId) => (
                  <Badge
                    key={expertId}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                  >
                    {expertId === "no_expert" 
                      ? "No Expert" 
                      : availableExperts.find(e => e.id === expertId)?.username || expertId}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSelectedExperts((prev) =>
                          prev.filter((e) => e !== expertId)
                        )
                      }
                    />
                  </Badge>
                ))}
              {selectedContentTypes
                .filter((c) => c !== "all")
                .map((contentType) => (
                  <Badge
                    key={contentType}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                  >
                    {contentType}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSelectedContentTypes((prev) =>
                          prev.filter((c) => c !== contentType)
                        )
                      }
                    />
                  </Badge>
                ))}
              {selectedVideoTypes
                .filter((v) => v !== "all")
                .map((videoType) => (
                  <Badge
                    key={videoType}
                    variant="secondary"
                    className="bg-purple-500/20 text-purple-300 border-purple-400/30 flex items-center gap-1"
                  >
                    {videoType.replace("_", " ")}
                    <X
                      className="w-3 h-3 cursor-pointer"
                      onClick={() =>
                        setSelectedVideoTypes((prev) =>
                          prev.filter((v) => v !== videoType)
                        )
                      }
                    />
                  </Badge>
                ))}
            </div>
          )}
        </div>

        {/* Results summary */}
        {filteredFigures.length > 0 && (
          <div className="mb-4 text-white/60 text-sm">
            Showing {startIndex + 1}-{Math.min(endIndex, filteredFigures.length)} of {filteredFigures.length} exercises
          </div>
        )}

        {/* Exercise Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {paginatedFigures.map((figure) => (
            <Card
              key={figure.id}
              className="bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300 cursor-pointer group overflow-hidden"
              onClick={() => handleFigureClick(figure)}
            >
              <CardContent className="p-0">
                <div className="relative aspect-square overflow-hidden">
                  {figure.image_url ? (
                    <img
                      src={figure.image_url}
                      alt={figure.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                      <span className="text-6xl">🤸</span>
                    </div>
                  )}
                  
                  {/* Premium badge */}
                  {figure.premium && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="bg-gradient-to-r from-yellow-400 to-orange-400 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-lg">
                        <Crown className="w-3 h-3" />
                        PRO
                      </div>
                    </div>
                  )}

                  {/* Status icon */}
                  {getStatusIcon(figure.progress_status) && (
                    <div className="absolute top-3 left-3 z-10 bg-black/50 backdrop-blur-sm rounded-full p-1.5">
                      {getStatusIcon(figure.progress_status)}
                    </div>
                  )}

                  {/* Video indicator */}
                  {figure.video_url && (
                    <div className="absolute bottom-3 right-3 z-10">
                      <div className="bg-black/70 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        Video
                      </div>
                    </div>
                  )}

                  {/* Gradient overlay for better text readability */}
                  <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Exercise type badge */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      figure.type === 'single_figure' 
                        ? 'bg-blue-500/90 text-white' 
                        : 'bg-purple-500/90 text-white'
                    }`}>
                      {figure.type === 'single_figure' ? 'Figure' : 'Combo'}
                    </div>
                  </div>
                </div>

                <div className="p-4">
                  {/* Header with title and edit buttons */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold text-base leading-tight mb-2 line-clamp-2">
                        {figure.name}
                      </h3>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={`${getDifficultyColor(
                            figure.difficulty_level
                          )} text-xs border font-medium`}
                        >
                          {figure.difficulty_level}
                        </Badge>
                        <span className="text-white/60 text-xs capitalize">
                          {figure.category}
                        </span>
                      </div>
                    </div>
                    
                    {canModifyFigure(figure) && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-white/20 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingFigure(figure);
                            setShowCreateExercise(true);
                          }}
                        >
                          <Edit className="w-4 h-4 text-blue-400" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-white/20 rounded-full"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteModal({
                              isOpen: true,
                              figure: figure,
                            });
                          }}
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Tags section */}
                  {figure.tags && figure.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {figure.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-1 bg-white/10 text-white/80 rounded-md hover:bg-white/20 transition-colors"
                        >
                          {tag}
                        </span>
                      ))}
                      {figure.tags.length > 3 && (
                        <span className="text-xs px-2 py-1 bg-white/10 text-white/60 rounded-md">
                          +{figure.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex justify-center">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage > 1) {
                        setCurrentPage(currentPage - 1);
                      }
                    }}
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  const isCurrentPage = pageNumber === currentPage;
                  
                  // Show first page, last page, current page, and pages around current page
                  const showPage = 
                    pageNumber === 1 || 
                    pageNumber === totalPages || 
                    (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1);
                  
                  if (!showPage) {
                    // Show ellipsis for gaps
                    if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
                      return (
                        <PaginationItem key={pageNumber}>
                          <span className="px-3 py-2 text-white/60">...</span>
                        </PaginationItem>
                      );
                    }
                    return null;
                  }
                  
                  return (
                    <PaginationItem key={pageNumber}>
                      <PaginationLink
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setCurrentPage(pageNumber);
                        }}
                        isActive={isCurrentPage}
                      >
                        {pageNumber}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (currentPage < totalPages) {
                        setCurrentPage(currentPage + 1);
                      }
                    }}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        )}

        {filteredFigures.length === 0 && (
          <div className="text-center py-12">
            <div className="text-white/60 mb-4">
              No exercises found matching your filters
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setSelectedCategories([]);
                setSelectedLevels([]);
                setSelectedTypes([]);
                setSelectedTags([]);
                setSelectedStatuses([]);
                setSelectedExperts([]);
                setSelectedContentTypes([]);
                setSelectedVideoTypes([]);
                setSearchTerm("");
              }}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateExerciseModal
        isOpen={showCreateExercise}
        onClose={() => {
          setShowCreateExercise(false);
          setEditingFigure(null);
          fetchFigures();
        }}
        editingFigure={editingFigure}
      />

      <ConfirmDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, figure: null })}
        onConfirm={() => deleteFigure(deleteModal.figure?.id)}
        title="Delete Exercise"
        description={`Are you sure you want to delete "${deleteModal.figure?.name}"? This action cannot be undone.`}
      />

      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        onUpgrade={() => setShowPricingModal(false)}
      />
    </div>
  );
};

export default Library;
