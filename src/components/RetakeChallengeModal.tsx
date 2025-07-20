import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface RetakeChallengeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  challengeTitle: string;
  isLoading?: boolean;
}

const RetakeChallengeModal: React.FC<RetakeChallengeModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  challengeTitle,
  isLoading = false
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            Retake Challenge
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Are you sure you want to retake this challenge?
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-400 mb-2">⚠️ Important Warning</h3>
            <ul className="space-y-1 text-sm text-muted-foreground">
              <li>• All your current progress in "{challengeTitle}" will be permanently deleted</li>
              <li>• You will start from Day 1 again</li>
              <li>• Previous achievements and points from this challenge will be reset</li>
              <li>• This action cannot be undone</li>
            </ul>
          </div>
          
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={onConfirm}
              className="flex-1"
              disabled={isLoading}
            >
              {isLoading ? 'Resetting...' : 'Yes, Retake Challenge'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RetakeChallengeModal;