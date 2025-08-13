import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
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
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    
    if (!user) throw new Error("User not authenticated");

    const { challengeId, code } = await req.json();
    
    if (!challengeId || !code) {
      throw new Error("Challenge ID and code are required");
    }

    // Use service role for database operations to bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    // Check if user already purchased this challenge
    const { data: existingPurchase } = await supabaseService
      .from("user_challenge_purchases")
      .select("id")
      .eq("user_id", user.id)
      .eq("challenge_id", challengeId)
      .single();

    if (existingPurchase) {
      throw new Error("You have already purchased this challenge");
    }

    // Validate the redemption code
    const { data: redemptionCode, error: codeError } = await supabaseService
      .from("challenge_redemption_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("challenge_id", challengeId)
      .eq("is_active", true)
      .single();

    if (codeError || !redemptionCode) {
      throw new Error("Invalid or expired redemption code");
    }

    // Check if code has reached max uses
    if (redemptionCode.current_uses >= redemptionCode.max_uses) {
      throw new Error("This redemption code has been used the maximum number of times");
    }

    // Check if code is expired
    if (redemptionCode.expires_at && new Date(redemptionCode.expires_at) < new Date()) {
      throw new Error("This redemption code has expired");
    }

    // Create the purchase record
    const { error: purchaseError } = await supabaseService
      .from("user_challenge_purchases")
      .insert({
        user_id: user.id,
        challenge_id: challengeId,
        purchase_type: "code",
        redemption_code: code.toUpperCase(),
        purchased_at: new Date().toISOString(),
      });

    if (purchaseError) {
      throw new Error("Failed to create purchase record");
    }

    // Update the code usage count
    const { error: updateError } = await supabaseService
      .from("challenge_redemption_codes")
      .update({
        current_uses: redemptionCode.current_uses + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", redemptionCode.id);

    if (updateError) {
      console.error("Failed to update code usage:", updateError);
    }

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Challenge unlocked successfully!" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error redeeming challenge code:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});