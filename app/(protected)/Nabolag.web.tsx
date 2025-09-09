// app/(protected)/Nabolag.web.tsx
import { decode } from "base64-arraybuffer";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import React, { useMemo, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Keyboard,
    Modal,
    Platform,
    RefreshControl,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    useWindowDimensions,
    View,
} from "react-native";

import { KATEGORIER, Post, useNabolag } from "../../hooks/useNabolag";
import { supabase } from "../../utils/supabase";

/* ╔════════════════════════════════ THEME (ALT KAN TILPASSES HER) ═══════════════════════════════╗
   ║ Skift farver, radii, skygger og breakpoints.                                                  ║
   ║ - Baggrundsfarven (#7C8996) ligger her, men på web styrer _layout.web.tsx også baggrunden.    ║
   ╚═══════════════════════════════════════════════════════════════════════════════════════════════╝ */
const THEME = {
  // ── Farver ────────────────────────────────────────────────────────────────────────────────
  pageBg: "#7C8996",           // ← EDIT HERE  (global baggrund)
  boardBg: "#ffffff",          // ← EDIT HERE  (den hvide “tavle”)
  ink: "#0b1220",              // ← EDIT HERE  (primær tekst)
  sub: "#425466",              // ← EDIT HERE  (sekundær tekst)
  line: "#d0d7de",             // ← EDIT HERE  (grænselinje)
  chipBg: "#eef2ff",           // ← EDIT HERE  (badge-knapper)
  chipText: "#1e293b",         // ← EDIT HERE
  btn: "#131921",              // ← EDIT HERE  (primær CTA)

  cardBg: "#ffffff",           // ← EDIT HERE  (kort)
  cardInk: "#0f172a",          // ← EDIT HERE  (kort-overskrift)
  imageBg: "#f1f5f9",          // ← EDIT HERE  (fallback for billeder)

  // ── Radii ────────────────────────────────────────────────────────────────────────────────
  radius: { sm: 8, md: 12, lg: 16, xl: 22 }, // ← EDIT HERE

  // ── Skygge (blød) ────────────────────────────────────────────────────────────────────────
  shadowSoft: {
    shadowColor: "#000",
    shadowOpacity: 0.08,      // ← EDIT HERE
    shadowRadius: 14,         // ← EDIT HERE
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  // ── Layout / breakpoints ─────────────────────────────────────────────────────────────────
  boardMaxW: 1120, // ← EDIT HERE  (max bredde for “tavle”)
  padX: 20,        // ← EDIT HERE  (vandret padding i board)
  gap: 18,         // ← EDIT HERE  (afstand mellem kort)
  brk3: 1024,      // ← EDIT HERE  (>= 3 kolonner)
  brk2: 680,       // ← EDIT HERE  (>= 2 kolonner)
} as const;

const distances = [1, 2, 3, 5, 10, 20, 50]; // radius-valg
const km = (n: number) => (Number.isNaN(n) ? "" : `${n.toFixed(1)} km`);

/* ╭────────────────────────────────────────── Helpers ───────────────────────────────────────────╮ */
function Chip({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.chip}>
      <Text style={styles.chipText}>{children}</Text>
    </View>
  );
}
/* ╰──────────────────────────────────────────────────────────────────────────────────────────────╯ */

