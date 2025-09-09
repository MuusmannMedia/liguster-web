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

/* ─────────────────────────  TEMA / LAYOUT  ───────────────────────── */
/*  SKIFT FARVER HER  */
const THEME = {
  pageBg: "#7C8996", // ← Global baggrund
  boardBg: "#0b1220",
  paneBg: "#0f1623",
  ink: "#0b1220",
  text: "#e5e7eb",
  sub: "#94a3b8",
  white: "#ffffff",
  outline: "#dbe2ea",
  outlineDark: "#1f2937",
  badgeBg: "#25489022",
  // knapper
  btnBg: "#131921",
  btnText: "#ffffff",
};
/*  BREDDER / GAPS  */
const LAYOUT = {
  MAX_BOARD_W: 1040, // “kort-tavlens” max bredde
  PAD_X: 20,
  GAP: 16,
  RADIUS: 14,
  INPUT_H: 46,
};
/*  Afstande til filter-dialoger  */
const distances = [1, 2, 3, 5, 10, 20, 50];

/* ───────────────────────── Hjælpere ───────────────────────── */
function fmtKm(n: number) {
  if (Number.isNaN(n)) return "";
  return `${n.toFixed(1)} km`;
}

/* ───────────────────────── Filter-dialoger ───────────────────────── */
function KategoriSelector({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.iconBtn} onPress={() => setOpen(true)} activeOpacity={0.9}>
        <Text style={styles.iconBtnText}>▾</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.dialog}>
            <Text style={dialogStyles.title}>Vælg kategori</Text>

            <TouchableOpacity
              style={[dialogStyles.option, value === null && dialogStyles.selectedOption]}
              onPress={() => {
                onChange(null);
                setOpen(false);
              }}
            >
              <Text style={dialogStyles.optionText}>Alle</Text>
            </TouchableOpacity>

            {KATEGORIER.map((k) => (
              <TouchableOpacity
                key={k}
                style={[dialogStyles.option, value === k && dialogStyles.selectedOption]}
                onPress={() => {
                  onChange(k);
                  setOpen(false);
                }}
              >
                <Text style={dialogStyles.optionText}>{k}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={dialogStyles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={dialogStyles.closeBtnText}>Luk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function RadiusSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.radiusBtn} onPress={() => setOpen(true)}>
        <Text style={styles.radiusBtnText}>{value} km</Text>
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={dialogStyles.overlay}>
          <View style={dialogStyles.dialog}>
            <Text style={dialogStyles.title}>Vis opslag indenfor</Text>

            {distances.map((d) => (
              <TouchableOpacity
                key={d}
                style={[dialogStyles.option, value === d && dialogStyles.selectedOption]}
                onPress={() => {
                  onChange(d);
                  setOpen(false);
                }}
              >
                <Text style={dialogStyles.optionText}>{d} km</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={dialogStyles.closeBtn} onPress={() => setOpen(false)}>
              <Text style={dialogStyles.closeBtnText}>Luk</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

/* ───────────────────── Opret opslag (web) ───────────────────── */
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

      setOverskrift("");
      setText("");
      setOmraade("");
      setKategori(null);
      setImagePreview(null);
      setImageBase64(null);
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
        <View style={dialogStyles.overlay}>
          <View style={[dialogStyles.dialog, { width: 520, alignItems: "stretch" }]}>
            <Text style={[dialogStyles.title, { alignSelf: "center" }]}>Opret opslag</Text>

            <TextInput
              style={styles.input}
              placeholder="Overskrift *"
              placeholderTextColor="#9aa0a6"
              value={overskrift}
              onChangeText={setOverskrift}
            />
            <TextInput
              style={[styles.input, styles.inputMultiline]}
              placeholder="Tekst *"
              placeholderTextColor="#9aa0a6"
              value={text}
              onChangeText={setText}
              multiline
            />
            <TextInput
              style={styles.input}
              placeholder="Område (fx vej/bydel)"
              placeholderTextColor="#9aa0a6"
              value={omraade}
              onChangeText={setOmraade}
            />

            <View style={{ marginTop: 8 }}>
              <Text style={styles.label}>Kategori</Text>
              <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
                <TextInput
                  editable={false}
                  style={[styles.input, { flex: 1, marginTop: 0 }]}
                  placeholder="(valgfri)"
                  placeholderTextColor="#9aa0a6"
                  value={kategori || ""}
                />
                <KategoriSelector value={kategori} onChange={setKategori} />
              </View>
            </View>

            {imagePreview ? (
              <View style={{ marginTop: 8 }}>
                <Image source={{ uri: imagePreview }} style={styles.preview} />
                <TouchableOpacity
                  onPress={() => {
                    setImagePreview(null);
                    setImageBase64(null);
                  }}
                  style={[styles.smallBtn, styles.grayBtn, { alignSelf: "flex-start", marginTop: 8 }]}
                >
                  <Text style={styles.smallBtnText}>Fjern billede</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                onPress={pickImage}
                style={[styles.smallBtn, styles.blackBtn, { alignSelf: "flex-start", marginTop: 6 }]}
              >
                <Text style={styles.smallBtnText}>Vælg billede</Text>
              </TouchableOpacity>
            )}

            <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.blackBtn, !canSubmit && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={!canSubmit}
              >
                <Text style={styles.actionText}>{saving ? "Opretter…" : "Opret opslag"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, styles.grayBtn]} onPress={onClose}>
                <Text style={styles.actionText}>Annullér</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

/* ───────────────────── Detalje modal (web) ───────────────────── */
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={[dialogStyles.dialog, { width: 640, alignItems: "stretch" }]}>
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <Text style={[dialogStyles.title, { marginBottom: 0 }]}>Opslag</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={{ fontWeight: "900", fontSize: 18 }}>✕</Text>
            </TouchableOpacity>
          </View>

          {opslag ? (
            <View>
              {!!opslag.image_url && (
                <Image source={{ uri: opslag.image_url }} style={{ width: "100%", height: 280, borderRadius: 12, marginBottom: 10 }} />
              )}
              {!!opslag.kategori && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{opslag.kategori}</Text>
                </View>
              )}
              <Text style={{ fontWeight: "900", fontSize: 18, color: THEME.ink }}>{opslag.overskrift}</Text>
              {!!opslag.omraade && <Text style={{ color: "#374151", marginTop: 2 }}>{opslag.omraade}</Text>}
              {!!distanceText && <Text style={{ color: "#6b7280", marginTop: 2 }}>{distanceText}</Text>}
              {!!opslag.text && <Text style={{ color: "#111827", marginTop: 10, lineHeight: 20 }}>{opslag.text}</Text>}
            </View>
          ) : (
            <Text style={{ color: "#6b7280" }}>Indlæser…</Text>
          )}

          <TouchableOpacity onPress={onClose} style={[styles.actionBtn, styles.blackBtn, { marginTop: 16 }]}>
            <Text style={styles.actionText}>Luk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ───────────────────────────── Skærm ───────────────────────────── */
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

  const [opretVisible, setOpretVisible] = useState(false);
  const [detaljeVisible, setDetaljeVisible] = useState(false);
  const [valgtOpslag, setValgtOpslag] = useState<Post | null>(null);

  const { width } = useWindowDimensions();

  // “Tavle”-bredde + responsive kolonner (1 / 2 / 3)
  const boardW = Math.min(width, LAYOUT.MAX_BOARD_W);
  const cols = width >= 980 ? 3 : width >= 680 ? 2 : 1;
  const isGrid = cols > 1;
  const cardW = isGrid
    ? (boardW - LAYOUT.PAD_X * 2 - LAYOUT.GAP * (cols - 1)) / cols
    : Math.min(560, boardW - LAYOUT.PAD_X * 2);

  const distanceText = useMemo(() => {
    if (!valgtOpslag || !userLocation || !valgtOpslag.latitude || !valgtOpslag.longitude) return null;
    const d = distanceInKm(
      userLocation.latitude,
      userLocation.longitude,
      valgtOpslag.latitude,
      valgtOpslag.longitude
    );
    return fmtKm(d);
  }, [valgtOpslag, userLocation]);

  const renderItem = ({ item }: { item: Post }) => {
    const showDistance = !!userLocation && !!item.latitude && !!item.longitude;
    const d = showDistance
      ? distanceInKm(userLocation!.latitude, userLocation!.longitude, item.latitude!, item.longitude!)
      : NaN;

    return (
      <TouchableOpacity
        onPress={() => {
          setValgtOpslag(item);
          setDetaljeVisible(true);
        }}
        style={{ width: cardW, marginBottom: LAYOUT.GAP }}
        activeOpacity={0.92}
      >
        <View style={styles.card}>
          {!!item.image_url && <Image source={{ uri: item.image_url }} style={styles.cardImage} />}
          {!!item.kategori && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{item.kategori}</Text>
            </View>
          )}
          <Text style={styles.cardTitle}>{item.overskrift}</Text>
          {!!item.omraade && <Text style={styles.cardPlace}>{item.omraade}</Text>}
          {!!item.text && (
            <Text style={styles.cardTeaser} numberOfLines={1} ellipsizeMode="tail">
              {item.text}
            </Text>
          )}
          {showDistance ? <Text style={styles.distance}>{fmtKm(d)} væk</Text> : null}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.page}>
      {/* “Tavlen” der holder alt indhold centreret og giver scroll */}
      <View style={[styles.board, { width: boardW }]}>
        {/* Toplinje: søg + filtre + CTA */}
        <View style={styles.topRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Søg i opslag…"
            placeholderTextColor={THEME.sub}
            returnKeyType="search"
          />

          <View style={styles.topRight}>
            <KategoriSelector value={kategoriFilter} onChange={setKategoriFilter} />
            <RadiusSelector value={radius} onChange={handleRadiusChange} />
            <TouchableOpacity style={styles.primaryBtn} onPress={() => setOpretVisible(true)} activeOpacity={0.92}>
              <Text style={styles.primaryBtnText}>Opret opslag</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Kortliste – scroll sker her */}
        {loading ? (
          <ActivityIndicator size="large" color={THEME.ink} style={{ marginTop: 20 }} />
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(it) => it.id}
            style={{ width: "100%" }}
            contentContainerStyle={{
              paddingHorizontal: LAYOUT.PAD_X,
              paddingBottom: 28,
              alignItems: "center",
              width: boardW,
              alignSelf: "center",
            }}
            numColumns={isGrid ? cols : 1}
            columnWrapperStyle={isGrid ? { gap: LAYOUT.GAP } : undefined}
            renderItem={renderItem}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<Text style={{ color: THEME.sub, marginTop: 14 }}>Ingen opslag fundet.</Text>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[THEME.ink]} />}
          />
        )}
      </View>

      {/* Modaler */}
      <OpretOpslagWeb
        visible={opretVisible}
        onClose={() => setOpretVisible(false)}
        onSubmit={async (payload) => {
          await createPost(payload);
        }}
        currentUserId={userId}
      />
      <OpslagDetaljeWeb
        visible={detaljeVisible}
        opslag={valgtOpslag}
        onClose={() => setDetaljeVisible(false)}
        distanceText={distanceText}
      />
    </View>
  );
}

