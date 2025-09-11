// app/(protected)/OpslagDetaljeModal.web.tsx
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Image, StyleSheet, Text, TextInput, View } from "react-native";
import { supabase } from "../../utils/supabase";

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
};

export default function OpslagDetaljeModalWeb() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [post, setPost] = useState<PostRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  // reply dialog
  const [replyOpen, setReplyOpen] = useState(false);
  const [replyText, setReplyText] = useState("");

  // lås baggrundsscroll mens modal-siden er åben
  useEffect(() => {
    if (typeof document !== "undefined") {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, []);

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
          .select("id,user_id,created_at,overskrift,text,omraade,kategori,image_url,latitude,longitude")
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

  // SEND: som standard hopper vi til Beskeder med prefill
  const sendReply = () => {
    if (!post?.user_id || !post?.id || !replyText.trim()) return;
    const href = `/(protected)/Beskeder?compose=1&to=${encodeURIComponent(
      post.user_id
    )}&postId=${encodeURIComponent(post.id)}&text=${encodeURIComponent(replyText.trim())}`;
    router.replace(href);
  };

  // guard
  useEffect(() => {
    if (!id) close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={styles.titleText}>{post?.overskrift || (loading ? "Indlæser…" : "Opslag")}</Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {post?.id && post?.user_id ? (
              <button
                onClick={() => setReplyOpen(true)}
                className="pill"
                aria-label="Svar på opslag"
              >
                Svar
              </button>
            ) : null}
            <button onClick={close} className="pill" aria-label="Luk">
              Luk
            </button>
          </View>
        </View>

        {/* Body (scrolls) */}
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

        {/* Reply dialog (inline) */}
        {replyOpen && (
          <View style={styles.replyWrap}>
            <Text style={styles.replyLabel}>Skriv en besked til forfatteren</Text>
            <TextInput
              style={styles.replyInput}
              multiline
              placeholder="Din besked…"
              placeholderTextColor="#94a3b8"
              value={replyText}
              onChangeText={setReplyText}
            />
            <View style={{ flexDirection: "row", gap: 8, justifyContent: "flex-end" }}>
              <button className="pill" onClick={() => setReplyOpen(false)}>Annullér</button>
              <button className="pill primary" onClick={sendReply} disabled={!replyText.trim()}>
                Send
              </button>
            </View>
          </View>
        )}
      </View>

      {/* Web-CSS for knapper + iOS Safari scroll hints */}
      <style>{`
        .pill{
          padding:8px 12px;
          border-radius:999px;
          border:1.5px solid #cbd5e1;
          background:#0b1220;
          color:#fff;
          font-weight:800;
          cursor:pointer;
        }
        .pill.primary{ background:#ffffff; color:#0b1220; }
        .pill:disabled{ opacity:.6; cursor:not-allowed; }
        .pill:hover{ opacity:.95 }

        /* iOS Safari smooth scroll inside the card */
        .rnw-overflow-scroll{ -webkit-overflow-scrolling: touch; }
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
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
  },
  card: {
    width: "100%",
    maxWidth: 720,
    maxHeight: "86vh",
    backgroundColor: THEME.cardBg,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.line,
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
    overflowY: "auto" as any,
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

  replyWrap: {
    borderTopWidth: 1,
    borderTopColor: THEME.line,
    padding: 14,
    gap: 8,
    backgroundColor: "#ffffff",
  },
  replyLabel: { color: THEME.ink, fontWeight: "900" },
  replyInput: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: THEME.line,
    borderRadius: 12,
    padding: 10,
    color: THEME.ink,
    backgroundColor: "#fff",
    outlineStyle: "none",
  },
});