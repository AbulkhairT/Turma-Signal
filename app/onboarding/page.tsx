import { redirect } from "next/navigation";
import { OnboardingForm } from "@/components/onboarding-form";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { Topic } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.onboarding_completed) {
    redirect("/app/today");
  }

  const { data: topicsData } = await supabase.from("topics").select("id,lens,slug,name").order("name", { ascending: true });
  const topics = Array.isArray(topicsData) ? (topicsData as Topic[]) : [];

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-6 py-12">
      <OnboardingForm topics={topics} />
    </main>
  );
}
