// lib/supabase.ts
//
// Supabase client for DRUCKA order storage.
//
// This is intentionally NULL-SAFE: if the env vars aren't set (local dev without
// Supabase, or before you've created the project), `getSupabase()` returns null
// and every caller falls back to its previous behavior. Nothing crashes.
//
// Env vars (see .env.local.example):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_ANON_KEY
//
// These are NEXT_PUBLIC_ because we read/write from the browser using the anon
// key. Protect the data with Row Level Security policies in Supabase (see
// SUPABASE-SCHEMA.md) — the anon key is meant to be public.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let client: SupabaseClient | null = null;

/** Returns a shared Supabase client, or null if env vars are missing. */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null;
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return client;
}

/** True when Supabase is configured (env vars present). */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}
