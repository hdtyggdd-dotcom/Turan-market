import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { getBaseUrl } from '@workspace/api-client-react';
import { ListingPhoto } from './ListingPhoto';

interface ImageUploaderProps {
  images: string[];          // server URL list
  onChange: (urls: string[]) => void;
  max?: number;
  label?: string;
}

async function uploadImage(base64: string, mimeType: string, token: string | null): Promise<string> {
  const baseUrl = getBaseUrl();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);
  let res: Response;
  try {
    res = await fetch(`${baseUrl}/api/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ data: base64, mimeType }),
    signal: controller.signal,
    });
  } catch (error) {
    if (controller.signal.aborted) throw new Error('Rasm yuklash vaqti tugadi. Internetni tekshirib qayta urinib ko‘ring.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error ?? 'Yuklash xato');
  }
  const json = await res.json() as { url: string };
  if (typeof json.url !== 'string' || !/^\/api\/images\/img_[A-Za-z0-9_-]+$/.test(json.url)) {
    throw new Error('Server rasm manzilini qaytarmadi.');
  }
  // Save a portable image path, not the temporary Expo/Replit preview host.
  return json.url;
}

export function ImageUploader({ images, onChange, max = 5, label = "Rasmlar" }: ImageUploaderProps) {
  const colors = useColors();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // Get token from AsyncStorage
  async function getToken(): Promise<string | null> {
    try {
      const AsyncStorage = (await import('@react-native-async-storage/async-storage')).default;
      return await AsyncStorage.getItem('osavdo_token');
    } catch {
      return null;
    }
  }

  async function pickImage(source: 'camera' | 'library') {
    if (uploading) return;
    setError('');
    if (images.length >= max) {
      setError(`Maksimal ${max} ta rasm yuklash mumkin`);
      return;
    }

    try {
      let result: ImagePicker.ImagePickerResult;

      if (source === 'camera') {
        const perm = await ImagePicker.requestCameraPermissionsAsync();
        if (!perm.granted) {
          setError('Kameraga ruxsat berilmadi. Sozlamalarda ruxsat bering yoki galereyadan tanlang.');
          return;
        }
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          quality: 0.6,
          base64: false,
          allowsEditing: true,
          aspect: [4, 3],
        });
      } else {
        // The system photo picker grants access only to the chosen image.
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          quality: 0.6,
          base64: false,
          allowsEditing: true,
          aspect: [4, 3],
        });
      }

      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setUploading(true);
      // Web pickers may ignore quality; resize/re-encode before the 2 MB API limit.
      const dimension = asset.width >= asset.height ? 'width' : 'height';
      const longestSide = Math.max(asset.width, asset.height);
      let prepared = await manipulateAsync(asset.uri, longestSide > 1600 || longestSide <= 0 ? [{ resize: { [dimension]: 1600 } }] : [], {
        base64: true, compress: 0.7, format: SaveFormat.JPEG,
      });
      if (prepared.base64 && prepared.base64.length * 3 / 4 > 2 * 1024 * 1024) {
        prepared = await manipulateAsync(prepared.uri, [{ resize: { [dimension]: 1000 } }], {
          base64: true, compress: 0.5, format: SaveFormat.JPEG,
        });
      }
      if (!prepared.base64) throw new Error('Rasmni o‘qib bo‘lmadi. Boshqa rasm tanlang.');
      if (prepared.base64.length * 3 / 4 > 2 * 1024 * 1024) throw new Error('Rasm juda katta. Kichikroq rasm tanlang.');
      const token = await getToken();
      if (!token) throw new Error('Rasm yuklash uchun akkauntingizga kiring.');
      const url = await uploadImage(prepared.base64, 'image/jpeg', token);
      onChange([...images, url]);
    } catch (e) {
      setError((e as Error).message || 'Rasm yuklanmadi. Internetni tekshirib qayta urinib ko‘ring.');
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
            <ListingPhoto source={url} style={styles.thumbImg} />
            <TouchableOpacity
              style={styles.removeBtn}
              disabled={uploading}
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
      {error !== '' && <Text accessibilityRole="alert" style={{ color: colors.destructive, fontSize: 13 }}>{error}</Text>}

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
