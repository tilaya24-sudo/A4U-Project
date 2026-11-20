import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY)?.trim();

// Never place a service-role key or a database password into Vite env variables.
export const supabase = url && anonKey
  ? createClient(url, anonKey, {
      auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
    })
  : null;
export const isConfigured = Boolean(supabase);

export const siteError = error => error?.message || 'An unexpected error occurred.';
