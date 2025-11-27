// src/app/api/test-supabase/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "../../lib/supabase/server";

export async function GET() {
  const supabase = await createServerSupabase();

  const { data, error } = await supabase
    .from("test_ping")
    .insert({ note: "Hello from kreirajoglas!" })
    .select("*")
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json(
      { ok: false, error: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, row: data });
}
