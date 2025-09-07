// utils/supabase.web.ts
import { createClient } from '@supabase/supabase-js';

// Prøv først EXPO_PUBLIC_ env vars (bedst praksis på web), fald tilbage til app.json:extra
const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  (globalThis as any).__expoConfig?.extra?.supabaseUrl;

const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  (globalThis as any).__expoConfig?.extra?.supabaseAnonKey;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  // Smid en klar fejl i console i stedet for at crashe "tyst"
  // (app'en kan stadig gengive UI, men login-knappen vil give fejl)
  console.error('Supabase web: mangler URL eller ANON KEY. Tjek miljøvariabler / app.json extra.');
}

// På web bruger vi browserens localStorage direkte.
export const supabase = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
  auth: {
    persistSession: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});