import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Filter, X } from 'lucide-react';
import {
  FilterStatus,
  FilterAccess,
  FilterLevelGroup,
  FilterDuration,
  SortOption,
} from '@/hooks/useChallengeFilters';

interface ChallengeFiltersSheetProps {
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
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const ChallengeFiltersSheet: React.FC<ChallengeFiltersSheetProps> = ({
  filters,
  sortBy,
  activeFilterCount,
  onToggleFilter,
  onClearFilters,
  onSortChange,
  isOpen,
  onOpenChange,
}) => {
  const statusOptions: { value: FilterStatus; label: string }[] = [
    { value: 'active', label: 'Aktywne' },
    { value: 'not_started', label: 'Nierozpoczęte' },
    { value: 'completed', label: 'Ukończone' },
  ];

  const accessOptions: { value: FilterAccess; label: string }[] = [
    { value: 'premium', label: 'Premium' },
    { value: 'free', label: 'Darmowe' },
  ];

  const levelGroupOptions: { value: FilterLevelGroup; label: string }[] = [
    { value: '1-3', label: 'Poziom 1–3' },
    { value: '4-6', label: 'Poziom 4–6' },
    { value: '7-10', label: 'Poziom 7–10' },
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
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">
            Filtry {activeFilterCount > 0 && `(${activeFilterCount})`}
          </SheetTitle>
        </SheetHeader>
        <div className="py-6 space-y-6">
          {/* Status */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Status</h3>
            <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Access */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Dostęp</h3>
            <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Level Groups */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Poziom</h3>
            <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Duration */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Czas trwania</h3>
            <div className="flex flex-wrap gap-2">
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
          </div>

          {/* Sort */}
          <div>
            <h3 className="font-semibold mb-3 text-foreground">Sortowanie</h3>
            <Select value={sortBy} onValueChange={onSortChange}>
              <SelectTrigger className="w-full">
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
        <SheetFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClearFilters}
            className="flex-1"
          >
            <X className="w-4 h-4 mr-2" />
            Wyczyść
          </Button>
          <Button
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Zastosuj
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};

export default ChallengeFiltersSheet;
