// hooks/useNabolag.tsx

import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';
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

type UserLocation = {
  latitude: number;
  longitude: number;
};

function distanceInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (val: number) => (val * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export const KATEGORIER = [
  'Alle kategorier', 'Værktøj', 'Arbejde tilbydes', 'Affald', 'Mindre ting', 
  'Større ting', 'Hjælp søges', 'Hjælp tilbydes', 'Byttes',
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

  useEffect(() => {
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id || null);
    };
    getUser();
  }, []);

  useEffect(() => {
    const initializeLocationAndRadius = async () => {
      try {
        const savedRadius = await AsyncStorage.getItem('liguster_radius');
        if (savedRadius) setRadius(Number(savedRadius));
      } catch (e) {
        console.error("Kunne ikke hente radius fra storage", e);
      }
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Placering påkrævet', 'Du skal give adgang til din placering for at kunne filtrere opslag baseret på afstand.');
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
    };
    initializeLocationAndRadius();
  }, []);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      Alert.alert('Fejl', 'Kunne ikke hente opslag: ' + error.message);
      setAllPosts([]);
    } else {
      setAllPosts(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  }, [fetchPosts]);
  
  const createPost = async (postData) => {
    if (!userId) {
      Alert.alert('Fejl', 'Du skal være logget ind for at oprette et opslag.');
      return false;
    }
    // --- RETTELSE HER ---
    // Vi fjerner 'id' fra objektet, før vi sender det til databasen.
    const { id, ...insertData } = postData; 
    const { error } = await supabase.from('posts').insert([{ ...insertData, user_id: userId }]);
    if (error) {
      Alert.alert('Fejl', 'Kunne ikke oprette opslag: ' + error.message);
      return false;
    }
    await fetchPosts();
    return true;
  };

  const handleRadiusChange = async (newRadius: number) => {
    setRadius(newRadius);
    await AsyncStorage.setItem('liguster_radius', String(newRadius));
  };

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      const search = searchQuery.toLowerCase();
      const matchesSearch =
        post.overskrift?.toLowerCase().includes(search) ||
        post.omraade?.toLowerCase().includes(search) ||
        post.text?.toLowerCase().includes(search);
      const matchesKategori =
        kategoriFilter === KATEGORIER[0] || post.kategori === kategoriFilter;
      if (userLocation && post.latitude && post.longitude) {
        const dist = distanceInKm(
          userLocation.latitude, userLocation.longitude,
          post.latitude, post.longitude
        );
        return matchesSearch && matchesKategori && dist <= radius;
      }
      return matchesSearch && matchesKategori;
    });
  }, [allPosts, searchQuery, kategoriFilter, radius, userLocation]);

  return {
    userId, userLocation, loading, refreshing, filteredPosts,
    searchQuery, setSearchQuery, radius, handleRadiusChange,
    kategoriFilter, setKategoriFilter, onRefresh, createPost, distanceInKm,
  };
}
