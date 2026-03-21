import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { signalId?: string } | null;
  const signalId = body?.signalId;
  if (!signalId) {
    return NextResponse.json({ error: "Missing signalId" }, { status: 400 });
  }

  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing } = await supabase
    .from("saved_signals")
    .select("id")
    .eq("user_id", user.id)
    .eq("signal_id", signalId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase.from("saved_signals").delete().eq("id", existing.id);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ saved: false });
  }

  const { error } = await supabase.from("saved_signals").insert({ user_id: user.id, signal_id: signalId });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ saved: true });
}
