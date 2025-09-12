// app/(protected)/_layout.tsx
import { Stack } from "expo-router";
import { Platform } from "react-native";

/**
 * Ét fælles layout til både web og native.
 * Hvis du vil gøre noget kun for web, brug Platform.OS === 'web'.
 */
export default function ProtectedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // små web-venlige defaults
        contentStyle: Platform.OS === "web" ? { backgroundColor: "#0f172a" } : undefined,
      }}
    />
  );
}

// (valgfrit) Sæt initial route for gruppen
export const unstable_settings = {
  initialRouteName: "Nabolag",
};