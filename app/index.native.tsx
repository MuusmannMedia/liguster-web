// app/index.native.tsx
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/Liguster-logo-NEG.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        {/* Call-to-action knapper */}
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/LoginScreen')}
          accessibilityRole="button"
          accessibilityLabel="Log ind"
        >
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/OpretBruger')}
          accessibilityRole="button"
          accessibilityLabel="Opret bruger"
        >
          <Text style={styles.buttonText}>OPRET BRUGER</Text>
        </TouchableOpacity>

        {/* Legal footer */}
        <View style={styles.legalBox}>
          <TouchableOpacity
            onPress={() => router.push('/privacy')}
            accessibilityRole="link"
            accessibilityLabel="Gå til Privacy Policy"
          >
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.copyright}>© {new Date().getFullYear()} Liguster</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#171C22' },
  safeArea: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  logoContainer: { alignItems: 'center', marginBottom: 40 },
  logoImage: { width: 180, height: 180, marginBottom: 30 },

  button: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 220,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  buttonText: { color: '#171C22', fontSize: 14, fontWeight: '700', letterSpacing: 1 },

  legalBox: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    opacity: 0.9,
  },
  legalLink: { color: '#C9D2DC', textDecorationLine: 'underline', fontSize: 13, fontWeight: '600' },
  dot: { color: '#6C7682', fontSize: 12, marginHorizontal: 4 },
  copyright: { color: '#6C7682', fontSize: 12 },
});