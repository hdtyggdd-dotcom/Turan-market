import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export type CargoPurchase = { orderId: string; title: string; quantity: number; unit?: string | null };
export function PurchaseCargoSuggestion({ purchases, onClose, inline = false }: {
  purchases: CargoPurchase[]; onClose: () => void; inline?: boolean;
}) {
  const colors = useColors();
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);
  useEffect(() => { setSelected(purchases[0]?.orderId ?? null); }, [purchases]);
  const content = (
      <View style={styles.overlay}>
        <View style={[styles.card, { backgroundColor: colors.card }]}>
          <Feather name="truck" size={32} color={colors.primary} />
          <Text style={[styles.title, { color: colors.text }]}>Yuk tashish kerakmi?</Text>
          <Text style={{ color: colors.mutedForeground }}>
            Buyurtma sotuvchiga yuborildi. Cargo orqali yuk tashishni tayyorlashingiz mumkin.
            {'\n'}Narx haydovchi bilan alohida kelishiladi. Siz tasdiqlamaguncha yuk yaratilmaydi.
          </Text>
          <ScrollView style={{ maxHeight: 180 }}>
            {purchases.map(purchase => (
              <TouchableOpacity key={purchase.orderId} onPress={() => setSelected(purchase.orderId)}
                style={[styles.choice, { borderColor: selected === purchase.orderId ? colors.primary : colors.border }]}>
                <Text style={{ color: colors.text, flex: 1 }}>{purchase.title} — {purchase.quantity} {purchase.unit || 'birlik'}</Text>
                <Feather name={selected === purchase.orderId ? 'check-circle' : 'circle'} size={20} color={colors.primary} />
              </TouchableOpacity>
            ))}
          </ScrollView>
          {purchases.length > 1 && <Text style={{ color: colors.mutedForeground }}>Yuk tayyorlash uchun xaridni tanlang. Turli sotuvchilarning yuklari avtomatik birlashtirilmaydi.</Text>}
          <TouchableOpacity testID="purchase-cargo" disabled={!selected} style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => {
              if (!selected) return;
              onClose();
              router.push({ pathname: '/cargo/create', params: { orderId: selected } });
            }}>
            <Text style={{ color: colors.primaryForeground, fontFamily: 'Inter_600SemiBold' }}>Cargo tayyorlash</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={() => { onClose(); router.push('/(tabs)/orders'); }}>
            <Text style={{ color: colors.primary }}>Buyurtmalarim</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="dismiss-cargo" style={styles.button} onPress={onClose}>
            <Text style={{ color: colors.mutedForeground }}>Keyinroq</Text>
          </TouchableOpacity>
        </View>
      </View>
  );
  return inline ? content : <Modal visible={purchases.length > 0} transparent animationType="fade" onRequestClose={onClose}>{content}</Modal>;
}
const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: '#0008', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: { width: '100%', maxWidth: 440, borderRadius: 20, padding: 20, gap: 14 },
  title: { fontFamily: 'Inter_700Bold', fontSize: 21 },
  choice: { borderWidth: 1, borderRadius: 12, padding: 12, marginBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  button: { padding: 12, borderRadius: 12, alignItems: 'center' },
});
