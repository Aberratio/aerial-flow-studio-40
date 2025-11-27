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
    <div className="space-y-6">
      {/* Your Sports - Always visible */}
      <YourSportsSection />

      {/* Achievements - Always visible */}
      <AchievementsSection />

      {/* Figure Journey - Collapsible */}
      <CollapsibleSection
        title="Postęp w figurach"
        icon={<TrendingUp className="h-5 w-5 text-green-400" />}
        defaultOpen={false}
      >
        <FigureJourneySection />
      </CollapsibleSection>
    </div>
  );
};
