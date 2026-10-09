import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Linking, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { contactTelephone } from '@/services/manual-payment';

export function ManualPaymentNotice({ contact, compact = false }: {
  contact?: { name: string; phone?: string | null } | null;
  compact?: boolean;
}) {
  const colors = useColors();
  const [callError, setCallError] = useState(false);
  const telephone = contactTelephone(contact?.phone);
  return (
    <View style={[styles.box, { backgroundColor: colors.card, borderColor: colors.border }]} testID="manual-payment-notice">
      <Text style={[styles.title, { color: colors.text }]}>To‘lov — o‘zaro kelishuv asosida</Text>
      <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Xaridor pulni sotuvchiga o‘z bank ilovasi orqali o‘tkazadi. Cosmos Market pul yechmaydi va o‘tkazmani avtomatik tasdiqlamaydi.
      </Text>
      {!compact && <Text style={[styles.text, { color: colors.mutedForeground }]}>
        Buyurtma tasdiqlanishi pul to‘langanini anglatmaydi. Pul yuborishdan oldin bank ilovasida oluvchining ismi va summani tekshiring. Sotuvchi pul tushganini o‘z bank hisobidan tekshirsin; faqat chek rasmiga ishonmang. SMS kod, PIN va CVVni hech kimga bermang.
      </Text>}
      {contact && <Text style={[styles.text, { color: colors.text }]}>Kelishuv uchun: {contact.name}</Text>}
      {telephone && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Bog‘lanish: ${contact?.name}`}
          style={[styles.call, { borderColor: colors.primary }]}
          onPress={(event) => {
            event.stopPropagation();
            setCallError(false);
            void Linking.openURL(telephone).catch(() => setCallError(true));
          }}
        >
          <Feather name="phone" size={16} color={colors.primary} />
          <Text style={{ color: colors.primary }}>Qo‘ng‘iroq qilish · {contact?.phone}</Text>
        </TouchableOpacity>
      )}
      {contact && !telephone && <Text style={[styles.text, { color: colors.mutedForeground }]}>Bog‘lanish telefoni mavjud emas.</Text>}
      {callError && <Text accessibilityRole="alert" style={[styles.text, { color: colors.destructive }]}>
        Qo‘ng‘iroq ochilmadi. Ko‘rsatilgan raqamni telefoningizda tering.
      </Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderWidth: 1, borderRadius: 12, padding: 12, gap: 8, marginVertical: 8 },
  title: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  text: { fontSize: 13, lineHeight: 19 },
  call: { minHeight: 44, borderWidth: 1, borderRadius: 8, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
});
