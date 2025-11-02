import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ChevronDown, Crown, Plus, X, GripVertical } from "lucide-react";

interface SportLevel {
  id: string;
  level_number: number;
  level_name: string;
  point_limit: number;
  sport_category: string;
  challenge_id?: string;
  status: string;
}

interface Figure {
  id: string;
  name: string;
  difficulty_level?: string;
  category?: string;
  image_url?: string;
  sport_category_id?: string;
}

interface Challenge {
  id: string;
  title: string;
}

interface LevelFigureParams {
  figure_id: string;
  order_index: number;
  is_boss: boolean;
  boss_description?: string;
  hold_time_seconds?: number;
  reps?: number;
  notes?: string;
}

interface LevelEditorSheetProps {
  level: SportLevel | null;
  isOpen: boolean;
  onClose: () => void;
  sportKey: string;
  onSave: () => void;
}

export default function LevelEditorSheet({ level, isOpen, onClose, sportKey, onSave }: LevelEditorSheetProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("info");
  
  // Level info state
  const [levelNumber, setLevelNumber] = useState(1);
  const [levelName, setLevelName] = useState("");
  const [pointLimit, setPointLimit] = useState(0);
  const [challengeId, setChallengeId] = useState<string>("");
  const [status, setStatus] = useState("draft");
  
  // Figures state
  const [allFigures, setAllFigures] = useState<Figure[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedFigures, setSelectedFigures] = useState<LevelFigureParams[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [sportFilter, setSportFilter] = useState<string>("current");
  
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (level) {
        loadLevelData();
      } else {
        resetForm();
      }
    }
  }, [isOpen, level]);

  const fetchData = async () => {
    try {
      const [figuresRes, challengesRes] = await Promise.all([
        supabase.from("figures").select("*").order("name"),
        supabase.from("challenges").select("id, title").eq("status", "published").order("title")
      ]);

      if (figuresRes.error) throw figuresRes.error;
      if (challengesRes.error) throw challengesRes.error;

      setAllFigures(figuresRes.data || []);
      setChallenges(challengesRes.data || []);
    } catch (error) {
      console.error("Błąd pobierania danych:", error);
      toast.error("Nie udało się pobrać danych");
    }
  };

  const loadLevelData = async () => {
    if (!level) return;

    setLevelNumber(level.level_number);
    setLevelName(level.level_name);
    setPointLimit(level.point_limit);
    setChallengeId(level.challenge_id || "");
    setStatus(level.status);

    try {
      const { data, error } = await supabase
        .from("level_figures")
        .select("*")
        .eq("level_id", level.id)
        .order("order_index");

      if (error) throw error;

      const figureParams: LevelFigureParams[] = (data || []).map((lf) => ({
        figure_id: lf.figure_id,
        order_index: lf.order_index,
        is_boss: lf.is_boss || false,
        boss_description: lf.boss_description || undefined,
        hold_time_seconds: lf.hold_time_seconds || undefined,
        reps: lf.reps || undefined,
        notes: lf.notes || undefined,
      }));

      setSelectedFigures(figureParams);
    } catch (error) {
      console.error("Błąd ładowania figurek:", error);
      toast.error("Nie udało się załadować figurek");
    }
  };

  const resetForm = () => {
    setLevelNumber(1);
    setLevelName("");
    setPointLimit(0);
    setChallengeId("");
    setStatus("draft");
    setSelectedFigures([]);
    setActiveTab("info");
  };

  const getFilteredFigures = () => {
    return allFigures.filter((fig) => {
      // Search
      if (searchQuery && !fig.name.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      // Sport filter
      if (sportFilter === "current") {
        const sportCategory = allFigures.find(f => f.sport_category_id)?.sport_category_id;
        if (fig.sport_category_id && sportCategory && fig.sport_category_id !== sportCategory) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== "all" && fig.category !== categoryFilter) {
        return false;
      }

      // Difficulty filter
      if (difficultyFilter !== "all" && fig.difficulty_level !== difficultyFilter) {
        return false;
      }

      return true;
    });
  };

  const addFigure = (figureId: string) => {
    if (selectedFigures.some(f => f.figure_id === figureId)) {
      toast.info("Ta figurka jest już dodana do poziomu");
      return;
    }

    const newFigure: LevelFigureParams = {
      figure_id: figureId,
      order_index: selectedFigures.length,
      is_boss: false,
    };

    setSelectedFigures([...selectedFigures, newFigure]);
    toast.success("Dodano figurkę");
  };

  const removeFigure = (figureId: string) => {
    setSelectedFigures(selectedFigures.filter(f => f.figure_id !== figureId));
    toast.success("Usunięto figurkę");
  };

  const updateFigureParams = (figureId: string, updates: Partial<LevelFigureParams>) => {
    setSelectedFigures(selectedFigures.map(f => {
      if (f.figure_id === figureId) {
        // If setting is_boss to true, unset all other bosses
        if (updates.is_boss === true) {
          setSelectedFigures(prev => prev.map(pf => 
            pf.figure_id === figureId ? pf : { ...pf, is_boss: false }
          ));
        }
        return { ...f, ...updates };
      }
      return f;
    }));
  };

  const getFigureById = (id: string) => allFigures.find(f => f.id === id);

  const saveAllChanges = async () => {
    if (!levelName.trim()) {
      toast.error("Nazwa poziomu jest wymagana");
      return;
    }

    // Check for multiple bosses
    const bossCount = selectedFigures.filter(f => f.is_boss).length;
    if (bossCount > 1) {
      toast.error("Tylko jedna figurka może być bossem poziomu");
      return;
    }

    setIsSaving(true);

    try {
      let levelId = level?.id;

      // Save or update level
      if (level) {
        const { error } = await supabase
          .from("sport_levels")
          .update({
            level_number: levelNumber,
            level_name: levelName,
            point_limit: pointLimit,
            challenge_id: challengeId || null,
            status,
          })
          .eq("id", level.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("sport_levels")
          .insert({
            sport_category: sportKey,
            level_number: levelNumber,
            level_name: levelName,
            point_limit: pointLimit,
            challenge_id: challengeId || null,
            status,
            created_by: user?.id,
          })
          .select()
          .single();

        if (error) throw error;
        levelId = data.id;
      }

      // Delete old level_figures
      if (levelId) {
        const { error: deleteError } = await supabase
          .from("level_figures")
          .delete()
          .eq("level_id", levelId);

        if (deleteError) throw deleteError;

        // Insert new level_figures with parameters
        if (selectedFigures.length > 0) {
          const levelFiguresData = selectedFigures.map((fig) => ({
            level_id: levelId,
            figure_id: fig.figure_id,
            order_index: fig.order_index,
            is_boss: fig.is_boss || false,
            boss_description: fig.boss_description || null,
            hold_time_seconds: fig.hold_time_seconds || null,
            reps: fig.reps || null,
            notes: fig.notes || null,
            created_by: user?.id,
          }));

          const { error: insertError } = await supabase
            .from("level_figures")
            .insert(levelFiguresData);

          if (insertError) throw insertError;
        }
      }

      toast.success(level ? "Zaktualizowano poziom" : "Utworzono poziom");
      onSave();
      onClose();
    } catch (error) {
      console.error("Błąd zapisu:", error);
      toast.error("Nie udało się zapisać zmian");
    } finally {
      setIsSaving(false);
    }
  };

  const selectedFigureIds = selectedFigures.map(f => f.figure_id);
  const availableFigures = getFilteredFigures().filter(f => !selectedFigureIds.includes(f.id));

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-[95vw] lg:max-w-7xl p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-6 pb-4 border-b">
            <SheetTitle className="text-2xl">
              {level ? "Edytuj Poziom" : "Utwórz Nowy Poziom"}
            </SheetTitle>
            <SheetDescription>
              {level ? "Zaktualizuj informacje o poziomie i przypisane figurki" : "Dodaj nowy poziom umiejętności"}
            </SheetDescription>
          </SheetHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 pt-4">
              <TabsList className="w-full grid grid-cols-2">
                <TabsTrigger value="info">Informacje o Poziomie</TabsTrigger>
                <TabsTrigger value="figures">
                  Figurki ({selectedFigures.length})
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="info" className="flex-1 overflow-auto px-6 pb-6 mt-4">
              <div className="space-y-6 max-w-2xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="levelNumber">Numer Poziomu</Label>
                    <Input
                      id="levelNumber"
                      type="number"
                      min="1"
                      value={levelNumber}
                      onChange={(e) => setLevelNumber(parseInt(e.target.value) || 1)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pointLimit">Limit Punktów</Label>
                    <Input
                      id="pointLimit"
                      type="number"
                      min="0"
                      value={pointLimit}
                      onChange={(e) => setPointLimit(parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="levelName">Nazwa Poziomu</Label>
                  <Input
                    id="levelName"
                    value={levelName}
                    onChange={(e) => setLevelName(e.target.value)}
                    placeholder="np. Poziom Początkujący"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="challenge">Powiązane Wyzwanie</Label>
                  <Select value={challengeId} onValueChange={setChallengeId}>
                    <SelectTrigger id="challenge">
                      <SelectValue placeholder="Brak Wyzwania" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Brak Wyzwania</SelectItem>
                      {challenges.map((ch) => (
                        <SelectItem key={ch.id} value={ch.id}>
                          {ch.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Wersja Robocza</SelectItem>
                      <SelectItem value="published">Opublikowane</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="figures" className="flex-1 overflow-hidden mt-4">
              <div className="grid lg:grid-cols-2 gap-6 h-full px-6 pb-6">
                {/* Left: Available figures */}
                <div className="space-y-4 flex flex-col overflow-hidden">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Dostępne Figurki</h3>
                    
                    <div className="space-y-3">
                      <Input
                        placeholder="Szukaj figurek..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />

                      <div className="grid grid-cols-2 gap-2">
                        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Kategoria" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Wszystkie Kategorie</SelectItem>
                            <SelectItem value="strength">Siła</SelectItem>
                            <SelectItem value="flexibility">Elastyczność</SelectItem>
                            <SelectItem value="balance">Równowaga</SelectItem>
                          </SelectContent>
                        </Select>

                        <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                          <SelectTrigger>
                            <SelectValue placeholder="Trudność" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Wszystkie Poziomy</SelectItem>
                            <SelectItem value="beginner">Początkujący</SelectItem>
                            <SelectItem value="intermediate">Średniozaawansowany</SelectItem>
                            <SelectItem value="advanced">Zaawansowany</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <ScrollArea className="flex-1">
                    <div className="space-y-2 pr-4">
                      {availableFigures.map((fig) => (
                        <Card key={fig.id} className="overflow-hidden hover:border-primary/50 transition-colors">
                          <CardContent className="p-3 flex items-center gap-3">
                            {fig.image_url && (
                              <img
                                src={fig.image_url}
                                alt={fig.name}
                                className="w-12 h-12 rounded object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="font-medium truncate">{fig.name}</p>
                              {fig.difficulty_level && (
                                <Badge variant="outline" className="text-xs mt-1">
                                  {fig.difficulty_level}
                                </Badge>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addFigure(fig.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      ))}

                      {availableFigures.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Brak dostępnych figurek
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>

                {/* Right: Selected figures with parameters */}
                <div className="space-y-4 flex flex-col overflow-hidden">
                  <h3 className="text-lg font-semibold">Wybrane Figurki</h3>

                  <ScrollArea className="flex-1">
                    <div className="space-y-3 pr-4">
                      {selectedFigures.map((figParam) => {
                        const fig = getFigureById(figParam.figure_id);
                        if (!fig) return null;

                        return (
                          <Card key={figParam.figure_id} className={figParam.is_boss ? "border-yellow-500 border-2" : ""}>
                            <CardHeader className="pb-3">
                              <div className="flex items-start gap-3">
                                <GripVertical className="h-5 w-5 text-muted-foreground mt-1 cursor-move" />
                                {fig.image_url && (
                                  <img
                                    src={fig.image_url}
                                    alt={fig.name}
                                    className="w-12 h-12 rounded object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <CardTitle className="text-base flex items-center gap-2">
                                    {fig.name}
                                    {figParam.is_boss && <Crown className="h-4 w-4 text-yellow-500" />}
                                  </CardTitle>
                                  {fig.difficulty_level && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {fig.difficulty_level}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => removeFigure(figParam.figure_id)}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardHeader>

                            <CardContent className="pt-0">
                              <Collapsible>
                                <CollapsibleTrigger asChild>
                                  <Button variant="ghost" size="sm" className="w-full justify-between">
                                    Parametry Poziomu
                                    <ChevronDown className="h-4 w-4" />
                                  </Button>
                                </CollapsibleTrigger>
                                <CollapsibleContent className="space-y-4 pt-4">
                                  <div className="flex items-center space-x-2">
                                    <Checkbox
                                      id={`boss-${figParam.figure_id}`}
                                      checked={figParam.is_boss}
                                      onCheckedChange={(checked) =>
                                        updateFigureParams(figParam.figure_id, { is_boss: checked as boolean })
                                      }
                                    />
                                    <Label htmlFor={`boss-${figParam.figure_id}`} className="flex items-center gap-2">
                                      <Crown className="h-4 w-4 text-yellow-500" />
                                      Oznacz jako Boss
                                    </Label>
                                  </div>

                                  {figParam.is_boss && (
                                    <div className="space-y-2">
                                      <Label>Opis Wymagań Bossa</Label>
                                      <Textarea
                                        placeholder="np. Utrzymaj 30s bez drżenia"
                                        value={figParam.boss_description || ""}
                                        onChange={(e) =>
                                          updateFigureParams(figParam.figure_id, { boss_description: e.target.value })
                                        }
                                        rows={2}
                                      />
                                    </div>
                                  )}

                                  <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-2">
                                      <Label>Czas Trzymania (s)</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Auto"
                                        value={figParam.hold_time_seconds || ""}
                                        onChange={(e) =>
                                          updateFigureParams(figParam.figure_id, {
                                            hold_time_seconds: e.target.value ? parseInt(e.target.value) : undefined,
                                          })
                                        }
                                      />
                                    </div>

                                    <div className="space-y-2">
                                      <Label>Liczba Powtórzeń</Label>
                                      <Input
                                        type="number"
                                        min="0"
                                        placeholder="Auto"
                                        value={figParam.reps || ""}
                                        onChange={(e) =>
                                          updateFigureParams(figParam.figure_id, {
                                            reps: e.target.value ? parseInt(e.target.value) : undefined,
                                          })
                                        }
                                      />
                                    </div>
                                  </div>

                                  <div className="space-y-2">
                                    <Label>Notatki dla Użytkownika</Label>
                                    <Textarea
                                      placeholder="Dodatkowe wskazówki..."
                                      value={figParam.notes || ""}
                                      onChange={(e) =>
                                        updateFigureParams(figParam.figure_id, { notes: e.target.value })
                                      }
                                      rows={2}
                                    />
                                  </div>
                                </CollapsibleContent>
                              </Collapsible>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {selectedFigures.length === 0 && (
                        <p className="text-center text-muted-foreground py-8">
                          Nie wybrano jeszcze żadnych figurek
                        </p>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="p-6 pt-4 border-t flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} disabled={isSaving}>
              Anuluj
            </Button>
            <Button onClick={saveAllChanges} disabled={isSaving}>
              {isSaving ? "Zapisywanie..." : "Zapisz Wszystko"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
