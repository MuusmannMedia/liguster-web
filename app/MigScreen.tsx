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

/** ====== iPhone vs iPad størrelser (justér frit) ====== */
const iPhoneSizes = {
  nameFont: 15,
  nameInputFont: 15,
  buttonFont: 10,          // knap-tekst iPhone
  actionFont: 13,
  emailFont: 10,
  statusFont: 8,
  logoutFont: 14,
  avatarSize: 250,
  avatarMarginBottom: 20,  // <-- iPhone: afstand under avatar
  cardWidth: '85%' as const,
  cardPadding: 24,
  buttonWidth: 110,
  buttonHeight: 34,
  sectionGapBelowButtons: 18,
  sectionGapAboveBottomRow: 26,
};

const iPadSizes = {
  nameFont: 30,
  nameInputFont: 20,
  buttonFont: 14,          // knap-tekst iPad
  actionFont: 15,
  emailFont: 14,
  statusFont: 14,
  logoutFont: 16,
  avatarSize: 460,
  avatarMarginBottom: 32,  // <-- iPad: afstand under avatar
  cardWidth: '65%' as const,
  cardPadding: 46,
  buttonWidth: 140,
  buttonHeight: 46,
  sectionGapBelowButtons: 24,
  sectionGapAboveBottomRow: 30,
};

/** ====== Navn‑editor ====== */
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
          style={[styles.name, styles.nameInput, { fontSize: sizes.nameInputFont, paddingVertical: 7 }]}
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

