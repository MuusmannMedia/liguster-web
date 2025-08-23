// app/MigScreen.tsx

import { useNavigation } from '@react-navigation/native';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BottomNav from '../components/BottomNav';
import { useProfile } from '../hooks/useProfile';
import { supabase } from '../utils/supabase';

const PLACEHOLDER = 'https://placehold.co/250x250?text=Profil';

// ---------- Størrelser ----------
const iPhoneSizes = {
  nameFont: 15,
  nameInputFont: 15,
  buttonFont: 10,
  actionFont: 13,
  emailFont: 12,
  statusFont: 12,
  logoutFont: 14,
  avatarSize: 250,
  cardWidth: '85%',
  cardPadding: 36,
};

const iPadSizes = {
  nameFont: 30,
  nameInputFont: 20,
  buttonFont: 12,
  actionFont: 15,
  emailFont: 14,
  statusFont: 14,
  logoutFont: 16,
  avatarSize: 460,
  cardWidth: '65%',
  cardPadding: 46,
};

// ---------- Navn editor ----------
const NameEditor = ({
  initialName,
  onSave,
  savingName,
  isTablet,
}: {
  initialName?: string | null;
  onSave: (name: string) => Promise<boolean>;
  savingName: boolean;
  isTablet: boolean;
}) => {
  const [name, setName] = useState(initialName ?? '');
  const [editing, setEditing] = useState(false);

  const sizes = isTablet ? iPadSizes : iPhoneSizes;

  const handleSave = async () => {
    const success = await onSave(name.trim());
    if (success) setEditing(false);
  };

  if (editing) {
    return (
      <>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Indtast navn"
          style={[
            styles.name,
            styles.nameInput,
            { fontSize: sizes.nameInputFont, paddingVertical: 7 },
          ]}
          autoFocus
          returnKeyType="done"
          onSubmitEditing={handleSave}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
          <TouchableOpacity onPress={handleSave} disabled={savingName}>
            <Text style={[styles.actionText, { color: '#259030', fontSize: sizes.actionFont }]}>
              {savingName ? 'GEMMER…' : 'GEM'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => {
              setEditing(false);
              Keyboard.dismiss();
            }}
          >
            <Text style={[styles.actionText, { color: '#F44', fontSize: sizes.actionFont }]}>
              ANNULLER
            </Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <>
      <Text style={[styles.name, { fontSize: sizes.nameFont }]}>{initialName || 'Bruger'}</Text>
      <TouchableOpacity onPress={() => setEditing(true)} style={styles.textButton}>
        <Text style={[styles.textButtonTextUnderline, { fontSize: sizes.buttonFont }]}>RET NAVN</Text>
      </TouchableOpacity>
    </>
  );
};

// ---------- Skærm ----------
export default function MigScreen() {
  const navigation = useNavigation<any>();
  const {
    user,
    profile,
    loading,
    uploading,
    savingName,
    handleLogout,
    pickAndUploadAvatar,
    handleSaveName,
    setProfile,
  } = useProfile();

  const [removing, setRemoving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { width, height } = useWindowDimensions();
  const isTablet = useMemo(() => {
    // @ts-ignore - iPad
    if (Platform.OS === 'ios' && Platform.isPad) return true;
    return Math.min(width, height) >= 768;
  }, [width, height]);

  const sizes = isTablet ? iPadSizes : iPhoneSizes;

  const removeAvatar = async () => {
    if (!user?.id) return;
    try {
      setRemoving(true);
      const { error } = await supabase.from('users').update({ avatar_url: null }).eq('id', user.id);
      if (error) {
        Alert.alert('Fejl', 'Kunne ikke slette billede: ' + error.message);
      } else {
        setProfile((prev: any) => ({ ...prev, avatar_url: null }));
      }
    } finally {
      setRemoving(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Slet konto',
      'Du er nu ved at slette din konto. Dette kan ikke gøres om. Når din konto er slettet vil alt dit indhold forsvinde fra Liguster!',
      [
        { text: 'Annuller', style: 'cancel' },
        { text: 'Slet', style: 'destructive', onPress: deleteAccount },
      ],
    );
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      setDeleting(true);

      // Hent access token til Authorization header
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        Alert.alert('Fejl', 'Ingen gyldig session. Prøv at logge ind igen.');
        return;
      }

      // Kald din Edge Function
      // (URL’en er fast for projektet – brug POST uden body; funktionen finder selv current user)
      const url = 'https://gizskyfynvyvhnaqcyax.functions.supabase.co/delete-account';
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Delete function fejlede (${res.status}): ${txt || 'Ukendt fejl'}`);
      }

      // Log ud i klienten
      await supabase.auth.signOut();

      // Nulstil navigation til LoginScreen (route-navnet skal matche din navigator)
      navigation.reset({
        index: 0,
        routes: [{ name: 'LoginScreen' }],
      });
    } catch (e: any) {
      Alert.alert('Fejl', e?.message ?? 'Kunne ikke slette kontoen.');
    } finally {
      setDeleting(false);
    }
  };

  const imageSource =
    profile?.avatar_url && profile.avatar_url.startsWith('http')
      ? { uri: profile.avatar_url }
      : { uri: PLACEHOLDER };

  if (loading) {
    return (
      <View style={[styles.root, { justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={styles.centerArea}>
            <View style={[styles.card, { width: sizes.cardWidth, padding: sizes.cardPadding }]}>
              <Image
                source={imageSource}
                style={[styles.avatar, { width: sizes.avatarSize, height: sizes.avatarSize }]}
                resizeMode="cover"
              />

              {/* Knapper: RET BILLEDE + SLET BILLEDE */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, marginBottom: 22 }}>
                <TouchableOpacity onPress={pickAndUploadAvatar} disabled={uploading} style={styles.textButton}>
                  <Text style={[styles.textButtonTextUnderline, { fontSize: sizes.buttonFont }]}>
                    {uploading ? 'UPLOADER…' : 'RET BILLEDE'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={removeAvatar} disabled={removing} style={styles.textButton}>
                  <Text
                    style={[
                      styles.textButtonTextUnderline,
                      { color: '#B00020', fontSize: sizes.buttonFont },
                    ]}
                  >
                    {removing ? 'SLETTER…' : 'SLET BILLEDE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Navn + redigering */}
              <View style={{ alignItems: 'center', width: '100%', marginBottom: 12 }}>
                <NameEditor
                  initialName={profile?.name || user?.email?.split('@')[0]}
                  onSave={handleSaveName}
                  savingName={savingName}
                  isTablet={isTablet}
                />
              </View>

              <Text style={[styles.email, { fontSize: sizes.emailFont }]}>{user?.email ?? 'Ingen email'}</Text>
              <Text style={[styles.status, { fontSize: sizes.statusFont }]}>
                {user ? 'Du er logget ind' : 'Du er ikke logget ind'}
              </Text>

              {/* Log ud */}
              <TouchableOpacity onPress={handleLogout} disabled={deleting}>
                <Text style={[styles.logout, { fontSize: sizes.logoutFont }]}>LOG UD</Text>
              </TouchableOpacity>

              {/* Slet konto */}
              <TouchableOpacity onPress={confirmDeleteAccount} disabled={deleting} style={{ marginTop: 12 }}>
                <Text style={[styles.logout, { fontSize: sizes.logoutFont }]}>
                  {deleting ? 'SLÆTTER…' : 'SLET KONTO'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}

// ---------- Styles ----------
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#7C8996' },
  centerArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingBottom: 95 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatar: {
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 0,
    borderColor: '#E8ECF1',
  },
  textButton: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingVertical: 2,
    paddingHorizontal: 2,
    alignSelf: 'center',
    minHeight: 20,
  },
  textButtonTextUnderline: {
    color: '#567',
    fontWeight: 'bold',
    letterSpacing: 0.5,
    textDecorationLine: 'underline',
  },
  name: {
    fontWeight: '700',
    color: '#2A2D34',
    marginBottom: 2,
    minWidth: 80,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  nameInput: {
    borderBottomWidth: 1,
    borderColor: '#7C8996',
    textAlign: 'center',
    backgroundColor: '#f7f7f7',
    marginBottom: 10,
    borderRadius: 5,
  },
  actionText: {
    fontWeight: 'bold',
    marginHorizontal: 8,
    textDecorationLine: 'underline',
  },
  email: { color: '#6B7280', marginBottom: 20, textAlign: 'center' },
  status: { color: '#2A2D34', opacity: 0.7, marginBottom: 20, textAlign: 'center' },
  logout: { fontWeight: 'bold', color: 'red', textDecorationLine: 'underline' },
});