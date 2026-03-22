"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { LENS_OPTIONS } from "@/lib/constants";
import { Lens, Topic } from "@/lib/types";

export function OnboardingForm({ topics }: { topics: Topic[] }) {
  const [fullName, setFullName] = useState("");
  const [lens, setLens] = useState<Lens>("building");
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const availableTopics = useMemo(() => topics.filter((topic) => topic.lens === lens), [lens, topics]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/onboarding", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lens, fullName, topicIds: selectedTopics })
    });

    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      setError(body.error ?? "Unable to save onboarding");
      setLoading(false);
      return;
    }

    router.push("/app/today");
    router.refresh();
    setLoading(false);
  }

  function toggleTopic(id: string) {
    setSelectedTopics((prev) => (prev.includes(id) ? prev.filter((topicId) => topicId !== id) : [...prev, id]));
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto flex w-full max-w-2xl flex-col gap-6 rounded-xl border border-zinc-800 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Where do you want an edge?</h1>
        <p className="mt-2 text-sm text-zinc-400">Choose your lens and topics.</p>
      </div>

      <label className="flex flex-col gap-2 text-sm">
        Full name
        <input
          className="rounded border border-zinc-700 bg-zinc-900 px-3 py-2"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
          placeholder="Your name"
        />
      </label>

      <div>
        <p className="mb-2 text-sm text-zinc-300">Lens</p>
        <div className="flex flex-wrap gap-2">
          {LENS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`rounded border px-3 py-2 text-sm ${lens === option.value ? "border-white bg-white text-black" : "border-zinc-700"}`}
              onClick={() => {
                setLens(option.value);
                setSelectedTopics([]);
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <p className="mb-2 text-sm text-zinc-300">Topics</p>
        <div className="flex flex-wrap gap-2">
          {availableTopics.map((topic) => {
            const active = selectedTopics.includes(topic.id);
            return (
              <button
                key={topic.id}
                type="button"
                onClick={() => toggleTopic(topic.id)}
                className={`rounded border px-3 py-1 text-sm ${active ? "border-white bg-white text-black" : "border-zinc-700"}`}
              >
                {topic.name}
              </button>
            );
          })}
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button className="rounded bg-white px-4 py-2 text-black disabled:opacity-60" disabled={loading} type="submit">
        {loading ? "Saving..." : "Continue"}
      </button>
    </form>
  );
}
