import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing Authorization header");
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: authData, error: authError } =
      await supabaseClient.auth.getUser(token);

    if (authError || !authData.user) {
      console.error("Auth error:", authError);
      return new Response(JSON.stringify({ error: "User not authenticated" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 401,
      });
    }

    const user = authData.user;

    let requestBody;
    try {
      requestBody = await req.json();
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return new Response(JSON.stringify({ error: "Invalid request body" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const { challengeId, code } = requestBody;

    if (!challengeId || !code) {
      console.error("Missing required fields:", {
        challengeId: !!challengeId,
        code: !!code,
      });
      return new Response(
        JSON.stringify({ error: "Challenge ID and code are required" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Use service role for database operations to bypass RLS
    const supabaseService = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { persistSession: false } }
    );

    console.log("Redeeming code:", {
      userId: user.id,
      challengeId,
      code: code.toUpperCase(),
    });

    // Check if user already purchased this challenge
    const { data: existingPurchase, error: purchaseCheckError } =
      await supabaseService
        .from("user_challenge_purchases")
        .select("id")
        .eq("user_id", user.id)
        .eq("challenge_id", challengeId)
        .single();

    if (purchaseCheckError && purchaseCheckError.code !== "PGRST116") {
      // PGRST116 is "not found" error, which is expected if no purchase exists
      console.error("Error checking existing purchase:", purchaseCheckError);
      return new Response(
        JSON.stringify({ error: "Failed to check existing purchase" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (existingPurchase) {
      console.log("User already purchased this challenge");
      return new Response(
        JSON.stringify({ error: "You have already purchased this challenge" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Validate the redemption code
    const { data: redemptionCode, error: codeError } = await supabaseService
      .from("challenge_redemption_codes")
      .select("*")
      .eq("code", code.toUpperCase())
      .eq("challenge_id", challengeId)
      .eq("is_active", true)
      .single();

    if (codeError) {
      console.error("Error fetching redemption code:", codeError);
      if (codeError.code === "PGRST116") {
        // Not found
        return new Response(
          JSON.stringify({ error: "Invalid or expired redemption code" }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 404,
          }
        );
      }
      return new Response(
        JSON.stringify({ error: "Failed to validate redemption code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!redemptionCode) {
      console.error("Redemption code not found");
      return new Response(
        JSON.stringify({ error: "Invalid or expired redemption code" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 404,
        }
      );
    }

    // Check if code has reached max uses
    if (redemptionCode.current_uses >= redemptionCode.max_uses) {
      console.log("Code has reached max uses:", {
        current: redemptionCode.current_uses,
        max: redemptionCode.max_uses,
      });
      return new Response(
        JSON.stringify({
          error:
            "This redemption code has been used the maximum number of times",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Check if code is expired
    if (
      redemptionCode.expires_at &&
      new Date(redemptionCode.expires_at) < new Date()
    ) {
      console.log("Code expired:", redemptionCode.expires_at);
      return new Response(
        JSON.stringify({ error: "This redemption code has expired" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create the purchase record
    console.log("Creating purchase record...");
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
      console.error("Failed to create purchase record:", purchaseError);
      return new Response(
        JSON.stringify({ error: "Failed to create purchase record" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Purchase record created successfully");

    // Update the code usage count
    console.log("Updating code usage count...");
    const { error: updateError } = await supabaseService
      .from("challenge_redemption_codes")
      .update({
        current_uses: redemptionCode.current_uses + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("id", redemptionCode.id);

    if (updateError) {
      console.error("Failed to update code usage:", updateError);
      // Don't fail the whole request if usage update fails - purchase is already recorded
    } else {
      console.log("Code usage updated successfully");
    }

    console.log("Redemption successful");
    return new Response(
      JSON.stringify({
        success: true,
        message: "Challenge unlocked successfully!",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      "Unexpected error redeeming challenge code:",
      errorMessage,
      error
    );
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
