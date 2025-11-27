// src/app/api/generate-auth-ad/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../lib/supabase/server";
import { getCurrentPeriodStart } from "../../lib/usage";
import { callOpenAIForAd, type GenerateAdInput } from "../../lib/generateAd";

const FREE_AUTH_LIMIT = 5; // npr. 5 besplatnih generiranja mjesečno za logirane

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const periodStart = getCurrentPeriodStart();

    // 1) Dohvati usera iz Supabase Auth
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError.message);
    }

    if (!user) {
      return NextResponse.json(
        {
          error: "unauthorized",
          message: "Prijavi se za korištenje AI generiranja.",
        },
        { status: 401 }
      );
    }

    // 2) Dohvati ili kreiraj usage_limits red za user + mjesec
    let { data: usage, error: usageError } = await supabase
      .from("usage_limits")
      .select("*")
      .eq("user_id", user.id)
      .eq("period_start", periodStart)
      .single();

    // PGRST116 = no rows found kod .single()
    if (usageError && usageError.code !== "PGRST116") {
      console.error("Error fetching usage_limits:", usageError);
      return NextResponse.json(
        { error: "server_error", message: "Greška kod provjere limita." },
        { status: 500 }
      );
    }

    if (!usage) {
      const { data: inserted, error: insertError } = await supabase
        .from("usage_limits")
        .insert({
          user_id: user.id,
          period_start: periodStart,
          ai_generations_used: 0,
          image_uploads_used: 0,
        })
        .select("*")
        .single();

      if (insertError || !inserted) {
        console.error("Error inserting usage_limits:", insertError);
        return NextResponse.json(
          {
            error: "server_error",
            message: "Greška kod inicijalizacije limita.",
          },
          { status: 500 }
        );
      }

      usage = inserted;
    }

    // 3) Provjera limita PRIJE OpenAI poziva
    if (usage.ai_generations_used >= FREE_AUTH_LIMIT) {
      return NextResponse.json(
        {
          error: "limit_reached",
          message: "Iskoristio si limit",
          limit: FREE_AUTH_LIMIT,
          used: usage.ai_generations_used,
          remaining: 0,
        },
        { status: 402 }
      );
    }

    // 4) Body → GenerateAdInput + AI helper
    const body = (await req.json()) as GenerateAdInput;
    const result = await callOpenAIForAd(body);

    // 5) Povećaj counter
    const newUsed = usage.ai_generations_used + 1;

    const { error: updateError } = await supabase
      .from("usage_limits")
      .update({ ai_generations_used: newUsed })
      .eq("user_id", user.id)
      .eq("period_start", periodStart);

    if (updateError) {
      console.error("Error updating usage_limits:", updateError);
      // ne rušimo request – korisnik je dobio rezultat, samo logiramo
    }

    // 6) Vrati rezultat + usage info
    return NextResponse.json(
      {
        ...result,
        usage: {
          limit: FREE_AUTH_LIMIT,
          used: newUsed,
          remaining: Math.max(FREE_AUTH_LIMIT - newUsed, 0),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "Greška pri generiranju oglasa" },
      { status: 500 }
    );
  }
}
