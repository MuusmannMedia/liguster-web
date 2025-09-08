// app/(public)/_layout.web.tsx
import { Slot } from "expo-router";

export default function PublicWebLayout() {
  // Ingen auto-redirect længere – viser bare public routes
  return <Slot />;
}