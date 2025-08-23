// app/forening/[id].tsx
import { decode } from "base64-arraybuffer";
import * as ImagePicker from "expo-image-picker";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions
} from "react-native";

import { useSession } from "../../hooks/useSession";
import { Forening } from "../../types/forening";
import { supabase } from "../../utils/supabase";

/* ---------- Typer ---------- */
type MedlemsRow = {
  user_id: string;
  rolle?: string | null;
  status?: "pending" | "approved" | "declined" | null;
  users?: {
    name?: string | null;
    username?: string | null;
    avatar_url?: string | null;
    email?: string | null;
  } | null;
};

type ThreadRow = {
  id: string;
  forening_id: string;
  title: string;
  created_at: string;
  created_by: string;
};

type MsgRow = { id: string; user_id: string; text: string; created_at: string };

type UiMsg = {
  id: string;
  text: string;
  created_at: string;
  user: { id: string; name: string | null; email: string | null; avatar_url: string | null };
};

/** --------- Events (aktiviteter) – til preview ---------- */
type EventRow = {
  id: string;
  title: string;
  start_at: string; // ISO
  end_at: string;   // ISO
  location: string | null;
  price: number | null;
};

/* ---------- Helpers ---------- */
const getDisplayName = (m: MedlemsRow) => {
  const n = m.users?.name?.trim() || m.users?.username?.trim();
  if (n) return n;
  const email = m.users?.email || "";
  return email.includes("@") ? email.split("@")[0] : "Ukendt";
};

const isAdmin = (m: MedlemsRow, ownerId?: string | null) => {
  const r = (m.rolle || "").toLowerCase();
  return r === "admin" || r === "administrator" || (!!ownerId && m.user_id === ownerId);
};

const resolveAvatarUrl = (maybePath?: string | null): string | null => {
  if (!maybePath) return null;
  if (/^https?:\/\//i.test(maybePath)) return maybePath;
  const path = maybePath.replace(/^\/+/, "");
  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  return data?.publicUrl || null;
};

function formatDateRange(startISO: string, endISO: string) {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const sameDay =
    s.getFullYear() === e.getFullYear() &&
    s.getMonth() === e.getMonth() &&
    s.getDate() === e.getDate();

  const dkDate = (d: Date) =>
    d.toLocaleDateString(undefined, { day: "2-digit", month: "2-digit", year: "numeric" });
  const dkTime = (d: Date) =>
    d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });

  if (sameDay) {
    return `${dkDate(s)} kl. ${dkTime(s)}–${dkTime(e)}`;
  }
  return `${dkDate(s)} ${dkTime(s)} – ${dkDate(e)} ${dkTime(e)}`;
}

