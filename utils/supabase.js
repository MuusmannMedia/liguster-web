import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Læs fra EXPO_PUBLIC_* (web) ELLER fra app.json extra (native)
let supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  Constants.expoConfig?.extra?.supabaseUrl ||
  '';
let supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  Constants.expoConfig?.extra?.supabaseAnonKey ||
  '';

// Fjern trailing slash
if (supabaseUrl) supabaseUrl = supabaseUrl.replace(/\/+$/, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '⚠️ Supabase env mangler. Tjek EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY eller app.json extra.'
  );
}

const commonAuth = {
  autoRefreshToken: true,
  persistSession: true,
};

const options =
  Platform.OS === 'web'
    ? { auth: { ...commonAuth, detectSessionInUrl: true } }
    : { auth: { ...commonAuth, storage: AsyncStorage, detectSessionInUrl: false } };

export const supabase =
  globalThis.__supabase__ ||
  (globalThis.__supabase__ = createClient(supabaseUrl, supabaseAnonKey, options));