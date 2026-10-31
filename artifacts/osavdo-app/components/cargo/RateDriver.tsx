import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import {
  useRateCargoDriver,
  getGetCargoLoadQueryKey,
  getGetCargoLoadsQueryKey,
  getGetDriversQueryKey,
  getGetDriverQueryKey,
  useGetDriver,
} from '@workspace/api-client-react';
import { useColors } from '@/hooks/useColors';
import { Btn, ErrorBox, errMessage } from '@/components/driver/ui';

export function RateDriver({ loadId, driverId }: { loadId: string; driverId?: string }) {
  const c = useColors();
  const qc = useQueryClient();
  const [score, setScore] = useState(0);
  const [comment, setComment] = useState('');
  const [done, setDone] = useState(false);
  const rate = useRateCargoDriver();
  const driver = useGetDriver(driverId ?? '', { query: {
    queryKey: getGetDriverQueryKey(driverId ?? ''), enabled: !!driverId, refetchOnMount: 'always',
  } });
  const existingRating = driver.data?.ratingHistory?.find(item => item.loadId === loadId);

  function submit() {
    rate.mutate(
      { id: loadId, data: { score, ...(comment.trim() ? { comment: comment.trim() } : {}) } },
      {
        onSuccess: () => {
          setDone(true);
          qc.invalidateQueries({ queryKey: getGetCargoLoadQueryKey(loadId) });
          qc.invalidateQueries({ queryKey: getGetCargoLoadsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetDriversQueryKey() });
          if (driverId) qc.invalidateQueries({ queryKey: getGetDriverQueryKey(driverId) });
        },
      },
    );
  }

  return (
    <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
      <Text style={[s.title, { color: c.text }]}>Haydovchini baholang</Text>
      {done || existingRating ? (
        <Text style={{ color: c.statusDelivered, fontFamily: 'Inter_600SemiBold' }}>
          {existingRating ? `Qatnov bahosi: ${existingRating.score}/5. ${existingRating.comment ?? ''}` : 'Bahoyingiz qabul qilindi. Rahmat.'}
        </Text>
      ) : (
        <>
          <View style={{ flexDirection: 'row', gap: 6 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity key={n} onPress={() => setScore(n)} hitSlop={6}>
                <Feather name="star" size={30} color={n <= score ? c.statusPending : c.input} />
              </TouchableOpacity>
            ))}
          </View>
          <TextInput
            value={comment}
            onChangeText={setComment}
            maxLength={500}
            multiline
            placeholder="Izoh (ixtiyoriy)"
            placeholderTextColor={c.mutedForeground}
            style={[s.input, { borderColor: c.input, color: c.text }]}
          />
          {rate.isError && <ErrorBox message={errMessage(rate.error)} onRetry={score ? submit : undefined} />}
          <Btn label={rate.isPending ? 'Yuborilmoqda...' : 'Baho yuborish'} onPress={submit} disabled={!score || rate.isPending || driver.isLoading} />
        </>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 12 },
  title: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  input: { borderWidth: 1, borderRadius: 12, padding: 12, minHeight: 64, fontFamily: 'Inter_400Regular', textAlignVertical: 'top' },
});
