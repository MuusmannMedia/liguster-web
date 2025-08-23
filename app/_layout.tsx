// app/_layout.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import * as Linking from 'expo-linking';
import { Stack, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useColorScheme } from '@/hooks/useColorScheme';
import { supabase } from '../utils/supabase';

/** Parse tokens from fragment (#...) eller query (?...) */
function extractTokensFromUrl(
  url?: string | null
): { access_token: string; refresh_token: string } | null {
  if (!url) return null;
  const fragment = url.split('#')[1] ?? '';
  const query = url.split('?')[1] ?? '';

  const frag = new URLSearchParams(fragment);
  const q = new URLSearchParams(query);

  const access_token = frag.get('access_token') || q.get('access_token') || '';
  const refresh_token = frag.get('refresh_token') || q.get('refresh_token') || '';

  if (!access_token || !refresh_token) return null;
  return { access_token, refresh_token };
}

/** Hent path‑delen efter scheme (fx 'reset-password', 'LoginScreen') */
function getPath(url?: string | null): string | null {
  if (!url) return null;
  try {
    const { path } = Linking.parse(url);
    return path ?? null;
  } catch {
    return null;
  }
}

export default function RootLayout() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Undgå at håndtere samme URL to gange
  const lastHandledUrl = useRef<string | null>(null);

  useEffect(() => {
    if (!loaded) return;

    const handleUrl = async (incoming?: string | null) => {
      // Debug i Xcode / Metro
      console.log(
        '\n=================================================\n' +
        `handleUrl KØRER NU med URL: ${incoming}\n` +
        `Tidspunkt: ${new Date().toISOString()}\n` +
        '=================================================\n'
      );

      if (!incoming) return;
      if (lastHandledUrl.current === incoming) return;
      lastHandledUrl.current = incoming;

      const path = getPath(incoming)?.toLowerCase();

      // Bekræftet sign‑up → til login
      if (path === 'loginscreen') {
        router.replace('/LoginScreen');
        return;
      }

      // Password recovery
      if (path === 'reset-password') {
        const tokens = extractTokensFromUrl(incoming);

        if (!tokens) {
          Alert.alert(
            'Fejl i link',
            'Nulstillingslinket er ugyldigt eller mangler information. Anmod om et nyt og prøv igen.'
          );
          return;
        }

        const { error } = await supabase.auth.setSession({
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
        });

        if (error) {
          Alert.alert('Fejl', `Kunne ikke aktivere nulstilling: ${error.message}`);
          return;
        }

        // Session er sat → vis skærmen til at vælge nyt kodeord
        router.replace('/reset-password');
        return;
      }

      // Andre dybe ruter: ingen speciel håndtering
    };

    // 1) initial URL (app åbnet via link)
    Linking.getInitialURL().then(handleUrl).catch(() => {});
    // 2) events mens appen er åben
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, [loaded, router]);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={styles.root}>
        <StatusBar style="light" animated={false} translucent={false} />
        <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
          {/* Main screens */}
          <Stack.Screen name="index" />
          <Stack.Screen name="LoginScreen" />
          <Stack.Screen name="OpretBruger" />
          <Stack.Screen name="Nabolag" />
          <Stack.Screen name="MigScreen" />
          <Stack.Screen name="OpretOpslag" />
          <Stack.Screen name="ForeningerScreen" />
          <Stack.Screen name="MineOpslag" />
          <Stack.Screen name="Beskeder" />

          {/* Auth flow */}
          <Stack.Screen name="request-password-reset" />
          <Stack.Screen name="reset-password" />

          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#7C8996' },
});