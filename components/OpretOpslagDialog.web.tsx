// components/OpretOpslagDialog.web.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { supabase } from "../utils/supabase";

// ──────────────────────────────────────────────────────────────────────────────
// Konfiguration
// ──────────────────────────────────────────────────────────────────────────────
// Brug samme bucket som appen (du kan skifte til "foreningsbilleder" hvis du vil)
const BUCKET = "images";

const KATEGORIER = [
  "Værktøj",
  "Arbejde tilbydes",
  "Affald",
  "Mindre ting",
  "Større ting",
  "Hjælp søges",
  "Hjælp tilbydes",
  "Byttes",
  "Udlejning",
  "Sælges",
  "Andet",
];

type SubmitData = {
  id?: string;
  overskrift: string;
  omraade: string;
  text: string;
  user_id: string;
  image_url?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  kategori: string;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: SubmitData) => void;
  initialValues?: {
    id?: string;
    overskrift?: string;
    omraade?: string;
    beskrivelse?: string;
    text?: string;
    image_url?: string | null;
    kategori?: string;
    latitude?: number | null;
    longitude?: number | null;
  };
};

// ──────────────────────────────────────────────────────────────────────────────
// Hjælpere (web)
// ──────────────────────────────────────────────────────────────────────────────

// Læs en File som HTMLImageElement
async function fileToImage(file: File): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  try {
    await new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = (e) => reject(e);
      img.src = url;
    });
    const img = new Image();
    img.src = url;
    return img;
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  }
}

// Komprimer/resize i canvas (maxWidth 1400, JPEG kvalitet ~0.72)
async function resizeToBlob(file: File, maxWidth = 1400, quality = 0.72): Promise<Blob> {
  const img = await fileToImage(file);
  const scale = Math.min(1, maxWidth / (img.width || maxWidth));
  const targetW = Math.round((img.width || maxWidth) * scale);
  const targetH = Math.round((img.height || maxWidth) * scale);

  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;

  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Kunne ikke oprette canvas context.");
  ctx.drawImage(img, 0, 0, targetW, targetH);

  const blob: Blob = await new Promise((resolve) =>
    canvas.toBlob((b) => resolve(b || file), "image/jpeg", quality)
  );

  URL.revokeObjectURL(img.src);
  return blob;
}

// Prøv at hente browser-lokation "blødt"
async function tryGetBrowserLocation(): Promise<{ lat: number; lng: number } | null> {
  if (!("geolocation" in navigator)) return null;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  });
}

