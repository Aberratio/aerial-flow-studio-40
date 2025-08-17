import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Calendar, 
  Users, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface TrainingRedemptionCode {
  id: string;
  code: string;
  training_session_id: string;
  max_uses: number;
  current_uses: number;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface TrainingRedemptionCodeManagementProps {
  trainingSessionId: string | undefined;
  onCodesUpdate?: () => void;
}

const TrainingRedemptionCodeManagement: React.FC<TrainingRedemptionCodeManagementProps> = ({
  trainingSessionId,
  onCodesUpdate
}) => {
  const { toast } = useToast();
  const [codes, setCodes] = useState<TrainingRedemptionCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState({
    code: '',
    max_uses: 1,
    expires_at: '',
    is_active: true
  });

  useEffect(() => {
    if (trainingSessionId) {
      fetchCodes();
    }
  }, [trainingSessionId]);

  const fetchCodes = async () => {
    if (!trainingSessionId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("training_redemption_codes")
        .select("*")
        .eq("training_session_id", trainingSessionId)
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
    } finally {
      setLoading(false);
    }
  };

  const generateRandomCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleCreateCode = async () => {
    if (!trainingSessionId) return;

    const codeToCreate = newCode.code.trim() || generateRandomCode();
    
    try {
      const { data, error } = await supabase
        .from("training_redemption_codes")
        .insert({
          code: codeToCreate,
          training_session_id: trainingSessionId,
          max_uses: newCode.max_uses,
          expires_at: newCode.expires_at || null,
          is_active: newCode.is_active,
        })
        .select()
        .single();

      if (error) throw error;

      setCodes(prev => [data, ...prev]);
      setNewCode({ code: '', max_uses: 1, expires_at: '', is_active: true });
      setIsDialogOpen(false);
      onCodesUpdate?.();
      
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
    }
  };

  const handleToggleActive = async (codeId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("training_redemption_codes")
        .update({ is_active: isActive })
        .eq("id", codeId);

      if (error) throw error;

      setCodes(prev =>
        prev.map(code =>
          code.id === codeId ? { ...code, is_active: isActive } : code
        )
      );

      toast({
        title: "Success",
        description: `Code ${isActive ? 'activated' : 'deactivated'} successfully`,
      });
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
    try {
      const { error } = await supabase
        .from("training_redemption_codes")
        .delete()
        .eq("id", codeId);

      if (error) throw error;

      setCodes(prev => prev.filter(code => code.id !== codeId));
      
      toast({
        title: "Success",
        description: "Redemption code deleted",
      });
    } catch (error) {
      console.error("Error deleting code:", error);
      toast({
        title: "Error",
        description: "Failed to delete redemption code",
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Redemption code copied to clipboard",
    });
  };

  const getStatusBadge = (code: TrainingRedemptionCode) => {
    if (!code.is_active) {
      return <Badge variant="secondary">Inactive</Badge>;
    }

    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }

    if (code.current_uses >= code.max_uses) {
      return <Badge variant="outline">Used Up</Badge>;
    }

    return <Badge className="bg-green-500">Active</Badge>;
  };

  if (!trainingSessionId) {
    return (
      <Card className="glass-effect border-white/10">
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">Save the training session first to manage redemption codes</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center">
            <Users className="w-5 h-5 mr-2 text-primary" />
            Redemption Codes
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="border-white/20 text-white hover:bg-white/10">
                <Plus className="w-4 h-4 mr-2" />
                Create Code
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-effect border-white/10">
              <DialogHeader>
                <DialogTitle className="text-white">Create Redemption Code</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="code" className="text-white">
                    Code (leave empty to auto-generate)
                  </Label>
                  <Input
                    id="code"
                    value={newCode.code}
                    onChange={(e) => setNewCode(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
                    placeholder="AUTO-GENERATED"
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/60"
                  />
                </div>

                <div>
                  <Label htmlFor="max_uses" className="text-white">
                    Max Uses
                  </Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min={1}
                    value={newCode.max_uses}
                    onChange={(e) => setNewCode(prev => ({ ...prev, max_uses: parseInt(e.target.value) || 1 }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="expires_at" className="text-white">
                    Expiry Date (optional)
                  </Label>
                  <Input
                    id="expires_at"
                    type="datetime-local"
                    value={newCode.expires_at}
                    onChange={(e) => setNewCode(prev => ({ ...prev, expires_at: e.target.value }))}
                    className="bg-white/5 border-white/10 text-white"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_active"
                    checked={newCode.is_active}
                    onCheckedChange={(checked) => setNewCode(prev => ({ ...prev, is_active: checked }))}
                  />
                  <Label htmlFor="is_active" className="text-white">
                    Active immediately
                  </Label>
                </div>

                <Button
                  onClick={handleCreateCode}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                >
                  Create Code
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No redemption codes created yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Table>
              <TableHeader>
                <TableRow className="border-white/10">
                  <TableHead className="text-white/70">Code</TableHead>
                  <TableHead className="text-white/70">Uses</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                  <TableHead className="text-white/70">Expires</TableHead>
                  <TableHead className="text-white/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {codes.map((code) => (
                  <TableRow key={code.id} className="border-white/10">
                    <TableCell className="text-white font-mono">
                      <div className="flex items-center space-x-2">
                        <span>{code.code}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(code.code)}
                          className="h-6 w-6 p-0 hover:bg-white/10"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-white">
                      {code.current_uses}/{code.max_uses}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(code)}
                    </TableCell>
                    <TableCell className="text-white/70">
                      {code.expires_at 
                        ? new Date(code.expires_at).toLocaleDateString()
                        : 'Never'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(code.id, !code.is_active)}
                          className="h-8 w-8 p-0 hover:bg-white/10"
                        >
                          {code.is_active ? (
                            <EyeOff className="w-4 h-4 text-yellow-400" />
                          ) : (
                            <Eye className="w-4 h-4 text-green-400" />
                          )}
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-white/10 text-red-400"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="glass-effect border-white/10">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-white">
                                Delete Redemption Code
                              </AlertDialogTitle>
                              <AlertDialogDescription className="text-white/70">
                                Are you sure you want to delete the code "{code.code}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="border-white/20 text-white hover:bg-white/10">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDeleteCode(code.id)}
                                className="bg-red-500 hover:bg-red-600"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TrainingRedemptionCodeManagement;