import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Star, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PricingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingPlansModal: React.FC<PricingPlansModalProps> = ({ isOpen, onClose }) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started with basic training',
      features: [
        'Access to basic exercises',
        'Limited training sessions',
        'Community support',
        'Basic progress tracking'
      ],
      icon: Star,
      color: 'text-gray-400',
      bgColor: 'bg-gray-500/10',
      borderColor: 'border-gray-500/30',
      current: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '$10',
      period: 'per month',
      description: 'Unlock advanced features and unlimited access',
      features: [
        'Unlimited training sessions',
        'Advanced exercise library',
        'Personalized training plans',
        'Progress analytics',
        'Premium support',
        'Challenge participation',
        'Export workout data'
      ],
      icon: Crown,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/50',
      popular: true
    }
  ];

  const handlePlanSelect = async (planId: string) => {
    if (planId === 'free') {
      toast({
        title: "Current Plan",
        description: "You're already on the free plan!"
      });
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { paymentType: 'subscription' }
      });
      
      if (error) throw error;
      
      // Open Stripe checkout in a new tab
      if (data.url) {
        window.open(data.url, '_blank');
      }
      
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto glass-effect border-white/10 text-white mx-4">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl gradient-text text-center">Choose Your Plan</DialogTitle>
          <p className="text-muted-foreground text-center text-sm sm:text-base">
            Upgrade your training experience with premium features
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mt-6">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.current;
            const isSelected = selectedPlan === plan.id;
            
            return (
              <Card 
                key={plan.id} 
                className={`glass-effect transition-all duration-200 relative ${
                  plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                } ${isSelected ? 'ring-2 ring-blue-500' : 'border-white/10'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                  </div>
                )}
                
                <CardHeader className="text-center p-4 sm:p-6">
                  <div className={`w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-4 rounded-full ${plan.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 sm:w-8 sm:h-8 ${plan.color}`} />
                  </div>
                  <CardTitle className="text-white text-lg sm:text-xl">{plan.name}</CardTitle>
                  <div className="space-y-1">
                    <div className="text-2xl sm:text-3xl font-bold text-white">
                      {plan.price}
                      <span className="text-sm sm:text-lg font-normal text-muted-foreground">
                        /{plan.period}
                      </span>
                    </div>
                    <p className="text-muted-foreground text-xs sm:text-sm">{plan.description}</p>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 sm:p-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-3">
                        <Check className="w-3 h-3 sm:w-4 sm:h-4 text-green-400 flex-shrink-0" />
                        <span className="text-xs sm:text-sm text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={isCurrentPlan || isLoading}
                    className={`w-full text-sm sm:text-base py-2 sm:py-3 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600' 
                        : 'bg-white/10 hover:bg-white/20 border border-white/20'
                    }`}
                  >
                    {isLoading && isSelected ? (
                      'Processing...'
                    ) : isCurrentPlan ? (
                      'Current Plan'
                    ) : (
                      `Choose ${plan.name}`
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-muted-foreground text-sm">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
          <p className="text-muted-foreground text-xs">
            Payments are processed securely through Stripe. Your data is protected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingPlansModal;