import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Lens } from "@/lib/types";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | { lens?: Lens; fullName?: string; topicIds?: string[] }
    | null;

  const lens = body?.lens;
  if (!lens || !["building", "investing", "health"].includes(lens)) {
    return NextResponse.json({ error: "Invalid lens" }, { status: 400 });
  }

  const topicIds = Array.isArray(body?.topicIds) ? body.topicIds.filter((topic): topic is string => typeof topic === "string") : [];
  const fullName = typeof body?.fullName === "string" ? body.fullName : null;

  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: fullName, lens, onboarding_completed: true })
    .eq("id", user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  await supabase.from("user_topics").delete().eq("user_id", user.id);
  if (topicIds.length > 0) {
    const rows = topicIds.map((topicId) => ({ user_id: user.id, topic_id: topicId }));
    const { error: topicsError } = await supabase.from("user_topics").insert(rows);
    if (topicsError) {
      return NextResponse.json({ error: topicsError.message }, { status: 400 });
    }
  }

  return NextResponse.json({ ok: true });
}
