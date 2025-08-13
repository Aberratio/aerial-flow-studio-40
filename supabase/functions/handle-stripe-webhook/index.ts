import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();
    
    if (!signature) {
      throw new Error("No Stripe signature found");
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new Error("Stripe webhook secret not configured");
    }

    // Verify the webhook signature
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Processing webhook event:", event.type);

    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Handle challenge purchases
        if (session.metadata?.purchase_type === "challenge") {
          const userId = session.metadata.user_id;
          const challengeId = session.metadata.challenge_id;
          
          if (userId && challengeId) {
            // Create the purchase record
            const { error: purchaseError } = await supabaseService
              .from("user_challenge_purchases")
              .insert({
                user_id: userId,
                challenge_id: challengeId,
                purchase_type: "payment",
                payment_amount: session.amount_total,
                currency: session.currency,
                stripe_session_id: session.id,
                purchased_at: new Date().toISOString(),
              });

            if (purchaseError) {
              console.error("Error creating purchase record:", purchaseError);
            } else {
              console.log("Challenge purchase recorded successfully");
            }

            // Update the order status
            const { error: orderError } = await supabaseService
              .from("orders")
              .update({ status: "paid" })
              .eq("stripe_session_id", session.id);

            if (orderError) {
              console.error("Error updating order status:", orderError);
            }
          }
        }
        break;
      }

      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        
        // Update order status to expired
        const { error } = await supabaseService
          .from("orders")
          .update({ status: "expired" })
          .eq("stripe_session_id", session.id);

        if (error) {
          console.error("Error updating expired order:", error);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});