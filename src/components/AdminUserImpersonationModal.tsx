import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, UserCheck, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  role: string;
  created_at: string;
}

interface AdminUserImpersonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminUserImpersonationModal: React.FC<AdminUserImpersonationModalProps> = ({
  isOpen,
  onClose
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { impersonateUser } = useAuth();

  // Search for users
  useEffect(() => {
    const searchUsers = async () => {
      if (searchTerm.length < 2) {
        setUsers([]);
        return;
      }

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, email, avatar_url, role, created_at')
          .or(`username.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .limit(20);

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error searching users:', error);
        toast.error('Failed to search users');
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchTerm]);

  const handleImpersonate = async (userId: string, username: string) => {
    try {
      await impersonateUser(userId);
      toast.success(`Now viewing as ${username}`);
      onClose();
    } catch (error) {
      console.error('Impersonation failed:', error);
      toast.error('Failed to impersonate user');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5" />
            Wciel się w użytkownika
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Szukaj po nazwie użytkownika lub e-mailu..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-orange-500 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-orange-300">
                <p className="font-medium">Ostrzeżenie dla Administratora</p>
                <p className="text-xs mt-1">
                  Zobaczysz aplikację z perspektywy tego użytkownika. Używaj odpowiedzialnie tylko do debugowania.
                </p>
              </div>
            </div>
          </div>

          {searchTerm.length >= 2 && (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4 text-muted-foreground">
                  Wyszukiwanie...
                </div>
              ) : users.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Nie znaleziono użytkowników
                </div>
              ) : (
                users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.avatar_url} />
                        <AvatarFallback className="bg-gradient-to-r from-purple-500 to-pink-500">
                          {user.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.username}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleImpersonate(user.id, user.username)}
                      className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      Wciel się
                    </Button>
                  </div>
                ))
              )}
            </div>
          )}

          {searchTerm.length < 2 && (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>Zacznij pisać, aby wyszukać użytkowników</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};