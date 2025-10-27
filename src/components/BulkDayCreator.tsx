import React, { useState } from "react";
import {
  Wand2,
  Copy,
  Calendar,
  Dumbbell,
  Moon,
  Zap,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ExerciseSearchModal } from "@/components/ExerciseSearchModal";

interface Exercise {
  id: string;
  figure_id: string;
  order_index: number;
  sets?: number;
  reps?: number;
  hold_time_seconds?: number;
  rest_time_seconds?: number;
  video_url?: string;
  audio_url?: string;
  notes?: string;
  figure?: {
    id: string;
    name: string;
    difficulty_level: string;
    category: string;
  };
}

interface TrainingDay {
  id?: string;
  date: Date;
  title: string;
  description: string;
  exercises: Exercise[];
  isRestDay?: boolean;
}

interface BulkDayCreatorProps {
  trainingDays: TrainingDay[];
  onUpdateDays: (days: TrainingDay[]) => void;
}

export const BulkDayCreator: React.FC<BulkDayCreatorProps> = ({
  trainingDays,
  onUpdateDays,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [createCount, setCreateCount] = useState(1);
  const [cloneDayIndex, setCloneDayIndex] = useState<number>(0);
  const [cloneCount, setCloneCount] = useState(1);
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());
  const [isExerciseModalOpen, setIsExerciseModalOpen] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const { toast } = useToast();

  const handleCreateBulkDays = () => {
    const lastDate = trainingDays.length > 0 
      ? trainingDays[trainingDays.length - 1].date 
      : new Date();
    
    const newDays: TrainingDay[] = Array.from({ length: createCount }, (_, i) => {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i + 1);
      
      return {
        date,
        title: `Day ${trainingDays.length + i + 1}`,
        description: "",
        exercises: [],
        isRestDay: false,
      };
    });

    onUpdateDays([...trainingDays, ...newDays]);
    toast({
      title: "Days Created",
      description: `Successfully created ${createCount} training days.`,
    });
    setCreateCount(1);
  };

  const handleCloneDay = () => {
    if (cloneDayIndex < 0 || cloneDayIndex >= trainingDays.length) {
      toast({
        title: "Invalid Selection",
        description: "Please select a valid day to clone.",
        variant: "destructive",
      });
      return;
    }

    const dayToClone = trainingDays[cloneDayIndex];
    const clonedDays: TrainingDay[] = Array.from({ length: cloneCount }, (_, i) => {
      const date = new Date(trainingDays[trainingDays.length - 1].date);
      date.setDate(date.getDate() + i + 1);
      
      return {
        ...dayToClone,
        id: undefined, // Remove ID so it creates a new one
        date,
        title: `${dayToClone.title} (Copy ${i + 1})`,
        exercises: dayToClone.exercises.map(ex => ({
          ...ex,
          id: `temp_${Math.random()}`, // Temporary ID
        })),
      };
    });

    onUpdateDays([...trainingDays, ...clonedDays]);
    toast({
      title: "Day Cloned",
      description: `Cloned Day ${cloneDayIndex + 1} ${cloneCount} time(s).`,
    });
    setCloneCount(1);
  };

  const applyRestEvery7th = () => {
    const updatedDays = trainingDays.map((day, index) => ({
      ...day,
      isRestDay: (index + 1) % 7 === 0,
      title: (index + 1) % 7 === 0 ? `Rest Day ${index + 1}` : day.title,
      exercises: (index + 1) % 7 === 0 ? [] : day.exercises,
    }));

    onUpdateDays(updatedDays);
    toast({
      title: "Template Applied",
      description: "Set every 7th day as a rest day.",
    });
  };

  const applyProgressive30Day = () => {
    const updatedDays = trainingDays.map((day, index) => {
      const weekNumber = Math.floor(index / 7) + 1;
      const isRestDay = (index + 1) % 7 === 0;
      
      return {
        ...day,
        isRestDay,
        title: isRestDay 
          ? `Week ${weekNumber} - Rest Day` 
          : `Week ${weekNumber} - Training Day ${((index % 7) + 1)}`,
        exercises: isRestDay ? [] : day.exercises,
      };
    });

    onUpdateDays(updatedDays);
    toast({
      title: "Template Applied",
      description: "Applied 30-day progressive template.",
    });
  };

  const toggleDaySelection = (index: number) => {
    const newSelected = new Set(selectedDays);
    if (newSelected.has(index)) {
      newSelected.delete(index);
    } else {
      newSelected.add(index);
    }
    setSelectedDays(newSelected);
  };

  const handleExerciseSelect = (exercise: any, sets?: number, reps?: number, holdTime?: number) => {
    setIsExerciseModalOpen(false);
    
    // Now add this exercise to all selected days
    if (selectedDays.size === 0) {
      toast({
        title: "No Days Selected",
        description: "Please select at least one day to add the exercise to.",
        variant: "destructive",
      });
      return;
    }

    const updatedDays = trainingDays.map((day, index) => {
      if (selectedDays.has(index)) {
        const newExercise: Exercise = {
          id: `temp_${Math.random()}`,
          figure_id: exercise.id,
          order_index: day.exercises.length,
          sets: sets || 3,
          reps: reps || 10,
          hold_time_seconds: holdTime || 30,
          rest_time_seconds: 60,
          figure: {
            id: exercise.id,
            name: exercise.name,
            difficulty_level: exercise.difficulty_level,
            category: exercise.category,
          },
        };
        
        return {
          ...day,
          exercises: [...day.exercises, newExercise],
        };
      }
      return day;
    });

    onUpdateDays(updatedDays);
    toast({
      title: "Exercise Added",
      description: `Added "${exercise.name}" to ${selectedDays.size} day(s).`,
    });
    setSelectedDays(new Set());
  };

  const selectAllDays = () => {
    setSelectedDays(new Set(trainingDays.map((_, i) => i)));
  };

  const clearSelection = () => {
    setSelectedDays(new Set());
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm">
            <Wand2 className="w-4 h-4 mr-2" />
            Bulk Operations
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5" />
              Bulk Training Day Operations
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="create" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="create">Create</TabsTrigger>
              <TabsTrigger value="clone">Clone</TabsTrigger>
              <TabsTrigger value="template">Templates</TabsTrigger>
              <TabsTrigger value="bulk-exercise">Bulk Add</TabsTrigger>
            </TabsList>

            {/* TAB 1: CREATE DAYS */}
            <TabsContent value="create" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="create-count">Number of days to create</Label>
                <Input
                  id="create-count"
                  type="number"
                  min="1"
                  max="365"
                  value={createCount}
                  onChange={(e) => setCreateCount(parseInt(e.target.value) || 1)}
                />
                <p className="text-sm text-muted-foreground">
                  Creates {createCount} new training day{createCount > 1 ? 's' : ''} after the last existing day.
                </p>
              </div>
              <Button onClick={handleCreateBulkDays} className="w-full">
                <Calendar className="w-4 h-4 mr-2" />
                Create {createCount} Day{createCount > 1 ? 's' : ''}
              </Button>
            </TabsContent>

            {/* TAB 2: CLONE DAY */}
            <TabsContent value="clone" className="space-y-4">
              <div className="space-y-2">
                <Label>Select day to clone</Label>
                <Select
                  value={cloneDayIndex.toString()}
                  onValueChange={(value) => setCloneDayIndex(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a day" />
                  </SelectTrigger>
                  <SelectContent>
                    {trainingDays.map((day, index) => (
                      <SelectItem key={index} value={index.toString()}>
                        Day {index + 1}: {day.title || "Untitled"} 
                        {day.isRestDay && " (Rest)"}
                        {" "}({day.exercises.length} exercise{day.exercises.length !== 1 ? 's' : ''})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clone-count">Number of copies</Label>
                <Input
                  id="clone-count"
                  type="number"
                  min="1"
                  max="100"
                  value={cloneCount}
                  onChange={(e) => setCloneCount(parseInt(e.target.value) || 1)}
                />
              </div>
              <Button onClick={handleCloneDay} className="w-full">
                <Copy className="w-4 h-4 mr-2" />
                Clone Day {cloneCount} Time{cloneCount > 1 ? 's' : ''}
              </Button>
            </TabsContent>

            {/* TAB 3: TEMPLATES */}
            <TabsContent value="template" className="space-y-4">
              <div className="space-y-2">
                <h3 className="font-medium">Quick Templates</h3>
                <p className="text-sm text-muted-foreground">
                  Apply pre-made templates to organize your challenge days.
                </p>
              </div>
              <div className="space-y-2">
                <Button
                  onClick={applyRestEvery7th}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Moon className="w-4 h-4 mr-2" />
                  Rest Day Every 7th Day
                  <span className="ml-auto text-xs text-muted-foreground">
                    Days 7, 14, 21...
                  </span>
                </Button>
                <Button
                  onClick={applyProgressive30Day}
                  variant="outline"
                  className="w-full justify-start"
                >
                  <Zap className="w-4 h-4 mr-2" />
                  30-Day Progressive Challenge
                  <span className="ml-auto text-xs text-muted-foreground">
                    4 weeks + rest
                  </span>
                </Button>
              </div>
            </TabsContent>

            {/* TAB 4: BULK EXERCISE */}
            <TabsContent value="bulk-exercise" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Select days to add exercise to:</Label>
                  <div className="space-x-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={selectAllDays}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearSelection}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                <div className="grid grid-cols-5 gap-2 max-h-48 overflow-y-auto p-2 border rounded-lg">
                  {trainingDays.map((day, index) => (
                    <div
                      key={index}
                      className="flex items-center space-x-2"
                    >
                      <Checkbox
                        id={`day-${index}`}
                        checked={selectedDays.has(index)}
                        onCheckedChange={() => toggleDaySelection(index)}
                      />
                      <label
                        htmlFor={`day-${index}`}
                        className="text-sm cursor-pointer"
                      >
                        Day {index + 1}
                      </label>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {selectedDays.size} day{selectedDays.size !== 1 ? 's' : ''} selected
                </p>
              </div>
              <Button
                onClick={() => setIsExerciseModalOpen(true)}
                className="w-full"
                disabled={selectedDays.size === 0}
              >
                <Dumbbell className="w-4 h-4 mr-2" />
                Choose Exercise to Add
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Exercise Search Modal */}
      <ExerciseSearchModal
        isOpen={isExerciseModalOpen}
        onClose={() => setIsExerciseModalOpen(false)}
        onExerciseSelect={handleExerciseSelect}
        selectedExercises={[]}
      />
    </>
  );
};