/** ====== Skærm ====== */
export default function MigScreen() {
  const navigation = useNavigation<any>();
  const {
    user,
    profile,
    loading,
    uploading,
    handleLogout,
    pickAndUploadAvatar,
    setProfile,
  } = useProfile();

  const [savingNameLocal, setSavingNameLocal] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const { width, height } = useWindowDimensions();
  const isTablet = useMemo(() => {
    // @ts-ignore iPad
    if (Platform.OS === 'ios' && Platform.isPad) return true;
    return Math.min(width, height) >= 768;
  }, [width, height]);

  const sizes = isTablet ? iPadSizes : iPhoneSizes;

  // Gem navn i både public.users og auth metadata
  const saveNameBoth = async (newName: string) => {
    if (!user?.id) return false;
    if (!newName) {
      Alert.alert('Fejl', 'Navn må ikke være tomt.');
      return false;
    }
    try {
      setSavingNameLocal(true);
      const [authRes, dbRes] = await Promise.allSettled([
        supabase.auth.updateUser({ data: { full_name: newName } }),
        supabase.from('users').update({ name: newName }).eq('id', user.id),
      ]);

      if (authRes.status === 'rejected') throw new Error(authRes.reason?.message || 'Kunne ikke opdatere auth‑profil.');
      if (dbRes.status === 'rejected' || (dbRes.status === 'fulfilled' && (dbRes.value as any)?.error)) {
        throw new Error((dbRes as any)?.value?.error?.message || 'Kunne ikke opdatere brugerprofil i databasen.');
      }

      setProfile((prev: any) => ({ ...prev, name: newName }));
      return true;
    } catch (e: any) {
      Alert.alert('Fejl', e?.message ?? 'Kunne ikke gemme navnet.');
      return false;
    } finally {
      setSavingNameLocal(false);
    }
  };

  const removeAvatar = async () => {
    if (!user?.id) return;
    try {
      setRemoving(true);
      const { error } = await supabase.from('users').update({ avatar_url: null }).eq('id', user.id);
      if (error) Alert.alert('Fejl', 'Kunne ikke slette billede: ' + error.message);
      else setProfile((prev: any) => ({ ...prev, avatar_url: null }));
    } finally {
      setRemoving(false);
    }
  };

  const confirmDeleteAccount = () => {
    Alert.alert(
      'Slet konto',
      'Du er nu ved at slette din konto. Dette kan ikke gøres om. Når din konto er slettet vil alt dit indhold forsvinde fra Liguster!',
      [{ text: 'Annuller', style: 'cancel' }, { text: 'Slet', style: 'destructive', onPress: deleteAccount }],
    );
  };

  const deleteAccount = async () => {
    if (!user) return;
    try {
      setDeleting(true);
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;
      if (!accessToken) {
        Alert.alert('Fejl', 'Ingen gyldig session. Prøv at logge ind igen.');
        return;
      }
      const url = 'https://gizskyfynvyvhnaqcyax.functions.supabase.co/delete-account';
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Delete function fejlede (${res.status}): ${txt || 'Ukendt fejl'}`);
      }
      await supabase.auth.signOut();
      navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
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

  const initialDisplayName =
    profile?.name ??
    // @ts-ignore
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0];

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
                style={[
                  styles.avatar,
                  {
                    width: sizes.avatarSize,
                    height: sizes.avatarSize,
                    marginBottom: sizes.avatarMarginBottom, // <- forskellig pr. device
                  },
                ]}
                resizeMode="cover"
              />

              {/* Knapper: RET BILLEDE + SLET BILLEDE */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: sizes.avatarSize,
                  marginBottom: sizes.sectionGapBelowButtons,
                }}
              >
                <TouchableOpacity
                  onPress={pickAndUploadAvatar}
                  disabled={uploading}
                  style={[styles.actionBox, { width: sizes.buttonWidth, height: sizes.buttonHeight }]}
                >
                  <Text style={[styles.actionBoxText, { fontSize: sizes.buttonFont }]}>
                    {uploading ? 'UPLOADER…' : 'RET BILLEDE'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={removeAvatar}
                  disabled={removing}
                  style={[styles.actionBox, { width: sizes.buttonWidth, height: sizes.buttonHeight }]}
                >
                  <Text style={[styles.actionBoxText, { fontSize: sizes.buttonFont }]}>
                    {removing ? 'SLETTER…' : 'SLET BILLEDE'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Navn + redigering */}
              <View style={{ alignItems: 'center', width: '100%', marginBottom: 12 }}>
                <NameEditor
                  initialName={initialDisplayName}
                  onSave={saveNameBoth}
                  savingName={savingNameLocal}
                  isTablet={isTablet}
                />
              </View>

              <Text style={[styles.email, { fontSize: sizes.emailFont }]}>
                {user?.email ?? 'Ingen email'}
              </Text>

              {/* Nederste række: LOG UD + SLET KONTO */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  width: sizes.avatarSize,
                  marginTop: sizes.sectionGapAboveBottomRow,
                }}
              >
                <View style={{ alignItems: 'center' }}>
                  <TouchableOpacity
                    onPress={handleLogout}
                    disabled={deleting}
                    style={[styles.actionBox, { width: sizes.buttonWidth, height: sizes.buttonHeight }]}
                  >
                    <Text style={[styles.actionBoxText, { fontSize: sizes.buttonFont }]}>LOG UD</Text>
                  </TouchableOpacity>
                  <Text style={[styles.status, { fontSize: sizes.statusFont }]}>
                    {user ? 'Du er logget ind' : 'Du er ikke logget ind'}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={confirmDeleteAccount}
                  disabled={deleting}
                  style={[styles.actionBox, { width: sizes.buttonWidth, height: sizes.buttonHeight }]}
                >
                  <Text style={[styles.actionBoxText, { fontSize: sizes.buttonFont }]}>
                    {deleting ? 'SLETTER…' : 'SLET KONTO'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
      <BottomNav />
    </SafeAreaView>
  );
}

/** ====== Styles (device‑uafhængige) ====== */
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
    borderRadius: 8,
    borderWidth: 0,
    borderColor: '#E8ECF1',
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
  email: { color: '#6B7280', marginTop: 10, textAlign: 'center' },
  status: { color: '#2A2D34', opacity: 0.7, marginTop: 4, textAlign: 'center' },

  actionBox: {
    backgroundColor: '#131921',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBoxText: {
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center', // fontSize sættes dynamisk via sizes.buttonFont
  },

  textButton: { marginTop: 4 },
  textButtonTextUnderline: { textDecorationLine: 'underline', fontWeight: 'bold' },
});