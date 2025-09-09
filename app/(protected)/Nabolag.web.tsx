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

/* Theme */
const COLORS = {
  pageBg: "#7C8996",        // requested
  panel: "#0b1220",
  text: "#0b1220",
  sub: "#334155",
  white: "#fff",
  blue: "#131921",
  blueTint: "#25489022",
  fieldBorder: "#1f2937",
  card: "#ffffff",
  cardText: "#131921",
};
const RADII = { sm: 8, md: 10, lg: 14, xl: 18 };
const SHADOW = {
  card: {
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
};
const distances = [1, 2, 3, 5, 10, 20, 50];

/** Shared layout with layout.web.tsx */
const LAYOUT = {
  MAX_W: 1180,
  PAD_X: 24,
  GAP: 16,
  MAX_CARD_W_SINGLE: 560,
};

/* Helpers */
function fmtKm(n: number) {
  if (Number.isNaN(n)) return "";
  return `${n.toFixed(1)} km`;
}

/* Small selectors */
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
      <TouchableOpacity style={styles.iconBtn} onPress={() => setOpen(true)} activeOpacity={0.85}>
        <Text style={styles.iconBtnText}>▼</Text>
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
              <Text style={{ fontWeight: value === null ? "bold" : "normal" }}>Alle</Text>
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
                <Text style={{ fontWeight: value === k ? "bold" : "normal" }}>{k}</Text>
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
                style={[dialogStyles.option, d === value && dialogStyles.selectedOption]}
                onPress={() => {
                  onChange(d);
                  setOpen(false);
                }}
              >
                <Text style={{ fontWeight: d === value ? "bold" : "normal" }}>{d} km</Text>
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

/* Create Post (web) */
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

            <View style={{ marginTop: 6, marginBottom: 10 }}>
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

/* Detail modal */
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
              <Text style={{ fontWeight: "900", fontSize: 18, color: COLORS.cardText }}>{opslag.overskrift}</Text>
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

/* Screen */
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

  // Container width we actually use (matches layout)
  const containerWidth = Math.min(width, LAYOUT.MAX_W);
  // 3 columns on desktop, 2 on tablet, 1 on mobile
  const numColumns = containerWidth >= 1000 ? 3 : containerWidth >= 680 ? 2 : 1;
  const isGrid = numColumns > 1;

  const cardWidth = isGrid
    ? (containerWidth - LAYOUT.PAD_X * 2 - LAYOUT.GAP * (numColumns - 1)) / numColumns
    : Math.min(LAYOUT.MAX_CARD_W_SINGLE, containerWidth - LAYOUT.PAD_X * 2);

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

  const renderItem = ({ item }: { item: Post; index: number }) => {
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
        style={{ width: cardWidth, marginBottom: LAYOUT.GAP }}
        activeOpacity={0.9}
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
      <View style={styles.container}>
        {/* Title removed (you already have it in navbar). Keep only controls */}
        <TouchableOpacity style={styles.primaryCta} onPress={() => setOpretVisible(true)} activeOpacity={0.88}>
          <Text style={styles.primaryCtaText}>OPRET OPSLAG</Text>
        </TouchableOpacity>

        <View style={styles.filterRow}>
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            placeholder="Søg i opslag…"
            placeholderTextColor="#64748b"
            returnKeyType="search"
          />
          <KategoriSelector value={kategoriFilter} onChange={setKategoriFilter} />
          <RadiusSelector value={radius} onChange={handleRadiusChange} />
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0b1220" style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={filteredPosts}
            keyExtractor={(item) => item.id}
            style={{ width: "100%" }}
            contentContainerStyle={{
              paddingTop: 12,
              paddingBottom: 56,
              paddingHorizontal: LAYOUT.PAD_X,
              alignItems: "center", // keeps grid centered
              width: containerWidth, // important: match container
              alignSelf: "center",
            }}
            keyboardShouldPersistTaps="handled"
            numColumns={isGrid ? numColumns : 1}
            columnWrapperStyle={isGrid ? { gap: LAYOUT.GAP } : undefined}
            renderItem={renderItem}
            ListEmptyComponent={<Text style={{ color: COLORS.sub, marginTop: 22 }}>Ingen opslag fundet.</Text>}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#0b1220"]} />}
          />
        )}
      </View>

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

/* Styles */
const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: COLORS.pageBg },
  container: {
    maxWidth: LAYOUT.MAX_W,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: LAYOUT.PAD_X,
    paddingTop: 20,
  },

  /* CTA */
  primaryCta: {
    width: "100%",
    backgroundColor: COLORS.blue,
    borderRadius: RADII.sm,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 6,
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOW.card,
  },
  primaryCtaText: { color: COLORS.white, fontSize: 16, fontWeight: "900", letterSpacing: 1 },

  /* Filters */
  filterRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    marginBottom: 8,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white, // keep inputs white
    borderRadius: RADII.sm,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.cardText,
    borderWidth: 1.5,
    borderColor: COLORS.fieldBorder,
  },
  iconBtn: {
    height: 45,
    width: 45,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.blue,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnText: { fontSize: 18, color: COLORS.white, fontWeight: "bold", marginTop: -2 },
  radiusBtn: {
    minWidth: 64,
    height: 45,
    paddingHorizontal: 14,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.blue,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  radiusBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 15, letterSpacing: 1 },

  /* Cards */
  card: {
    width: "100%",
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: 12,
    ...SHADOW.card,
  },
  cardImage: { width: "100%", height: 140, borderRadius: RADII.md, marginBottom: 10, backgroundColor: "#f1f5f9" },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.blueTint,
    borderRadius: RADII.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 7,
  },
  badgeText: { color: COLORS.cardText, fontWeight: "bold", fontSize: 13 },
  cardTitle: { fontWeight: "800", fontSize: 15, marginBottom: 2, color: COLORS.cardText },
  cardPlace: { fontSize: 12, color: "#64748b", marginBottom: 2 },
  cardTeaser: { fontSize: 13, color: "#475569", marginTop: 3 },
  distance: { fontSize: 11, color: "#6b7280", marginTop: 4 },

  /* Dialog inputs */
  input: {
    backgroundColor: "#fff",
    borderRadius: 8,
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
  blackBtn: { backgroundColor: "#131921" },
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
  overlay: { flex: 1, backgroundColor: "rgba(15,22,35,0.70)", justifyContent: "center", alignItems: "center", padding: 18 },
  dialog: { backgroundColor: "#ffffff", borderRadius: 16, padding: 18, width: 420, borderWidth: 1, borderColor: "#eef1f4" },
  title: { fontSize: 18, fontWeight: "900", color: "#111827", marginBottom: 12 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 7,
    backgroundColor: "#f4f7fa",
    width: 220,
    alignItems: "center",
    alignSelf: "center",
  },
  selectedOption: { backgroundColor: "#e5ecff", borderColor: "#3b82f6", borderWidth: 2 },
  closeBtn: { marginTop: 10, padding: 8, alignSelf: "center" },
  closeBtnText: { color: "#111827", fontWeight: "bold" },
});