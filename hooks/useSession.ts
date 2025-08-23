import { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import { supabase } from "../utils/supabase";

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    // Hent nuværende session ved første load
    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error("Fejl ved hentning af session:", error.message);
      }
      setSession(data?.session ?? null);
      setLoading(false);
    });

    // Lyt på fremtidige login/logout events
    const { data: authListener } = supabase.auth.onAuthStateChange((event, newSession) => {
      // console.log("Auth event:", event, newSession);
      if (isMounted) {
        setSession(newSession);
      }
    });

    return () => {
      isMounted = false;
      authListener?.subscription?.unsubscribe?.();
    };
  }, []);

  return { session, loading };
}