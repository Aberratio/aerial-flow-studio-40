import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Challenge {
  id: string;
  title: string;
  premium: boolean;
}

interface RedemptionCode {
  id: string;
  code: string;
  challenge_id: string;
  challenge?: Challenge;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

const RedemptionCodeManager = () => {
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [newCode, setNewCode] = useState("");
  const [selectedChallenge, setSelectedChallenge] = useState("");
  const [maxUses, setMaxUses] = useState(1);
  const [hasExpiration, setHasExpiration] = useState(false);
  const [expirationDate, setExpirationDate] = useState<Date>();
  
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const { data, error } = await supabase
        .from("challenges")
        .select("id, title, premium")
        .eq("premium", true)
        .order("title");

      if (error) throw error;
      setChallenges(data || []);
    } catch (error) {
      console.error("Error fetching challenges:", error);
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive",
      });
    }
  };

  const fetchCodes = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("challenge_redemption_codes")
        .select(`
          *,
          challenge:challenges(id, title, premium)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error("Error fetching codes:", error);
      toast({
        title: "Error",
        description: "Failed to load redemption codes",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewCode(result);
  };

  const handleCreateCode = async () => {
    if (!newCode.trim() || !selectedChallenge) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("challenge_redemption_codes")
        .insert({
          code: newCode.toUpperCase(),
          challenge_id: selectedChallenge,
          max_uses: maxUses,
          expires_at: hasExpiration && expirationDate 
            ? expirationDate.toISOString() 
            : null,
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Redemption code created successfully",
      });

      // Reset form
      setNewCode("");
      setSelectedChallenge("");
      setMaxUses(1);
      setHasExpiration(false);
      setExpirationDate(undefined);
      setIsDialogOpen(false);

      // Refresh codes
      fetchCodes();
    } catch (error: any) {
      console.error("Error creating code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create redemption code",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (codeId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("challenge_redemption_codes")
        .update({ is_active: isActive })
        .eq("id", codeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Code ${isActive ? "activated" : "deactivated"} successfully`,
      });

      fetchCodes();
    } catch (error) {
      console.error("Error updating code:", error);
      toast({
        title: "Error",
        description: "Failed to update code status",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCode = async (codeId: string) => {
    if (!confirm("Are you sure you want to delete this redemption code?")) {
      return;
    }

    try {
      const { error } = await supabase
        .from("challenge_redemption_codes")
        .delete()
        .eq("id", codeId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Redemption code deleted successfully",
      });

      fetchCodes();
    } catch (error) {
      console.error("Error deleting code:", error);
      toast({
        title: "Error",
        description: "Failed to delete redemption code",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Redemption Code Manager
              </h1>
              <p className="text-muted-foreground">
                Create and manage premium challenge redemption codes
              </p>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Code
                </Button>
              </DialogTrigger>
              <DialogContent className="glass-effect border-white/10 text-white">
                <DialogHeader>
                  <DialogTitle className="text-white">Create Redemption Code</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Code</Label>
                    <div className="flex gap-2">
                      <Input
                        value={newCode}
                        onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                        placeholder="Enter code or generate random"
                        className="bg-white/10 border-white/20 text-white"
                      />
                      <Button 
                        variant="outline" 
                        onClick={generateRandomCode}
                        className="border-white/20 text-white hover:bg-white/10"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Challenge</Label>
                    <Select value={selectedChallenge} onValueChange={setSelectedChallenge}>
                      <SelectTrigger className="bg-white/10 border-white/20 text-white">
                        <SelectValue placeholder="Select a challenge" />
                      </SelectTrigger>
                      <SelectContent>
                        {challenges.map((challenge) => (
                          <SelectItem key={challenge.id} value={challenge.id}>
                            {challenge.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Maximum Uses</Label>
                    <Input
                      type="number"
                      value={maxUses}
                      onChange={(e) => setMaxUses(Number(e.target.value))}
                      min="1"
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={hasExpiration}
                        onCheckedChange={setHasExpiration}
                      />
                      <Label>Set Expiration Date</Label>
                    </div>

                    {hasExpiration && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal bg-white/10 border-white/20 text-white hover:bg-white/20",
                              !expirationDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {expirationDate ? format(expirationDate, "PPP") : "Pick a date"}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={expirationDate}
                            onSelect={setExpirationDate}
                            disabled={(date) => date < new Date()}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  <Button 
                    onClick={handleCreateCode} 
                    className="w-full"
                    variant="primary"
                  >
                    Create Code
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Codes List */}
        <div className="grid gap-4">
          {codes.length === 0 ? (
            <Card className="glass-effect border-white/10">
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No redemption codes created yet</p>
              </CardContent>
            </Card>
          ) : (
            codes.map((code) => (
              <Card key={code.id} className="glass-effect border-white/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-mono text-white bg-white/10 px-3 py-1 rounded">
                          {code.code}
                        </span>
                        <Badge variant={code.is_active ? "default" : "secondary"}>
                          {code.is_active ? "Active" : "Inactive"}
                        </Badge>
                        {code.expires_at && new Date(code.expires_at) < new Date() && (
                          <Badge variant="destructive">Expired</Badge>
                        )}
                      </div>
                      
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p><strong>Challenge:</strong> {code.challenge?.title}</p>
                        <p><strong>Uses:</strong> {code.current_uses} / {code.max_uses}</p>
                        {code.expires_at && (
                          <p><strong>Expires:</strong> {format(new Date(code.expires_at), "PPP")}</p>
                        )}
                        <p><strong>Created:</strong> {format(new Date(code.created_at), "PPP")}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={code.is_active}
                        onCheckedChange={(checked) => handleToggleActive(code.id, checked)}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCode(code.id)}
                        className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default RedemptionCodeManager;