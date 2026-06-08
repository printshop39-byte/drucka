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
//   NEXT_PUBLIC_SUPABASE_ANON_KEY  (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
//
// Supabase recently renamed the public client key from "anon" to "publishable".
// We accept either name so old and new projects both work.
//
// These are NEXT_PUBLIC_ because we read/write from the browser using the public
// key. Protect the data with Row Level Security policies in Supabase (see
// SUPABASE-SCHEMA.md) — the public key is meant to be public.

import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;
let warned = false;

/** Returns a shared Supabase client, or null if env vars are missing. */
export function getSupabase(): SupabaseClient | null {
  if (!SUPABASE_URL || !supabaseKey) {
    if (!warned) {
      console.warn("[supabase] missing env vars");
      warned = true;
    }
    return null;
  }
  if (!client) {
    client = createClient(SUPABASE_URL, supabaseKey);
  }
  return client;
}

/** True when Supabase is configured (env vars present). */
export function isSupabaseConfigured(): boolean {
  return Boolean(SUPABASE_URL && supabaseKey);
}
