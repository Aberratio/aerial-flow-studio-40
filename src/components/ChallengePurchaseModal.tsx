import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Crown, CreditCard, Gift, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ChallengePurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  challenge: {
    id: string;
    title: string;
    description?: string;
    image?: string;
  };
  onPurchaseSuccess?: () => void;
}

const ChallengePurchaseModal: React.FC<ChallengePurchaseModalProps> = ({
  isOpen,
  onClose,
  challenge,
  onPurchaseSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [currency, setCurrency] = useState<"usd" | "pln">("usd");
  const [redemptionCode, setRedemptionCode] = useState("");
  const [activeTab, setActiveTab] = useState("purchase");
  const { toast } = useToast();

  const prices = {
    usd: { amount: "9.99", symbol: "$" },
    pln: { amount: "39.99", symbol: "zł" },
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("purchase-challenge", {
        body: {
          challengeId: challenge.id,
          currency: currency,
        },
      });

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
        onClose();
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start purchase process",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeRedemption = async () => {
    if (!redemptionCode.trim()) {
      toast({
        title: "Error",
        description: "Please enter a redemption code",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("redeem-challenge-code", {
        body: {
          challengeId: challenge.id,
          code: redemptionCode.trim(),
        },
      });

      if (error) throw error;

      toast({
        title: "Success!",
        description: data.message || "Challenge unlocked successfully!",
      });
      onPurchaseSuccess?.();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to redeem code",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-2xl max-h-[85vh] overflow-y-auto glass-effect border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl sm:text-2xl text-white text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Crown className="w-6 h-6 text-yellow-400" />
              Premium Challenge
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Challenge Info */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {challenge.title}
              <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">
                Premium
              </Badge>
            </CardTitle>
            {challenge.description && (
              <CardDescription className="text-white/70">
                {challenge.description}
              </CardDescription>
            )}
          </CardHeader>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-white/10">
            <TabsTrigger value="purchase" className="text-white data-[state=active]:bg-white/20">
              <CreditCard className="w-4 h-4 mr-2" />
              Purchase
            </TabsTrigger>
            <TabsTrigger value="code" className="text-white data-[state=active]:bg-white/20">
              <Gift className="w-4 h-4 mr-2" />
              Redeem Code
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-6 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Purchase Challenge</CardTitle>
                <CardDescription className="text-white/70">
                  Get lifetime access to this premium challenge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-white">
                    Currency
                  </Label>
                  <Select value={currency} onValueChange={(value: "usd" | "pln") => setCurrency(value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="pln">PLN (zł)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Price:</span>
                    <span className="text-2xl font-bold text-white">
                      {prices[currency].symbol}{prices[currency].amount}
                    </span>
                  </div>
                </div>

                <Button
                  onClick={handlePurchase}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Purchase Challenge
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-6 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Redeem Code</CardTitle>
                <CardDescription className="text-white/70">
                  Have a redemption code? Enter it below to unlock this challenge
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white">
                    Redemption Code
                  </Label>
                  <Input
                    id="code"
                    value={redemptionCode}
                    onChange={(e) => setRedemptionCode(e.target.value.toUpperCase())}
                    placeholder="Enter your code here"
                    className="bg-white/10 border-white/20 text-white placeholder-white/50"
                  />
                </div>

                <Button
                  onClick={handleCodeRedemption}
                  disabled={isLoading || !redemptionCode.trim()}
                  variant="outline"
                  className="w-full border-white/20 text-white hover:bg-white/10"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Redeeming...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Redeem Code
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center space-y-2">
          <p className="text-white/70 text-sm">
            Once purchased, you'll have lifetime access to this challenge
          </p>
          <p className="text-white/60 text-xs">
            Payments are processed securely through Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengePurchaseModal;