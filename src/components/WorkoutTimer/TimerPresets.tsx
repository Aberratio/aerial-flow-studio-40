import { Card, CardContent } from '@/components/ui/card';
import { DEFAULT_PRESETS, DEFAULT_CONFIG, type TimerConfig } from '@/types/timer';

interface TimerPresetsProps {
  onSelectPreset: (config: TimerConfig) => void;
}

export const TimerPresets = ({ onSelectPreset }: TimerPresetsProps) => {
  const handlePresetClick = (preset: Partial<TimerConfig>) => {
    const newConfig: TimerConfig = {
      ...DEFAULT_CONFIG,
      ...preset,
      lastUsed: new Date(),
    };
    onSelectPreset(newConfig);
  };

  const getPresetIcon = (name?: string) => {
    switch (name) {
      case 'Tabata': return '⚡';
      case 'HIIT Classic': return '🔥';
      case 'EMOM': return '⏱️';
      case 'Circuit': return '🔄';
      default: return '💪';
    }
  };

  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-foreground mb-4">Szybkie presety</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {DEFAULT_PRESETS.map((preset, index) => (
          <Card
            key={index}
            className="cursor-pointer border-border/50 bg-card/50 hover:bg-card/80 transition-all hover:scale-105"
            onClick={() => handlePresetClick(preset)}
          >
            <CardContent className="p-4 text-center">
              <div className="text-3xl mb-2">{getPresetIcon(preset.presetName)}</div>
              <p className="font-semibold text-foreground text-sm">{preset.presetName}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {preset.workDuration}s / {preset.restDuration}s
              </p>
              <p className="text-xs text-muted-foreground">
                {preset.rounds} {preset.rounds === 1 ? 'runda' : 'rund'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
