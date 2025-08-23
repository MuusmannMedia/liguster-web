// app/MineOpslag.tsx

import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions
} from 'react-native';
import BottomNav from '../components/BottomNav';
import OpretOpslagDialog from '../components/OpretOpslagDialog';
import OpslagDetaljeModal from '../components/OpslagDetaljeModal';
import { useMineOpslag } from '../hooks/useMineOpslag';
import { Post } from '../hooks/useNabolag';

export default function MineOpslagScreen() {
  const { userId, mineOpslag, loading, createPost, updatePost, deletePost } = useMineOpslag();

  // State til at styre detalje-visning
  const [detaljeVisible, setDetaljeVisible] = useState(false);
  const [valgtOpslag, setValgtOpslag] = useState<Post | null>(null);

  // --- NY STATE-HÅNDTERING TIL OPRET/RET DIALOG ---
  const [dialogState, setDialogState] = useState({
    visible: false,
    mode: 'create', // 'create' eller 'edit'
    initialData: null as Post | null,
  });

  const { width } = useWindowDimensions();
  const numColumns = width >= 900 ? 3 : width >= 650 ? 2 : 1;
  const isGrid = numColumns > 1;
  const ITEM_GAP = 18;
  const SIDE_PADDING = isGrid ? 18 : 0;
  const itemWidth = isGrid ? (width - SIDE_PADDING * 2 - ITEM_GAP * (numColumns - 1)) / numColumns : '100%';

  const handleDialogSubmit = async (data) => {
    const success = dialogState.mode === 'create' 
      ? await createPost(data) 
      : await updatePost(data);
    
    if (success) {
      setDialogState({ visible: false, mode: 'create', initialData: null });
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.content}>
        <TouchableOpacity 
          style={styles.welcomeBox} 
          onPress={() => setDialogState({ visible: true, mode: 'create', initialData: null })} 
          activeOpacity={0.88}
        >
          <Text style={styles.opretOpslagBtnText}>OPRET NYT OPSLAG</Text>
        </TouchableOpacity>

        {loading ? (
          <ActivityIndicator size="large" color="#254890" style={{ marginTop: 30 }} />
        ) : (
          <FlatList
            data={mineOpslag}
            keyExtractor={(item) => item.id}
            style={{ width: '100%' }}
            contentContainerStyle={{
              paddingTop: 10,
              paddingBottom: 80,
              paddingHorizontal: SIDE_PADDING,
              alignItems: isGrid ? 'center' : 'stretch',
            }}
            numColumns={numColumns}
            columnWrapperStyle={isGrid ? { gap: ITEM_GAP } : undefined}
            renderItem={({ item, index }) => (
              <View style={{ width: itemWidth, marginBottom: index === mineOpslag.length - 1 ? 0 : 18 }}>
                <View style={styles.opslagBox}>
                  <TouchableOpacity
                    onPress={() => { setValgtOpslag(item); setDetaljeVisible(true); }}
                    activeOpacity={0.85}
                    style={{ width: '100%' }}
                  >
                    {item.image_url && <Image source={{ uri: item.image_url }} style={styles.opslagImage} />}
                    {item.kategori && (
                      <View style={styles.kategoriBadge}>
                        <Text style={styles.kategoriBadgeText}>{item.kategori}</Text>
                      </View>
                    )}
                    <Text style={styles.opslagTitle}>{item.overskrift}</Text>
                    <Text style={styles.opslagOmraade}>{item.omraade}</Text>
                    <Text style={styles.opslagBeskrivelse} numberOfLines={1} ellipsizeMode="tail">
                      {item.text}
                    </Text>
                  </TouchableOpacity>
                  
                  <View style={styles.buttonRow}>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#254890' }]} 
                      onPress={() => setDialogState({ visible: true, mode: 'edit', initialData: item })}
                    >
                      <Text style={styles.actionBtnText}>Ret</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={[styles.actionBtn, { backgroundColor: '#e85c5c' }]} 
                      onPress={() => deletePost(item.id)}
                    >
                      <Text style={styles.actionBtnText}>Slet</Text>
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

      <OpslagDetaljeModal
        visible={detaljeVisible}
        opslag={valgtOpslag}
        onClose={() => setDetaljeVisible(false)}
      />

      {/* --- KUN ÉN DIALOG NU --- */}
      <OpretOpslagDialog
        visible={dialogState.visible}
        onClose={() => setDialogState({ visible: false, mode: 'create', initialData: null })}
        onSubmit={handleDialogSubmit}
        initialValues={dialogState.initialData}
      />
      
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#7C8996' },
  content: { flex: 1, alignItems: 'center', paddingHorizontal: 20, paddingTop: 40 },
  welcomeBox: { width: '100%', backgroundColor: '#131921', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 18, marginTop: 18, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.09, shadowRadius: 7, shadowOffset: { width: 0, height: 2 }, elevation: 3, borderWidth: 3, borderColor: '#fff' },
  opretOpslagBtnText: { color: '#fff', fontSize: 17, fontWeight: 'bold', letterSpacing: 1 },
  opslagBox: { backgroundColor: '#fff', borderRadius: 14, padding: 12, width: '100%', minWidth: 0, shadowColor: '#000', shadowOpacity: 0.07, shadowRadius: 5, shadowOffset: { width: 0, height: 2 }, elevation: 2, alignItems: 'flex-start' },
  kategoriBadge: { alignSelf: 'flex-start', backgroundColor: '#25489022', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, marginBottom: 7, marginTop: 0 },
  kategoriBadgeText: { color: '#131921', fontWeight: 'bold', fontSize: 13 },
  opslagImage: { width: '100%', height: 120, borderRadius: 10, marginBottom: 10 },
  opslagTitle: { fontWeight: 'bold', fontSize: 16, marginBottom: 2, textDecorationLine: 'underline' },
  opslagOmraade: { fontSize: 14, color: '#222', marginBottom: 2 },
  opslagBeskrivelse: { fontSize: 14, color: '#444', marginBottom: 8 },
  buttonRow: { flexDirection: 'row', alignSelf: 'flex-end', marginTop: 8, gap: 10 },
  actionBtn: { borderRadius: 7, paddingHorizontal: 20, paddingVertical: 8 },
  actionBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  emptyText: { color: '#666', marginTop: 22, alignSelf: 'center' },
});
