// app/api/generate-ad/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "../../lib/supabase/server";
import { getCurrentPeriodStart } from "../../lib/usage";
import { callOpenAIForAd, type GenerateAdInput } from "../../lib/generateAd";

const FREE_ANON_DEVICE_LIMIT = 5;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const periodStart = getCurrentPeriodStart();

    const deviceId = req.headers.get("x-device-id");
    const resetCountHeader = req.headers.get("x-device-reset-count");
    const resetCount = resetCountHeader ? Number(resetCountHeader) : 0;
    const suspect_abuse = resetCount > 0;

    if (!deviceId) {
      return NextResponse.json(
        {
          error: "no_device",
          message: "Nije moguće identificirati uređaj.",
          suspect_abuse,
        },
        { status: 400 }
      );
    }

    // 1) DEVICE LIMIT (anon_usage_limits)
    let { data: deviceUsage, error: deviceUsageError } = await supabase
      .from("anon_usage_limits")
      .select("*")
      .eq("device_id", deviceId)
      .eq("period_start", periodStart)
      .single();

    if (deviceUsageError && deviceUsageError?.code !== "PGRST116") {
      console.error("Error fetching anon_usage_limits:", deviceUsageError);
      return NextResponse.json(
        {
          error: "server_error",
          message: "Greška kod provjere limita uređaja.",
          suspect_abuse,
        },
        { status: 500 }
      );
    }

    if (!deviceUsage) {
      const { data: inserted, error: insertError } = await supabase
        .from("anon_usage_limits")
        .insert({
          device_id: deviceId,
          period_start: periodStart,
          ai_generations_used: 0,
        })
        .select("*")
        .single();

      if (insertError || !inserted) {
        console.error("Error inserting anon_usage_limits:", insertError);
        return NextResponse.json(
          {
            error: "server_error",
            message: "Greška kod inicijalizacije limita za uređaj.",
            suspect_abuse,
          },
          { status: 500 }
        );
      }

      deviceUsage = inserted;
    }

    if (deviceUsage.ai_generations_used >= FREE_ANON_DEVICE_LIMIT) {
      return NextResponse.json(
        {
          error: "device_limit_reached",
          message: "Iskoristio si limit",
          limit: FREE_ANON_DEVICE_LIMIT,
          used: deviceUsage.ai_generations_used,
          remaining: 0,
          suspect_abuse,
        },
        { status: 402 }
      );
    }

    // 3) Ako smo prošli limite → pozovi OpenAI
    const body = (await req.json()) as GenerateAdInput;
    const result = await callOpenAIForAd(body);

    // 4) Uspješno generiranje → update device_usage + ip_usage
    const newDeviceUsed = deviceUsage.ai_generations_used + 1;

    const { error: deviceUpdateError } = await supabase
      .from("anon_usage_limits")
      .update({
        ai_generations_used: newDeviceUsed,
        last_used_at: new Date().toISOString(),
      })
      .eq("device_id", deviceId)
      .eq("period_start", periodStart);

    if (deviceUpdateError) {
      console.error("Error updating anon_usage_limits:", deviceUpdateError);
    }

    return NextResponse.json(
      {
        ...result,
        usage: {
          device_limit: FREE_ANON_DEVICE_LIMIT,
          device_used: newDeviceUsed,
          device_remaining: Math.max(FREE_ANON_DEVICE_LIMIT - newDeviceUsed, 0),
        },
        suspect_abuse,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Greška pri generiranju oglasa",
        suspect_abuse: false,
      },
      { status: 500 }
    );
  }
}
