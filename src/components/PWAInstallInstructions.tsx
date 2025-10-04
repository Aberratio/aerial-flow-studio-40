import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Share, Plus, Smartphone } from 'lucide-react';

interface PWAInstallInstructionsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isIOSDevice: boolean;
}

const PWAInstallInstructions: React.FC<PWAInstallInstructionsProps> = ({
  open,
  onOpenChange,
  isIOSDevice,
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Install IguanaFlow App
          </DialogTitle>
          <DialogDescription>
            {isIOSDevice
              ? 'Follow these steps to install the app on your iPhone/iPad:'
              : 'Install the app for a better experience'}
          </DialogDescription>
        </DialogHeader>

        {isIOSDevice ? (
          <div className="space-y-4 py-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                1
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  Tap the <Share className="inline w-4 h-4 mx-1" /> <strong>Share</strong> button at the bottom of your Safari browser
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                2
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  Scroll down and tap <Plus className="inline w-4 h-4 mx-1" /> <strong>"Add to Home Screen"</strong>
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold">
                3
              </div>
              <div className="flex-1">
                <p className="text-sm">
                  Tap <strong>"Add"</strong> in the top right corner
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-muted rounded-lg">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> This only works in Safari browser. If you're using another browser, please open this page in Safari first.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Your browser will prompt you to install the app. Follow the on-screen instructions to complete the installation.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallInstructions;
