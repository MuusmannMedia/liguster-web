// app/ForeningerScreen.tsx
import { Feather } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";
import BottomNav from "../components/BottomNav";
import { useAlleForeninger, useMineForeninger } from "../hooks/useForeninger";
import { useSession } from "../hooks/useSession";
import { supabase } from "../utils/supabase";
import { Forening } from "./types/forening";

export default function ForeningerScreen() {
  const [visning, setVisning] = useState<"mine" | "alle">("mine");
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  // nøgle der tvinger hooks/listen til at refetch/re-render
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user?.id;

  // HENT DATA – afhænger af refreshKey
  const { data: alleForeninger = [], loading: loadingAlle } = useAlleForeninger(refreshKey);
  const { data: mineForeninger = [], loading: loadingMine } = useMineForeninger(userId, refreshKey);

  const foreninger: Forening[] = visning === "mine" ? mineForeninger : alleForeninger;
  const loading = visning === "mine" ? loadingMine : loadingAlle;

  // REFRESH NÅR SIDEN FÅR FOKUS (fx efter sletning fra detaljeskærm)
  useFocusEffect(
    useCallback(() => {
      // bump nøgle → hooks refetcher, liste re-renderer
      setRefreshKey((k) => k + 1);
      return () => {};
    }, [])
  );

  const onPullToRefresh = useCallback(() => {
    setRefreshing(true);
    setRefreshKey((k) => k + 1);
    // vi sætter refreshing false på næste tick – hooks refetcher selv
    requestAnimationFrame(() => setRefreshing(false));
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return foreninger ?? [];
    return (foreninger ?? []).filter((f) => {
      const navn = (f?.navn ?? "").toLowerCase();
      const sted = (f?.sted ?? "").toLowerCase();
      const beskrivelse = (f?.beskrivelse ?? "").toLowerCase();
      return navn.includes(s) || sted.includes(s) || beskrivelse.includes(s);
    });
  }, [foreninger, search]);

  // --- Responsive: iPhone = gammelt layout (330px), iPad = grid som Nabolag ---
  const { width } = useWindowDimensions();
  const isPhoneSingle = width < 650; // iPhone / smalle skærme
  const fixedWidth = 330;

  // Grid til tablets
  const numColumns = !isPhoneSingle ? (width >= 900 ? 3 : 2) : 1;
  const isGrid = !isPhoneSingle && numColumns > 1;
  const ITEM_GAP = 18;
  const SIDE_PADDING = isGrid ? 18 : 0;
  const itemWidth = isGrid
    ? (width - SIDE_PADDING * 2 - ITEM_GAP * (numColumns - 1)) / numColumns
    : "100%";

  return (
    <View style={styles.root}>
      {/* Søg + Plus-knap */}
      <View
        style={[
          styles.searchRow,
          isPhoneSingle
            ? { width: fixedWidth, alignSelf: "center" }
            : { width: "100%", paddingHorizontal: SIDE_PADDING },
        ]}
      >
        <View style={styles.searchWrap}>
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder="Søg i foreninger…"
            placeholderTextColor="#a1a9b6"
            returnKeyType="search"
          />
          <Feather name="search" size={21} color="#254890" style={styles.searchIcon} />
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => setShowCreate(true)}
          activeOpacity={0.87}
        >
          <Feather name="plus" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Skift mellem MINE og ALLE */}
      <View
        style={[
          styles.switchRow,
          isPhoneSingle
            ? { width: fixedWidth, alignSelf: "center" }
            : { width: "100%", paddingHorizontal: SIDE_PADDING },
        ]}
      >
        <TouchableOpacity
          style={[styles.switchBtn, visning === "mine" && styles.switchBtnActive]}
          onPress={() => setVisning("mine")}
        >
          <Text style={[styles.switchText, visning === "mine" && styles.switchTextActive]}>
            MINE FORENINGER
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.switchBtn, visning === "alle" && styles.switchBtnActive]}
          onPress={() => setVisning("alle")}
        >
          <Text style={[styles.switchText, visning === "alle" && styles.switchTextActive]}>
            ALLE FORENINGER
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item: Forening) => item.id}
          numColumns={isPhoneSingle ? 1 : numColumns}
          columnWrapperStyle={
            isGrid ? { gap: ITEM_GAP, paddingHorizontal: SIDE_PADDING } : undefined
          }
          contentContainerStyle={
            isPhoneSingle
              ? { paddingBottom: 90, alignItems: "center" }
              : { paddingBottom: 90, paddingHorizontal: SIDE_PADDING, alignItems: isGrid ? "center" : "stretch" }
          }
          extraData={refreshKey}           // tving re-render når vi bumper nøglen
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onPullToRefresh} tintColor="#fff" />
          }
          renderItem={({ item }) => {
            const wrapStyle = isPhoneSingle
              ? { width: fixedWidth, marginBottom: 17 }
              : { width: itemWidth as number | "100%", marginBottom: 18 };
            return (
              <TouchableOpacity
                onPress={() => router.push(`/forening/${item.id}`)}
                activeOpacity={0.87}
                style={wrapStyle}
              >
                <View style={styles.card}>
                  {!!item.billede_url && (
                    <Image
                      source={{ uri: item.billede_url }}
                      style={[styles.img, isPhoneSingle ? { height: 105 } : { height: 120 }]}
                    />
                  )}
                  <Text style={styles.navn}>{item.navn}</Text>
                  <Text style={styles.sted}>{item.sted}</Text>
                  {!!item.beskrivelse && (
                    <Text style={styles.beskrivelse} numberOfLines={2}>
                      {item.beskrivelse}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          ListEmptyComponent={
            <Text style={{ color: "#fff", marginTop: 40, textAlign: "center" }}>
              {visning === "mine"
                ? "Du er endnu ikke medlem af nogen foreninger."
                : "Ingen foreninger fundet."}
            </Text>
          }
        />
      )}

      {/* Modal til oprettelse */}
      {showCreate && (
        <CreateForeningModal
          visible={showCreate}
          onClose={() => setShowCreate(false)}
          userId={userId}
          onCreated={() => setRefreshKey((k) => k + 1)}
        />
      )}

      <BottomNav />
    </View>
  );
}

function CreateForeningModal({
  visible,
  onClose,
  userId,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  userId?: string;
  onCreated?: () => void;
}) {
  const [navn, setNavn] = useState("");
  const [sted, setSted] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const disabled = !userId || !navn.trim() || !sted.trim() || !beskrivelse.trim();

  async function handleOpret() {
    if (disabled) return;
    setLoading(true);

    const { data, error } = await supabase
      .from("foreninger")
      .insert([
        { navn: navn.trim(), sted: sted.trim(), beskrivelse: beskrivelse.trim(), oprettet_af: userId },
      ])
      .select("id")
      .single();

    if (error) {
      setLoading(false);
      alert("Noget gik galt ved oprettelse: " + error.message);
      return;
    }

    if (data?.id) {
      const { error: mErr } = await supabase
        .from("foreningsmedlemmer")
        .insert([{ forening_id: data.id, user_id: userId!, rolle: "admin", status: "approved" }]);
      if (mErr) console.warn("Kunne ikke tilføje medlemskab:", mErr.message);
    }

    setLoading(false);
    setNavn(""); setSted(""); setBeskrivelse("");

    onCreated?.();     // bump liste i parent
    onClose();

    if (data?.id) router.push(`/forening/${data.id}`);
  }

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      style={styles.modalBackdrop}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={80}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Opret ny forening</Text>

        <Text style={styles.fieldLabel}>Navn</Text>
        <TextInput style={styles.modalInput} placeholder="Navn på foreningen" value={navn} onChangeText={setNavn} />

        <Text style={styles.fieldLabel}>Sted</Text>
        <TextInput style={styles.modalInput} placeholder="F.eks. København" value={sted} onChangeText={setSted} />

        <Text style={styles.fieldLabel}>Beskrivelse</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="Kort beskrivelse"
          value={beskrivelse}
          onChangeText={setBeskrivelse}
          multiline
        />

        <View style={{ flexDirection: "row", gap: 12, marginTop: 15 }}>
          <TouchableOpacity onPress={onClose} style={[styles.modalBtn, { backgroundColor: "#aaa" }]} disabled={loading}>
            <Text style={{ color: "#fff" }}>Annullér</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleOpret}
            style={[styles.modalBtn, disabled && { opacity: 0.5 }]}
            disabled={loading || disabled}
          >
            <Text style={{ color: "#fff" }}>{loading ? "Opretter..." : "Opret"}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#7C8996", paddingTop: 60 },

  // Top controls
  searchRow: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 7 },
  searchWrap: { flex: 1, position: "relative" },
  searchInput: {
    height: 44, backgroundColor: "#fff", borderRadius: 8, paddingHorizontal: 14, fontSize: 15, color: "#222",
    borderWidth: 1, borderColor: "#dde1e8",
  },
  searchIcon: { position: "absolute", right: 12, top: 11 },
  addBtn: {
    height: 44, width: 44, borderRadius: 8, backgroundColor: "#131921",
    alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "#fff",
  },

  switchRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginBottom: 15, gap: 10 },
  switchBtn: { flex: 1, backgroundColor: "#fff", borderRadius: 8, paddingVertical: 10, alignItems: "center" },
  switchBtnActive: { backgroundColor: "#131921", borderWidth: 3, borderColor: "#fff" },
  switchText: { color: "#131921", fontWeight: "bold", fontSize: 10, letterSpacing: 0.5 },
  switchTextActive: { color: "#fff", fontWeight: "bold" },

  // Cards
  card: {
    width: "100%", backgroundColor: "#fff", borderRadius: 13, padding: 12,
    shadowColor: "#000", shadowOpacity: 0.11, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2,
  },
  img: { width: "100%", borderRadius: 9, marginBottom: 6, resizeMode: "cover" },
  navn: { fontWeight: "bold", fontSize: 16, color: "#131921", marginBottom: 2 },
  sted: { color: "#444", fontSize: 15, marginBottom: 4, fontWeight: "600" },
  beskrivelse: { color: "#666", fontSize: 14 },

  // Modal
  modalBackdrop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(40,50,60,0.43)", alignItems: "center", justifyContent: "center", zIndex: 100,
  },
  modalContent: {
    width: 320, backgroundColor: "#fff", borderRadius: 12, padding: 20,
    shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 10, elevation: 7,
  },
  modalTitle: { fontWeight: "bold", fontSize: 22, color: "#254890", marginBottom: 13, textAlign: "center" },
  fieldLabel: { fontSize: 15, fontWeight: "bold", color: "#254890", marginBottom: 2, marginTop: 6 },
  modalInput: {
    backgroundColor: "#f3f3f7", borderRadius: 7, padding: 9, fontSize: 17,
    color: "#222", borderWidth: 1, borderColor: "#dde1e8", marginBottom: 8,
  },
  modalBtn: { flex: 1, backgroundColor: "#254890", borderRadius: 7, padding: 13, alignItems: "center" },
});