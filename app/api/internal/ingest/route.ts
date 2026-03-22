import { NextResponse } from "next/server";
import { validateInternalRequest } from "@/lib/internal-auth";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const invalid = validateInternalRequest(request);
  if (invalid) return invalid;

  try {
    const service = await getSupabaseServiceClient();
    const { error } = await service.from("processing_runs").insert({
      run_type: "ingest",
      status: "succeeded",
      finished_at: new Date().toISOString(),
      metadata: { message: "Ingest endpoint reachable" }
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, message: "Ingest run logged." });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase service client init failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
