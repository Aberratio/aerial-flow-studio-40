import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { SheetHeader, SheetTitle } from '@/components/ui/sheet';
import type { TimerConfig } from '@/types/timer';
import { DEFAULT_CONFIG } from '@/types/timer';

interface TimerConfigurationProps {
  config: TimerConfig;
  onSave: (config: TimerConfig) => void;
}

export const TimerConfiguration = ({ config, onSave }: TimerConfigurationProps) => {
  const [formData, setFormData] = useState<TimerConfig>(config);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...formData, lastUsed: new Date() });
  };

  const handleReset = () => {
    setFormData(DEFAULT_CONFIG);
  };

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle>Konfiguracja stopera</SheetTitle>
      </SheetHeader>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Settings */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Podstawowe ustawienia</h3>
          
          <div className="space-y-2">
            <Label htmlFor="workDuration">Czas pracy (sekundy)</Label>
            <Input
              id="workDuration"
              type="number"
              min="5"
              max="300"
              value={formData.workDuration}
              onChange={(e) => setFormData({ ...formData, workDuration: parseInt(e.target.value) || 0 })}
              className="bg-background/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restDuration">Czas odpoczynku (sekundy)</Label>
            <Input
              id="restDuration"
              type="number"
              min="0"
              max="180"
              value={formData.restDuration}
              onChange={(e) => setFormData({ ...formData, restDuration: parseInt(e.target.value) || 0 })}
              className="bg-background/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rounds">Liczba rund</Label>
            <Input
              id="rounds"
              type="number"
              min="1"
              max="99"
              value={formData.rounds}
              onChange={(e) => setFormData({ ...formData, rounds: parseInt(e.target.value) || 1 })}
              className="bg-background/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="sets">Liczba serii</Label>
            <Input
              id="sets"
              type="number"
              min="1"
              max="20"
              value={formData.sets}
              onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 1 })}
              className="bg-background/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="restBetweenSets">Przerwa między seriami (sekundy)</Label>
            <Input
              id="restBetweenSets"
              type="number"
              min="10"
              max="300"
              value={formData.restBetweenSets}
              onChange={(e) => setFormData({ ...formData, restBetweenSets: parseInt(e.target.value) || 0 })}
              className="bg-background/50 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prepareTime">Czas przygotowania (sekundy)</Label>
            <Input
              id="prepareTime"
              type="number"
              min="3"
              max="30"
              value={formData.prepareTime}
              onChange={(e) => setFormData({ ...formData, prepareTime: parseInt(e.target.value) || 0 })}
              className="bg-background/50 border-border/50"
            />
          </div>
        </div>

        {/* Advanced Settings */}
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="audio">
            <AccordionTrigger>Ustawienia dźwięku</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="enableSound">Włącz dźwięk</Label>
                <Switch
                  id="enableSound"
                  checked={formData.enableSound}
                  onCheckedChange={(checked) => setFormData({ ...formData, enableSound: checked })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="countdownBeeps">Bipy odliczania (sekundy przed końcem)</Label>
                <Select
                  value={formData.countdownBeeps.toString()}
                  onValueChange={(value) => setFormData({ ...formData, countdownBeeps: parseInt(value) })}
                >
                  <SelectTrigger id="countdownBeeps">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Brak</SelectItem>
                    <SelectItem value="1">1 sekunda</SelectItem>
                    <SelectItem value="2">2 sekundy</SelectItem>
                    <SelectItem value="3">3 sekundy</SelectItem>
                    <SelectItem value="5">5 sekund</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="beepVolume">Głośność ({formData.beepVolume}%)</Label>
                <Slider
                  id="beepVolume"
                  min={0}
                  max={100}
                  step={10}
                  value={[formData.beepVolume]}
                  onValueChange={(value) => setFormData({ ...formData, beepVolume: value[0] })}
                  className="w-full"
                />
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="display">
            <AccordionTrigger>Ustawienia wyświetlania</AccordionTrigger>
            <AccordionContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="showExerciseName">Pokaż nazwę ćwiczenia</Label>
                <Switch
                  id="showExerciseName"
                  checked={formData.showExerciseName}
                  onCheckedChange={(checked) => setFormData({ ...formData, showExerciseName: checked })}
                />
              </div>

              {formData.showExerciseName && (
                <div className="space-y-2">
                  <Label htmlFor="exerciseName">Nazwa ćwiczenia</Label>
                  <Input
                    id="exerciseName"
                    type="text"
                    placeholder="np. Pompki"
                    value={formData.exerciseName || ''}
                    onChange={(e) => setFormData({ ...formData, exerciseName: e.target.value })}
                    className="bg-background/50 border-border/50"
                  />
                </div>
              )}
            </AccordionContent>
          </AccordionItem>
        </Accordion>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="button" variant="outline" onClick={handleReset} className="flex-1">
            Resetuj
          </Button>
          <Button type="submit" variant="default" className="flex-1">
            Zapisz
          </Button>
        </div>
      </form>
    </div>
  );
};
