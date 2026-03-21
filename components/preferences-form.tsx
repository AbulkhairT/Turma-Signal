"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LENS_OPTIONS } from "@/lib/constants";
import { Lens, Profile, Topic } from "@/lib/types";

export function PreferencesForm({
  profile,
  topics,
  selectedTopicIds
}: {
  profile: Profile;
  topics: Topic[];
  selectedTopicIds: string[];
}) {
  const [fullName, setFullName] = useState(profile.full_name ?? "");
  const [lens, setLens] = useState<Lens>(profile.lens ?? "building");
  const [selected, setSelected] = useState<string[]>(selectedTopicIds);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const visibleTopics = useMemo(() => topics.filter((topic) => topic.lens === lens), [topics, lens]);

  function toggle(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((topicId) => topicId !== id) : [...prev, id]));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/preferences", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lens, fullName, topicIds: selected })
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Update failed");
      setLoading(false);
      return;
    }

    router.refresh();
    setLoading(false);
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-xl border border-zinc-800 p-6">
      <h1 className="text-2xl font-semibold">Preferences</h1>
      <label className="flex flex-col gap-2 text-sm">
        Full name
        <input
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
        />
      </label>

      <div>
        <p className="mb-2 text-sm">Lens</p>
        <div className="flex gap-2">
          {LENS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                setLens(option.value);
                setSelected([]);
              }}
              className={`rounded border px-3 py-2 text-sm ${lens === option.value ? "border-white bg-white text-black" : "border-zinc-700"}`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm">Topics</p>
        <div className="flex flex-wrap gap-2">
          {visibleTopics.map((topic) => {
            const active = selected.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggle(topic.id)}
                className={`rounded border px-3 py-1 text-sm ${active ? "border-white bg-white text-black" : "border-zinc-700"}`}
              >
                {topic.name}
              </button>
            );
          })}
        </div>
      </div>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button className="rounded bg-white px-4 py-2 text-black" disabled={loading}>
        {loading ? "Saving..." : "Save preferences"}
      </button>
    </form>
  );
}
