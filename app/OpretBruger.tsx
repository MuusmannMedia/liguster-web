import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';

// <--- DENNE LINJE FJERNER HEADEREN
export const options = { headerShown: false };

export default function OpretBruger() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleSignup = async () => {
    if (!email || !password) {
      Alert.alert('Fejl', 'Udfyld både email og password');
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Fejl', error.message);
    } else {
      // Prøv at oprette bruger i users-tabellen (ikke kritisk hvis det fejler)
      try {
        const userId = data?.user?.id || data?.session?.user?.id;
        const userEmail = data?.user?.email || data?.session?.user?.email;
        if (userId && userEmail) {
          // Tjek om brugeren allerede findes
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', userId)
            .single();
          if (!existingUser) {
            await supabase.from('users').insert([
              { id: userId, email: userEmail }
            ]);
          }
        }
      } catch (err) {
        // Ikke kritisk – vis bare succes
      }
      Alert.alert('Succes', 'Din bruger er oprettet! Tjek din email for at bekræfte.');
      router.replace('/LoginScreen');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#171C22' }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Tilbage-ikon øverst til venstre - nu til START */}
            <TouchableOpacity style={styles.backIcon} onPress={() => router.replace('/')}>
              <Text style={{ fontSize: 30, color: '#fff' }}>{'‹'}</Text>
            </TouchableOpacity>

            <Text style={styles.title}>Opret bruger</Text>
            <Text style={styles.gdpr}>
              Vi gemmer kun din email for at kunne vise din profil. Vi deler den aldrig med andre.
            </Text>
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
            <TouchableOpacity style={styles.button} onPress={handleSignup}>
              <Text style={styles.buttonText}>OPRET BRUGER</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#171C22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    position: 'absolute',
    top: 36,
    left: 16,
    zIndex: 99,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  gdpr: {
    color: '#fff',
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 10,
    marginHorizontal: 20,
    textAlign: 'center',
    lineHeight: 18,
  },
  title: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    marginTop: 56,
    marginBottom: 14,
    letterSpacing: 1.5,
  },
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
  buttonText: {
    color: '#171C22',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
