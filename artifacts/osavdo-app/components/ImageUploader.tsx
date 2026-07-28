import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getBaseUrl } from '@workspace/api-client-react';

interface ImageUploaderProps {
  images: string[];          // server URL list
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

async function uploadImage(base64: string, mimeType: string, token: string | null): Promise<string> {
  const baseUrl = getBaseUrl();
  const res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ data: base64, mimeType }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Yuklash xato');
  }
  const json = await res.json() as { url: string };
  // Convert relative URL to full URL
  return `${baseUrl}${json.url}`;
}

export function ImageUploader({ images, onChange, max = 5, label = "Rasmlar" }: ImageUploaderProps) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);

  // Get token from AsyncStorage
  async function getToken(): Promise<string | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return await AsyncStorage.getItem('auth_token');
    } catch {
      return null;
    }
  }

  async function pickImage(source: 'camera' | 'library') {
    if (images.length >= max) {
      Alert.alert('', `Maksimal ${max} ta rasm yuklash mumkin`);
      return;
    }

    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Ruxsat kerak', 'Kamera ruxsatini bering');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          quality: 0.6,
          base64: true,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Ruxsat kerak', 'Galereya ruxsatini bering');
          return;
        }
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          quality: 0.6,
          base64: true,
          allowsEditing: true,
          aspect: [4, 3],
        });
      }

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      if (!asset.base64) {
        Alert.alert('Xato', 'Rasm o\'qilmadi');
        return;
      }

      setUploading(true);
      const token = await getToken();
      const mime = asset.mimeType ?? 'image/jpeg';
      const url = await uploadImage(asset.base64, mime, token);
      onChange([...images, url]);
    } catch (e) {
      Alert.alert('Xato', (e as Error).message ?? 'Rasm yuklanmadi');
    } finally {
      setUploading(false);
    }
  }

  function removeImage(idx: number) {
    onChange(images.filter((_, i) => i !== idx));
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        {label} ({images.length}/{max})
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {/* Existing images */}
        {images.map((url, idx) => (
          <View key={url + idx} style={[styles.thumb, { borderColor: colors.border }]}>
            <Image source={{ uri: url }} style={styles.thumbImg} />
            <TouchableOpacity
              style={styles.removeBtn}
              onPress={() => removeImage(idx)}
            >
              <Feather name="x" size={12} color="#fff" />
            </TouchableOpacity>
          </View>
        ))}

        {/* Add button */}
        {images.length < max && !uploading && (
          <View style={styles.addButtons}>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => pickImage('camera')}
            >
              <Feather name="camera" size={22} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Rasmga ol</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => pickImage('library')}
            >
              <Feather name="image" size={22} color={colors.mutedForeground} />
              <Text style={[styles.addBtnText, { color: colors.mutedForeground }]}>Galereya</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Upload spinner */}
        {uploading && (
          <View style={[styles.addBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <ActivityIndicator color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.mutedForeground }]}>Yuklanmoqda...</Text>
          </View>
        )}
      </ScrollView>

      {images.length === 0 && (
        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          📸 Rasm qo'shsangiz e'lon ko'proq ko'riladi
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  row: { flexDirection: 'row', gap: 10, paddingVertical: 4 },
  thumb: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  thumbImg: { width: '100%', height: '100%', resizeMode: 'cover' },
  removeBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#00000088',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtons: { flexDirection: 'row', gap: 8 },
  addBtn: {
    width: 90,
    height: 90,
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addBtnText: { fontSize: 10, fontFamily: 'Inter_500Medium', textAlign: 'center' },
  hint: { fontSize: 12, fontFamily: 'Inter_400Regular' },
});
