// app/LoginScreen.tsx
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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

  const goHome = () => {
    // Garanter at man kommer til start
    router.replace('/');
  };

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
      <SafeAreaView style={styles.container}>
        {/* Tilbage-knap */}
        <TouchableOpacity style={styles.backIcon} onPress={goHome} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
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
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.button} onPress={onLogin} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Logger ind…' : 'LOG IND'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  backIcon: {
    position: 'absolute',
    top: 40,
    left: 16,
    zIndex: 99,
    width: 40,
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
  },
  buttonText: { color: '#171C22', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
});