/* ---------- Component ---------- */
export default function ForeningDetaljeScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { session } = useSession();
  const userId = session?.user?.id ?? null;

  const [forening, setForening] = useState<Forening | null>(null);
  const [loading, setLoading] = useState(true);

  const [medlemmer, setMedlemmer] = useState<MedlemsRow[]>([]);
  const [antalApproved, setAntalApproved] = useState(0);

  const [uploading, setUploading] = useState(false);

  // Medlems-modal
  const [showMembers, setShowMembers] = useState(false);
  const [selectedMember, setSelectedMember] = useState<MedlemsRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Redigering (ejer)
  const [editMode, setEditMode] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editNavn, setEditNavn] = useState("");
  const [editSted, setEditSted] = useState("");
  const [editBeskrivelse, setEditBeskrivelse] = useState("");

  const isOwner = useMemo(
    () => !!forening?.oprettet_af && forening.oprettet_af === userId,
    [forening?.oprettet_af, userId]
  );

  // iPad / tablet
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  /* ----- Hent forening ----- */
  const fetchForening = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase.from("foreninger").select("*").eq("id", id).single();
    if (error) console.error("Kunne ikke hente forening:", error);
    setForening(data ?? null);
  }, [id]);

  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoading(true);
      await fetchForening();
      setLoading(false);
    })();
  }, [id, fetchForening]);

  // Sync redigeringsfelter
  useEffect(() => {
    if (!forening) return;
    setEditNavn(forening.navn || "");
    setEditSted(forening.sted || "");
    setEditBeskrivelse(forening.beskrivelse || "");
  }, [forening]);

  /* ----- Hent medlemmer ----- */
  const fetchMedlemmer = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("foreningsmedlemmer")
      .select(
        "user_id, rolle, status, users:users!foreningsmedlemmer_user_id_fkey (name, username, avatar_url, email)"
      )
      .eq("forening_id", id);

    if (error) {
      console.error("Kunne ikke hente medlemmer:", error?.message || error);
      setMedlemmer([]);
      setAntalApproved(0);
      return;
    }

    const mapped = (data as MedlemsRow[]).map((m) => ({
      ...m,
      users: { ...m.users, avatar_url: resolveAvatarUrl(m.users?.avatar_url ?? null) },
    }));

    setMedlemmer(mapped);
    setAntalApproved(mapped.filter((m) => m.status === "approved").length);
  }, [id]);

  useEffect(() => {
    fetchMedlemmer();
  }, [id, fetchMedlemmer]);

  /* ----- Derived ----- */
  const myRow = useMemo(
    () => medlemmer.find((m) => m.user_id === userId) || null,
    [medlemmer, userId]
  );
  const isApproved = myRow?.status === "approved";
  const isPending = myRow?.status === "pending";
  const amAdmin = !!myRow && isAdmin(myRow, forening?.oprettet_af);

  const approved = medlemmer.filter((m) => m.status === "approved");
  const pending = medlemmer.filter((m) => m.status === "pending");
  const admins = approved.filter((m) => isAdmin(m, forening?.oprettet_af));
  const regulars = approved.filter((m) => !isAdmin(m, forening?.oprettet_af));

  /* 🔹 Visningsnavne pr. user_id */
  const nameByUserId = useMemo(() => {
    const map: Record<string, string> = {};
    approved.forEach((m) => (map[m.user_id] = getDisplayName(m)));
    return map;
  }, [approved]);

  const getNameFromId = (uid: string) => nameByUserId[uid] || "Ukendt";

  /* ==========================
     SAMTALER – PREVIEW
     ========================== */
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const fetchThreads = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("forening_threads")
      .select("id, forening_id, title, created_at, created_by")
      .eq("forening_id", id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("Kunne ikke hente tråde:", error.message);
      setThreads([]);
      return;
    }
    setThreads((data || []) as ThreadRow[]);
  }, [id]);

  useEffect(() => {
    fetchThreads();
  }, [id, fetchThreads]);

  /* ==========================
     AKTIVITETER – PREVIEW
     ========================== */
  const [events, setEvents] = useState<EventRow[]>([]);
  const fetchEvents = useCallback(async () => {
    if (!id) return;
    const { data, error } = await supabase
      .from("forening_events")
      .select("id, title, start_at, end_at, location, price")
      .eq("forening_id", id)
      .order("start_at", { ascending: false });

    if (error) {
      console.error("Kunne ikke hente aktiviteter:", error.message);
      setEvents([]);
      return;
    }
    setEvents((data || []) as EventRow[]);
  }, [id]);

  useEffect(() => {
    fetchEvents();
  }, [id, fetchEvents]);

  /* ---------- FOKUS-REFRESH + PULL-TO-REFRESH ---------- */

  const [refreshing, setRefreshing] = useState(false);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchForening(), fetchMedlemmer(), fetchThreads(), fetchEvents()]);
    setRefreshing(false);
  }, [fetchForening, fetchMedlemmer, fetchThreads, fetchEvents]);

  // 🔁 Hver gang siden bliver fokuseret (navigeret tilbage til), henter vi alt igen
  useFocusEffect(
    useCallback(() => {
      refreshAll();
      return () => {};
    }, [refreshAll])
  );

  /* ----- Upload foreningsbillede ----- */
  const handleUploadHeader = async () => {
    if (!isOwner) return;
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (res.canceled) return;

    setUploading(true);
    const file = res.assets?.[0];
    if (!file?.base64) {
      setUploading(false);
      Alert.alert("Kunne ikke hente billedet.");
      return;
    }

    const ext = (file.uri.split(".").pop() || "jpg").toLowerCase();
    const fileName = `${id}_${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("foreningsbilleder")
      .upload(fileName, decode(file.base64), {
        contentType: file.type || "image/jpeg",
        upsert: true,
      });

    if (uploadError) {
      setUploading(false);
      Alert.alert("Fejl ved upload: " + uploadError.message);
      return;
    }

    const { data } = supabase.storage.from("foreningsbilleder").getPublicUrl(fileName);
    const publicUrl = data.publicUrl;

    const { error: updateErr } = await supabase
      .from("foreninger")
      .update({ billede_url: publicUrl })
      .eq("id", id);

    if (updateErr) {
      setUploading(false);
      Alert.alert("Kunne ikke gemme billedets URL: " + updateErr.message);
      return;
    }

    await refreshAll();
    setUploading(false);
  };

  /* ----- Gem/Annuller redigering ----- */
  const handleSaveEdit = async () => {
    if (!isOwner || !id) return;
    if (!editNavn.trim() || !editSted.trim() || !editBeskrivelse.trim()) {
      Alert.alert("Udfyld venligst alle felter.");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("foreninger")
      .update({ navn: editNavn.trim(), sted: editSted.trim(), beskrivelse: editBeskrivelse.trim() })
      .eq("id", id);
    setSaving(false);
    if (error) return Alert.alert("Fejl", "Kunne ikke gemme ændringer: " + error.message);
    await refreshAll();
    setEditMode(false);
  };

  /* ----- Medlemsrettigheder (admin) ----- */

  // Hvem må fjerne hvem?
  const canRemove = (target: MedlemsRow) => {
    if (!amAdmin) return false; // ikke admin = ingen rettigheder
    if (target.user_id === forening?.oprettet_af) return false; // ejeren kan aldrig fjernes
    const targetIsAdmin = isAdmin(target, forening?.oprettet_af);
    if (!isOwner && targetIsAdmin) return false; // kun ejeren må fjerne andre admins
    return true;
  };

  const removeMember = async (target: MedlemsRow) => {
    if (!id) return;
    if (!canRemove(target)) return;
    const name = getDisplayName(target);
    Alert.alert(
      "Fjern medlem",
      `Vil du fjerne ${name} fra foreningen?`,
      [
        { text: "Annuller", style: "cancel" },
        {
          text: "Fjern",
          style: "destructive",
          onPress: async () => {
            try {
              setBusyId(target.user_id);
              const { error } = await supabase
                .from("foreningsmedlemmer")
                .delete()
                .eq("forening_id", id as string)
                .eq("user_id", target.user_id);
              if (error) throw error;
              await refreshAll();
              if (selectedMember?.user_id === target.user_id) {
                setSelectedMember(null);
              }
            } catch (e: any) {
              Alert.alert("Fejl", e?.message ?? "Kunne ikke fjerne medlemmet.");
            } finally {
              setBusyId(null);
            }
          },
        },
      ]
    );
  };

  /* ----- Bliv medlem / Forlad / Slet forening ----- */
  const handleBlivMedlem = async () => {
    if (!userId || !id) return;
    const { error } = await supabase
      .from("foreningsmedlemmer")
      .insert([{ forening_id: id as string, user_id: userId, rolle: "medlem", status: "pending" }]);
    if (error) return Alert.alert("Fejl", "Kunne ikke sende anmodning: " + error.message);
    Alert.alert("Din anmodning er sendt og afventer godkendelse.");
    await refreshAll();
  };

  const handleForlad = async () => {
    if (!userId || !id) return;
    const { error } = await supabase
      .from("foreningsmedlemmer")
      .delete()
      .eq("forening_id", id)
      .eq("user_id", userId);
    if (error) return Alert.alert("Fejl", "Kunne ikke forlade foreningen: " + error.message);
    await refreshAll();
  };

  const handleDeleteForening = async () => {
    if (!isOwner || !id) return;
    Alert.alert(
      "Slet forening",
      "Er du sikker på, at du vil slette foreningen? Denne handling kan ikke fortrydes.",
      [
        { text: "Annuller", style: "cancel" },
        {
          text: "Slet",
          style: "destructive",
          onPress: async () => {
            const { error } = await supabase.from("foreninger").delete().eq("id", id);
            if (error) {
              Alert.alert("Fejl", "Kunne ikke slette foreningen: " + error.message);
              return;
            }
            router.back();
          },
        },
      ]
    );
  };

  /* ----- UI ----- */
  if (loading || !forening) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#131921" />
      </View>
    );
  }

  const top3Threads = threads.slice(0, 3);
  const top3Events = events.slice(0, 3);

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: "#7C8996" }}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refreshAll} tintColor="#131921" />
        }
      >
        {/* Topbar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.counter}
            onPress={() => {
              setSelectedMember(null);
              setShowMembers(true);
            }}
          >
            <Text style={styles.counterIcon}>👥</Text>
            <Text style={styles.counterNum}>{antalApproved}</Text>
          </TouchableOpacity>
        </View>

        {/* Kort (Forening info) */}
        <View style={styles.card}>
          {forening.billede_url ? (
            <Image source={{ uri: forening.billede_url }} style={[styles.hero, isTablet && styles.heroTablet]} />
          ) : (
            <View style={[styles.hero, styles.heroPlaceholder, isTablet && styles.heroTablet]}>
              <Text style={{ color: "#222", fontSize: 12 }}>Intet billede</Text>
            </View>
          )}

          {isOwner && editMode ? (
            <TextInput
              style={[styles.input, styles.titleInput]}
              value={editNavn}
              onChangeText={setEditNavn}
              placeholder="Foreningens navn"
              placeholderTextColor="#777"
            />
          ) : (
            <Text style={styles.title}>{forening.navn}</Text>
          )}

          {isOwner && editMode ? (
            <TextInput
              style={[styles.input]}
              value={editSted}
              onChangeText={setEditSted}
              placeholder="Sted"
              placeholderTextColor="#777"
            />
          ) : (
            <Text style={styles.place}>{forening.sted}</Text>
          )}

          {isOwner && editMode ? (
            <TextInput
              style={[styles.input, styles.descInput]}
              value={editBeskrivelse}
              onChangeText={setEditBeskrivelse}
              placeholder="Beskrivelse"
              placeholderTextColor="#777"
              multiline
            />
          ) : !!forening.beskrivelse ? (
            <Text style={styles.desc}>{forening.beskrivelse}</Text>
          ) : null}

          {isOwner && (
            <View style={styles.editRow}>
              {!editMode ? (
                <TouchableOpacity style={[styles.smallActionBtn, styles.editBtn]} onPress={() => setEditMode(true)}>
                  <Text style={styles.smallActionText}>Rediger</Text>
                </TouchableOpacity>
              ) : (
                <>
                  <TouchableOpacity style={[styles.smallActionBtn, styles.saveBtn]} onPress={handleSaveEdit} disabled={saving}>
                    <Text style={styles.smallActionText}>{saving ? "Gemmer…" : "Gem"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.smallActionBtn, styles.cancelBtn]} onPress={() => setEditMode(false)} disabled={saving}>
                    <Text style={styles.smallActionText}>Annullér</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {isApproved ? null : isPending ? (
            <View style={[styles.bigBtn, { backgroundColor: "#9aa0a6" }]}>
              <Text style={styles.bigBtnText}>Afventer godkendelse…</Text>
            </View>
          ) : (
            <TouchableOpacity style={[styles.bigBtn, styles.join]} onPress={handleBlivMedlem}>
              <Text style={styles.bigBtnText}>Bliv medlem</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Medlemmer (preview) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>MEDLEMMER</Text>
          <FlatList
            data={approved}
            keyExtractor={(item) => item.user_id}
            horizontal
            renderItem={({ item }) => (
              <TouchableOpacity onPress={() => { setSelectedMember(item); setShowMembers(true); }} style={styles.memberBox}>
                {item.users?.avatar_url ? (
                  <Image source={{ uri: item.users.avatar_url }} style={styles.memberAvatar} />
                ) : (
                  <View style={styles.memberAvatarPlaceholder}>
                    <Text style={{ color: "#131921", fontSize: 12 }}>?</Text>
                  </View>
                )}
                <Text style={styles.memberName}>{getDisplayName(item)}</Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={{ color: "#000", margin: 8, fontSize: 12 }}>Ingen medlemmer endnu.</Text>}
            contentContainerStyle={{ paddingVertical: 6, paddingLeft: 12 }}
            showsHorizontalScrollIndicator={false}
          />
        </View>

        {/* Samtaler – PREVIEW (3 seneste). Hele kortet klikbart */}
        <TouchableOpacity
          style={styles.section}
          activeOpacity={0.9}
          onPress={() => router.push(`/forening/${id}/threads`)}
        >
          <Text style={styles.sectionTitle}>SAMTALER</Text>
          {top3Threads.length === 0 ? (
            <Text style={styles.sectionMuted}>Ingen tråde endnu.</Text>
          ) : (
            top3Threads.map((t) => (
              <View key={t.id} style={styles.threadItemRow}>
                <View style={styles.threadItemLeft}>
                  <Text style={styles.threadTitle}>{t.title}</Text>
                  <Text style={styles.threadMeta}>
                    Oprettet af {getNameFromId(t.created_by)} · {new Date(t.created_at).toLocaleDateString()}
                  </Text>
                </View>
              </View>
            ))
          )}
          {threads.length > 3 && (
            <Text style={[styles.sectionMuted, { marginTop: 4 }]}>
              Viser de 3 seneste – tryk for at se alle ({threads.length}).
            </Text>
          )}
        </TouchableOpacity>

        {/* Aktiviteter – PREVIEW (3 seneste). Hele kortet klikbart */}
        <TouchableOpacity
          style={styles.section}
          activeOpacity={0.9}
          onPress={() => router.push(`/forening/${id}/events`)}
        >
          <Text style={styles.sectionTitle}>AKTIVITETER</Text>
          {top3Events.length === 0 ? (
            <Text style={styles.sectionMuted}>Ingen aktiviteter endnu.</Text>
          ) : (
            top3Events.map((ev) => (
              <View key={ev.id} style={styles.eventRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.eventTitle}>{ev.title}</Text>
                  <Text style={styles.eventMeta}>{formatDateRange(ev.start_at, ev.end_at)}</Text>
                  {!!ev.location && <Text style={styles.eventMeta}>📍 {ev.location}</Text>}
                  {!!ev.price && <Text style={styles.eventMeta}>Pris: {ev.price} kr.</Text>}
                </View>
              </View>
            ))
          )}
          {events.length > 3 && (
            <Text style={[styles.sectionMuted, { marginTop: 4 }]}>
              Viser de 3 seneste – tryk for at se alle ({events.length}).
            </Text>
          )}
        </TouchableOpacity>

        {/* ===== BUNDSEKTION: handlinger ===== */}
        <View style={styles.bottomActions}>
          {isApproved && (
            <TouchableOpacity style={[styles.actionBtn, styles.leaveAction]} onPress={handleForlad}>
              <Text style={styles.actionBtnText}>Afslut medlemskab</Text>
            </TouchableOpacity>
          )}

          {isOwner && (
            <>
              <TouchableOpacity
                style={[styles.actionBtn, styles.uploadAction]}
                onPress={handleUploadHeader}
                disabled={uploading}
              >
                <Text style={styles.actionBtnText}>{uploading ? "Uploader..." : "Upload foreningsbillede"}</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.actionBtn, styles.deleteAction]} onPress={handleDeleteForening}>
                <Text style={styles.deleteActionText}>Slet forening</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Medlems-dialog */}
      <Modal visible={showMembers} transparent animationType="fade" onRequestClose={() => setShowMembers(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            {selectedMember ? (
              <View style={styles.profileWrap}>
                <Image
                  source={
                    selectedMember.users?.avatar_url
                      ? { uri: selectedMember.users.avatar_url }
                      : { uri: "https://placehold.co/200x200?text=Profil" }
                  }
                  style={styles.profileAvatar}
                />
                <Text style={styles.profileName}>{getDisplayName(selectedMember)}</Text>
                <Text style={styles.roleBadge}>
                  {isAdmin(selectedMember, forening?.oprettet_af) ? "ADMIN" : "MEDLEM"}
                </Text>

                {canRemove(selectedMember) && (
                  <TouchableOpacity
                    onPress={() => removeMember(selectedMember)}
                    style={[styles.smallActionBtn, { backgroundColor: "#C62828", marginTop: 6 }]}
                    disabled={busyId === selectedMember.user_id}
                  >
                    <Text style={styles.smallActionText}>
                      {busyId === selectedMember.user_id ? "Fjerner…" : "Fjern medlem"}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity onPress={() => setShowMembers(false)} style={styles.modalCloseBottom}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={{ maxHeight: 480 }}>
                <ScrollView>
                  {amAdmin && (
                    <>
                      <Text style={[styles.listHeader, { marginTop: 4 }]}>Afventer godkendelse</Text>
                      {pending.length === 0 ? (
                        <Text style={styles.emptyLine}>Ingen anmodninger.</Text>
                      ) : (
                        pending.map((m) => {
                          const busy = busyId === m.user_id;
                          return (
                            <View key={`pending-${m.user_id}`} style={styles.row}>
                              {m.users?.avatar_url ? (
                                <Image source={{ uri: m.users.avatar_url }} style={styles.rowAvatar} />
                              ) : (
                                <View style={[styles.rowAvatar, styles.rowAvatarPh]}>
                                  <Text>?</Text>
                                </View>
                              )}
                              <View style={{ flex: 1 }}>
                                <Text style={styles.rowName}>{getDisplayName(m)}</Text>
                                <Text style={styles.rowEmail}>{m.users?.email || "Ingen email"}</Text>
                              </View>
                              <View style={{ flexDirection: "row", gap: 6 }}>
                                <TouchableOpacity
                                  onPress={async () => {
                                    setBusyId(m.user_id);
                                    await supabase
                                      .from("foreningsmedlemmer")
                                      .update({ status: "approved" })
                                      .eq("forening_id", id)
                                      .eq("user_id", m.user_id);
                                    await refreshAll();
                                    setBusyId(null);
                                  }}
                                  disabled={busy}
                                  style={[styles.smallBtn, styles.approveBtn, busy && styles.btnDisabled]}
                                >
                                  <Text style={styles.smallBtnText}>{busy ? "..." : "Godkend"}</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                  onPress={async () => {
                                    setBusyId(m.user_id);
                                    await supabase
                                      .from("foreningsmedlemmer")
                                      .update({ status: "declined" })
                                      .eq("forening_id", id)
                                      .eq("user_id", m.user_id);
                                    await refreshAll();
                                    setBusyId(null);
                                  }}
                                  disabled={busy}
                                  style={[styles.smallBtn, styles.rejectBtn, busy && styles.btnDisabled]}
                                >
                                  <Text style={styles.smallBtnText}>{busy ? "..." : "Afvis"}</Text>
                                </TouchableOpacity>
                              </View>
                            </View>
                          );
                        })
                      )}
                    </>
                  )}

                  <Text style={[styles.listHeader, { marginTop: amAdmin ? 12 : 4 }]}>Administratorer</Text>
                  {admins.length === 0 ? (
                    <Text style={styles.emptyLine}>Ingen administratorer.</Text>
                  ) : (
                    admins.map((m) => {
                      const busy = busyId === m.user_id;
                      const showRemove = canRemove(m);
                      return (
                        <View key={`admin-${m.user_id}`} style={styles.row}>
                          {m.users?.avatar_url ? (
                            <Image source={{ uri: m.users.avatar_url }} style={styles.rowAvatar} />
                          ) : (
                            <View style={[styles.rowAvatar, styles.rowAvatarPh]}>
                              <Text>?</Text>
                            </View>
                          )}
                          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedMember(m)}>
                            <Text style={styles.rowName}>{getDisplayName(m)}</Text>
                            <Text style={styles.roleUnderName}>ADMIN</Text>
                          </TouchableOpacity>
                          {showRemove && (
                            <TouchableOpacity
                              onPress={() => removeMember(m)}
                              disabled={busy}
                              style={[styles.smallBtn, styles.deleteMiniBtn, busy && styles.btnDisabled]}
                            >
                              <Text style={styles.smallBtnText}>{busy ? "…" : "Fjern"}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}

                  <Text style={[styles.listHeader, { marginTop: 10 }]}>Medlemmer</Text>
                  {regulars.length === 0 ? (
                    <Text style={styles.emptyLine}>Ingen medlemmer.</Text>
                  ) : (
                    regulars.map((m) => {
                      const busy = busyId === m.user_id;
                      const showRemove = canRemove(m);
                      return (
                        <View key={`mem-${m.user_id}`} style={styles.row}>
                          {m.users?.avatar_url ? (
                            <Image source={{ uri: m.users.avatar_url }} style={styles.rowAvatar} />
                          ) : (
                            <View style={[styles.rowAvatar, styles.rowAvatarPh]}>
                              <Text>?</Text>
                            </View>
                          )}
                          <TouchableOpacity style={{ flex: 1 }} onPress={() => setSelectedMember(m)}>
                            <Text style={styles.rowName}>{getDisplayName(m)}</Text>
                            <Text style={styles.roleUnderName}>MEDLEM</Text>
                          </TouchableOpacity>
                          {showRemove && (
                            <TouchableOpacity
                              onPress={() => removeMember(m)}
                              disabled={busy}
                              style={[styles.smallBtn, styles.deleteMiniBtn, busy && styles.btnDisabled]}
                            >
                              <Text style={styles.smallBtnText}>{busy ? "…" : "Fjern"}</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })
                  )}
                </ScrollView>

                <TouchableOpacity onPress={() => setShowMembers(false)} style={styles.modalCloseBottom}>
                  <Text style={styles.modalCloseText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* (Valgfri gammel tråd-modal beholdt) */}
      <Modal visible={false} transparent animationType="slide" onRequestClose={() => {}}>
        {/* skjult – beholdt hvis du vil genbruge */}
      </Modal>
    </>
  );
}

/* ---------- Styles ---------- */
const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#7C8996" },

  /* Topbar */
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingTop: 42,
    paddingBottom: 8,
    alignItems: "center",
    backgroundColor: "#7C8996",
  },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#131921",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#ffffff",
  },
  backBtnText: { color: "#fff", fontWeight: "800", fontSize: 16, lineHeight: 16 },

  counter: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: "#e5e8ec",
  },
  counterIcon: { fontSize: 12, color: "#131921" },
  counterNum: { color: "#131921", fontWeight: "800", fontSize: 13 },

  /* Kort */
  card: {
    marginHorizontal: 14,
    marginTop: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: "#eef1f4",
  },
  hero: { width: "100%", height: 180, borderRadius: 10, marginBottom: 8, resizeMode: "cover", backgroundColor: "#f0f0f0" },
  heroTablet: { height: 420 },
  heroPlaceholder: { backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },

  title: { fontSize: 15, fontWeight: "800", color: "#131921", marginTop: 4 },
  place: { fontSize: 12, fontWeight: "500", color: "#000", marginTop: 2 },
  desc: { fontSize: 13, color: "#000", marginTop: 6, lineHeight: 18 },

  /* Inputs til redigering */
  input: {
    backgroundColor: "#fff", borderRadius: 8, borderWidth: 1, borderColor: "#e5e8ec",
    paddingHorizontal: 10, paddingVertical: 8, color: "#000", marginTop: 6,
  },
  titleInput: { fontSize: 16, fontWeight: "900", color: "#131921" },
  descInput: { minHeight: 76, textAlignVertical: "top" },
  editRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  smallActionBtn: { paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  smallActionText: { color: "#fff", fontWeight: "800" },
  editBtn: { backgroundColor: "#131921" },
  saveBtn: { backgroundColor: "#1f7a33" },
  cancelBtn: { backgroundColor: "#9aa0a6" },

  bigBtn: { marginTop: 12, borderRadius: 10, paddingVertical: 10, alignItems: "center" },
  join: { backgroundColor: "#131921" },
  bigBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },

  /* Sektioner */
  section: {
    marginTop: 12, marginHorizontal: 14, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12,
    borderWidth: 1, borderColor: "#eef1f4", shadowColor: "#000", shadowOpacity: 0.04,
    shadowRadius: 4, shadowOffset: { width: 0, height: 1 }, elevation: 1,
  },
  sectionTitle: { fontSize: 12, fontWeight: "900", color: "#131921" },
  sectionMuted: { marginTop: 4, color: "#000", fontSize: 12, opacity: 0.7 },

  /* Medlemmer (preview) */
  memberBox: { alignItems: "center", marginRight: 12, minWidth: 64 },
  memberAvatar: { width: 60, height: 60, borderRadius: 8, marginBottom: 4, backgroundColor: "#f0f0f0" },
  memberAvatarPlaceholder: { width: 60, height: 60, borderRadius: 8, marginBottom: 4, backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  memberName: { color: "#000", fontSize: 10, fontWeight: "700", textAlign: "center" },

  /* Tråd preview */
  threadItemRow: { flexDirection: "row", alignItems: "center", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "#e9edf1", paddingVertical: 10 },
  threadItemLeft: { flex: 1 },
  threadTitle: { fontSize: 10, fontWeight: "800", color: "#131921" },
  threadMeta: { fontSize: 9, color: "#000", opacity: 0.6, marginTop: 2 },

  /* Aktiviteter preview */
  eventRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e9edf1",
    paddingVertical: 10,
  },
  eventTitle: { fontSize: 12, fontWeight: "800", color: "#131921" },
  eventMeta: { fontSize: 10, color: "#000", opacity: 0.7, marginTop: 2 },

  /* Bundsektion: handlinger (3 knapper) */
  bottomActions: {
    marginTop: 12, marginHorizontal: 14, marginBottom: 12, backgroundColor: "#FFFFFF", borderRadius: 14, padding: 12, gap: 10,
    shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 2,
    borderWidth: 1, borderColor: "#eef1f4",
  },
  actionBtn: { borderRadius: 8, paddingVertical: 12, alignItems: "center" },
  leaveAction: { backgroundColor: "#9aa0a6" },
  uploadAction: { backgroundColor: "#131921" },
  deleteAction: { backgroundColor: "#C62828" },
  actionBtnText: { color: "#fff", fontSize: 14, fontWeight: "800" },
  deleteActionText: { color: "#fff", fontSize: 12, fontWeight: "800" },

  /* Modal */
  modalBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", alignItems: "center", justifyContent: "center", padding: 18 },
  modalCard: { width: "100%", maxWidth: 520, backgroundColor: "#FFFFFF", borderRadius: 8, padding: 12, borderWidth: 1, borderColor: "#eef1f4" },

  listHeader: { fontSize: 10, fontWeight: "800", color: "#131921", marginVertical: 6 },
  emptyLine: { fontSize: 10, color: "#000", paddingVertical: 6, opacity: 0.7 },

  row: { flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#e8eef2" },
  rowAvatar: { width: 34, height: 34, borderRadius: 17, marginRight: 10, backgroundColor: "#f0f0f0" },
  rowAvatarPh: { backgroundColor: "#f0f0f0", alignItems: "center", justifyContent: "center" },
  rowName: { fontSize: 13, fontWeight: "700", color: "#000" },
  rowEmail: { fontSize: 11, color: "#000", opacity: 0.7 },
  roleUnderName: { fontSize: 10, fontWeight: "800", color: "#131921", marginTop: 2 },

  profileWrap: { alignItems: "center", paddingVertical: 8 },
  profileAvatar: { width: 310, height: 400, borderRadius: 12, marginBottom: 10, backgroundColor: "#f0f0f0" },
  profileName: { fontSize: 12, fontWeight: "800", color: "#000" },
  roleBadge: { fontSize: 10, fontWeight: "900", color: "#131921", marginVertical: 8 },

  modalCloseBottom: { alignSelf: "flex-end", marginTop: 10, backgroundColor: "#131921", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  modalCloseText: { color: "#fff", fontWeight: "900", fontSize: 16 },

  /* Mini-knapper i medlemslister */
  smallBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  smallBtnText: { color: "#fff", fontWeight: "800", fontSize: 11 },
  approveBtn: { backgroundColor: "#1f7a33" },
  rejectBtn: { backgroundColor: "#9aa0a6" },
  deleteMiniBtn: { backgroundColor: "#C62828" },
  btnDisabled: { opacity: 0.6 },
});