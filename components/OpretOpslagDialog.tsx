// components/OpretOpslagDialog.tsx
import { Buffer } from "buffer";
import * as FileSystem from "expo-file-system";
import * as ImageManipulator from "expo-image-manipulator";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { supabase } from "../utils/supabase";

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
    // NYT: send eksisterende koordinater ind ved redigering
    latitude?: number | null;
    longitude?: number | null;
  };
};

type PickedImage = { uri: string } | null;

async function uploadImageBase64(image: PickedImage, userId: string) {
  if (!image?.uri) return null;

  let ext = image.uri.split(".").pop() || "jpg";
  if (ext.length > 5) ext = "jpg"; // fallback hvis der ikke er en reel extension

  const fileName = `${userId}/${Date.now()}.${ext}`;
  const base64 = await FileSystem.readAsStringAsync(image.uri, {
    encoding: FileSystem.EncodingType.Base64,
  });
  const fileBuffer = Buffer.from(base64, "base64");

  const { error } = await supabase.storage
    .from("images")
    .upload(fileName, fileBuffer, {
      contentType: `image/${ext}`,
      upsert: true,
    });

  if (error) throw error;

  const { data: publicUrlData } = supabase.storage
    .from("images")
    .getPublicUrl(fileName);

  return publicUrlData?.publicUrl || null;
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
      <TouchableOpacity
        style={styles.dropdownBtn}
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
      >
        <Text
          style={selected ? styles.dropdownBtnText : styles.dropdownBtnPlaceholder}
        >
          {selected || "Vælg kategori"}
        </Text>
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity
          style={styles.dropdownOverlay}
          activeOpacity={1}
          onPress={() => setOpen(false)}
        >
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
                      selected === item && {
                        color: "#254890",
                        fontWeight: "bold",
                      },
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

export default function OpretOpslagDialog({
  visible,
  onClose,
  onSubmit,
  initialValues,
}: Props) {
  const [id, setId] = useState<string | undefined>(undefined);
  const [overskrift, setOverskrift] = useState("");
  const [omraade, setOmraade] = useState("");
  const [beskrivelse, setBeskrivelse] = useState("");
  const [billede, setBillede] = useState<PickedImage>(null);
  const [uploading, setUploading] = useState(false);
  const [kategori, setKategori] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  // Hold eksisterende koordinater når vi redigerer
  const [lat, setLat] = useState<number | null | undefined>(undefined);
  const [lng, setLng] = useState<number | null | undefined>(undefined);

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUserId(data.user?.id || null);
    };
    if (visible) {
      getUser();
      setId(initialValues?.id || undefined);
      setOverskrift(initialValues?.overskrift || "");
      setOmraade(initialValues?.omraade || "");
      setBeskrivelse(initialValues?.beskrivelse ?? initialValues?.text ?? "");
      setBillede(initialValues?.image_url ? { uri: initialValues.image_url } : null);
      setKategori(initialValues?.kategori || "");
      setLat(initialValues?.latitude ?? null);
      setLng(initialValues?.longitude ?? null);
    }
  }, [visible, initialValues]);

  const pickImage = async (source: "camera" | "library") => {
    try {
      if (source === "camera") {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") throw new Error("Kameratilladelse mangler.");
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== "granted") throw new Error("Billedbibliotek-tilladelse mangler.");
      }

      let result;
      if (source === "camera") {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality: 1,
        });
      }
      if (!result.canceled) {
        const asset = result.assets?.[0];
        if (asset?.uri) {
          const manipResult = await ImageManipulator.manipulateAsync(
            asset.uri,
            [{ resize: { width: 1400 } }],
            { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
          );
          setBillede(manipResult);
        }
      }
    } catch (err: any) {
      Alert.alert("Fejl", err.message);
    }
  };

  const openImageMenu = () => {
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ["Annuller", "Tag billede", "Vælg fra galleri"],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) pickImage("camera");
          else if (buttonIndex === 2) pickImage("library");
        }
      );
    } else {
      Alert.alert("", "Vælg billede", [
        { text: "Tag billede", onPress: () => pickImage("camera") },
        { text: "Vælg fra galleri", onPress: () => pickImage("library") },
        { text: "Annuller", style: "cancel" },
      ]);
    }
  };

  // Hent lokation “blødt” – ingen blokering/fejl hvis det ikke lykkes
  const tryGetForegroundLocation = async (): Promise<{ lat: number; lng: number } | null> => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return null;

      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        // i simulator fejler det ofte – lad standard timeout gælde
      });
      return { lat: pos.coords.latitude, lng: pos.coords.longitude };
    } catch {
      return null; // simulator / ingen signal / m.m.
    }
  };

  const handleSubmit = async () => {
    if (!overskrift.trim() || !omraade.trim() || !beskrivelse.trim() || !kategori) {
      return Alert.alert("Udfyld alle felter og vælg en kategori");
    }
    if (!currentUserId) {
      return Alert.alert("Bruger ikke fundet. Prøv at logge ind igen.");
    }

    const isEditing = !!id;
    setUploading(true);
    try {
      // Billede
      let imageUrl = initialValues?.image_url || null;
      if (billede && billede.uri && !billede.uri.startsWith("http")) {
        imageUrl = await uploadImageBase64(billede, currentUserId);
      } else if (!billede) {
        imageUrl = null;
      }

      // Lokation:
      // - Ved redigering: behold eksisterende koordinater hvis vi har dem; prøv ellers blødt at hente nye.
      // - Ved oprettelse: prøv blødt at hente; fortsæt også hvis ikke muligt.
      let latitude: number | null | undefined = lat ?? null;
      let longitude: number | null | undefined = lng ?? null;

      if (!isEditing || (isEditing && (latitude == null || longitude == null))) {
        const got = await tryGetForegroundLocation();
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
      Alert.alert("Fejl", err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.overlay} />
        </TouchableWithoutFeedback>

        <View style={styles.dialog}>
          <Text style={styles.title}>{id ? "Ret opslag" : "Opret opslag"}</Text>
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
              {billede?.uri && (
                <View style={styles.thumbnailBox}>
                  <Image source={{ uri: billede.uri }} style={styles.thumbnail} />
                  <TouchableOpacity
                    style={styles.removeBtn}
                    onPress={() => setBillede(null)}
                    disabled={uploading}
                  >
                    <Text style={styles.removeBtnText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
              {!billede && (
                <TouchableOpacity
                  style={styles.addImageBtn}
                  onPress={openImageMenu}
                  disabled={uploading}
                >
                  <Text style={styles.addImageBtnText}>＋</Text>
                </TouchableOpacity>
              )}
            </View>
            {uploading && (
              <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
                <ActivityIndicator color="#254890" />
                <Text style={styles.uploadingText}>Uploader...</Text>
              </View>
            )}
          </ScrollView>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={onClose}
              disabled={uploading}
            >
              <Text style={styles.cancelText}>Annuller</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={uploading}
            >
              <Text style={styles.submitText}>{id ? "Gem" : "Opret"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(20,30,40,0.65)" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  dialog: { width: 350, maxHeight: "90%", backgroundColor: "#fff", borderRadius: 18, padding: 22 },
  title: { fontSize: 18, fontWeight: "bold", color: "#254890", marginBottom: 14, textAlign: "center" },
  input: { backgroundColor: "#f4f7fa", borderRadius: 7, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15, marginBottom: 12, borderWidth: 1, borderColor: "#e0e6ed" },
  textArea: { minHeight: 70, textAlignVertical: "top" },
  label: { fontSize: 14, color: "#254890", fontWeight: "600", marginBottom: 6 },
  billederLabel: { fontSize: 14, color: "#254890", marginTop: 4, marginBottom: 7, fontWeight: "600" },
  thumbnailRow: { flexDirection: "row", marginBottom: 10, minHeight: 62 },
  thumbnailBox: { marginRight: 10, position: "relative" },
  thumbnail: { width: 62, height: 62, borderRadius: 7, backgroundColor: "#eee" },
  removeBtn: { position: "absolute", top: -7, right: -7, backgroundColor: "#e85c5c", borderRadius: 13, width: 24, height: 24, alignItems: "center", justifyContent: "center", zIndex: 2 },
  removeBtnText: { color: "#fff", fontWeight: "bold" },
  addImageBtn: { width: 62, height: 62, borderRadius: 7, backgroundColor: "#f3f3f3", borderWidth: 1, borderColor: "#ddd", alignItems: "center", justifyContent: "center" },
  addImageBtnText: { fontSize: 28, color: "#444" },
  uploadingText: { marginLeft: 8, color: "#254890" },
  buttonRow: { flexDirection: "row", justifyContent: "center", marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  cancelBtn: { backgroundColor: "#e0e6ed", borderRadius: 8, padding: 12, minWidth: 100, alignItems: "center", marginRight: 10 },
  cancelText: { color: "#254890", fontWeight: "bold" },
  submitBtn: { backgroundColor: "#254890", borderRadius: 8, padding: 12, minWidth: 100, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "bold" },
  dropdownBtn: { backgroundColor: "#f4f7fa", borderRadius: 7, padding: 12, borderWidth: 1, borderColor: "#e0e6ed", marginBottom: 12 },
  dropdownBtnText: { color: "#000" },
  dropdownBtnPlaceholder: { color: "#999" },
  dropdownOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "center", alignItems: "center" },
  dropdownList: { backgroundColor: "#fff", borderRadius: 8, width: 250, maxHeight: 300 },
  dropdownItem: { padding: 15, borderBottomWidth: 1, borderBottomColor: "#eee" },
  dropdownItemText: { fontSize: 16 },
});