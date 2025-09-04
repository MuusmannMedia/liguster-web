// app/MineOpslag.tsx
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import BottomNav from "../components/BottomNav";
import OpretOpslagDialog from "../components/OpretOpslagDialog";
import OpslagDetaljeModal from "../components/OpslagDetaljeModal";
import { useMineOpslag } from "../hooks/useMineOpslag";
import { Post } from "../hooks/useNabolag";

/* ─────────────────────────── Tema & konstanter ─────────────────────────── */
const COLORS = {
  bg: "#7C8996",
  card: "#fff",
  text: "#131921",
  blue: "#131921", // primær blå
  blueTint: "#25489022",
  red: "#e85c5c",
  white: "#fff",
  gray: "#666",
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

export default function MineOpslagScreen() {
  const { userId, mineOpslag, loading, createPost, updatePost, deletePost } = useMineOpslag();

  // Detaljevisning
  const [detaljeVisible, setDetaljeVisible] = useState(false);
  const [valgtOpslag, setValgtOpslag] = useState<Post | null>(null);

  // Dialog (opret/ret)
  const [dialogState, setDialogState] = useState<{
    visible: boolean;
    mode: "create" | "edit";
    initialData: Post | null;
  }>({
    visible: false,
    mode: "create",
    initialData: null,
  });

  // Grid layout
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 3 : width >= 650 ? 2 : 1;
  const isGrid = numColumns > 1;
  const ITEM_GAP = 18;
  const SIDE_PADDING = isGrid ? 18 : 0;
  const itemWidth = isGrid
    ? (width - SIDE_PADDING * 2 - ITEM_GAP * (numColumns - 1)) / numColumns
    : "100%";

  const handleDialogSubmit = async (data: any) => {
    const success = dialogState.mode === "create" ? await createPost(data) : await updatePost(data);
    if (success) {
      setDialogState({ visible: false, mode: "create", initialData: null });
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        {/* Primær CTA */}
        <TouchableOpacity
          style={styles.primaryCta}
          onPress={() => setDialogState({ visible: true, mode: "create", initialData: null })}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryCtaText}>OPRET NYT OPSLAG</Text>
        </TouchableOpacity>

        {/* Liste */}
        {loading ? (
          <ActivityIndicator size="large" color={COLORS.blue} style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={mineOpslag}
            keyExtractor={(item) => item.id}
            style={{ width: "100%" }}
            contentContainerStyle={{
              paddingTop: 10,
              paddingBottom: 80,
              paddingHorizontal: SIDE_PADDING,
              alignItems: isGrid ? "center" : "stretch",
            }}
            numColumns={numColumns}
            columnWrapperStyle={isGrid ? { gap: ITEM_GAP } : undefined}
            renderItem={({ item, index }) => (
              <View style={{ width: itemWidth, marginBottom: index === mineOpslag.length - 1 ? 0 : 18 }}>
                <View style={styles.card}>
                  <TouchableOpacity
                    onPress={() => {
                      setValgtOpslag(item);
                      setDetaljeVisible(true);
                    }}
                    activeOpacity={0.85}
                    style={{ width: "100%" }}
                  >
                    {!!item.image_url && <Image source={{ uri: item.image_url }} style={styles.cardImage} />}

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
                  </TouchableOpacity>

                  {/* Knapper */}
                  <View style={styles.actionsRow}>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnBlue]}
                      onPress={() => setDialogState({ visible: true, mode: "edit", initialData: item })}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.btnText}>RET</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.btn, styles.btnRed]}
                      onPress={() => deletePost(item.id)}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.btnText}>SLET</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyText}>Du har ikke oprettet nogen opslag endnu.</Text>
            }
          />
        )}
      </View>

      {/* Detalje-modal */}
      <OpslagDetaljeModal
        visible={detaljeVisible}
        opslag={valgtOpslag}
        onClose={() => setDetaljeVisible(false)}
      />

      {/* Én dialog – genbruges til både opret og ret */}
      <OpretOpslagDialog
        visible={dialogState.visible}
        onClose={() => setDialogState({ visible: false, mode: "create", initialData: null })}
        onSubmit={handleDialogSubmit}
        initialValues={dialogState.initialData}
      />

      <BottomNav />
    </View>
  );
}

/* ─────────────────────────────── Styles ─────────────────────────────── */
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
    marginBottom: 12,
    alignItems: "center",
    borderWidth: 3,
    borderColor: COLORS.white,
    ...SHADOW.lift,
  },
  primaryCtaText: { color: COLORS.white, fontSize: 17, fontWeight: "bold", letterSpacing: 1 },

  /* Kort */
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADII.lg,
    padding: 12,
    width: "100%",
    minWidth: 0,
    alignItems: "flex-start",
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
  cardTitle: { fontWeight: "bold", fontSize: 16, marginBottom: 2, textDecorationLine: "underline", color: COLORS.text },
  cardPlace: { fontSize: 14, color: "#222", marginBottom: 2 },
  cardTeaser: { fontSize: 14, color: "#444", marginBottom: 8 },

  /* Knaprække */
  actionsRow: { flexDirection: "row", alignSelf: "flex-end", marginTop: 8, gap: 10 },

  /* Knapper – fælles og varianter */
  btn: {
    borderRadius: RADII.sm,
    paddingHorizontal: 20,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  btnBlue: { backgroundColor: COLORS.blue },
  btnRed: { backgroundColor: COLORS.red },
  btnText: { color: COLORS.white, fontWeight: "bold", fontSize: 14, letterSpacing: 1 },

  /* Tom liste */
  emptyText: { color: COLORS.gray, marginTop: 22, alignSelf: "center" },
});