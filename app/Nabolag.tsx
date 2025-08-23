// app/Nabolag.tsx

import React, { useState } from 'react';
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
  useWindowDimensions
} from 'react-native';
import BottomNav from '../components/BottomNav';
import OpretOpslagDialog from '../components/OpretOpslagDialog';
import OpslagDetaljeModal from '../components/OpslagDetaljeModal';
import SvarModal from '../components/SvarModal';
import { KATEGORIER, Post, useNabolag } from '../hooks/useNabolag'; // <-- Importerer vores nye hook
import { supabase } from '../utils/supabase';

// Disse dialoger er rene UI-komponenter og kan blive her,
// eller flyttes til deres egne filer i /components mappen for endnu mere orden.
const distances = [1, 2, 3, 5, 10, 20, 50];

function RadiusDialog({ visible, value, onClose, onChange }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.title}>Vis opslag indenfor</Text>
          {distances.map((d) => (
            <TouchableOpacity
              key={d}
              style={[dialogStyles.option, d === value && dialogStyles.selectedOption]}
              onPress={() => { onChange(d); onClose(); }}
            >
              <Text style={{ fontWeight: d === value ? 'bold' : 'normal' }}>{d} km</Text>
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

function KategoriDialog({ visible, value, onClose, onChange }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={dialogStyles.overlay}>
        <View style={dialogStyles.dialog}>
          <Text style={dialogStyles.title}>Vælg kategori</Text>
          {KATEGORIER.map((k) => (
            <TouchableOpacity
              key={k}
              style={[dialogStyles.option, k === value && dialogStyles.selectedOption]}
              onPress={() => { onChange(k); onClose(); }}
            >
              <Text style={{ fontWeight: k === value ? 'bold' : 'normal' }}>{k}</Text>
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

export default function Nabolag() {
  // Al logik og state er nu samlet i denne ene linje.
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

  // State for modals styres stadig lokalt i UI-komponenten
  const [opretVisible, setOpretVisible] = useState(false);
  const [detaljeVisible, setDetaljeVisible] = useState(false);
  const [svarVisible, setSvarVisible] = useState(false);
  const [radiusVisible, setRadiusVisible] = useState(false);
  const [kategoriVisible, setKategoriVisible] = useState(false);
  const [valgtOpslag, setValgtOpslag] = useState<Post | null>(null);

  // --- Logik til dynamisk grid-layout ---
  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 3 : width >= 650 ? 2 : 1;
  const isGrid = numColumns > 1;
  const ITEM_GAP = 18;
  const SIDE_PADDING = isGrid ? 18 : 0;
  const itemWidth = isGrid ? (width - SIDE_PADDING * 2 - ITEM_GAP * (numColumns - 1)) / numColumns : '100%';

  const handleOpretOpslag = async (postData) => {
    const success = await createPost(postData);
    if (success) {
      setOpretVisible(false);
    }
  };

  return (
    <View style={styles.root}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.welcomeBox} onPress={() => setOpretVisible(true)} activeOpacity={0.88}>
            <Text style={styles.opretOpslagBtnText}>OPRET OPSLAG</Text>
          </TouchableOpacity>

          <View style={styles.filterRow}>
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.searchInput}
              placeholder="Søg i opslag…"
              placeholderTextColor="#666"
              returnKeyType="search"
            />
            <TouchableOpacity style={styles.kategoriBtn} onPress={() => setKategoriVisible(true)} activeOpacity={0.7}>
              <Text style={styles.kategoriBtnText}>▼</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.radiusBtn} onPress={() => setRadiusVisible(true)}>
              <Text style={styles.radiusBtnText}>{radius} km</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#254890" style={{ marginTop: 30 }} />
          ) : (
            <FlatList
              data={filteredPosts}
              keyExtractor={(item) => item.id}
              style={{ width: '100%' }}
              contentContainerStyle={{
                paddingTop: 10,
                paddingBottom: 80,
                paddingHorizontal: SIDE_PADDING,
                alignItems: isGrid ? 'center' : 'stretch',
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
                  <View style={styles.opslagBox}>
                    {item.image_url && <Image source={{ uri: item.image_url }} style={styles.opslagImage} />}
                    {item.kategori && (
                      <View style={styles.kategoriBadge}>
                        <Text style={styles.kategoriBadgeText}>{item.kategori}</Text>
                      </View>
                    )}
                    <Text style={styles.opslagTitle}>{item.overskrift}</Text>
                    <Text style={styles.opslagOmraade}>{item.omraade}</Text>
                    <Text style={styles.opslagTeaser} numberOfLines={1} ellipsizeMode="tail">
                      {item.text}
                    </Text>
                    {userLocation && item.latitude && item.longitude && (
                      <Text style={{ fontSize: 11, color: '#888', marginTop: 3 }}>
                        {distanceInKm(userLocation.latitude, userLocation.longitude, item.latitude, item.longitude).toFixed(1)} km væk
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={{ color: '#666', marginTop: 22, alignSelf: 'center' }}>Ingen opslag fundet.</Text>}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#254890']} />}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* --- Modals --- */}
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
          const threadId = [userId, valgtOpslag.user_id].sort().join('_') + '_' + valgtOpslag.id;
          await supabase.from('messages').insert([{
            thread_id: threadId,
            sender_id: userId,
            receiver_id: valgtOpslag.user_id,
            post_id: valgtOpslag.id,
            text: svarTekst,
          }]);
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

// Styles (uændret)
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#7C8996' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 },
  welcomeBox: { width: '100%', backgroundColor: '#131921', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 18, marginTop: 18, marginBottom: 0, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.09, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 3, borderWidth: 3, borderColor: '#fff' },
  opretOpslagBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 1 },
  filterRow: { width: '100%', flexDirection: 'row', alignItems: 'center', marginTop: 14, marginBottom: 6, gap: 10 },
  searchInput: { flex: 1, backgroundColor: '#fff', borderRadius: 8, paddingHorizontal: 15, paddingVertical: 10, fontSize: 15, color: '#131921', borderWidth: 1.5, borderColor: '#c7ced6' },
  kategoriBtn: { marginLeft: 3, marginRight: 3, backgroundColor: '#131921', borderRadius: 8, borderWidth: 3, borderColor: '#ffffffff', height: 45, width: 45, justifyContent: 'center', alignItems: 'center', elevation: 1, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 } },
  kategoriBtnText: { fontSize: 18, color: '#ffffffff', fontWeight: 'bold', alignSelf: 'center', marginTop: -2 },
  radiusBtn: { backgroundColor: '#131921', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 0, borderWidth: 3, borderColor: '#ffffffff', justifyContent: 'center', alignItems: 'center', height: 45, minWidth: 54, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  radiusBtnText: { color: '#ffffffff', fontWeight: 'bold', fontSize: 15, letterSpacing: 1 },
  opslagBox: { backgroundColor: '#fff', borderRadius: 14, padding: 12, width: '100%', minWidth: 0, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  kategoriBadge: { alignSelf: 'flex-start', backgroundColor: '#25489022', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 7, marginTop: 0 },
  kategoriBadgeText: { color: '#131921', fontWeight: 'bold', fontSize: 13 },
  opslagImage: { width: '100%', height: 120, borderRadius: 10, marginBottom: 10 },
  opslagTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 2, textDecorationLine: 'underline' },
  opslagOmraade: { fontSize: 14, color: '#222', marginBottom: 2 },
  opslagTeaser: { fontSize: 14, color: '#444', marginTop: 3 }
});
const dialogStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(20,30,40,0.60)', justifyContent: 'center', alignItems: 'center' },
  dialog: { backgroundColor: '#fff', borderRadius: 18, padding: 22, width: 260, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#131921', marginBottom: 15 },
  option: { paddingVertical: 10, paddingHorizontal: 15, borderRadius: 7, marginBottom: 7, backgroundColor: '#f4f7fa', width: 210, alignItems: 'center' },
  selectedOption: { backgroundColor: '#25489022', borderColor: '#131921', borderWidth: 3 },
  closeBtn: { marginTop: 10, padding: 8 },
  closeBtnText: { color: '#131921', fontWeight: 'bold' }
});
