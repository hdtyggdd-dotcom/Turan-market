import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';

export function statusColor(c: ReturnType<typeof useColors>, s: string) {
  if (s === 'approved') return c.statusDelivered;
  if (s === 'rejected') return c.destructive;
  return c.statusPending;
}
export const STATUS_LABEL: Record<string, string> = {
  none: 'Yuborilmagan',
  pending: 'Kutilmoqda',
  approved: 'Tasdiqlangan',
  rejected: 'Rad etilgan',
};
export const KIND_LABEL: Record<string, string> = {
  identity: 'Shaxsni tasdiqlovchi hujjat',
  license: 'Haydovchilik guvohnomasi',
  registration: 'Transport ro\'yxatdan o\'tish guvohnomasi',
};
export const KINDS = ['identity', 'license', 'registration'] as const;

export function StatusPill({ status }: { status: string }) {
  const c = useColors();
  const col = statusColor(c, status);
  return (
    <View style={[s.pill, { backgroundColor: col + '22' }]}>
      <Text style={[s.pillText, { color: col }]}>{STATUS_LABEL[status] ?? status}</Text>
    </View>
  );
}

export function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const c = useColors();
  return (
    <View style={[s.box, { borderColor: c.destructive, backgroundColor: c.card }]}>
      <Feather name="alert-circle" size={18} color={c.destructive} />
      <Text style={{ flex: 1, color: c.text, fontFamily: 'Inter_500Medium', fontSize: 13 }}>{message}</Text>
      {onRetry && (
        <TouchableOpacity onPress={onRetry}>
          <Text style={{ color: c.primary, fontFamily: 'Inter_700Bold', fontSize: 13 }}>Qayta urinish</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export function errMessage(e: unknown): string {
  const x = e as { data?: { message?: string; error?: string }; message?: string };
  return x?.data?.message ?? x?.data?.error ?? x?.message ?? 'Xatolik yuz berdi';
}
export function errStatus(e: unknown): number | undefined {
  return (e as { status?: number })?.status;
}

export function Btn({ label, onPress, disabled, tone = 'primary', icon }: {
  label: string; onPress: () => void; disabled?: boolean; tone?: 'primary' | 'ghost' | 'danger'; icon?: keyof typeof Feather.glyphMap;
}) {
  const c = useColors();
  const bg = tone === 'primary' ? c.primary : tone === 'danger' ? c.destructive : 'transparent';
  const fg = tone === 'ghost' ? c.primary : c.primaryForeground;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[s.btn, { backgroundColor: bg, borderColor: tone === 'ghost' ? c.primary : bg, opacity: disabled ? 0.5 : 1 }]}
    >
      {icon && <Feather name={icon} size={16} color={fg} />}
      <Text style={{ color: fg, fontFamily: 'Inter_600SemiBold', fontSize: 14 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, fontFamily: 'Inter_600SemiBold' },
  box: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderWidth: 1, borderRadius: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
});
