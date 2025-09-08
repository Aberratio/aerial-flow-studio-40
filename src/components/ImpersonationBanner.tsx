import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { UserX, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const ImpersonationBanner: React.FC = () => {
  const { isImpersonating, originalAdminUser, user, exitImpersonation } = useAuth();

  if (!isImpersonating || !originalAdminUser || !user) {
    return null;
  }

  const handleExitImpersonation = async () => {
    try {
      await exitImpersonation();
      toast.success(`Returned to admin account: ${originalAdminUser.username}`);
    } catch (error) {
      console.error('Failed to exit impersonation:', error);
      toast.error('Failed to exit impersonation');
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5" />
            <div className="flex items-center gap-2">
              <span className="font-medium">Admin Mode:</span>
              <span>Viewing as</span>
              <Badge variant="secondary" className="bg-white/20 text-white">
                {user.username}
              </Badge>
              <span className="text-sm opacity-90">
                (Admin: {originalAdminUser.username})
              </span>
            </div>
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleExitImpersonation}
            className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:text-white"
          >
            <UserX className="w-4 h-4 mr-2" />
            Exit Impersonation
          </Button>
        </div>
      </div>
    </div>
  );
};