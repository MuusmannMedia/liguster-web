// app/Beskeder.tsx

import { useFocusEffect, useNavigation } from "@react-navigation/native";
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import BottomNav from '../components/BottomNav';
import useBeskeder from '../hooks/useBeskeder'; // <-- Vores nye hook

export default function BeskederScreen() {
  const { userId, threads, loading, deleteThread, refresh } = useBeskeder();
  const navigation = useNavigation();

  // useFocusEffect er en hook fra React Navigation, der kører hver gang skærmen kommer i fokus.
  // Det sikrer, at listen er opdateret, hvis brugeren har slettet en besked på en anden skærm.
  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  return (
    <View style={styles.root}>
      {loading ? (
        <ActivityIndicator size="large" color="#254890" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={threads}
          keyExtractor={item => item.thread_id}
          contentContainerStyle={{ paddingBottom: 100, paddingTop: 60 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={{ flex: 1 }}
                activeOpacity={0.8}
                onPress={() =>
                  navigation.navigate('ChatScreen', {
                    threadId: item.thread_id,
                    postId: item.post_id,
                    otherUserId: item.sender_id === userId ? item.receiver_id : item.sender_id,
                  })
                }
              >
                <Text style={styles.opslagTitle}>
                  <Text style={styles.underlined}>{item.posts?.overskrift || "UKENDT OPSLAG"}</Text>
                </Text>
                <Text style={styles.omraade}>{item.posts?.omraade || ""}</Text>
                <Text style={styles.besked} numberOfLines={2} ellipsizeMode="tail">
                  {item.text}
                </Text>
              </TouchableOpacity>
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  onPress={() =>
                    navigation.navigate('ChatScreen', {
                      threadId: item.thread_id,
                      postId: item.post_id,
                      otherUserId: item.sender_id === userId ? item.receiver_id : item.sender_id,
                    })
                  }
                >
                  <Text style={styles.laesBesked}>LÆS BESKED</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => deleteThread(item.thread_id)}
                >
                  <Text style={styles.deleteBtnText}>SLET</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Du har ingen beskeder endnu.</Text>
          }
        />
      )}
      <BottomNav />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#7C8996',
    alignItems: 'center',
  },
  card: {
    width: 340,
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 18,
    marginBottom: 18,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  opslagTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#254890',
    marginBottom: 1,
  },
  underlined: {
    color: '#254890',
    textDecorationLine: 'underline',
    fontWeight: 'bold',
  },
  omraade: {
    color: '#222',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  besked: {
    color: '#111',
    fontSize: 15,
    marginBottom: 18,
    marginTop: 2,
    lineHeight: 21,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
    gap: 16,
  },
  laesBesked: {
    fontWeight: 'bold',
    fontSize: 15,
    color: '#000',
    textDecorationLine: 'underline',
    marginTop: 0,
    alignSelf: 'flex-start',
  },
  deleteBtn: {
    backgroundColor: '#e34141',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    alignSelf: 'flex-end',
    elevation: 1,
  },
  deleteBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
  },
  emptyText: {
    color: '#666',
    marginTop: 22,
    alignSelf: 'center'
  }
});