function KategoriDropdown({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (cat: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <TouchableOpacity style={styles.dropdownBtn} onPress={() => setOpen(true)} activeOpacity={0.8}>
        <Text style={selected ? styles.dropdownBtnText : styles.dropdownBtnPlaceholder}>
          {selected || "Vælg kategori"}
        </Text>
      </TouchableOpacity>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <TouchableOpacity style={styles.dropdownOverlay} activeOpacity={1} onPress={() => setOpen(false)}>
          <View style={styles.dropdownList}>
            <FlatList
              data={KATEGORIER}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    onSelect(item);
                    setOpen(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    selected === item && { backgroundColor: "#25489011" },
                  ]}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      selected === item && { color: "#254890", fontWeight: "bold" },
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Komponent (web)
// ──────────────────────────────────────────────────────────────────────────────

export default function OpretOpslagDialog({
  visible,
  onClose,
  onSubmit,
  initialValues,
}: Props) {
  const [id, setId] = useState<string | undefined>();
  const [overskrift, setOverskrift] = useState("");
  const [omraade, setOmraade] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [kategori, setKategori] = useState("");
  const [uploading, setUploading] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [lat, setLat] = useState<number | null | undefined>(undefined);
  const [lng, setLng] = useState<number | null | undefined>(undefined);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    if (visible) {
      load();
      setId(initialValues?.id);
      setOverskrift(initialValues?.overskrift || "");
      setOmraade(initialValues?.omraade || "");
      setBeskrivelse(initialValues?.beskrivelse ?? initialValues?.text ?? "");
      setKategori(initialValues?.kategori || "");
      setPreviewUri(initialValues?.image_url ?? null);
      setFile(null);
      setLat(initialValues?.latitude ?? null);
      setLng(initialValues?.longitude ?? null);
    }
  }, [visible, initialValues]);

  const openFilePicker = () => {
    inputRef.current?.click();
  };

  const onPickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    // Gem forhåndsvisning
    const localUrl = URL.createObjectURL(f);
    setPreviewUri(localUrl);
    setFile(f);
  };

  // Upload til Supabase (Blob) og returner public URL
  const uploadImage = async (blob: Blob, userId: string): Promise<string> => {
    const fileName = `${userId}/${Date.now()}.jpg`;
    const { error } = await supabase.storage.from(BUCKET).upload(fileName, blob, {
      contentType: "image/jpeg",
      upsert: true,
    });
    if (error) throw error;
    const { data: url } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
    return url?.publicUrl || "";
  };

  const handleSubmit = async () => {
    if (!overskrift.trim() || !omraade.trim() || !beskrivelse.trim() || !kategori) {
      Alert.alert("Udfyld alle felter og vælg en kategori");
      return;
    }
    if (!currentUserId) {
      Alert.alert("Bruger ikke fundet. Prøv at logge ind igen.");
      return;
    }

    const isEditing = !!id;
    setUploading(true);
    try {
      // Billede
      let imageUrl = initialValues?.image_url || null;
      if (file) {
        const blob = await resizeToBlob(file, 1400, 0.72);
        imageUrl = await uploadImage(blob, currentUserId);
      } else if (!previewUri && !file) {
        // hvis brugeren har fjernet eksisterende preview
        imageUrl = null;
      }

      // Lokation (blød)
      let latitude: number | null | undefined = lat ?? null;
      let longitude: number | null | undefined = lng ?? null;
      if (!isEditing || (isEditing && (latitude == null || longitude == null))) {
        const got = await tryGetBrowserLocation();
        if (got) {
          latitude = got.lat;
          longitude = got.lng;
        }
      }

      onSubmit({
        id,
        overskrift,
        omraade,
        text: beskrivelse,
        user_id: currentUserId,
        image_url: imageUrl,
        latitude: latitude ?? null,
        longitude: longitude ?? null,
        kategori,
      });
    } catch (err: any) {
      Alert.alert("Fejl", err?.message ?? "Noget gik galt ved upload.");
    } finally {
      setUploading(false);
    }
  };

  // Fjern billede (nulstil både preview og file)
  const removeImage = () => {
    if (previewUri?.startsWith("blob:")) URL.revokeObjectURL(previewUri);
    setPreviewUri(null);
    setFile(null);
  };

  // Husk at rydde blob-URL ved unmount
  useEffect(() => {
    return () => {
      if (previewUri?.startsWith("blob:")) URL.revokeObjectURL(previewUri);
    };
  }, [previewUri]);

  const title = useMemo(() => (id ? "Ret opslag" : "Opret opslag"), [id]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.overlay} />

        <View style={styles.dialog}>
          <Text style={styles.title}>{title}</Text>

          <ScrollView keyboardShouldPersistTaps="handled">
            <Text style={styles.label}>Overskrift</Text>
            <TextInput
              placeholder="Skriv en titel..."
              value={overskrift}
              onChangeText={setOverskrift}
              style={styles.input}
              editable={!uploading}
            />

            <Text style={styles.label}>Område</Text>
            <TextInput
              placeholder="F.eks. Lyngby, 2800"
              value={omraade}
              onChangeText={setOmraade}
              style={styles.input}
              editable={!uploading}
            />

            <Text style={styles.label}>Beskrivelse</Text>
            <TextInput
              placeholder="Skriv dit opslag her..."
              value={beskrivelse}
              onChangeText={setBeskrivelse}
              style={[styles.input, styles.textArea]}
              multiline
              editable={!uploading}
            />

            <Text style={styles.label}>Kategori</Text>
            <KategoriDropdown selected={kategori} onSelect={setKategori} />

            <Text style={styles.billederLabel}>Upload billede</Text>
            <View style={styles.thumbnailRow}>
              {previewUri ? (
                <View style={styles.thumbnailBox}>
                  <Image source={{ uri: previewUri }} style={styles.thumbnail} />
                  <TouchableOpacity style={styles.removeBtn} onPress={removeImage} disabled={uploading}>
                    <Text style={styles.removeBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.addImageBtn} onPress={openFilePicker} disabled={uploading}>
                  <Text style={styles.addImageBtnText}>＋</Text>
                </TouchableOpacity>
              )}
              {/* Skjult input til web */}
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                style={{ display: "none" }}
                onChange={onPickFile}
              />
            </View>

            {uploading && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <ActivityIndicator color="#254890" />
                <Text style={styles.uploadingText}>Uploader...</Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={uploading}>
              <Text style={styles.cancelText}>Annuller</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={uploading}>
              <Text style={styles.submitText}>{id ? "Gem" : "Opret"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Styles (match app-look)
// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,30,40,0.65)" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  dialog: { width: 350, maxHeight: "90%", backgroundColor: "#fff", borderRadius: 18, padding: 22 },
  title: { fontSize: 18, fontWeight: "bold", color: "#254890", marginBottom: 14, textAlign: "center" },
  input: {
    backgroundColor: "#f4f7fa",
    borderRadius: 7,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e0e6ed",
  },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  label: { fontSize: 14, color: "#254890", fontWeight: "600", marginBottom: 6 },
  billederLabel: { fontSize: 14, color: "#254890", marginTop: 4, marginBottom: 7, fontWeight: "600" },
  thumbnailRow: { flexDirection: "row", marginBottom: 10, minHeight: 62 },
  thumbnailBox: { marginRight: 10, position: "relative" },
  thumbnail: { width: 62, height: 62, borderRadius: 7, backgroundColor: "#eee" },
  removeBtn: {
    position: "absolute",
    top: -7,
    right: -7,
    backgroundColor: "#e85c5c",
    borderRadius: 13,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  removeBtnText: { color: "#fff", fontWeight: "bold" },
  addImageBtn: {
    width: 62,
    height: 62,
    borderRadius: 7,
    backgroundColor: "#f3f3f3",
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    justifyContent: "center",
  },
  addImageBtnText: { fontSize: 28, color: "#444" },
  uploadingText: { marginLeft: 8, color: "#254890" },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelBtn: { backgroundColor: "#e0e6ed", borderRadius: 8, padding: 12, minWidth: 100, alignItems: "center", marginRight: 10 },
  cancelText: { color: "#254890", fontWeight: "bold" },
  submitBtn: { backgroundColor: "#254890", borderRadius: 8, padding: 12, minWidth: 100, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "bold" },

  // Dropdown
  dropdownBtn: { backgroundColor: "#f4f7fa", borderRadius: 7, padding: 12, borderWidth: 1, borderColor: "#e0e6ed", marginBottom: 12 },
  dropdownBtnText: { color: "#000" },
  dropdownBtnPlaceholder: { color: "#999" },
  dropdownOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  dropdownList: { backgroundColor: "#fff", borderRadius: 8, width: 250, maxHeight: 300 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  dropdownItemText: { fontSize: 16 },
});