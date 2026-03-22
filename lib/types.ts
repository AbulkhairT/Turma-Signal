export type Lens = "building" | "investing" | "health";

export type Topic = {
  id: string;
  lens: Lens;
  slug: string;
  name: string;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  lens: Lens | null;
  onboarding_completed: boolean;
  subscription_tier: "free" | "premium";
};

export type Signal = {
  id: string;
  title: string;
  what_happened: string | null;
  why_it_matters: string | null;
  what_happens_next: string | null;
  what_you_should_do: string | null;
  confidence: string | null;
  published_at: string | null;
  topic_id: string | null;
};
