// utils/supabase.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

// Læs fra EXPO_PUBLIC_* (bliver automatisk injiceret i Expo & Vercel)
let supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
let supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Lille “sikkerhed” mod trailing slash
if (supabaseUrl) supabaseUrl = supabaseUrl.replace(/\/+$/, '');

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase env mangler. Tjek EXPO_PUBLIC_SUPABASE_URL og EXPO_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Native (iOS/Android) skal have storage angivet – web bruger localStorage automatisk
const options =
  Platform.OS === 'web'
    ? {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      }
    : {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          // Der er ingen "URL" i native deep links under bundling
          detectSessionInUrl: false,
        },
      };

// Singleton så HMR/fast refresh ikke laver flere klienter
export const supabase =
  globalThis.__supabase__ ||
  (globalThis.__supabase__ = createClient(supabaseUrl, supabaseAnonKey, options));