/* ╭────────────────────────────────────── Kategori & Radius pickers ─────────────────────────────╮ */
function KategoriPicker({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.chipBtn} onPress={() => setOpen(true)} activeOpacity={0.9}>
        <Text style={styles.chipBtnText}>{value ?? "Alle kategorier"}</Text>
        <Text style={styles.caret}>▾</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: 360 }]}>
            <Text style={styles.modalTitle}>Vælg kategori</Text>

            <TouchableOpacity
              style={[
                styles.modalOption,
                { backgroundColor: value === null ? "#e6eeff" : "#f6f8fa", borderWidth: value === null ? 2 : 0, borderColor: "#3b82f6" },
              ]}
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <Text style={{ fontWeight: value === null ? "900" : "600", color: THEME.ink }}>Alle</Text>
            </TouchableOpacity>

            {KATEGORIER.map((k) => (
              <TouchableOpacity
                key={k}
                style={[
                  styles.modalOption,
                  { backgroundColor: value === k ? "#e6eeff" : "#f6f8fa", borderWidth: value === k ? 2 : 0, borderColor: "#3b82f6" },
                ]}
                onPress={() => {
                  onChange(k);
                  setOpen(false);
                }}
              >
                <Text style={{ fontWeight: value === k ? "900" : "600", color: THEME.ink }}>{k}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={() => setOpen(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Luk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function RadiusPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.chipBtn} onPress={() => setOpen(true)} activeOpacity={0.9}>
        <Text style={styles.chipBtnText}>{value} km</Text>
        <Text style={styles.caret}>▾</Text>
      </TouchableOpacity>

      <Modal transparent visible={open} animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: 360 }]}>
            <Text style={styles.modalTitle}>Vis opslag indenfor</Text>

            {distances.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.modalOption,
                  { backgroundColor: value === d ? "#e6eeff" : "#f6f8fa", borderWidth: value === d ? 2 : 0, borderColor: "#3b82f6" },
                ]}
                onPress={() => {
                  onChange(d);
                  setOpen(false);
                }}
              >
                <Text style={{ fontWeight: value === d ? "900" : "600", color: THEME.ink }}>{d} km</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={() => setOpen(false)} style={styles.modalClose}>
              <Text style={styles.modalCloseText}>Luk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}
/* ╰──────────────────────────────────────────────────────────────────────────────────────────────╯ */

