import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Users, BookOpen, Target, BarChart3, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
}

export const PricingModal = ({ isOpen, onClose, onUpgrade }: PricingModalProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const freeFeatures = [
    'Post updates to your feed',
    'Invite and follow friends',
    'View community posts',
    'Basic profile customization'
  ];

  const premiumFeatures = [
    'All Free features',
    'Access to figure library',
    'Create training sessions',
    'Join challenges',
    'Track your progress',
    'Advanced analytics',
    'Priority support'
  ];

  const handleUpgradeClick = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { paymentType: 'subscription' }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      if (data.url) {
        window.open(data.url, '_blank');
        onClose(); // Close modal after opening checkout
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-black/95 border-white/10 mx-4">
        <DialogHeader>
          <DialogTitle className="text-white text-center text-xl sm:text-2xl">
            Choose Your Plan
          </DialogTitle>
          <p className="text-white/70 text-center text-sm sm:text-base">
            Start your aerial journey with the perfect plan for you
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
          {/* Free Plan */}
          <Card className="bg-white/5 border-white/10 relative">
            <CardHeader className="text-center p-4 sm:p-6">
              <div className="flex items-center justify-center mb-2">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
              </div>
              <CardTitle className="text-white text-xl sm:text-2xl">Free</CardTitle>
              <CardDescription className="text-white/70 text-sm sm:text-base">
                Perfect for getting started
              </CardDescription>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-bold text-white">$0</span>
                <span className="text-white/70 text-sm sm:text-base">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <ul className="space-y-3">
                {freeFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-white/80 text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={onClose}
                variant="outline"
                className="w-full border-white/20 text-white hover:bg-white/10 text-sm sm:text-base py-2 sm:py-3"
              >
                Continue with Free
              </Button>
            </CardContent>
          </Card>

          {/* Premium Plan */}
          <Card className="bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/50 relative">
            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
              RECOMMENDED
            </Badge>
            <CardHeader className="text-center p-4 sm:p-6">
              <div className="flex items-center justify-center mb-2">
                <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
              </div>
              <CardTitle className="text-white text-xl sm:text-2xl">Premium</CardTitle>
              <CardDescription className="text-white/70 text-sm sm:text-base">
                Unlock your full potential
              </CardDescription>
              <div className="mt-4">
                <span className="text-2xl sm:text-3xl font-bold text-white">$10</span>
                <span className="text-white/70 text-sm sm:text-base">/month</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <ul className="space-y-3">
                {premiumFeatures.map((feature, index) => (
                  <li key={index} className="flex items-center text-white/80 text-sm sm:text-base">
                    <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-3 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
              <Button
                onClick={handleUpgradeClick}
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600 text-sm sm:text-base py-2 sm:py-3"
              >
                {isLoading ? 'Processing...' : 'Upgrade to Premium'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-center">
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-white/60 hover:text-white"
          >
            <X className="w-4 h-4 mr-2" />
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};