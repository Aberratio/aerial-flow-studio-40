import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Eye, UserPlus, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface DemoUser {
  id: string;
  user_id: string;
  sport_category: string;
  granted_at: string;
  notes?: string;
  granted_by?: string;
  profiles: {
    username: string;
    email?: string;
  };
  granter?: {
    username: string;
  };
}

interface SportDemoUsersManagerProps {
  sportCategory: string;
}

export default function SportDemoUsersManager({ sportCategory }: SportDemoUsersManagerProps) {
  const { user } = useAuth();
  const [demoUsers, setDemoUsers] = useState<DemoUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  // Add user form
  const [usernameSearch, setUsernameSearch] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchDemoUsers();
  }, [sportCategory]);

  const fetchDemoUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("sport_demo_users")
        .select(`
          id,
          user_id,
          sport_category,
          granted_at,
          notes,
          granted_by,
          profiles!sport_demo_users_user_id_fkey(username, email),
          granter:profiles!sport_demo_users_granted_by_fkey(username)
        `)
        .eq("sport_category", sportCategory)
        .order("granted_at", { ascending: false });

      if (error) throw error;
      setDemoUsers((data as any) || []);
    } catch (error) {
      console.error("Błąd pobierania demo users:", error);
      toast.error("Nie udało się załadować listy użytkowników demo");
    } finally {
      setLoading(false);
    }
  };

  const addDemoUser = async () => {
    if (!usernameSearch.trim() || !user) {
      toast.error("Wprowadź nazwę użytkownika");
      return;
    }

    try {
      setAdding(true);

      // Find user by username or email
      const { data: foundUser, error: findError } = await supabase
        .from("profiles")
        .select("id, username, email")
        .or(`username.ilike.%${usernameSearch}%,email.ilike.%${usernameSearch}%`)
        .limit(1)
        .single();

      if (findError || !foundUser) {
        toast.error("Nie znaleziono użytkownika");
        return;
      }

      // Check if already has demo access
      const { data: existing } = await supabase
        .from("sport_demo_users")
        .select("id")
        .eq("user_id", foundUser.id)
        .eq("sport_category", sportCategory)
        .maybeSingle();

      if (existing) {
        toast.error("Użytkownik już ma dostęp demo");
        return;
      }

      // Add demo access
      const { error: insertError } = await supabase
        .from("sport_demo_users")
        .insert({
          user_id: foundUser.id,
          sport_category: sportCategory,
          granted_by: user.id,
          notes: notes.trim() || null,
        });

      if (insertError) throw insertError;

      toast.success(`Dodano dostęp demo dla ${foundUser.username}`);
      setUsernameSearch("");
      setNotes("");
      fetchDemoUsers();
    } catch (error) {
      console.error("Błąd dodawania demo user:", error);
      toast.error("Nie udało się dodać dostępu demo");
    } finally {
      setAdding(false);
    }
  };

  const removeDemoUser = async (demoUserId: string, username: string) => {
    if (!confirm(`Usunąć dostęp demo dla użytkownika ${username}?`)) return;

    try {
      const { error } = await supabase
        .from("sport_demo_users")
        .delete()
        .eq("id", demoUserId);

      if (error) throw error;

      toast.success("Usunięto dostęp demo");
      fetchDemoUsers();
    } catch (error) {
      console.error("Błąd usuwania demo user:", error);
      toast.error("Nie udało się usunąć dostępu demo");
    }
  };

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Eye className="w-5 h-5" />
          Demo Users - Beta Testerzy
        </CardTitle>
        <CardDescription className="text-white/70">
          Użytkownicy z dostępem demo mogą przełączać się między trybem użytkownika
          a trybem demo (wszystkie poziomy odblokowane)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add demo user form */}
        <div className="bg-purple-500/10 border border-purple-400/20 rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2 text-purple-400 font-semibold">
            <UserPlus className="w-5 h-5" />
            <span>Dodaj użytkownika demo</span>
          </div>
          <div className="grid gap-3">
            <div>
              <Label className="text-white">Nazwa użytkownika lub email</Label>
              <Input
                value={usernameSearch}
                onChange={(e) => setUsernameSearch(e.target.value)}
                placeholder="Wpisz username lub email"
                className="bg-white/5 border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white">Notatki (opcjonalne)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Np. Beta tester, influencer, itp."
                className="bg-white/5 border-white/20 text-white"
                rows={2}
              />
            </div>
            <Button
              onClick={addDemoUser}
              disabled={adding || !usernameSearch.trim()}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              {adding ? "Dodawanie..." : "Dodaj dostęp demo"}
            </Button>
          </div>
        </div>

        {/* List of demo users */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Ładowanie...</div>
        ) : demoUsers.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Brak użytkowników z dostępem demo
          </div>
        ) : (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white/80 uppercase tracking-wide">
              Aktywni użytkownicy demo ({demoUsers.length})
            </h3>
            {demoUsers.map((demoUser) => (
              <Card key={demoUser.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-white font-semibold">
                          {demoUser.profiles.username}
                        </span>
                        <Badge className="bg-purple-500/20 text-purple-400 border-purple-400/30">
                          <Eye className="w-3 h-3 mr-1" />
                          Demo Access
                        </Badge>
                      </div>
                      {demoUser.profiles.email && (
                        <p className="text-sm text-muted-foreground">{demoUser.profiles.email}</p>
                      )}
                      {demoUser.notes && (
                        <p className="text-sm text-white/70 italic">{demoUser.notes}</p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(demoUser.granted_at), "d MMM yyyy", { locale: pl })}
                        </span>
                        {demoUser.granter && (
                          <span>Nadane przez: {demoUser.granter.username}</span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeDemoUser(demoUser.id, demoUser.profiles.username)}
                      className="border-red-400/30 text-red-400 hover:bg-red-400/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
