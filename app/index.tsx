import { useRouter } from 'expo-router';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.root}>
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/Liguster-logo-NEG.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/LoginScreen')}
        >
          <Text style={styles.buttonText}>LOGIN</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push('/OpretBruger')}
        >
          <Text style={styles.buttonText}>OPRET BRUGER</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#171C22', // Sikrer farven over hele skærmen!
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoImage: {
    width: 180,
    height: 180,
    marginBottom: 30,
  },
  title: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 2,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: 200,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  buttonText: {
    color: '#171C22',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
