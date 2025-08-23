// app/ChatScreen.tsx
import { useNavigation, useRoute } from '@react-navigation/native';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../utils/supabase';

const AVATAR_SIZE = 40;
const FALLBACK_COLOR = '#6337c4';

type Message = {
  id: string;
  thread_id: string;
  sender_id: string;
  receiver_id: string;
  text: string;
  post_id: string | null;
  created_at: string;
  // valgfrit: posts?: { overskrift?: string } | null;
};

export default function ChatScreen() {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const { threadId, postId, otherUserId } = route.params || {};

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [postTitle, setPostTitle] = useState('UKENDT OPSLAG');
  const [loading, setLoading] = useState(true);
  const [avatars, setAvatars] = useState<Record<string, string | null>>({});
  const [emails, setEmails] = useState<Record<string, string | null>>({});

  const flatListRef = useRef<FlatList>(null);

  // Hent aktuel bruger
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data?.user?.id || null));
  }, []);

  // Førstegang: hent beskeder + titler + avatarer
  useEffect(() => {
    if (!threadId) return;
    let cancelled = false;

    const run = async () => {
      setLoading(true);

      // Hent beskeder for tråden
      const { data: msgs, error } = await supabase
        .from('messages')
        .select('id,thread_id,sender_id,receiver_id,text,post_id,created_at,posts!left(overskrift)')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });

      if (cancelled) return;

      if (error) {
        console.warn('Load messages error:', error.message);
        setMessages([]);
      } else {
        const rows = (msgs || []) as any[];
        setMessages(rows);

        // Titel (prøv via join først, ellers fetch posts)
        let title: string | undefined =
          rows.find((m) => m.posts?.overskrift)?.posts?.overskrift;

        if (!title) {
          const realPostId = postId || rows[0]?.post_id;
          if (realPostId) {
            const { data: p } = await supabase
              .from('posts')
              .select('overskrift')
              .eq('id', realPostId)
              .maybeSingle();
            if (p?.overskrift) title = p.overskrift;
          }
        }
        setPostTitle(title || 'UKENDT OPSLAG');

        // Avatars + emails til begge parter
        const uniqIds = Array.from(
          new Set<string>(
            rows
              .flatMap((m) => [m.sender_id, m.receiver_id])
              .concat(userId || '', otherUserId || '')
              .filter(Boolean),
          )
        );

        if (uniqIds.length) {
          const { data: usersData } = await supabase
            .from('users')
            .select('id, avatar_url, email')
            .in('id', uniqIds);

          const a: Record<string, string | null> = {};
          const e: Record<string, string | null> = {};
          for (const u of usersData || []) {
            e[u.id] = u.email ?? null;
            if (u.avatar_url) {
              const { data: urlObj } = supabase.storage.from('avatars').getPublicUrl(u.avatar_url);
              a[u.id] = urlObj?.publicUrl || null;
            } else {
              a[u.id] = null;
            }
          }
          setAvatars(a);
          setEmails(e);
        }
      }

      setLoading(false);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [threadId, postId, userId, otherUserId]);

  // Realtime: lyt kun på nye rækker i den specifikke tråd
  useEffect(() => {
    if (!threadId) return;

    const channel = supabase
      .channel(`messages:${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `thread_id=eq.${threadId}` },
        (payload) => {
          const row = payload.new as Message;
          setMessages((prev) => {
            // Undgå dubletter (kan ske hvis vi både indsætter lokalt og modtager realtime)
            if (prev.some((m) => m.id === row.id)) return prev;
            const next = [...prev, row].sort(
              (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
            );
            return next;
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId]);

  // Scroll til bund når antallet ændrer sig
  useEffect(() => {
    flatListRef.current?.scrollToEnd?.({ animated: true });
  }, [messages.length]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || !userId || !threadId || !otherUserId) return;

    // 1) Optimistisk besked (vises med det samme)
    const tempId = `temp-${Date.now()}`;
    const tempMsg: Message = {
      id: tempId,
      thread_id: threadId,
      sender_id: userId,
      receiver_id: otherUserId,
      text,
      post_id: postId || null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput('');

    // 2) Skriv til DB og få den rigtige række retur
    const { data: inserted, error } = await supabase
      .from('messages')
      .insert({
        thread_id: threadId,
        sender_id: userId,
        receiver_id: otherUserId,
        text,
        post_id: postId || null,
      })
      .select()
      .single();

    if (error || !inserted) {
      // Rul tilbage hvis det fejler
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      Alert.alert('Fejl', error?.message ?? 'Kunne ikke sende beskeden.');
      return;
    }

    // 3) Erstat den midlertidige med den rigtige række
    setMessages((prev) => {
      // Hvis realtime allerede nåede at tilføje den rigtige, så fjern temp
      if (prev.some((m) => m.id === inserted.id)) {
        return prev.filter((m) => m.id !== tempId);
      }
      return prev.map((m) => (m.id === tempId ? inserted : m));
    });

    // 4) Scroll efter succes
    setTimeout(() => flatListRef.current?.scrollToEnd?.({ animated: true }), 120);
  };

  const getInitial = (uid: string | null) => {
    if (!uid) return 'U';
    const email = emails[uid];
    if (email && email.length > 0) return email[0]!.toUpperCase();
    return 'U';
  };

  const AvatarView = ({ uid }: { uid: string }) =>
    avatars[uid] ? (
      <Image source={{ uri: avatars[uid] as string }} style={styles.avatar} />
    ) : (
      <View style={styles.avatarBadge}>
        <Text style={styles.avatarInitial}>{getInitial(uid)}</Text>
      </View>
    );

  // ----------- RENDER -----------
  return (
    <View style={styles.root}>
      {/* Topbar som de andre sider */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>

        <View style={styles.headerTitleContainer}>
          <Text style={styles.header} numberOfLines={2}>
            {postTitle ? postTitle.toUpperCase() : 'UKENDT OPSLAG'}
          </Text>
        </View>

        {/* tom spacer for symmetri */}
        <View style={{ width: 34 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: '#fff', fontSize: 18 }}>Indlæser...</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item: any) => String(item.id)}
            contentContainerStyle={{ paddingBottom: 18, paddingHorizontal: 10, paddingTop: 18 }}
            renderItem={({ item }: { item: Message }) => {
              const isMe = item.sender_id === userId;
              return (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'flex-end',
                    justifyContent: isMe ? 'flex-end' : 'flex-start',
                    marginBottom: 14,
                  }}
                >
                  {!isMe && <AvatarView uid={item.sender_id} />}
                  <View
                    style={[
                      styles.bubble,
                      isMe ? styles.bubbleRight : styles.bubbleLeft,
                      { alignSelf: isMe ? 'flex-end' : 'flex-start' },
                    ]}
                  >
                    <Text style={[styles.bubbleText, isMe && { color: '#fff' }]}>{item.text}</Text>
                    <Text style={styles.time}>
                      {new Date(item.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  {isMe && userId && <AvatarView uid={userId} />}
                </View>
              );
            }}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd?.({ animated: true })}
            onScrollBeginDrag={() => Keyboard.dismiss()}
            keyboardShouldPersistTaps="handled"
          />
        )}

        <View style={styles.inputRow}>
          <TextInput
            value={input}
            onChangeText={setInput}
            style={styles.input}
            placeholder="Skriv en besked…"
            placeholderTextColor="#999"
            multiline
            blurOnSubmit={false}
            returnKeyType={Platform.OS === 'ios' ? 'default' : 'none'}
            textAlignVertical="top"
          />
          <TouchableOpacity onPress={handleSend} style={styles.sendBtn}>
            <Text style={styles.sendBtnText}>SEND</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#7C8996',
    paddingTop: 42,
  },

  /* Topbar */
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingBottom: 8,
    minHeight: 48,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#131921',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  backBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
    lineHeight: 15,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0,
    textAlign: 'center',
    textTransform: 'uppercase',
    paddingHorizontal: 2,
    flexWrap: 'wrap',
  },

  /* Beskeder */
  bubble: {
    maxWidth: '80%',
    paddingVertical: 13,
    paddingHorizontal: 20,
    borderRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 7,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
    position: 'relative',
  },
  bubbleRight: { backgroundColor: '#131921' },
  bubbleLeft: { backgroundColor: '#fff' },
  bubbleText: {
    fontSize: 14,
    color: '#222',
    marginBottom: 2,
    letterSpacing: 0.25,
    lineHeight: 17,
  },
  time: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: '#a1a1a1',
    marginTop: 3,
    fontWeight: '400',
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginHorizontal: 6,
    backgroundColor: '#ddd',
  },
  avatarBadge: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    marginHorizontal: 6,
    backgroundColor: FALLBACK_COLOR,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { color: '#fff', fontWeight: 'bold', fontSize: 22 },

  /* Input */
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131921',
    paddingHorizontal: 12,
    paddingVertical: 15,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginRight: 9,
    minHeight: 44,
    color: '#1e2330',
    marginBottom: 4,
    textAlignVertical: 'top',
    maxHeight: 120,
    marginTop: 5,
  },
  sendBtn: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 50,
    minHeight: 44,
  },
  sendBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});