// app/(protected)/OpslagDetaljeModal.web.tsx
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, Platform, StyleSheet, Text, View } from "react-native";
import { supabase } from "../../utils/supabase";

// --- tweak this to match your message/compose route ---
function buildReplyHref(postId: string, toUserId: string) {
  // Example: open messages screen prefilled with this post
  return `/(protected)/Beskeder?postId=${encodeURIComponent(postId)}&to=${encodeURIComponent(toUserId)}`;
}

type PostRow = {
  id: string;
  user_id: string;
  created_at: string | null;
  overskrift: string | null;
  text: string | null;
  omraade: string | null;
  kategori: string | null;
  image_url: string | null;
  latitude: number | null;
  longitude: number | null;
};

const THEME = {
  scrim: "rgba(0,0,0,.55)",
  cardBg: "#ffffff",
  ink: "#0b1220",
  sub: "#475569",
  line: "#e5e8ec",
  chipBg: "#eef2ff",
  chipInk: "#1e293b",
  btnDark: "#0b1220",
};

export default function OpslagDetaljeModalWeb() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // fetch post
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase
          .from("posts")
          .select(
            "id,user_id,created_at,overskrift,text,omraade,kategori,image_url,latitude,longitude"
          )
          .eq("id", id)
          .single();
        if (error) throw error;
        if (alive) setPost(data as PostRow);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Kunne ikke hente opslaget.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  // close action – go back to previous page
  const close = () => router.back();

  const created = useMemo(() => {
    if (!post?.created_at) return null;
    try {
      const d = new Date(post.created_at);
      return d.toLocaleDateString("da-DK", { day: "2-digit", month: "short", year: "numeric" });
    } catch {
      return null;
    }
  }, [post?.created_at]);

  // guard: if no id at all, go back
  useEffect(() => {
    if (!id) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Header row */}
        <View style={styles.headerRow}>
          <Text style={styles.titleText}>{post?.overskrift || (loading ? "Indlæser…" : "Opslag")}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {post?.id && post?.user_id ? (
              <Link
                href={buildReplyHref(post.id, post.user_id)}
                style={[styles.pillBtn, styles.primaryPill]}
                aria-label="Svar på opslag"
              >
                <Text style={[styles.pillText, { color: "#0b1220", fontWeight: "900" }]}>Svar</Text>
              </Link>
            ) : null}
            <button onClick={close} className="pill-close" aria-label="Luk">
              Luk
            </button>
          </View>
        </View>

        {/* Content body scrolls if needed */}
        <View style={styles.body}>
          {error ? (
            <Text style={{ color: "#991b1b", fontWeight: "800" }}>{error}</Text>
          ) : loading ? (
            <Text style={{ color: THEME.sub }}>Indlæser…</Text>
          ) : post ? (
            <>
              {post.image_url ? (
                <Image
                  source={{ uri: post.image_url }}
                  style={styles.image}
                  // @ts-ignore react-native-web
                  alt={post.overskrift ?? "Billede"}
                />
              ) : null}

              <View style={{ gap: 8 }}>
                {/* chips */}
                <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
                  {post.kategori ? (
                    <View style={styles.chip}>
                      <Text style={styles.chipTxt}>{post.kategori}</Text>
                    </View>
                  ) : null}
                  {post.omraade ? (
                    <View style={styles.chip}>
                      <Text style={styles.chipTxt}>{post.omraade}</Text>
                    </View>
                  ) : null}
                  {created ? (
                    <View style={styles.chipLight}>
                      <Text style={[styles.chipTxt, { color: THEME.sub }]}>{created}</Text>
                    </View>
                  ) : null}
                </View>

                {post.text ? (
                  <Text style={styles.bodyText}>{post.text}</Text>
                ) : null}
              </View>
            </>
          ) : null}
        </View>
      </View>

      {/* some light CSS specific to web for the "Luk" pill to match your style */}
      <style>{`
        .pill-close{
          padding:8px 12px;
          border-radius:999px;
          border:1.5px solid #cbd5e1;
          background:#0b1220;
          color:#fff;
          font-weight:800;
          cursor:pointer;
        }
        .pill-close:hover{ opacity:.95 }
      `}</style>
    </View>
  );
}

/* ───────── styles ───────── */
const styles = StyleSheet.create({
  overlay: {
    position: "fixed" as const,
    inset: 0,
    backgroundColor: THEME.scrim,
    zIndex: 9999,
    // center the card
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  card: {
    width: "min(720px, calc(100vw - 32px))",
    maxHeight: "min(86vh, 1000px)",
    backgroundColor: THEME.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.line,
    // separate internal scroll from the fixed overlay
    overflow: "hidden",
    boxShadow: "0 18px 50px rgba(0,0,0,.35)" as any,
    display: "flex",
  },
  headerRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: THEME.line,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
  },
  titleText: { fontSize: 18, fontWeight: "900", color: THEME.ink },
  body: {
    padding: 14,
    gap: 12,
    overflowY: "auto" as any, // so mobile & desktop can scroll content independently
  },
  image: {
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  chip: {
    backgroundColor: THEME.chipBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipLight: {
    backgroundColor: "#f6f8fa",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: THEME.line,
  },
  chipTxt: { color: THEME.chipInk, fontWeight: "800", fontSize: 12 },
  bodyText: { color: "#111827", lineHeight: 20, fontSize: 14 },

  // pills (for Link “Svar”)
  pillBtn: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "web" ? 8 : 10,
    borderWidth: 1.5,
    borderColor: "#cbd5e1",
    backgroundColor: "#fff",
  },
  primaryPill: {
    backgroundColor: "#fff",
  },
  pillText: { fontSize: 14, fontWeight: "800" },
});