import React, { useState } from 'react';
import { Copy, Check, Globe, Users, Lock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

interface SharePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  postId: string;
  userName: string;
  post?: any;
}

export const SharePostModal = ({ isOpen, onClose, postId, userName, post }: SharePostModalProps) => {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  
  const shareUrl = `${window.location.origin}/post/${postId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast({
        title: "Link copied!",
        description: "Post link has been copied to your clipboard.",
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

  const getPrivacyIcon = () => {
    switch (post?.privacy) {
      case 'friends':
        return <Users className="w-4 h-4 text-blue-400" />;
      case 'private':
        return <Lock className="w-4 h-4 text-red-400" />;
      default:
        return <Globe className="w-4 h-4 text-green-400" />;
    }
  };

  const getPrivacyText = () => {
    switch (post?.privacy) {
      case 'friends':
        return 'Friends only';
      case 'private':
        return 'Only me';
      default:
        return 'Public';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Share Post</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Share {userName}'s post with others by copying the link below.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Privacy Info */}
          {post && (
            <div className="bg-white/5 rounded-lg p-3 border border-white/10">
              <div className="flex items-center space-x-2 mb-2">
                {getPrivacyIcon()}
                <span className="text-white font-medium">{getPrivacyText()}</span>
              </div>
              <p className="text-muted-foreground text-xs">
                {post.privacy === 'private' 
                  ? 'This post is private and only visible to the author'
                  : post.privacy === 'friends' 
                  ? 'This post is only visible to friends of the author'
                  : 'This post is public and visible to everyone'
                }
              </p>
            </div>
          )}
          
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