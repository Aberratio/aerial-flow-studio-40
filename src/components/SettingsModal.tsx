import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Moon, 
  Globe, 
  Trash2, 
  LogOut,
  Crown,
  CreditCard
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import PricingPlansModal from '@/components/PricingPlansModal';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { hasPremiumAccess, subscribed, subscription_tier, subscription_end, isLoading } = useSubscriptionStatus();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const handleSaveSettings = () => {
    toast({
      title: "Settings Saved",
      description: "Your preferences have been updated.",
    });
    onClose();
  };

  const handleDeleteAccount = () => {
    // Would show confirmation dialog
    toast({
      title: "Account Deletion",
      description: "This action requires confirmation. Please contact support.",
      variant: "destructive",
    });
  };

  const handleLogout = () => {
    // Would handle logout logic
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto glass-effect border-white/10">
        <DialogHeader>
          <DialogTitle className="text-white">Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Subscription & Billing */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Crown className="w-5 h-5 text-yellow-400" />
              <h3 className="text-white font-semibold">Subscription & Billing</h3>
            </div>
            
            <div className="space-y-3 pl-7">
              <div className="bg-white/5 p-4 rounded-lg border border-white/10">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : hasPremiumAccess ? (
                  <>
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-white font-medium">Current Plan</span>
                      <span className="text-green-400 text-sm font-medium">
                        {subscription_tier || user?.role || 'Premium'}
                      </span>
                    </div>

                    {/* Check if user has Stripe subscription or manual premium */}
                    {subscribed && subscription_end ? (
                      <>
                        {/* Stripe subscription details */}
                        <div className="space-y-2 mb-4">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Subscription active until:</span>
                            <span className="text-white">
                              {new Date(subscription_end).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Next billing date:</span>
                            <span className="text-white">
                              {new Date(subscription_end).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Plan type:</span>
                            <span className="text-white">Monthly subscription</span>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={async () => {
                              try {
                                const { data, error } = await supabase.functions.invoke('customer-portal');
                                if (error) throw error;
                                if (data.url) window.open(data.url, '_blank');
                              } catch (error) {
                                console.error('Portal error:', error);
                                toast({
                                  title: "Error",
                                  description: "Failed to open subscription management portal",
                                  variant: "destructive"
                                });
                              }
                            }}
                            className="flex-1 border-white/20 text-white hover:bg-white/10"
                          >
                            <CreditCard className="w-4 h-4 mr-2" />
                            Manage Subscription
                          </Button>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Manual premium (no Stripe subscription) */}
                        <div className="space-y-2 mb-4">
                          <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <Crown className="w-4 h-4 text-blue-400" />
                              <span className="text-blue-400 font-medium text-sm">Manual Premium Access</span>
                            </div>
                            <p className="text-blue-300 text-xs">
                              Your premium access was granted manually by an administrator. 
                              This is not a recurring subscription and won't auto-renew.
                            </p>
                          </div>
                        </div>
                        
                        <p className="text-muted-foreground text-sm">
                          To upgrade to a recurring subscription plan, click the button below.
                        </p>
                        
                        <Button
                          variant="outline"
                          onClick={async () => {
                            try {
                              const { data, error } = await supabase.functions.invoke('create-checkout', {
                                body: { paymentType: 'subscription' }
                              });
                              if (error) throw error;
                              if (data.url) window.open(data.url, '_blank');
                            } catch (error) {
                              console.error('Checkout error:', error);
                              toast({
                                title: "Error",
                                description: "Failed to start checkout process",
                                variant: "destructive"
                              });
                            }
                          }}
                          className="w-full border-white/20 text-white hover:bg-white/10"
                        >
                          <Crown className="w-4 h-4 mr-2" />
                          Subscribe to Premium Plan
                        </Button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-white font-medium">Current Plan</span>
                      <span className="text-gray-400 text-sm">Free</span>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3">
                      You're currently on the free plan. Upgrade to unlock premium features!
                    </p>
                    <Button
                      variant="primary"
                      onClick={async () => {
                        try {
                          const { data, error } = await supabase.functions.invoke('create-checkout', {
                            body: { paymentType: 'subscription' }
                          });
                          if (error) throw error;
                          if (data.url) window.open(data.url, '_blank');
                        } catch (error) {
                          console.error('Checkout error:', error);
                          toast({
                            title: "Error",
                            description: "Failed to start checkout process",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="w-full"
                    >
                      <Crown className="w-4 h-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  </>
                )}
              </div>
              {/* Only show View Pricing Plans for free users and users with Stripe subscriptions */}
              {(!hasPremiumAccess || subscribed) && (
                <Button
                  variant="outline"
                  className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                  onClick={() => setIsPricingModalOpen(true)}
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  View Pricing Plans
                </Button>
              )}
            </div>
          </div>

          <Separator className="bg-white/10" />

          {/* Account Actions */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Button
                variant="outline"
                className="w-full justify-start border-white/20 text-white hover:bg-white/10 hover:text-white"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4 mr-2" />
                Log Out
              </Button>
              
              <Button
                variant="outline"
                className="w-full justify-start border-red-500/50 text-red-400 hover:bg-red-500/10"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </Button>
            </div>
          </div>

          {/* Save Button */}
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            className="w-full"
          >
            Save Settings
          </Button>
        </div>

        {/* Pricing Plans Modal */}
        <PricingPlansModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
};