/**
 * Ba9chich Webhook Receiver — Supabase Edge Function
 *
 * Incoming Payload Contract:
 * {
 *   "paymentID": 123,
 *   "message": "Thanks for the tools!",
 *   "donor": {
 *     "username": "karim_ux",
 *     "fullname": "Karim Mansour"
 *   },
 *   "amount": 10,
 *   "asset": "DiamondsTND"
 * }
 *
 * SECURITY NOTE:
 * The current Ba9chich webhook specification does NOT include a cryptographic signature
 * header (HMAC SHA-256) or bearer secret token. Until Ba9chich provides a secret or
 * signature header format, payments are recorded with verification_status = 'pending_verification'.
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-ba9chich-signature",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();

    // 1. Validate mandatory fields
    const paymentId = String(body.paymentID || body.payment_id || "").trim();
    const amount = Number(body.amount) || 0;
    const asset = String(body.asset || "DiamondsTND").trim();
    const message = String(body.message || "").trim();
    const donorUsername = String(body.donor?.username || "").trim();
    const donorFullname = String(body.donor?.fullname || "").trim();

    if (!paymentId || amount <= 0) {
      return new Response(
        JSON.stringify({ error: "Invalid payment payload: missing paymentID or positive amount" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 2. Check Idempotency / Existing Donation
    const { data: existingDonation } = await supabase
      .from("donations")
      .select("id, payment_id")
      .eq("payment_id", paymentId)
      .eq("provider", "ba9chich")
      .maybeSingle();

    if (existingDonation) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Payment already processed (idempotent)",
          id: existingDonation.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // 3. Insert Donation Record
    const { data: newDonation, error: insertError } = await supabase
      .from("donations")
      .insert({
        payment_id: paymentId,
        provider: "ba9chich",
        amount,
        asset,
        donor_username: donorUsername,
        donor_fullname: donorFullname,
        message,
        received_at: new Date().toISOString(),
        verification_status: "pending_verification", // Pending until signature validation is established
        raw_payload: body,
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Ba9chich donation recorded successfully",
        donation: newDonation,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal Webhook Error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
