import { useState, useMemo, useEffect } from "react";

export type FilterStatus = "active" | "not_started" | "completed";
export type FilterAccess = "premium" | "free";
export type FilterLevelGroup = "1-3" | "4-6" | "7-10";
export type FilterDuration = 28;
export type SortOption =
  | "last_activity"
  | "popularity"
  | "level_asc"
  | "level_desc"
  | "duration"
  | "date_added";

interface ChallengeFiltersState {
  status: FilterStatus[];
  access: FilterAccess[];
  levelGroups: FilterLevelGroup[];
  durations: FilterDuration[];
}

const STORAGE_KEY = "challengeFilters";

const loadFiltersFromLocalStorage = (): {
  filters: ChallengeFiltersState;
  sortBy: SortOption;
} | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate structure
      if (parsed && typeof parsed === "object") {
        return {
          filters: {
            status: Array.isArray(parsed.filters?.status)
              ? parsed.filters.status
              : [],
            access: Array.isArray(parsed.filters?.access)
              ? parsed.filters.access
              : [],
            levelGroups: Array.isArray(parsed.filters?.levelGroups)
              ? parsed.filters.levelGroups
              : [],
            durations: Array.isArray(parsed.filters?.durations)
              ? parsed.filters.durations
              : [],
          },
          sortBy:
            parsed.sortBy &&
            [
              "last_activity",
              "popularity",
              "level_asc",
              "level_desc",
              "duration",
              "date_added",
            ].includes(parsed.sortBy)
              ? parsed.sortBy
              : "last_activity",
        };
      }
    }
  } catch (error) {
    console.error("Error loading filters from localStorage:", error);
  }
  return null;
};

const defaultFilters: ChallengeFiltersState = {
  status: [],
  access: [],
  levelGroups: [],
  durations: [],
};

export const useChallengeFilters = () => {
  const loadedData = loadFiltersFromLocalStorage();
  const [filters, setFilters] = useState<ChallengeFiltersState>(
    loadedData?.filters || defaultFilters
  );

  const [sortBy, setSortBy] = useState<SortOption>(
    loadedData?.sortBy || "last_activity"
  );

  const toggleFilter = (
    category: keyof ChallengeFiltersState,
    value: FilterStatus | FilterAccess | FilterLevelGroup | FilterDuration
  ) => {
    setFilters((prev) => {
      const currentValues = prev[category] as any[];
      const valueExists = currentValues.includes(value);

      return {
        ...prev,
        [category]: valueExists
          ? currentValues.filter((v) => v !== value)
          : [...currentValues, value],
      };
    });
  };

  const clearFilters = () => {
    setFilters({
      status: [],
      access: [],
      levelGroups: [],
      durations: [],
    });
  };

  // Save filters and sortBy to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ filters, sortBy }));
    } catch (error) {
      console.error("Error saving filters to localStorage:", error);
    }
  }, [filters, sortBy]);

  const initializeFilters = () => {
    // Empty function - no automatic filter initialization
    // Kept for backward compatibility
  };

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).reduce((count, arr) => count + arr.length, 0);
  }, [filters]);

  const applyFilters = <
    T extends {
      status: string;
      premium: boolean;
      level?: number;
      duration?: number;
    }
  >(
    challenges: T[]
  ): T[] => {
    return challenges.filter((challenge) => {
      // Status filter
      if (filters.status.length > 0) {
        const statusMatch = filters.status.some((s) => {
          if (s === "active") return challenge.status === "active";
          if (s === "not_started") return challenge.status === "not-started";
          if (s === "completed") return challenge.status === "completed";
          return false;
        });
        if (!statusMatch) return false;
      }

      // Access filter
      if (filters.access.length > 0) {
        const accessMatch = filters.access.some((a) => {
          if (a === "premium") return challenge.premium === true;
          if (a === "free") return challenge.premium === false;
          return false;
        });
        if (!accessMatch) return false;
      }

      // Level groups filter
      if (filters.levelGroups.length > 0 && challenge.level) {
        const levelMatch = filters.levelGroups.some((group) => {
          if (group === "1-3")
            return challenge.level >= 1 && challenge.level <= 3;
          if (group === "4-6")
            return challenge.level >= 4 && challenge.level <= 6;
          if (group === "7-10")
            return challenge.level >= 7 && challenge.level <= 10;
          return false;
        });
        if (!levelMatch) return false;
      }

      // Duration filter
      if (filters.durations.length > 0 && challenge.duration) {
        const durationMatch = filters.durations.includes(
          challenge.duration as FilterDuration
        );
        if (!durationMatch) return false;
      }

      return true;
    });
  };

  const applySorting = <
    T extends {
      status: string;
      participants?: number;
      level?: number;
      duration?: number;
      created_at?: string;
      updated_at?: string;
      userProgress?: number;
    }
  >(
    challenges: T[]
  ): T[] => {
    const sorted = [...challenges];

    switch (sortBy) {
      case "last_activity":
        // Najpierw aktywne, potem wg updated_at
        return sorted.sort((a, b) => {
          if (a.status === "active" && b.status !== "active") return -1;
          if (a.status !== "active" && b.status === "active") return 1;
          return (b.updated_at || b.created_at || "").localeCompare(
            a.updated_at || a.created_at || ""
          );
        });

      case "popularity":
        return sorted.sort(
          (a, b) => (b.participants || 0) - (a.participants || 0)
        );

      case "level_asc":
        return sorted.sort((a, b) => (a.level || 0) - (b.level || 0));

      case "level_desc":
        return sorted.sort((a, b) => (b.level || 0) - (a.level || 0));

      case "duration":
        return sorted.sort((a, b) => (a.duration || 0) - (b.duration || 0));

      case "date_added":
        return sorted.sort((a, b) =>
          (b.created_at || "").localeCompare(a.created_at || "")
        );

      default:
        return sorted;
    }
  };

  return {
    filters,
    sortBy,
    toggleFilter,
    clearFilters,
    initializeFilters,
    setSortBy,
    activeFilterCount,
    applyFilters,
    applySorting,
  };
};
