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
        title: "Link copied!",
        description: "Exercise link has been copied to your clipboard.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: "Failed to copy",
        description: "Could not copy link to clipboard.",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-black/95 border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Share Exercise</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share {exerciseName} with others by copying the link below.
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
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};