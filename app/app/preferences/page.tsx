import { PreferencesForm } from "@/components/preferences-form";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Profile, Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function PreferencesPage() {
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

  const profile = (profileData ?? {
    id: user.id,
    email: user.email ?? null,
    full_name: null,
    lens: null,
    onboarding_completed: false,
    subscription_tier: "free"
  }) as Profile;

  const { data: topicsData } = await supabase.from("topics").select("id,lens,slug,name").order("name", { ascending: true });
  const topics = Array.isArray(topicsData) ? (topicsData as Topic[]) : [];

  const { data: selectedData } = await supabase.from("user_topics").select("topic_id").eq("user_id", user.id);
  const selectedTopicIds = Array.isArray(selectedData)
    ? selectedData
        .map((row) => (typeof row.topic_id === "string" ? row.topic_id : null))
        .filter((value): value is string => Boolean(value))
    : [];

  return <PreferencesForm profile={profile} topics={topics} selectedTopicIds={selectedTopicIds} />;
}
