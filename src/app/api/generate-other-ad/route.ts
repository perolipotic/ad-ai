import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/app/lib/supabase/server";
import { getCurrentPeriodStart } from "@/app/lib/usage";
import { openai } from "@/app/lib/openai";

const FREE_ANON_DEVICE_LIMIT = 25;

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const periodStart = getCurrentPeriodStart();

    // Device headers
    const deviceId = req.headers.get("x-device-id");
    const resetCountHeader = req.headers.get("x-device-reset-count");
    const platform = req.headers.get("x-device-platform") || "unknown";
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

    // 1) CHECK DEVICE LIMIT
    let { data: deviceUsage, error: deviceUsageError } = await supabase
      .from("anon_usage_limits")
      .select("*")
      .eq("device_id", deviceId)
      .eq("period_start", periodStart)
      .single();

    if (deviceUsageError && deviceUsageError.code !== "PGRST116") {
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
          platform,
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
          message: "Iskoristio si sve besplatne AI generiranja za ovaj mjesec.",
          limit: FREE_ANON_DEVICE_LIMIT,
          used: deviceUsage.ai_generations_used,
          remaining: 0,
          suspect_abuse,
        },
        { status: 402 }
      );
    }

    // 2) PARSE INPUT
    const body = await req.json();

    const { category, tone, notes } = body as {
      category: string;
      tone: string;
      notes: string;
    };

    // SAFETY
    if (!notes?.trim()) {
      return NextResponse.json(
        {
          error: "invalid_input",
          message: "Nedostaje opis oglasa.",
        },
        { status: 400 }
      );
    }

    // 3) PROMPT – OTHER ADS
    const toneInstruction =
      tone === "professional"
        ? "Piši profesionalno, precizno i strukturirano."
        : tone === "informal"
        ? "Piši prijateljski, jednostavno i pristupačno."
        : "Piši neutralno, jasno i profesionalno.";

    const categoryInstruction: Record<string, string> = {
      vozilo:
        "Ovo je oglas za vozilo (auto, motor, kombi...). Obavezno uključi stanje, opremu, kilometražu ako je navedena i tip kupca kojem je namijenjen.",
      posao:
        "Ovo je oglas za posao. Strukturiraj opis: odgovornosti, uvjeti, zahtjevi, lokacija, što nudite.",
      usluga:
        "Ovo je oglas za uslugu. Opiši što nudite, kome je namijenjeno, iskustvo i prednosti.",
      oprema:
        "Ovo je oglas za najam ili prodaju opreme. Opiši stanje, specifikacije i konkretne primjene.",
      ostalo:
        "Ovo je oglas općenitog tipa. Opiši predmet ili uslugu jasno, bez izmišljanja detalja.",
    };

    // FINAL PROMPT
    const finalPrompt = `
Ti si AI koji generira privatne i poslovne oglase. 
Korisnik je napisao opis i želi uredan oglas sa naslovom i odlomcima.
NE IZMIŠLJAJ podatke koji nisu u njegovim bilješkama.

KATEGORIJA: ${category}
${categoryInstruction[category] ?? categoryInstruction["ostalo"]}

TON PISANJA:
${toneInstruction}

KORISNIK JE NAPISAO:
"""
${notes}
"""

FORMAT ODGOVORA (VRATI ČIST JSON!):
{
  "title": "...",
  "description": "..."
}
`.trim();

    // 4) CALL OPENAI
    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: finalPrompt,
            },
          ],
        },
      ],
    });

    // Extract text
    const raw =
      (response as any).output_text ||
      // @ts-ignore
      response.output?.[0]?.content?.[0]?.text ||
      "";

    let parsed = { title: "Oglas", description: raw };

    try {
      parsed = JSON.parse(raw);
    } catch {
      const m = raw.match(/\{[\s\S]*\}/);
      if (m) {
        try {
          parsed = JSON.parse(m[0]);
        } catch {}
      }
    }

    // 5) UPDATE DEVICE USAGE
    const newUsed = deviceUsage.ai_generations_used + 1;

    const { error: updateErr } = await supabase
      .from("anon_usage_limits")
      .update({
        ai_generations_used: newUsed,
        last_used_at: new Date().toISOString(),
      })
      .eq("device_id", deviceId)
      .eq("period_start", periodStart);

    if (updateErr) console.error("Device usage update failed:", updateErr);

    return NextResponse.json(
      {
        title: parsed.title,
        description: parsed.description,
        usage: {
          device_limit: FREE_ANON_DEVICE_LIMIT,
          device_used: newUsed,
          device_remaining: Math.max(FREE_ANON_DEVICE_LIMIT - newUsed, 0),
        },
        suspect_abuse,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("GEN OTHER AD ERROR:", err);
    return NextResponse.json(
      {
        error: "server_error",
        message: "Greška pri generiranju oglasa.",
        suspect_abuse: false,
      },
      { status: 500 }
    );
  }
}
