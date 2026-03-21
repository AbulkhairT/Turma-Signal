"use client";

import { useState } from "react";
import { Signal } from "@/lib/types";

export function SignalCard({ signal, initiallySaved }: { signal: Signal; initiallySaved: boolean }) {
  const [saved, setSaved] = useState(initiallySaved);
  const [loading, setLoading] = useState(false);

  async function toggleSaved() {
    setLoading(true);
    const res = await fetch("/api/signals/toggle-save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalId: signal.id })
    });

    if (res.ok) {
      const body = (await res.json()) as { saved: boolean };
      setSaved(Boolean(body.saved));
    }

    setLoading(false);
  }

  async function trackImpression() {
    await fetch("/api/signals/impression", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ signalId: signal.id })
    });
  }

  return (
    <article className="rounded-xl border border-zinc-800 p-5" onMouseEnter={trackImpression}>
      <div className="mb-2 flex items-center justify-between gap-4">
        <h2 className="text-lg font-semibold">{signal.title}</h2>
        <button type="button" disabled={loading} onClick={toggleSaved} className="text-sm text-zinc-300 underline">
          {saved ? "Unsave" : "Save"}
        </button>
      </div>
      {signal.what_happened ? <p className="text-sm text-zinc-300">{signal.what_happened}</p> : null}
      {signal.why_it_matters ? <p className="mt-3 text-sm text-zinc-400">{signal.why_it_matters}</p> : null}
      {signal.what_you_should_do ? <p className="mt-3 text-sm text-zinc-200">Action: {signal.what_you_should_do}</p> : null}
    </article>
  );
}
