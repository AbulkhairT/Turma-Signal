import Link from "next/link";
import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { LogoutButton } from "@/components/logout-button";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
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

  if (!profile?.onboarding_completed) {
    redirect("/onboarding");
  }

  return (
    <div className="mx-auto min-h-screen w-full max-w-5xl px-6 py-6">
      <header className="mb-8 flex items-center justify-between border-b border-zinc-800 pb-4">
        <Link href="/app/today" className="text-xl font-semibold">
          Signal
        </Link>
        <nav className="flex items-center gap-4 text-sm">
          <Link href="/app/today">Today</Link>
          <Link href="/app/preferences">Preferences</Link>
          <Link href="/app/saved">Saved</Link>
          <LogoutButton />
        </nav>
      </header>
      {children}
    </div>
  );
}
