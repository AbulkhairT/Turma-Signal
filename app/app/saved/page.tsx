import { SignalCard } from "@/components/signal-card";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Signal } from "@/lib/types";

export const dynamic = "force-dynamic";

type SavedRow = {
  signal_id: string;
  signals: Signal | Signal[] | null;
};

export default async function SavedPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data } = await supabase
    .from("saved_signals")
    .select(
      "signal_id, signals(id,title,what_happened,why_it_matters,what_happens_next,what_you_should_do,confidence,published_at,topic_id)"
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const rows = Array.isArray(data) ? (data as SavedRow[]) : [];

  const signals: Signal[] = rows
    .map((row) => {
      if (!row.signals) return null;
      if (Array.isArray(row.signals)) {
        return row.signals[0] ?? null;
      }
      return row.signals;
    })
    .filter((value): value is Signal => Boolean(value));

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Saved</h1>
      {signals.length === 0 ? (
        <p className="text-zinc-400">You haven’t saved any signals yet.</p>
      ) : (
        <div className="space-y-3">
          {signals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} initiallySaved />
          ))}
        </div>
      )}
    </main>
  );
}
