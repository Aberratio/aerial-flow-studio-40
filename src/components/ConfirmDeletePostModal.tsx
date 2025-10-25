import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmDeletePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const ConfirmDeletePostModal = ({ isOpen, onClose, onConfirm, loading }: ConfirmDeletePostModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-red-400" />
            Usuń post
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Czy na pewno chcesz usunąć ten post? Ta operacja jest nieodwracalna.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex justify-end space-x-3 mt-6">
          <Button 
            variant="ghost" 
            onClick={onClose}
            disabled={loading}
            className="text-muted-foreground hover:text-white"
          >
            Anuluj
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700"
          >
            {loading ? 'Usuwanie...' : 'Usuń post'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};