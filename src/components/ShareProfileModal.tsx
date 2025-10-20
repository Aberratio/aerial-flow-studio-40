import React, { useState } from 'react';
import { Share2, Copy, Twitter, Facebook, Link } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface ShareProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profileId: string;
  profileName: string;
}

export const ShareProfileModal: React.FC<ShareProfileModalProps> = ({
  isOpen,
  onClose,
  profileId,
  profileName
}) => {
  const { toast } = useToast();
  const profileUrl = `${window.location.origin}/profile/${profileId}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(profileUrl);
      toast({
        title: "Link skopiowany!",
        description: "Link do profilu został skopiowany do schowka.",
      });
    } catch (error) {
      toast({
        title: "Błąd",
        description: "Nie udało się skopiować linku do schowka.",
        variant: "destructive"
      });
    }
  };

  const shareToTwitter = () => {
    const text = `Sprawdź profil ${profileName} w naszej aplikacji fitness!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[96vw] max-w-md max-h-[80vh] overflow-y-auto glass-effect border-white/10 text-white p-4 sm:p-6">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-center sm:text-left">
            Udostępnij profil {profileName}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 sm:space-y-6">
          {/* Profile URL Input */}
          <div className="space-y-2">
            <Label className="text-white/80 text-sm">Link do profilu</Label>
            <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <Input
                value={profileUrl}
                readOnly
                className="bg-white/5 border-white/20 text-white text-sm flex-1 h-10"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10 h-10 px-4"
              >
                <Copy className="w-4 h-4 sm:mr-2" />
                <span className="hidden sm:inline">Kopiuj</span>
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <Label className="text-white/80 text-sm">Udostępnij przez</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <Button
                onClick={shareToTwitter}
                variant="outline"
                className="border-white/20 text-white hover:bg-blue-500/20 hover:border-blue-400 h-10 text-sm"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={shareToFacebook}
                variant="outline"
                className="border-white/20 text-white hover:bg-blue-600/20 hover:border-blue-500 h-10 text-sm"
              >
                <Facebook className="w-4 h-4 mr-2" />
                Facebook
              </Button>
            </div>
          </div>

          {/* Quick Copy Button */}
          <Button
            onClick={copyToClipboard}
            variant="primary"
            className="w-full h-10 text-sm"
          >
            <Link className="w-4 h-4 mr-2" />
            Kopiuj link do profilu
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};