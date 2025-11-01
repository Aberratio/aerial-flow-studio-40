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
    price_usd?: number;
    price_pln?: number;
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
  const [redemptionCode, setRedemptionCode] = useState("");
  const [activeTab, setActiveTab] = useState("purchase");
  const { toast } = useToast();

  const price = {
    amount: ((challenge.price_pln || 3999) / 100).toFixed(0),
    symbol: "zł",
  };

  const handlePurchase = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "purchase-challenge",
        {
          body: {
            challengeId: challenge.id,
            currency: "pln",
          },
        }
      );

      if (error) throw error;

      if (data.url) {
        window.open(data.url, "_blank");
        onClose();
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to start purchase process";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const translateErrorMessage = (message: string) => {
    const translations: Record<string, string> = {
      "Invalid or expired redemption code":
        "Nieprawidłowy lub wygasły kod aktywacyjny",
      "You have already purchased this challenge":
        "Masz już dostęp do tego wyzwania",
      "This redemption code has been used the maximum number of times":
        "Ten kod został już wykorzystany maksymalną liczbę razy",
      "This redemption code has expired": "Ten kod wygasł",
      "Failed to redeem code": "Nie udało się aktywować kodu",
      "Failed to create purchase record": "Nie udało się zapisać zakupu",
      "Challenge ID and code are required":
        "Wymagany jest identyfikator wyzwania i kod",
      "User not authenticated": "Użytkownik niezalogowany",
      "Edge Function returned a non-2xx status code":
        "Błąd serwera. Spróbuj ponownie.",
    };
    return translations[message] || message;
  };

  const handleCodeRedemption = async () => {
    if (!redemptionCode.trim()) {
      toast({
        title: "Błąd",
        description: "Wpisz kod aktywacyjny",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        "redeem-challenge-code",
        {
          body: {
            challengeId: challenge.id,
            code: redemptionCode.trim(),
          },
        }
      );

      // Check if there's an error from Supabase client
      if (error) {
        // Try to extract error message from data if available
        let errorMessage = error.message;

        // If data exists and has error field, use that (Edge Function returned error in response body)
        if (data && typeof data === "object" && "error" in data && data.error) {
          errorMessage = data.error;
        }

        // Log full error for debugging
        console.error("Error redeeming code:", {
          error,
          data,
          errorMessage,
          fullError: JSON.stringify(error, null, 2),
        });

        throw new Error(errorMessage || "Nie udało się aktywować kodu");
      }

      // Check if data contains error (Edge Function returned error in success response)
      if (data && typeof data === "object" && "error" in data && data.error) {
        console.error("Edge Function returned error in data:", data);
        throw new Error(data.error);
      }

      // Success case
      toast({
        title: "Sukces!",
        description: data?.message || "Wyzwanie odblokowane pomyślnie!",
      });
      onPurchaseSuccess?.();
      onClose();
    } catch (error: unknown) {
      console.error("Error redeeming code - catch block:", error);
      let errorMessage = "Nie udało się aktywować kodu";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        error &&
        typeof error === "object" &&
        "error" in error &&
        typeof error.error === "string"
      ) {
        errorMessage = error.error;
      } else if (
        error &&
        typeof error === "object" &&
        "message" in error &&
        typeof error.message === "string"
      ) {
        errorMessage = error.message;
      }
      toast({
        title: "Błąd",
        description: translateErrorMessage(errorMessage),
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
              Wyzwanie Premium
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Challenge Info */}
        <Card className="bg-white/5 border-white/10 mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              {challenge.title}
              <Badge
                variant="secondary"
                className="bg-yellow-500/20 text-yellow-400"
              >
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
            <TabsTrigger
              value="purchase"
              className="text-white data-[state=active]:bg-white/20"
            >
              <CreditCard className="w-4 h-4 mr-2" />
              Kup
            </TabsTrigger>
            <TabsTrigger
              value="code"
              className="text-white data-[state=active]:bg-white/20"
            >
              <Gift className="w-4 h-4 mr-2" />
              Użyj kodu
            </TabsTrigger>
          </TabsList>

          <TabsContent value="purchase" className="space-y-6 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">
                  Kup wyzwanie
                </CardTitle>
                <CardDescription className="text-white/70">
                  Uzyskaj dożywotni dostęp do tego wyzwania premium
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-white/70">Cena:</span>
                    <span className="text-2xl font-bold text-white">
                      {price.amount} {price.symbol}
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
                      Przetwarzanie...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 mr-2" />
                      Kup wyzwanie
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="code" className="space-y-6 mt-6">
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white text-lg">Użyj kodu</CardTitle>
                <CardDescription className="text-white/70">
                  Masz kod aktywacyjny? Wpisz go poniżej, aby odblokować to
                  wyzwanie
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white">
                    Kod aktywacyjny
                  </Label>
                  <Input
                    id="code"
                    value={redemptionCode}
                    onChange={(e) =>
                      setRedemptionCode(e.target.value.toUpperCase())
                    }
                    placeholder="Wpisz swój kod tutaj"
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
                      Aktywacja...
                    </>
                  ) : (
                    <>
                      <Gift className="w-4 h-4 mr-2" />
                      Użyj kodu
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center space-y-2">
          <p className="text-white/70 text-sm">
            Po zakupie będziesz mieć dożywotni dostęp do tego wyzwania
          </p>
          <p className="text-white/60 text-xs">
            Płatności są bezpiecznie przetwarzane przez Stripe
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ChallengePurchaseModal;
