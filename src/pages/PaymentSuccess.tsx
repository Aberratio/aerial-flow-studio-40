import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Crown, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [isVerifying, setIsVerifying] = useState(true);
  const [verified, setVerified] = useState(false);
  const { toast } = useToast();
  const { refetchCounts } = useAuth();

  useEffect(() => {
    const verifyPayment = async () => {
      if (!sessionId) {
        setIsVerifying(false);
        return;
      }

      try {
        // Check subscription status to refresh data
        const { data, error } = await supabase.functions.invoke(
          "check-subscription"
        );
        if (error) throw error;

        // Wait a moment for Stripe to fully process the payment
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Check again to ensure we get the updated status
        await supabase.functions.invoke("check-subscription");

        // Refresh user auth context to update role
        if (refetchCounts) {
          await refetchCounts();
        }

        // Force a page reload to ensure all components get the updated user data
        setTimeout(() => {
          window.location.reload();
        }, 1000);

        setVerified(true);

        toast({
          title: "Payment Successful!",
          description: "Your premium subscription is now active!",
        });
      } catch (error) {
        console.error("Error verifying payment:", error);
        toast({
          title: "Verification Error",
          description:
            "Payment successful but verification failed. Your account will be updated shortly.",
          variant: "default",
        });
      } finally {
        setIsVerifying(false);
      }
    };

    verifyPayment();
  }, [sessionId, toast]);

  return (
    <div className="min-h-screen bg-gradient-to-tr from-black to-purple-950/10 flex items-center justify-center p-6">
      <Card className="max-w-md w-full glass-effect border-white/10 text-center">
        <CardHeader>
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
            {isVerifying ? (
              <Loader2 className="w-8 h-8 text-green-400 animate-spin" />
            ) : (
              <CheckCircle className="w-8 h-8 text-green-400" />
            )}
          </div>
          <CardTitle className="text-white text-2xl">
            {isVerifying ? "Verifying Payment..." : "Payment Successful!"}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="text-muted-foreground">
            {isVerifying ? (
              <p>
                Please wait while we verify your payment and update your
                account...
              </p>
            ) : verified ? (
              <div className="space-y-2">
                <p>
                  Thank you for your payment! Your account has been updated with
                  premium access.
                </p>
                <div className="flex items-center justify-center gap-2 text-yellow-400">
                  <Crown className="w-5 h-5" />
                  <span className="font-semibold">
                    Premium Access Activated
                  </span>
                </div>
              </div>
            ) : (
              <p>
                Your payment was successful. If you don't see your premium
                features immediately, they will be activated within a few
                minutes.
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Button
              onClick={() => navigate("/profile")}
              className="w-full bg-gradient-to-r from-purple-500 via-pink-500 to-blue-500 hover:from-purple-600 hover:via-pink-600 hover:to-blue-600"
            >
              Go to Profile
            </Button>

            <Button
              variant="outline"
              onClick={() => navigate("/feed")}
              className="w-full border-white/20 text-white hover:bg-white/10"
            >
              Continue to Feed
            </Button>
          </div>

          {sessionId && (
            <div className="text-xs text-muted-foreground border-t border-white/10 pt-4">
              <p>
                Session ID: {sessionId.substring(0, 20)}...
                {sessionId.substring(sessionId.length - 8)}
              </p>
              <p>Keep this for your records</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
