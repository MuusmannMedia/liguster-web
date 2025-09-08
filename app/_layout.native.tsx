// app/_layout.native.tsx
import { DarkTheme, DefaultTheme, ThemeProvider } from "@react-navigation/native";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { StyleSheet, View } from "react-native";

import { useColorScheme } from "../hooks/useColorScheme";
import useRegisterPushToken from "../hooks/useRegisterPushToken"; // <-- default import
import { useSession } from "../hooks/useSession";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
  });

  const { session } = useSession();
  const userId = session?.user?.id ?? null;

  // Registrer push når bruger er logget ind (no-op på web)
  useRegisterPushToken(userId ?? undefined);

  if (!loaded) return null;

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <View style={styles.root}>
        <StatusBar style="light" animated={false} translucent={false} />
        <Stack screenOptions={{ headerShown: false, animation: "fade" }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="LoginScreen" />
          <Stack.Screen name="OpretBruger" />
          <Stack.Screen name="Nabolag" />
          <Stack.Screen name="MigScreen" />
          <Stack.Screen name="OpretOpslag" />
          <Stack.Screen name="ForeningerScreen" />
          <Stack.Screen name="MineOpslag" />
          <Stack.Screen name="Beskeder" />
          <Stack.Screen name="+not-found" />
        </Stack>
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#7C8996" },
});