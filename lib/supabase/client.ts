"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "./env";

let browserClient: ReturnType<typeof createBrowserClient> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    const env = getSupabaseEnv();
    browserClient = createBrowserClient(env.url, env.anonKey);
  }
  return browserClient;
}
