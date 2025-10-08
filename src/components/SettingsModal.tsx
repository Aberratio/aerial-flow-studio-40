import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useSubscriptionStatus } from '@/hooks/useSubscriptionStatus';
import PricingPlansModal from './PricingPlansModal';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, Link } from 'react-router-dom';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Separator } from '@/components/ui/separator';
import { Shield, FileText, Info, CreditCard, Crown, Trash2, LogOut, Mail } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SettingsModal = ({ isOpen, onClose }: SettingsModalProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { hasPremiumAccess, subscribed, subscription_tier, subscription_end, isLoading } = useSubscriptionStatus();
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
    onClose();
  };

  const handleDeleteAccount = async () => {
    try {
      const { error } = await supabase.auth.admin.deleteUser(user?.id || '');
      if (error) throw error;
      
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      navigate('/');
    } catch (error) {
      console.error('Delete account error:', error);
      toast({
        title: "Error",
        description: "Failed to delete account. Please contact support.",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="w-[96vw] max-w-[600px] max-h-[85vh] overflow-y-auto glass-effect border-white/10 p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Settings</DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Account Section */}
            <Card className="glass-effect border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Mail className="w-5 h-5 text-primary" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Email</span>
                  <span className="text-white text-sm">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Username</span>
                  <span className="text-white text-sm">{user?.username}</span>
                </div>
              </CardContent>
            </Card>

            {/* Subscription & Billing */}
            <Card className="glass-effect border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-400" />
                  Subscription & Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  </div>
                ) : hasPremiumAccess ? (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Current Plan</span>
                      <span className="text-green-400 text-sm font-medium">
                        {subscription_tier || user?.role || 'Premium'}
                      </span>
                    </div>

                    {subscribed && subscription_end ? (
                      <>
                        <div className="bg-white/5 p-3 rounded-lg space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Active until:</span>
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
                          className="w-full border-white/20 text-white hover:bg-white/10"
                        >
                          <CreditCard className="w-4 h-4 mr-2" />
                          Manage Subscription
                        </Button>
                      </>
                    ) : (
                      <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-4 h-4 text-blue-400" />
                          <span className="text-blue-400 font-medium text-sm">Manual Premium Access</span>
                        </div>
                        <p className="text-blue-300 text-xs">
                          Your premium access was granted manually by an administrator.
                        </p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">Current Plan</span>
                      <span className="text-gray-400 text-sm">Free</span>
                    </div>
                    <p className="text-muted-foreground text-sm">
                      Upgrade to unlock premium features!
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
                
                {(!hasPremiumAccess || subscribed) && (
                  <Button
                    variant="outline"
                    className="w-full border-white/20 text-white hover:bg-white/10"
                    onClick={() => setIsPricingModalOpen(true)}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    View Pricing Plans
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Information Links */}
            <Card className="glass-effect border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-base flex items-center gap-2">
                  <Info className="w-5 h-5 text-primary" />
                  Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Link to="/privacy-policy" onClick={onClose}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
                  >
                    <Shield className="w-4 h-4 mr-3" />
                    Privacy Policy
                  </Button>
                </Link>
                <Link to="/terms-of-use" onClick={onClose}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
                  >
                    <FileText className="w-4 h-4 mr-3" />
                    Terms of Use
                  </Button>
                </Link>
                <Link to="/about-us" onClick={onClose}>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-muted-foreground hover:text-white hover:bg-white/5"
                  >
                    <Info className="w-4 h-4 mr-3" />
                    About Us
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="glass-effect border-red-500/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-red-400 text-base flex items-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Danger Zone
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  className="w-full justify-start border-white/20 text-white hover:bg-white/10"
                  onClick={() => setShowLogoutDialog(true)}
                >
                  <LogOut className="w-4 h-4 mr-3" />
                  Log Out
                </Button>
                
                <Button
                  variant="outline"
                  className="w-full justify-start border-red-500/50 text-red-400 hover:bg-red-500/10"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-3" />
                  Delete Account
                </Button>
              </CardContent>
            </Card>
          </div>

          <PricingPlansModal
            isOpen={isPricingModalOpen}
            onClose={() => setIsPricingModalOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="glass-effect border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout} className="bg-destructive hover:bg-destructive/90">
              Log Out
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Account Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="glass-effect border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Account</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteAccount} 
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};