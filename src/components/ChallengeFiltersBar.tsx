import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import {
  FilterStatus,
  FilterAccess,
  FilterLevelGroup,
  FilterDuration,
  SortOption,
} from '@/hooks/useChallengeFilters';

interface ChallengeFiltersBarProps {
  filters: {
    status: FilterStatus[];
    access: FilterAccess[];
    levelGroups: FilterLevelGroup[];
    durations: FilterDuration[];
  };
  sortBy: SortOption;
  activeFilterCount: number;
  onToggleFilter: (category: 'status' | 'access' | 'levelGroups' | 'durations', value: any) => void;
  onClearFilters: () => void;
  onSortChange: (value: SortOption) => void;
}

const ChallengeFiltersBar = ({
  filters,
  sortBy,
  activeFilterCount,
  onToggleFilter,
  onClearFilters,
  onSortChange,
}: ChallengeFiltersBarProps) => {
  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'active', label: 'Aktywne' },
    { value: 'not_started', label: 'Nie rozpoczęte' },
    { value: 'completed', label: 'Ukończone' },
  ];

  const accessOptions: { value: FilterAccess; label: string }[] = [
    { value: 'premium', label: 'Premium' },
    { value: 'free', label: 'Darmowe' },
  ];

  const levelGroupOptions: { value: FilterLevelGroup; label: string }[] = [
    { value: '1-3', label: '1–3' },
    { value: '4-6', label: '4–6' },
    { value: '7-10', label: '7–10' },
  ];

  const durationOptions: { value: FilterDuration; label: string }[] = [
    { value: 28, label: '28 dni' },
  ];

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: 'last_activity', label: 'Ostatnia aktywność' },
    { value: 'popularity', label: 'Popularność' },
    { value: 'level_asc', label: 'Poziom rosnąco' },
    { value: 'level_desc', label: 'Poziom malejąco' },
    { value: 'duration', label: 'Czas trwania' },
    { value: 'date_added', label: 'Data dodania' },
  ];

  return (
    <div className="space-y-4 mb-6">
      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {/* Status Chips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">Status:</span>
          {statusOptions.map(option => (
            <Badge
              key={option.value}
              variant={filters.status.includes(option.value) ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onToggleFilter('status', option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        {/* Access Chips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">Dostęp:</span>
          {accessOptions.map(option => (
            <Badge
              key={option.value}
              variant={filters.access.includes(option.value) ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onToggleFilter('access', option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        {/* Level Groups Chips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">Poziom:</span>
          {levelGroupOptions.map(option => (
            <Badge
              key={option.value}
              variant={filters.levelGroups.includes(option.value) ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onToggleFilter('levelGroups', option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        {/* Duration Chips */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground self-center">Czas:</span>
          {durationOptions.map(option => (
            <Badge
              key={option.value}
              variant={filters.durations.includes(option.value) ? 'default' : 'outline'}
              className="cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => onToggleFilter('durations', option.value)}
            >
              {option.label}
            </Badge>
          ))}
        </div>

        {/* Clear Button */}
        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilters}
            className="ml-auto"
          >
            <X className="w-4 h-4 mr-1" />
            Wyczyść ({activeFilterCount})
          </Button>
        )}
      </div>

      {/* Sort Dropdown */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Sortowanie:</span>
        <Select value={sortBy} onValueChange={onSortChange}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {sortOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ChallengeFiltersBar;
