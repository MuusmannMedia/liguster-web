// app/Nabolag.native.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Keyboard,
  Modal,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from "react-native";
import BottomNav from "../../components/BottomNav";
import OpretOpslagDialog from "../../components/OpretOpslagDialog";
import OpslagDetaljeModal from "../../components/OpslagDetaljeModal";
import SvarModal from "../../components/SvarModal";
import { KATEGORIER, Post, useNabolag } from "../../hooks/useNabolag";
import { supabase } from "../../utils/supabase";

/* ─────────────────────────────────  Konstanter / tema  ───────────────────────────────── */
const COLORS = {
  bg: "#7C8996",
  text: "#131921",
  white: "#fff",
  blue: "#131921",
  blueTint: "#25489022",
  grayText: "#666",
  fieldBorder: "#c7ced6",
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
  lift: {
    shadowColor: "#000",
    shadowOpacity: 0.09,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
};
const distances = [1, 2, 3, 5, 10, 20, 50];

/* ─────────────────────────────  Små dialog-komponenter  ───────────────────────────── */
function RadiusDialog({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: number;
  onClose: () => void;
  onChange: (v: number) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.title}>Vis opslag indenfor</Text>
          {distances.map((d) => (
            <TouchableOpacity
              key={d}
              style={[dialogStyles.option, d === value && dialogStyles.selectedOption]}
              onPress={() => {
                onChange(d);
                onClose();
              }}
            >
              <Text style={{ fontWeight: d === value ? "bold" : "normal" }}>{d} km</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={dialogStyles.closeBtn} onPress={onClose}>
            <Text style={dialogStyles.closeBtnText}>Luk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

function KategoriDialog({
  visible,
  value,
  onClose,
  onChange,
}: {
  visible: boolean;
  value: string | null;
  onClose: () => void;
  onChange: (v: string | null) => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.title}>Vælg kategori</Text>
          {KATEGORIER.map((k) => (
            <TouchableOpacity
              key={k}
              style={[dialogStyles.option, k === value && dialogStyles.selectedOption]}
              onPress={() => {
                onChange(k);
                onClose();
              }}
            >
              <Text style={{ fontWeight: k === value ? "bold" : "normal" }}>{k}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={dialogStyles.closeBtn} onPress={onClose}>
            <Text style={dialogStyles.closeBtnText}>Luk</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

/* ─────────────────────────────────────  Skærm  ───────────────────────────────────── */
export default function Nabolag() {
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
  const [svarVisible, setSvarVisible] = useState(false);
  const [radiusVisible, setRadiusVisible] = useState(false);
  const [kategoriVisible, setKategoriVisible] = useState(false);
  const [valgtOpslag, setValgtOpslag] = useState<Post | null>(null);

  // Dynamisk grid
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 3 : width >= 650 ? 2 : 1;
  const isGrid = numColumns > 1;
  const ITEM_GAP = 18;
  const SIDE_PADDING = isGrid ? 18 : 0;
  const itemWidth = isGrid
    ? (width - SIDE_PADDING * 2 - ITEM_GAP * (numColumns - 1)) / numColumns
    : "100%";

  const handleOpretOpslag = async (postData: any) => {
    const success = await createPost(postData);
    if (success) setOpretVisible(false);
  };

  return (
    <View style={styles.root}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          {/* Primær CTA */}
          <TouchableOpacity
            style={styles.primaryCta}
            onPress={() => setOpretVisible(true)}
            activeOpacity={0.88}
          >
            <Text style={styles.primaryCtaText}>OPRET OPSLAG</Text>
          </TouchableOpacity>

          {/* Filtre */}
          <View style={styles.filterRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholder="Søg i opslag…"
              placeholderTextColor="#666"
              returnKeyType="search"
            />
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => setKategoriVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.iconBtnText}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radiusBtn} onPress={() => setRadiusVisible(true)}>
              <Text style={styles.radiusBtnText}>{radius} km</Text>
            </TouchableOpacity>
          </View>

          {/* Liste */}
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.blue} style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={filteredPosts}
              keyExtractor={(item) => item.id}
              style={{ width: "100%" }}
              contentContainerStyle={{
                paddingTop: 10,
                paddingBottom: 80,
                paddingHorizontal: SIDE_PADDING,
                alignItems: isGrid ? "center" : "stretch",
              }}
              keyboardShouldPersistTaps="handled"
              numColumns={numColumns}
              columnWrapperStyle={isGrid ? { gap: ITEM_GAP } : undefined}
              renderItem={({ item, index }) => (
                <TouchableOpacity
                  onPress={() => {
                    setValgtOpslag(item);
                    setDetaljeVisible(true);
                  }}
                  style={{ width: itemWidth, marginBottom: index === filteredPosts.length - 1 ? 0 : 18 }}
                  activeOpacity={0.87}
                >
                  <View style={styles.card}>
                    {!!item.image_url && (
                      <Image source={{ uri: item.image_url }} style={styles.cardImage} />
                    )}

                    {!!item.kategori && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>{item.kategori}</Text>
                      </View>
                    )}

                    <Text style={styles.cardTitle}>{item.overskrift}</Text>
                    <Text style={styles.cardPlace}>{item.omraade}</Text>
                    <Text style={styles.cardTeaser} numberOfLines={1} ellipsizeMode="tail">
                      {item.text}
                    </Text>

                    {userLocation && item.latitude && item.longitude ? (
                      <Text style={styles.distance}>
                        {distanceInKm(
                          userLocation.latitude,
                          userLocation.longitude,
                          item.latitude,
                          item.longitude
                        ).toFixed(1)}{" "}
                        km væk
                      </Text>
                    ) : null}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Ingen opslag fundet.</Text>}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[COLORS.blue]} />
              }
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* Modals */}
      <OpslagDetaljeModal
        visible={detaljeVisible}
        opslag={valgtOpslag}
        currentUserId={userId}
        onClose={() => setDetaljeVisible(false)}
        onSendSvar={() => {
          setDetaljeVisible(false);
          setSvarVisible(true);
        }}
      />

      <SvarModal
        visible={svarVisible}
        onClose={() => setSvarVisible(false)}
        onSend={async (svarTekst) => {
          if (!valgtOpslag || !userId || !valgtOpslag.user_id) return;
          const threadId =
            [userId, valgtOpslag.user_id].sort().join("_") + "_" + valgtOpslag.id;
          await supabase.from("messages").insert([
            {
              thread_id: threadId,
              sender_id: userId,
              receiver_id: valgtOpslag.user_id,
              post_id: valgtOpslag.id,
              text: svarTekst,
            },
          ]);
          setSvarVisible(false);
        }}
      />

      <OpretOpslagDialog
        visible={opretVisible}
        onClose={() => setOpretVisible(false)}
        onSubmit={handleOpretOpslag}
        currentUserId={userId}
      />

      <RadiusDialog
        visible={radiusVisible}
        value={radius}
        onClose={() => setRadiusVisible(false)}
        onChange={handleRadiusChange}
      />

      <KategoriDialog
        visible={kategoriVisible}
        value={kategoriFilter}
        onClose={() => setKategoriVisible(false)}
        onChange={setKategoriFilter}
      />

      <BottomNav />
    </View>
  );
}

/* ─────────────────────────────────────  Styles  ───────────────────────────────────── */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.bg },
  content: { flex: 1, alignItems: "center", paddingHorizontal: 20, paddingTop: 40 },

  /* CTA */
  primaryCta: {
    width: "100%",
    backgroundColor: COLORS.blue,
    borderRadius: RADII.sm,
    paddingVertical: 12,
    paddingHorizontal: 18,
    marginTop: 18,
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOW.lift,
  },
  primaryCtaText: { color: COLORS.white, fontSize: 17, fontWeight: "bold", letterSpacing: 1 },

  /* Filtre */
  filterRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    marginTop: 14,
    marginBottom: 6,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    backgroundColor: COLORS.white,
    borderRadius: RADII.sm,
    paddingHorizontal: 15,
    paddingVertical: 10,
    fontSize: 15,
    color: COLORS.text,
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
    ...SHADOW.card,
  },
  iconBtnText: { fontSize: 18, color: COLORS.white, fontWeight: "bold", marginTop: -2 },
  radiusBtn: {
    minWidth: 54,
    height: 45,
    paddingHorizontal: 14,
    borderRadius: RADII.sm,
    backgroundColor: COLORS.blue,
    borderWidth: 3,
    borderColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
    ...SHADOW.card,
  },
  radiusBtnText: { color: COLORS.white, fontWeight: "bold", fontSize: 15, letterSpacing: 1 },

  /* Kort / cards */
  card: {
    width: "100%",
    backgroundColor: COLORS.white,
    borderRadius: RADII.lg,
    padding: 12,
    ...SHADOW.card,
  },
  cardImage: { width: "100%", height: 120, borderRadius: RADII.md, marginBottom: 10 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: COLORS.blueTint,
    borderRadius: RADII.sm,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 7,
  },
  badgeText: { color: COLORS.text, fontWeight: "bold", fontSize: 13 },
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 2, textDecorationLine: "underline" },
  cardPlace: { fontSize: 14, color: "#222", marginBottom: 2 },
  cardTeaser: { fontSize: 14, color: "#444", marginTop: 3 },
  distance: { fontSize: 11, color: "#888", marginTop: 3 },

  emptyText: { color: COLORS.grayText, marginTop: 22, alignSelf: "center" },
});

const dialogStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(20,30,40,0.60)", justifyContent: "center", alignItems: "center" },
  dialog: { backgroundColor: COLORS.white, borderRadius: RADII.xl, padding: 22, width: 260, alignItems: "center" },
  title: { fontSize: 18, fontWeight: "bold", color: COLORS.text, marginBottom: 15 },
  option: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: RADII.sm,
    marginBottom: 7,
    backgroundColor: "#f4f7fa",
    width: 210,
    alignItems: "center",
  },
  selectedOption: { backgroundColor: COLORS.blueTint, borderColor: COLORS.blue, borderWidth: 3 },
  closeBtn: { marginTop: 10, padding: 8 },
  closeBtnText: { color: COLORS.text, fontWeight: "bold" },
});