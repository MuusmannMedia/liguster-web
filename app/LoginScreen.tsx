// app/LoginScreen.tsx
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { supabase } from '../utils/supabase';

// Skjul header hvis du bruger Stack
export const options = { headerShown: false };

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // så vi kan hoppe fra email -> password med "next"
  const passwordRef = useRef<TextInput>(null);

  const goHome = () => router.replace('/');

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Fejl', 'Udfyld både email og password.');
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);

    if (error) {
      Alert.alert('Login fejlede', error.message);
      return;
    }
    router.replace('/Nabolag');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#171C22' }}>
      {/* KeyboardAvoidingView skubber indholdet væk fra tastaturet */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.select({ ios: 'padding', android: 'height' })}
        keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })} // justér hvis du har en fast topbar
      >
        {/* Tryk udenfor inputs lukker tastaturet */}
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <SafeAreaView style={{ flex: 1 }}>
            {/* Scroll så små skærme også kan nå knappen */}
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
            >
              {/* Tilbage-knap */}
              <TouchableOpacity
                style={styles.backIcon}
                onPress={goHome}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={{ fontSize: 30, color: '#fff' }}>{'‹'}</Text>
              </TouchableOpacity>

              <Text style={styles.title}>Log ind</Text>

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                blurOnSubmit={false}
              />

              <TextInput
                ref={passwordRef}
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                returnKeyType="go"
                onSubmitEditing={onLogin}
              />

              <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
                <Text style={styles.buttonText}>{loading ? 'Logger ind…' : 'LOG IND'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center', // centrer når tastatur er lukket
    paddingHorizontal: 20,
    paddingBottom: 24, // lidt luft når tastatur er åbent
  },
  backIcon: {
    position: 'absolute',
    top: 20,
    left: 16,
    zIndex: 99,
    width: 30,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '700', marginBottom: 16, marginTop: 8 },
  input: {
    backgroundColor: '#fff',
    width: 260,
    height: 48,
    borderRadius: 10,
    paddingHorizontal: 14,
    marginBottom: 18,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 200,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    elevation: 1,
  },
  buttonText: { color: '#171C22', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});