import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Trophy, TrendingUp, Dumbbell, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { YourSportsSection } from './YourSportsSection';
import { AchievementsSection } from './AchievementsSection';
import { FigureJourneySection } from './FigureJourneySection';

interface CollapsibleSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const CollapsibleSection = ({ title, icon, children, defaultOpen = false }: CollapsibleSectionProps) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader 
        className="cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
          </div>
          {isOpen ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="pt-0">
          {children}
        </CardContent>
      )}
    </Card>
  );
};

export const ActivityTab = () => {
  return (
    <div className="space-y-4">
      {/* Your Sports */}
      <CollapsibleSection
        title="Twoje dyscypliny"
        icon={<Dumbbell className="h-5 w-5 text-purple-400" />}
        defaultOpen={true}
      >
        <YourSportsSection />
      </CollapsibleSection>

      {/* Achievements */}
      <CollapsibleSection
        title="Osiągnięcia"
        icon={<Trophy className="h-5 w-5 text-yellow-400" />}
        defaultOpen={true}
      >
        <AchievementsSection />
      </CollapsibleSection>

      {/* Figure Journey */}
      <CollapsibleSection
        title="Podróż przez figury"
        icon={<TrendingUp className="h-5 w-5 text-green-400" />}
        defaultOpen={false}
      >
        <FigureJourneySection />
      </CollapsibleSection>

      {/* Training Stats - Placeholder for future */}
      <CollapsibleSection
        title="Statystyki treningowe"
        icon={<Target className="h-5 w-5 text-blue-400" />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-xs text-muted-foreground mt-1">Ukończone treningi</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">0h</div>
            <div className="text-xs text-muted-foreground mt-1">Całkowity czas</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">0</div>
            <div className="text-xs text-muted-foreground mt-1">Obecny streak</div>
          </div>
          <div className="bg-white/5 rounded-lg p-4">
            <div className="text-2xl font-bold text-foreground">-</div>
            <div className="text-xs text-muted-foreground mt-1">Ulubiona dyscyplina</div>
          </div>
        </div>
      </CollapsibleSection>
    </div>
  );
};