/* ╭──────────────────────────────────────  Opret opslag (web)  ─────────────────────────────────╮ */
function OpretOpslagWeb({
  visible,
  onClose,
  onSubmit,
  currentUserId,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: any) => Promise<void>;
  currentUserId: string | null;
}) {
  const [overskrift, setOverskrift] = useState("");
  const [text, setText] = useState("");
  const [omraade, setOmraade] = useState("");
  const [kategori, setKategori] = useState<string | null>(null);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const canSubmit = overskrift.trim().length > 0 && text.trim().length > 0 && !saving;

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: false,
      quality: 1,
      base64: false,
    });
    if ((res as any)?.canceled) return;
    const asset = (res as any)?.assets?.[0];
    if (!asset?.uri) return;

    const manipulated = await ImageManipulator.manipulateAsync(
      asset.uri,
      [{ resize: { width: 1600 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG, base64: true }
    );

    if (!manipulated.base64) return;
    setImagePreview(manipulated.uri);
    setImageBase64(manipulated.base64);
  };

  const handleSubmit = async () => {
    if (!currentUserId || !canSubmit) return;

    try {
      setSaving(true);

      let image_url: string | null = null;
      if (imageBase64) {
        const BUCKET = "foreningsbilleder";
        const filePath = `posts/${currentUserId}/${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(filePath, decode(imageBase64), {
            contentType: "image/jpeg",
            upsert: true,
          });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        image_url = data?.publicUrl ?? null;
      }

      await onSubmit({
        overskrift: overskrift.trim(),
        text: text.trim(),
        omraade: omraade.trim() || null,
        kategori,
        image_url,
      });

      setOverskrift(""); setText(""); setOmraade(""); setKategori(null);
      setImagePreview(null); setImageBase64(null);
      onClose();
    } catch (e: any) {
      alert(e?.message || "Kunne ikke oprette opslag.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { width: 520, alignItems: "stretch" }]}>
            <Text style={styles.modalTitle}>Opret opslag</Text>

            <Text style={styles.label}>Overskrift *</Text>
            <TextInput
              style={styles.input}
              placeholder="Hvad handler det om?"
              placeholderTextColor="#9aa0a6"
              value={overskrift}
              onChangeText={setOverskrift}
            />

            <Text style={[styles.label, { marginTop: 8 }]}>Tekst *</Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              placeholder="Fortæl lidt mere…"
              placeholderTextColor="#9aa0a6"
              value={text}
              onChangeText={setText}
              multiline
            />

            <Text style={[styles.label, { marginTop: 8 }]}>Område</Text>
            <TextInput
              style={styles.input}
              placeholder="fx vej/bydel"
              placeholderTextColor="#9aa0a6"
              value={omraade}
              onChangeText={setOmraade}
            />

            <Text style={[styles.label, { marginTop: 8 }]}>Kategori</Text>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <TextInput
                editable={false}
                style={[styles.input, { flex: 1, marginTop: 0 }]}
                placeholder="(valgfri)"
                placeholderTextColor="#9aa0a6"
                value={kategori || ""}
              />
              <KategoriPicker value={kategori} onChange={setKategori} />
            </View>

            {imagePreview ? (
              <View style={{ marginTop: 10 }}>
                <Image source={{ uri: imagePreview }} style={styles.preview} />
                <TouchableOpacity
                  onPress={() => { setImagePreview(null); setImageBase64(null); }}
                  style={[styles.smallBtn, styles.grayBtn, { alignSelf: "flex-start", marginTop: 8 }]}
                >
                  <Text style={styles.smallBtnText}>Fjern billede</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={pickImage} style={[styles.smallBtn, styles.btn, { alignSelf: "flex-start", marginTop: 10 }]}>
                <Text style={styles.smallBtnText}>Vælg billede</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.action, styles.btn, !canSubmit && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                <Text style={styles.actionText}>{saving ? "Opretter…" : "Opret opslag"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.action, styles.grayBtn]} onPress={onClose}>
                <Text style={styles.actionText}>Annullér</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
/* ╰──────────────────────────────────────────────────────────────────────────────────────────────╯ */

/* ╭──────────────────────────────────────  Detalje-modal (web)  ────────────────────────────────╮ */
function OpslagDetaljeWeb({
  visible,
  opslag,
  onClose,
  distanceText,
}: {
  visible: boolean;
  opslag: Post | null;
  onClose: () => void;
  distanceText?: string | null;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { width: 640, alignItems: "stretch" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={styles.modalTitle}>Opslag</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontWeight: "900", fontSize: 18, color: THEME.ink }}>✕</Text>
            </TouchableOpacity>
          </View>

          {opslag ? (
            <View>
              {!!opslag.image_url && (
                <Image source={{ uri: opslag.image_url }} style={{ width: "100%", height: 280, borderRadius: THEME.radius.md, marginBottom: 10, backgroundColor: THEME.imageBg }} />
              )}
              {!!opslag.kategori && <Chip>{opslag.kategori}</Chip>}
              <Text style={{ fontWeight: "900", fontSize: 18, color: THEME.cardInk }}>{opslag.overskrift}</Text>
              {!!opslag.omraade && <Text style={{ color: "#374151", marginTop: 2 }}>{opslag.omraade}</Text>}
              {!!distanceText && <Text style={{ color: "#6b7280", marginTop: 2 }}>{distanceText}</Text>}
              {!!opslag.text && <Text style={{ color: "#111827", marginTop: 10, lineHeight: 20 }}>{opslag.text}</Text>}
            </View>
          ) : (
            <Text style={{ color: "#6b7280" }}>Indlæser…</Text>
          )}

          <TouchableOpacity onPress={onClose} style={[styles.action, styles.btn, { marginTop: 16, alignSelf: "flex-start" }]}>
            <Text style={styles.actionText}>Luk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}
/* ╰──────────────────────────────────────────────────────────────────────────────────────────────╯ */

/* ╭────────────────────────────────────────────  Skærm  ─────────────────────────────────────────╮ */
export default function NabolagWeb() {
  const {
    userId,
    userLocation,
    loading,
    refreshing,
    filteredPosts,
    searchQuery,
    setSearchQuery,
    radius,
    handleRadiusChange,
    kategoriFilter,
    setKategoriFilter,
    onRefresh,
    createPost,
    distanceInKm,
  } = useNabolag();

  const { width } = useWindowDimensions();

  // Board-beregninger (centreret grid, ingen “overskæring” i højre side)
  const boardW = Math.min(width, THEME.boardMaxW);
  const cols = boardW >= THEME.brk3 ? 3 : boardW >= THEME.brk2 ? 2 : 1;
  const isGrid = cols > 1;
  const rawW =
    (boardW - THEME.padX * 2 - (isGrid ? THEME.gap * (cols - 1) : 0)) /
    (isGrid ? cols : 1);
  const cardW = Math.floor(rawW);
  const singleW = Math.floor(boardW - THEME.padX * 2);
  const isNarrow = boardW < 560;

  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selected, setSelected] = useState<Post | null>(null);

  const distanceText = useMemo(() => {
    if (!selected || !userLocation || !selected.latitude || !selected.longitude) return null;
    return km(
      distanceInKm(
        userLocation.latitude,
        userLocation.longitude,
        selected.latitude,
        selected.longitude
      )
    );
  }, [selected, userLocation]);

  const renderItem = ({ item }: { item: Post }) => {
    const showD = !!userLocation && !!item.latitude && !!item.longitude;
    const d = showD
      ? distanceInKm(
          userLocation!.latitude,
          userLocation!.longitude,
          item.latitude!,
          item.longitude!
        )
      : NaN;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelected(item);
          setDetailOpen(true);
        }}
        activeOpacity={0.92}
        style={{
          width: isGrid ? cardW : singleW,
          marginBottom: THEME.gap,
        }}
      >
        <View style={styles.card}>
          {!!item.image_url && (
            <Image
              source={{ uri: item.image_url }}
              style={styles.cardImage}
            />
          )}
          <View style={{ padding: 10 }}>
            {!!item.kategori && <Chip>{item.kategori}</Chip>}
            <Text style={styles.title}>{item.overskrift}</Text>
            {!!item.omraade && <Text style={styles.place}>{item.omraade}</Text>}
            {!!item.text && (
              <Text style={styles.teaser} numberOfLines={1} ellipsizeMode="tail">
                {item.text}
              </Text>
            )}
            {showD ? <Text style={styles.distance}>{km(d)} væk</Text> : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.page}>
      {/* Board (den hvide "tavle") */}
      <View style={[styles.board, { width: boardW }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.h1}>Nabolag</Text>
          <TouchableOpacity style={styles.primary} onPress={() => setCreateOpen(true)}>
            <Text style={styles.primaryText}>Opret opslag</Text>
          </TouchableOpacity>
        </View>

        {/* Filtre */}
        <View style={[styles.filters, isNarrow && { flexDirection: "column", gap: 10 }]}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={[styles.search, isNarrow && { width: "100%" }]}
            placeholder="Søg i opslag…"
            placeholderTextColor="#6b7280"
            returnKeyType="search"
          />
          <View style={[styles.filterRight, isNarrow && { width: "100%", justifyContent: "space-between" }]}>
            <KategoriPicker value={kategoriFilter} onChange={setKategoriFilter} />
            <RadiusPicker value={radius} onChange={handleRadiusChange} />
          </View>
        </View>

        {/* Grid */}
        {loading ? (
          <ActivityIndicator size="large" color={THEME.ink} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(it) => it.id}
            style={{ width: "100%" }}
            contentContainerStyle={{
              paddingHorizontal: THEME.padX,
              paddingBottom: 28,
              alignItems: "center",
              width: boardW,
              alignSelf: "center",
            }}
            numColumns={isGrid ? cols : 1}
            columnWrapperStyle={isGrid ? { gap: THEME.gap } : undefined}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={{ color: THEME.sub, marginTop: 14 }}>Ingen opslag fundet.</Text>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.ink]} />}
          />
        )}
      </View>

      {/* Modaler */}
      <OpretOpslagWeb
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={async (payload) => {
          await createPost(payload);
        }}
        currentUserId={userId}
      />

      <OpslagDetaljeWeb
        visible={detailOpen}
        opslag={selected}
        onClose={() => setDetailOpen(false)}
        distanceText={distanceText}
      />
    </View>
  );
}
/* ╰──────────────────────────────────────────────────────────────────────────────────────────────╯ */

/* ╔══════════════════════════════════════  STYLES  ═════════════════════════════════════════════╗ */
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: THEME.pageBg,        // ← EDIT HERE (kan overstyres i _layout.web.tsx)
    alignItems: "center",
  },

  board: {
    backgroundColor: THEME.boardBg,
    borderRadius: THEME.radius.xl,
    ...THEME.shadowSoft,
    marginTop: 16,                         // luft under fixed navbar
    marginBottom: 18,
  },

  header: {
    height: 68,
    paddingHorizontal: THEME.padX,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  h1: { color: THEME.ink, fontSize: 22, fontWeight: "900" },

  primary: {
    backgroundColor: THEME.btn,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: THEME.radius.md,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  primaryText: { color: "#fff", fontWeight: "800" },

  filters: {
    paddingHorizontal: THEME.padX,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  search: {
    flex: 1,
    height: 44,
    backgroundColor: "#fff",
    borderRadius: THEME.radius.md,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: THEME.line,
    color: THEME.ink,
  },
  filterRight: { flexDirection: "row", alignItems: "center", gap: 10 },

  chipBtn: {
    height: 44,
    borderRadius: THEME.radius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: THEME.line,
    backgroundColor: THEME.chipBg,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  chipBtnText: { color: THEME.chipText, fontWeight: "800" },
  caret: { color: THEME.chipText, fontSize: 12, marginTop: 1 },

  chip: {
    alignSelf: "flex-start",
    backgroundColor: THEME.chipBg,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 6,
  },
  chipText: { color: THEME.chipText, fontWeight: "800", fontSize: 12 },

  card: {
    width: "100%",
    backgroundColor: THEME.cardBg,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.line,
    overflow: "hidden",
  },
  cardImage: { width: "100%", height: 132, backgroundColor: THEME.imageBg },
  title: { fontWeight: "900", fontSize: 16, color: THEME.cardInk },
  place: { fontSize: 12, color: "#64748b", marginTop: 2 },
  teaser: { fontSize: 13, color: "#475569", marginTop: 6 },
  distance: { fontSize: 11, color: "#6b7280", marginTop: 6 },

  // Modal & inputs
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "center", alignItems: "center", padding: 18 },
  modalCard: { backgroundColor: "#fff", borderRadius: THEME.radius.xl, borderWidth: 1, borderColor: "#eef1f4", padding: 18 },
  modalTitle: { fontSize: 18, fontWeight: "900", color: "#111827", marginBottom: 12 },
  modalOption: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: THEME.radius.md, backgroundColor: "#f6f8fa", marginBottom: 8, alignItems: "center" },
  modalClose: { alignSelf: "center", marginTop: 6, padding: 8 },
  modalCloseText: { color: "#374151", fontWeight: "700" },

  input: {
    backgroundColor: "#fff",
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: "#e5e8ec",
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "web" ? 10 : 8,
    color: "#000",
    marginTop: 6,
    fontSize: 14,
  },
  inputMulti: { minHeight: 90, textAlignVertical: "top" },
  label: { color: "#111827", fontWeight: "700" },

  smallBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: THEME.radius.md, alignSelf: "flex-start" },
  smallBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  btn: { backgroundColor: THEME.btn },
  grayBtn: { backgroundColor: "#9aa0a6" },
  preview: { width: "100%", height: 180, backgroundColor: THEME.imageBg, borderRadius: THEME.radius.md },

  action: { borderRadius: THEME.radius.md, paddingVertical: 12, paddingHorizontal: 16, alignItems: "center", justifyContent: "center" },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});
/* ╚══════════════════════════════════════════════════════════════════════════════════════════════╝ */