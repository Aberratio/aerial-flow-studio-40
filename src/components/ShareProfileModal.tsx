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
        title: "Link copied!",
        description: "Profile link has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy link to clipboard.",
        variant: "destructive"
      });
    }
  };

  const shareToTwitter = () => {
    const text = `Check out ${profileName}'s profile on our fitness app!`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank');
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-md max-h-[90vh] overflow-y-auto glass-effect border-white/10 text-white mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Share {profileName}'s Profile
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Profile URL Input */}
          <div className="space-y-2">
            <Label className="text-white/80">Profile Link</Label>
            <div className="flex space-x-2">
              <Input
                value={profileUrl}
                readOnly
                className="bg-white/5 border-white/20 text-white flex-1"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="border-white/20 text-white hover:bg-white/10"
              >
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3">
            <Label className="text-white/80">Share via</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={shareToTwitter}
                variant="outline"
                className="border-white/20 text-white hover:bg-blue-500/20 hover:border-blue-400"
              >
                <Twitter className="w-4 h-4 mr-2" />
                Twitter
              </Button>
              <Button
                onClick={shareToFacebook}
                variant="outline"
                className="border-white/20 text-white hover:bg-blue-600/20 hover:border-blue-500"
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
            className="w-full"
          >
            <Link className="w-4 h-4 mr-2" />
            Copy Profile Link
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};