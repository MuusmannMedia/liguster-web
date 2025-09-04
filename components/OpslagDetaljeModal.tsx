import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

const { height, width } = Dimensions.get('window');
const BOX_WIDTH = width * 0.90;
const BOX_PADDING = 18;
const IMAGE_MAX_WIDTH = BOX_WIDTH - 2 * BOX_PADDING;
const IMAGE_MAX_HEIGHT = height * 0.36;

export default function OpslagDetaljeModal({
  visible,
  opslag,
  onClose,
  currentUserId,
  onSendSvar,
  canReply = true, // ← NY: kan bruges til at skjule SVAR-knappen (fx i MineOpslag)
}) {
  const [imgLayout, setImgLayout] = useState(null);

  useEffect(() => {
    if (opslag?.image_url) {
      Image.getSize(
        opslag.image_url,
        (w, h) => {
          const ratio = w / h;
          let showW = IMAGE_MAX_WIDTH;
          let showH = IMAGE_MAX_WIDTH / ratio;
          if (showH > IMAGE_MAX_HEIGHT) {
            showH = IMAGE_MAX_HEIGHT;
            showW = IMAGE_MAX_HEIGHT * ratio;
          }
          setImgLayout({ width: showW, height: showH });
        },
        () => setImgLayout({ width: IMAGE_MAX_WIDTH, height: IMAGE_MAX_HEIGHT })
      );
    } else {
      setImgLayout(null);
    }
  }, [opslag?.image_url]);

  if (!opslag) return null;
  const isOwner = opslag.user_id === currentUserId;
  const showReply = !!onSendSvar && !isOwner && canReply !== false; // ← vis SVAR kun når det giver mening

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.box}>
          {opslag.image_url && imgLayout && (
            <Image
              source={{ uri: opslag.image_url }}
              style={[styles.img, { width: imgLayout.width, height: imgLayout.height }]}
              resizeMode="stretch"
            />
          )}

          {/* --------- Kategori badge --------- */}
          {opslag.kategori && (
            <View style={styles.kategoriBadge}>
              <Text style={styles.kategoriBadgeText}>{opslag.kategori}</Text>
            </View>
          )}
          {/* ----------------------------------- */}

          <Text style={styles.titel}>{opslag.overskrift}</Text>
          <Text style={styles.omraade}>{opslag.omraade}</Text>
          <ScrollView style={styles.beskrivelseScroll} nestedScrollEnabled>
            <Text style={styles.beskrivelse}>{opslag.text}</Text>
          </ScrollView>

          <View style={styles.btnRow}>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.luk}>LUK</Text>
            </TouchableOpacity>

            {showReply && (
              <TouchableOpacity onPress={onSendSvar}>
                <Text style={styles.svar}>SVAR</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.98)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  box: {
    width: '90%',
    maxHeight: height * 0.85,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOpacity: 0.13,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  img: {
    alignSelf: 'center',
    borderRadius: 8,
    marginBottom: 10,
    backgroundColor: '#eee',
  },
  // ---------- Kategori badge styling ----------
  kategoriBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#25489022',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 7,
    marginTop: 0,
  },
  kategoriBadgeText: {
    color: '#254890',
    fontWeight: 'bold',
    fontSize: 13,
  },
  // --------------------------------------------
  titel: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#254890',
    textDecorationLine: 'underline',
    marginBottom: 2,
  },
  omraade: {
    color: '#222',
    fontSize: 15,
    marginBottom: 10,
  },
  beskrivelseScroll: {
    maxHeight: 240,
    marginBottom: 14,
    width: '100%',
  },
  beskrivelse: {
    fontSize: 15,
    color: '#222',
    marginBottom: 4,
  },
  btnRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  luk: {
    fontWeight: 'bold',
    fontSize: 15,
    textDecorationLine: 'underline',
    color: '#232323',
  },
  svar: {
    fontWeight: 'bold',
    fontSize: 15,
    textDecorationLine: 'underline',
    color: '#232323',
  },
});