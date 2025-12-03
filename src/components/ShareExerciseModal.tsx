import React, { useState } from 'react';
import { Copy, Check, Share2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface ShareExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseId: string;
  exerciseName: string;
}

export const ShareExerciseModal = ({ isOpen, onClose, exerciseId, exerciseName }: ShareExerciseModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/exercise/${exerciseId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link skopiowany!",
        description: "Link do ćwiczenia został skopiowany do schowka.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Nie udało się skopiować",
        description: "Nie można skopiować linku do schowka.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Udostępnij ćwiczenie</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Udostępnij {exerciseName} innym kopiując link poniżej.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="flex space-x-2">
            <Input
              value={shareUrl}
              readOnly
              className="bg-white/5 border-white/10 text-white"
            />
            <Button
              variant="primary"
              onClick={handleCopy}
              size="sm"
              className="shrink-0"
            >
              {copied ? (
                <Check className="w-4 h-4" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </Button>
          </div>
          
          <div className="flex justify-end">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-white">
              Zamknij
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
