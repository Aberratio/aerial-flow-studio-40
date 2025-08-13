import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Calendar,
  Users,
  Gift,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface RedemptionCode {
  id: string;
  code: string;
  challenge_id: string;
  max_uses?: number;
  current_uses: number;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
  created_by?: string;
}

interface RedemptionCodeManagementProps {
  challengeId: string;
  challengeTitle: string;
}

const RedemptionCodeManagement: React.FC<RedemptionCodeManagementProps> = ({
  challengeId,
  challengeTitle,
}) => {
  const [codes, setCodes] = useState<RedemptionCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [maxUses, setMaxUses] = useState<number | "">(1);
  const [expiresAt, setExpiresAt] = useState<Date>();
  const [showCodes, setShowCodes] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchCodes();
  }, [challengeId]);

  const fetchCodes = async () => {
    try {
      const { data, error } = await supabase
        .from("challenge_redemption_codes")
        .select("*")
        .eq("challenge_id", challengeId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCodes(data || []);
    } catch (error) {
      console.error("Error fetching redemption codes:", error);
      toast({
        title: "Error",
        description: "Failed to fetch redemption codes",
        variant: "destructive",
      });
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

  const createCode = async () => {
    if (!newCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("challenge_redemption_codes")
        .insert({
          code: newCode.trim().toUpperCase(),
          challenge_id: challengeId,
          max_uses: maxUses || null,
          expires_at: expiresAt?.toISOString() || null,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      setCodes((prev) => [data, ...prev]);
      setIsCreateModalOpen(false);
      setNewCode("");
      setMaxUses(1);
      setExpiresAt(undefined);

      toast({
        title: "Success",
        description: "Redemption code created successfully",
      });
    } catch (error: any) {
      console.error("Error creating redemption code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create redemption code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCodeActive = async (codeId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("challenge_redemption_codes")
        .update({ is_active: isActive })
        .eq("id", codeId);

      if (error) throw error;

      setCodes((prev) =>
        prev.map((code) =>
          code.id === codeId ? { ...code, is_active: isActive } : code
        )
      );

      toast({
        title: "Success",
        description: `Code ${isActive ? "activated" : "deactivated"}`,
      });
    } catch (error) {
      console.error("Error updating code status:", error);
      toast({
        title: "Error",
        description: "Failed to update code status",
        variant: "destructive",
      });
    }
  };

  const deleteCode = async (codeId: string) => {
    try {
      const { error } = await supabase
        .from("challenge_redemption_codes")
        .delete()
        .eq("id", codeId);

      if (error) throw error;

      setCodes((prev) => prev.filter((code) => code.id !== codeId));

      toast({
        title: "Success",
        description: "Redemption code deleted",
      });
    } catch (error) {
      console.error("Error deleting code:", error);
      toast({
        title: "Error",
        description: "Failed to delete code",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Copied",
      description: "Code copied to clipboard",
    });
  };

  const toggleShowCode = (codeId: string) => {
    setShowCodes((prev) => ({ ...prev, [codeId]: !prev[codeId] }));
  };

  const getStatusBadge = (code: RedemptionCode) => {
    const now = new Date();
    const expired = code.expires_at && new Date(code.expires_at) < now;
    const maxedOut = code.max_uses && code.current_uses >= code.max_uses;

    if (!code.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (expired) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    if (maxedOut) {
      return <Badge variant="destructive">Max Uses Reached</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400">Active</Badge>;
  };

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Gift className="w-5 h-5" />
            Redemption Codes
          </CardTitle>
          <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-white/10 text-white">
              <DialogHeader>
                <DialogTitle>Create Redemption Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code">Code</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={newCode}
                      onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                      placeholder="Enter custom code or generate one"
                      className="bg-white/10 border-white/20 text-white"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={generateRandomCode}
                      className="border-white/20"
                    >
                      Generate
                    </Button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="maxUses">Max Uses (optional)</Label>
                  <Input
                    id="maxUses"
                    type="number"
                    value={maxUses}
                    onChange={(e) =>
                      setMaxUses(e.target.value ? parseInt(e.target.value) : "")
                    }
                    placeholder="Unlimited"
                    min="1"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>

                <div>
                  <Label>Expiration Date (optional)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-white/10 border-white/20",
                          !expiresAt && "text-muted-foreground"
                        )}
                      >
                        <Calendar className="mr-2 h-4 w-4" />
                        {expiresAt ? (
                          format(expiresAt, "PPP")
                        ) : (
                          <span>No expiration</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={expiresAt}
                        onSelect={setExpiresAt}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button
                    onClick={createCode}
                    disabled={isLoading}
                    className="flex-1"
                  >
                    Create Code
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="border-white/20"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {codes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No redemption codes created yet</p>
              <p className="text-sm">
                Create codes to give users free access to this challenge
              </p>
            </div>
          ) : (
            codes.map((code) => (
              <Card key={code.id} className="bg-white/5 border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-lg font-bold text-white">
                            {showCodes[code.id] ? code.code : "••••••••"}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleShowCode(code.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showCodes[code.id] ? (
                              <EyeOff className="w-3 h-3" />
                            ) : (
                              <Eye className="w-3 h-3" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(code.code)}
                            className="h-6 w-6 p-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        </div>
                        {getStatusBadge(code)}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          <span>
                            {code.current_uses}
                            {code.max_uses ? `/${code.max_uses}` : ""} uses
                          </span>
                        </div>
                        {code.expires_at && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>
                              Expires {format(new Date(code.expires_at), "PPP")}
                            </span>
                          </div>
                        )}
                        <span>
                          Created {format(new Date(code.created_at), "PPP")}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`active-${code.id}`} className="text-sm">
                          Active
                        </Label>
                        <Switch
                          id={`active-${code.id}`}
                          checked={code.is_active}
                          onCheckedChange={(checked) =>
                            toggleCodeActive(code.id, checked)
                          }
                        />
                      </div>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="glass-effect border-white/10">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">
                              Delete Redemption Code
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground">
                              Are you sure you want to delete this redemption
                              code? This action cannot be undone and users will
                              no longer be able to use this code.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCode(code.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default RedemptionCodeManagement;