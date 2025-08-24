// hooks/useNabolag.tsx
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { supabase } from '../utils/supabase';

export type Post = {
  id: string;
  created_at: string;
  overskrift: string;
  omraade: string;
  text: string;
  image_url: string;
  user_id: string;
  latitude: number | null;
  longitude: number | null;
  kategori: string | null;
};

type UserLocation = { latitude: number; longitude: number };

// --------- helpers (platform-sikkert) ----------
function isWeb() {
  return Platform.OS === 'web';
}

function safeAlert(title: string, msg: string) {
  if (isWeb()) console.warn(`${title}: ${msg}`);
  else Alert.alert(title, msg);
}

// AsyncStorage på native, localStorage på web
async function storageGet(key: string): Promise<string | null> {
  if (isWeb()) {
    try {
      if (typeof window === 'undefined') return null; // SSR-sikkert
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function storageSet(key: string, value: string): Promise<void> {
  if (isWeb()) {
    try {
      if (typeof window === 'undefined') return; // SSR-sikkert
      window.localStorage.setItem(key, value);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ------------------------------------------------

export const KATEGORIER = [
  'Alle kategorier',
  'Værktøj',
  'Arbejde tilbydes',
  'Affald',
  'Mindre ting',
  'Større ting',
  'Hjælp søges',
  'Hjælp tilbydes',
  'Byttes',
];

export function useNabolag() {
  const [allPosts, setAllPosts] = useState<Post[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [radius, setRadius] = useState(3);
  const [kategoriFilter, setKategoriFilter] = useState(KATEGORIER[0]);

  // Hent bruger-id
  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return;
      if (error) console.warn('Kunne ikke hente user:', error.message);
      setUserId(data?.user?.id ?? null);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Init radius + hent lokation (platform-sikkert)
  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      const savedRadius = await storageGet('liguster_radius');
      if (savedRadius && !cancelled) setRadius(Number(savedRadius));

      // Web: brug browser geolocation, ingen permissions dialog via expo-location
      if (isWeb()) {
        if (typeof window === 'undefined' || !('geolocation' in (navigator ?? {}))) {
          console.warn('Geolocation ikke tilgængelig på web.');
          return;
        }
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            if (cancelled) return;
            setUserLocation({
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          },
          (err) => {
            console.warn('Web geolocation fejl:', err?.message);
          },
          { enableHighAccuracy: false, maximumAge: 60_000, timeout: 10_000 }
        );
        return;
      }

      // Native (iOS/Android): brug expo-location
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          safeAlert('Placering påkrævet', 'Giv adgang til placering for at filtrere opslag efter afstand.');
          return;
        }
        const loc = await Location.getCurrentPositionAsync({});
        if (!cancelled) {
          setUserLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
        }
      } catch (e: any) {
        console.warn('location error:', e?.message ?? e);
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      safeAlert('Fejl', 'Kunne ikke hente opslag: ' + error.message);
      setAllPosts([]);
    } else {
      setAllPosts(data ?? []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      await fetchPosts();
      if (!mounted) return;
    })();
    return () => {
      mounted = false;
    };
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);

  const createPost = useCallback(
    async (postData: Partial<Post>) => {
      if (!userId) {
        safeAlert('Fejl', 'Du skal være logget ind for at oprette et opslag.');
        return false;
      }
      // Fjern evt. id før insert
      const { id: _drop, user_id: _drop2, ...insertData } = postData;
      const { error } = await supabase
        .from('posts')
        .insert([{ ...insertData, user_id: userId }]);
      if (error) {
        safeAlert('Fejl', 'Kunne ikke oprette opslag: ' + error.message);
        return false;
      }
      await fetchPosts();
      return true;
    },
    [userId, fetchPosts]
  );

  const handleRadiusChange = useCallback(async (newRadius: number) => {
    setRadius(newRadius);
    await storageSet('liguster_radius', String(newRadius));
  }, []);

  const filteredPosts = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    return allPosts.filter((post) => {
      const matchesSearch =
        !search ||
        post.overskrift?.toLowerCase().includes(search) ||
        post.omraade?.toLowerCase().includes(search) ||
        post.text?.toLowerCase().includes(search);

      const matchesKategori =
        kategoriFilter === KATEGORIER[0] || post.kategori === kategoriFilter;

      if (userLocation && post.latitude && post.longitude) {
        const dist = distanceInKm(
          userLocation.latitude,
          userLocation.longitude,
          post.latitude,
          post.longitude
        );
        return matchesSearch && matchesKategori && dist <= radius;
      }
      return matchesSearch && matchesKategori;
    });
  }, [allPosts, searchQuery, kategoriFilter, radius, userLocation]);

  return {
    // data
    userId,
    userLocation,
    loading,
    refreshing,
    filteredPosts,
    // søgning/filtre
    searchQuery,
    setSearchQuery,
    radius,
    handleRadiusChange,
    kategoriFilter,
    setKategoriFilter,
    // actions
    onRefresh,
    createPost,
    // utils
    distanceInKm,
  };
}