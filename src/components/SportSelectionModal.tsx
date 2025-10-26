import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface SportCategory {
  id: string;
  key_name?: string;
  name: string;
  description?: string;
  icon?: string;
  is_published: boolean;
}

interface SportSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preSelectedSports?: string[];
}

const SportSelectionModal = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedSports = [],
}: SportSelectionModalProps) => {
  const { user } = useAuth();
  const [availableSports, setAvailableSports] = useState<SportCategory[]>([]);
  const [selectedSports, setSelectedSports] = useState<string[]>(preSelectedSports);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableSports();
      setSelectedSports(preSelectedSports);
    }
  }, [isOpen, preSelectedSports]);

  const fetchAvailableSports = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("sport_categories")
        .select("*")
        .eq("is_published", true)
        .order("name");

      if (error) throw error;
      setAvailableSports(data || []);
    } catch (error) {
      console.error("Error fetching sports:", error);
      toast.error("Nie udało się załadować sportów");
    } finally {
      setLoading(false);
    }
  };

  const toggleSport = (sportId: string) => {
    setSelectedSports((prev) =>
      prev.includes(sportId)
        ? prev.filter((id) => id !== sportId)
        : [...prev, sportId]
    );
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ sports: selectedSports })
        .eq("id", user.id);

      if (error) throw error;

      toast.success("Sporty zapisane!");
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error saving sports:", error);
      toast.error("Nie udało się zapisać sportów");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white text-2xl">
            Wybierz swoje sporty
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Zaznacz sporty, którymi się interesujesz. Możesz to zmienić później.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 py-4">
            {availableSports.map((sport) => (
              <Card
                key={sport.id}
                className={`cursor-pointer transition-all duration-200 ${
                  selectedSports.includes(sport.id)
                    ? "bg-purple-500/20 border-purple-400/50"
                    : "bg-white/5 border-white/10 hover:border-white/20"
                }`}
                onClick={() => toggleSport(sport.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start space-x-3">
                    <Checkbox
                      checked={selectedSports.includes(sport.id)}
                      onCheckedChange={() => toggleSport(sport.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {sport.icon && (
                          <span className="text-2xl">{sport.icon}</span>
                        )}
                        <h3 className="font-semibold text-white">
                          {sport.name}
                        </h3>
                      </div>
                      {sport.description && (
                        <p className="text-sm text-muted-foreground">
                          {sport.description}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="border-white/10"
          >
            Anuluj
          </Button>
          <Button
            onClick={handleSave}
            disabled={selectedSports.length === 0 || saving}
            className="bg-gradient-to-r from-purple-500 to-pink-500"
          >
            {saving ? "Zapisywanie..." : `Potwierdź wybór (${selectedSports.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default SportSelectionModal;
