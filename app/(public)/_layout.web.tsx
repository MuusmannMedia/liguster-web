// app/(public)/_layout.web.tsx (eller din web landing/index)
import { router, Slot } from "expo-router";
import { useEffect } from "react";
import { useSession } from "../../hooks/useSession";

export default function PublicWebLayout() {
  const { session, loading } = useSession();

  useEffect(() => {
    if (!loading && session) {
      router.replace("/(protected)/Nabolag");
    }
  }, [loading, session]);

  return <Slot />;
}