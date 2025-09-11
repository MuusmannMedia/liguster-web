// app/(protected)/OpslagDetaljeModal.web.tsx
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Image, Platform, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from "react-native";
import { supabase } from "../../utils/supabase";

// Valgfrit: hvis du vil vise distance senere, kan du importere din hook for location.
// import { useNabolag } from "../../hooks/useNabolag";

type PostRow = {
  id: string;
  overskrift: string | null;
  text: string | null;
  image_url: string | null;
  kategori: string | null;
  omraade: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string | null;
};

const THEME = {
  overlay: "rgba(0,0,0,0.45)",
  cardBg: "#ffffff",
  cardInk: "#0f172a",
  sub: "#475569",
  line: "#e5e7eb",
  chipBg: "#eef2ff",
  chipInk: "#1e293b",
  btn: "#0b1220",
  btnText: "#ffffff",
};

const RADII = { md: 12, lg: 16, xl: 22 };

export default function OpslagDetaljeModalWeb() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { width, height } = useWindowDimensions();

  // Responsiv bredde: 720 på desktop, smallere på mobil
  const cardWidth = Math.min(width - 32, 720);
  // Billedhøjde: 9/16 af kortets bredde, men minimum 220
  const imageHeight = Math.max(220, Math.round((cardWidth * 9) / 16));

  const [loading, setLoading] = useState(true);
  const [row, setRow] = useState<PostRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!id) { setError("Mangler id."); setLoading(false); return; }
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("posts")
          .select("id, overskrift, text, image_url, kategori, omraade, latitude, longitude, created_at")
          .eq("id", id)
          .maybeSingle();
        if (error) throw error;
        if (alive) setRow(data as PostRow);
      } catch (e: any) {
        if (alive) setError(e?.message ?? "Kunne ikke hente opslag.");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const created = useMemo(() => {
    if (!row?.created_at) return null;
    try {
      const d = new Date(row.created_at);
      return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
    } catch { return null; }
  }, [row?.created_at]);

  const close = () => router.back();

  return (
    <View style={[styles.overlay, { width, height }]}>
      <View style={[styles.card, { width: cardWidth }]}>
        {/* Topbar */}
        <View style={styles.topRow}>
          <Text style={styles.title}>{row?.overskrift ?? (loading ? "Indlæser…" : "Opslag")}</Text>
          <TouchableOpacity onPress={close} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Luk">
            <Text style={styles.closeBtnText}>Luk</Text>
          </TouchableOpacity>
        </View>

        {/* Indhold */}
        {loading ? (
          <View style={styles.centerArea}>
            <ActivityIndicator size="large" color={THEME.cardInk} />
          </View>
        ) : error ? (
          <Text style={{ color: "crimson", fontWeight: "700" }}>{error}</Text>
        ) : row ? (
          <View>
            {!!row.image_url && (
              <Image
                source={{ uri: row.image_url }}
                style={{ width: "100%", height: imageHeight, borderRadius: RADII.md, backgroundColor: "#f1f5f9" }}
                resizeMode="cover"
              />
            )}

            <View style={{ marginTop: 12, rowGap: 8 }}>
              {/* Chips */}
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {!!row.kategori && <Chip>{row.kategori}</Chip>}
                {!!row.omraade && <Chip>{row.omraade}</Chip>}
                {!!created && <Chip>{created}</Chip>}
              </View>

              {!!row.text && (
                <Text style={styles.body}>{row.text}</Text>
              )}
            </View>
          </View>
        ) : (
          <Text style={styles.body}>Opslaget findes ikke.</Text>
        )}
      </View>
    </View>
  );
}

/* —————— små komponenter —————— */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  );
}

/* —————— styles —————— */
const styles = StyleSheet.create({
  overlay: {
    position: "fixed" as const,
    top: 0, left: 0,
    backgroundColor: THEME.overlay,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 9999,
    // lidt blur for web
    ...(Platform.OS === "web" ? { backdropFilter: "blur(2px)" } as any : null),
  },
  card: {
    backgroundColor: THEME.cardBg,
    borderRadius: RADII.xl,
    borderWidth: 1,
    borderColor: THEME.line,
    padding: 16,
    boxShadow: Platform.OS === "web" ? ("0 16px 44px rgba(0,0,0,.35)") as any : undefined,
    maxHeight: "92vh",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: THEME.cardInk,
    flexShrink: 1,
  },
  closeBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: THEME.btn,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  closeBtnText: {
    color: THEME.btnText,
    fontWeight: "900",
    fontSize: 14,
  },
  chip: {
    alignSelf: "flex-start",
    backgroundColor: THEME.chipBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  chipText: { color: THEME.chipInk, fontWeight: "800", fontSize: 12 },
  body: {
    color: "#111827",
    fontSize: 16,
    lineHeight: 22,
  },
  centerArea: { alignItems: "center", justifyContent: "center", paddingVertical: 32 },
});