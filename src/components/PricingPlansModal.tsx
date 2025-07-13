import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Check, Crown, Star, Users, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PricingPlansModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingPlansModal: React.FC<PricingPlansModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState<"USD" | "PLN">("USD");
  const { toast } = useToast();

  const getCurrencySymbol = () => (currency === "USD" ? "$" : "zł");
  const getPremiumPrice = () => (currency === "USD" ? "10" : "40");

  const plans = [
    {
      id: "free",
      name: "Free",
      price: `${getCurrencySymbol()}0`,
      period: "forever",
      description: "Perfect for getting started with basic training",
      features: [
        "Access to basic exercises",
        "Limited training sessions",
        "Community support",
        "Basic progress tracking",
      ],
      icon: Star,
      color: "text-gray-400",
      bgColor: "bg-gray-500/10",
      borderColor: "border-gray-500/30",
      current: true,
    },
    {
      id: "premium",
      name: "Premium",
      price: `${getCurrencySymbol()}${getPremiumPrice()}`,
      period: "per month",
      description: "Unlock advanced features and unlimited access",
      features: [
        "Unlimited training sessions",
        "Advanced exercise library",
        "Personalized training plans",
        "Progress analytics",
        "Premium support",
        "Challenge participation",
        "Export workout data",
      ],
      icon: Crown,
      color: "text-purple-400",
      bgColor: "bg-purple-500/10",
      borderColor: "border-purple-500/50",
      popular: true,
    },
  ];

  const handlePlanSelect = async (planId: string) => {
    if (planId === "free") {
      toast({
        title: "Current Plan",
        description: "You're already on the free plan!",
      });
      return;
    }

    setSelectedPlan(planId);
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke(
        "create-checkout",
        {
          body: {
            paymentType: "subscription",
            currency: currency.toLowerCase(),
          },
        }
      );

      if (error) throw error;

      // Open Stripe checkout in a new tab
      if (data.url) {
        window.open(data.url, "_blank");
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start checkout process. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setSelectedPlan(null);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[85vh] sm:max-h-[90vh] overflow-y-auto glass-effect border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl text-white text-center">
            Choose Your Plan
          </DialogTitle>
          <p className="text-white/70 text-center text-sm sm:text-base">
            Upgrade your training experience with premium features
          </p>
          <div className="flex justify-center mt-4">
            <Select
              value={currency}
              onValueChange={(value: "USD" | "PLN") => setCurrency(value)}
            >
              <SelectTrigger className="w-32 bg-white/10 border-white/20 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="PLN">PLN (zł)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-8 mt-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = plan.current;
            const isSelected = selectedPlan === plan.id;

            return (
              <Card
                key={plan.id}
                className={`bg-white/5 border-white/10 relative ${
                  plan.popular
                    ? "bg-gradient-to-br from-purple-900/20 to-pink-900/20 border-purple-500/50"
                    : ""
                } `}
              >
                {plan.popular && (
                  <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                    Most Popular
                  </Badge>
                )}

                <CardHeader className="text-center p-4 sm:p-6">
                  <div className="flex items-center justify-center mb-2">
                    {plan.popular ? (
                      <Crown className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-400" />
                    ) : (
                      <Users className="w-6 h-6 sm:w-8 sm:h-8 text-purple-400" />
                    )}
                  </div>
                  <CardTitle className="text-white text-xl sm:text-2xl">
                    {plan.name}
                  </CardTitle>
                  <CardDescription className="text-white/70 text-sm sm:text-base">
                    {plan.description}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-2xl sm:text-3xl font-bold text-white">
                      {plan.price}
                    </span>

                    <span className="text-white/70 text-sm sm:text-base">
                      /{plan.period}
                    </span>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 p-4 sm:p-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-white/80 text-sm sm:text-base"
                      >
                        <Check className="w-4 h-4 sm:w-5 sm:h-5 text-green-400 mr-3 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>

                  <Button
                    onClick={() => handlePlanSelect(plan.id)}
                    disabled={isCurrentPlan || isLoading}
                    variant={plan.popular ? "primary" : "outline"}
                    className={`w-full text-sm sm:text-base py-2 sm:py-3 ${
                      !plan.popular
                        ? "border-white/20 text-white hover:bg-white/10"
                        : ""
                    }`}
                  >
                    {isLoading && isSelected
                      ? "Processing..."
                      : isCurrentPlan
                      ? "Current Plan"
                      : `Choose ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-white/70 text-sm">
            All plans include a 7-day free trial. Cancel anytime.
          </p>
          <p className="text-white/60 text-xs">
            Payments are processed securely through Stripe. Your data is
            protected.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PricingPlansModal;
