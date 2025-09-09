// app/(public)/_layout.tsx
import { Slot } from "expo-router";

export default function PublicNativeLayout() {
  // Samme her – ingen redirect
  return <Slot />;
}