/* ───────────────────────── Styles ───────────────────────── */
const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: THEME.pageBg, // ← baggrund
    alignItems: "center",
  },

  board: {
    backgroundColor: THEME.boardBg,
    borderRadius: 18,
    marginTop: 18,
    marginBottom: 18,
    overflow: "hidden",
    // subtil skygge
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },

  topRow: {
    width: "100%",
    paddingHorizontal: LAYOUT.PAD_X,
    paddingTop: 18,
    paddingBottom: 10,
    gap: 10,
  },

  topRight: {
    width: "100%",
    marginTop: 10,
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    justifyContent: "flex-end",
  },

  searchInput: {
    width: "100%",
    height: LAYOUT.INPUT_H,
    backgroundColor: THEME.paneBg,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: THEME.text,
    borderWidth: 1.5,
    borderColor: THEME.outlineDark,
  },

  /* Knapper */
  primaryBtn: {
    height: LAYOUT.INPUT_H,
    paddingHorizontal: 16,
    backgroundColor: THEME.btnBg,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: THEME.white,
  },
  primaryBtnText: { color: THEME.btnText, fontWeight: "900", letterSpacing: 0.4 },

  iconBtn: {
    height: LAYOUT.INPUT_H,
    width: LAYOUT.INPUT_H,
    borderRadius: 12,
    backgroundColor: THEME.btnBg,
    borderWidth: 2,
    borderColor: THEME.white,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { color: THEME.white, fontSize: 18, marginTop: -2, fontWeight: "900" },

  radiusBtn: {
    height: LAYOUT.INPUT_H,
    minWidth: 68,
    borderRadius: 12,
    backgroundColor: THEME.btnBg,
    borderWidth: 2,
    borderColor: THEME.white,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  radiusBtnText: { color: THEME.white, fontWeight: "900" },

  /* Kort */
  card: {
    width: "100%",
    backgroundColor: THEME.white,
    borderRadius: LAYOUT.RADIUS,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.outline,
  },
  cardImage: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: "#eef2f7",
  },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: THEME.badgeBg,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 7,
  },
  badgeText: { color: THEME.ink, fontWeight: "bold", fontSize: 12.5 },
  cardTitle: { fontWeight: "900", fontSize: 16, marginBottom: 2, color: THEME.ink },
  cardPlace: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  cardTeaser: { fontSize: 13, color: "#475569", marginTop: 3 },
  distance: { fontSize: 11, color: "#6b7280", marginTop: 4 },

  /* Inputs i dialog */
  input: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e8ec",
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "web" ? 10 : 8,
    color: "#000",
    marginTop: 6,
    fontSize: 14,
  },
  inputMultiline: { minHeight: 90, textAlignVertical: "top" },
  label: { color: "#111827", fontWeight: "700", marginBottom: 6 },

  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  smallBtnText: { color: "#fff", fontWeight: "800", fontSize: 12 },
  blackBtn: { backgroundColor: THEME.btnBg },
  grayBtn: { backgroundColor: "#9aa0a6" },
  preview: { width: "100%", height: 180, backgroundColor: "#f1f5f9", borderRadius: 10 },

  actionBtn: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: { color: "#fff", fontSize: 14, fontWeight: "900" },
});

const dialogStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15,22,35,0.70)",
    justifyContent: "center",
    alignItems: "center",
    padding: 18,
  },
  dialog: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 18,
    width: 420,
    borderWidth: 1,
    borderColor: "#eef1f4",
  },
  title: { fontSize: 18, fontWeight: "900", color: "#111827", marginBottom: 12 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 7,
    backgroundColor: "#f4f7fa",
    width: 240,
    alignItems: "center",
    alignSelf: "center",
  },
  optionText: { color: "#111827", fontWeight: "600" },
  selectedOption: { backgroundColor: "#e5ecff", borderColor: "#3b82f6", borderWidth: 2 },
  closeBtn: { marginTop: 10, padding: 8, alignSelf: "center" },
  closeBtnText: { color: "#111827", fontWeight: "bold" },
});