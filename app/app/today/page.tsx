import { SignalCard } from "@/components/signal-card";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Profile, Signal } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TodayPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data: profileData } = await supabase
    .from("profiles")
    .select("id,email,full_name,lens,onboarding_completed,subscription_tier")
    .eq("id", user.id)
    .maybeSingle();
  const profile = (profileData ?? null) as Profile | null;

  const { data: userTopicsData } = await supabase.from("user_topics").select("topic_id").eq("user_id", user.id);
  const topicIds = Array.isArray(userTopicsData)
    ? userTopicsData
        .map((row) => (typeof row.topic_id === "string" ? row.topic_id : null))
        .filter((value): value is string => Boolean(value))
    : [];

  if (!profile?.lens || topicIds.length === 0) {
    return (
      <main>
        <h1 className="mb-3 text-2xl font-semibold">Today</h1>
        <p className="text-zinc-400">You have no selected topics yet. Update your preferences to personalize your feed.</p>
      </main>
    );
  }

  const { data: signalsData } = await supabase
    .from("signals")
    .select("id,title,what_happened,why_it_matters,what_happens_next,what_you_should_do,confidence,published_at,topic_id")
    .eq("lens", profile.lens)
    .eq("status", "published")
    .in("topic_id", topicIds)
    .order("published_at", { ascending: false });

  const allSignals = Array.isArray(signalsData) ? (signalsData as Signal[]) : [];
  const max = profile.subscription_tier === "premium" ? allSignals.length : 3;
  const visibleSignals = allSignals.slice(0, max);

  const { data: savedData } = await supabase.from("saved_signals").select("signal_id").eq("user_id", user.id);
  const savedSet = new Set(
    Array.isArray(savedData)
      ? savedData
          .map((row) => (typeof row.signal_id === "string" ? row.signal_id : null))
          .filter((value): value is string => Boolean(value))
      : []
  );

  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-semibold">Today</h1>
      {visibleSignals.length === 0 ? (
        <p className="text-zinc-400">We’re preparing your next signals. Check back soon.</p>
      ) : (
        <div className="space-y-3">
          {visibleSignals.map((signal) => (
            <SignalCard key={signal.id} signal={signal} initiallySaved={savedSet.has(signal.id)} />
          ))}
        </div>
      )}
    </main>
  );
}
