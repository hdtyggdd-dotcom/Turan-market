import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, ActivityIndicator, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';
import { useColors } from '@/hooks/useColors';
import { useAuth } from '@/context/AuthContext';
import { SubscriptionProvider, useSubscription } from '@/context/SubscriptionContext';

function Content() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, isLoading } = useAuth();
  const sub = useSubscription();
  const [selected, setSelected] = useState<PurchasesPackage | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const top = Platform.OS === 'web' ? 67 : insets.top;

  const confirm = () => {
    const pkg = selected;
    setSelected(null);
    if (!pkg) return;
    setCancelled(false);
    // Modal is closed first; SDK dialog opens afterwards.
    setTimeout(() => { void sub.purchase(pkg); }, 350);
  };

  const btn = (bg: string) => [styles.btn, { backgroundColor: bg }];
  const eligible = !!user && user.role === 'seller';

  let body: React.ReactNode;
  if (isLoading) {
    body = <ActivityIndicator color={colors.primary} accessibilityLabel="Yuklanmoqda" />;
  } else if (!user) {
    body = (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.h, { color: colors.text }]}>Avval tizimga kiring</Text>
        <Text style={[styles.p, { color: colors.mutedForeground }]}>Sinov obunasi faqat ustalar (sotuvchi akkaunti) uchun.</Text>
        <TouchableOpacity style={btn(colors.primary)} onPress={() => router.push('/auth/login')} accessibilityRole="button" accessibilityLabel="Kirish">
          <Text style={styles.btnText}>Kirish</Text>
        </TouchableOpacity>
      </View>
    );
  } else if (!eligible) {
    body = (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="lock" size={22} color={colors.mutedForeground} />
        <Text style={[styles.h, { color: colors.text }]}>Bu akkaunt mos emas</Text>
        <Text style={[styles.p, { color: colors.mutedForeground }]}>Sinov faqat sotuvchi akkaunti bilan ishlaydi. Akkaunt turi avtomatik o‘zgartirilmaydi.</Text>
      </View>
    );
  } else {
    body = (
      <>
        {sub.active && (
          <View style={[styles.card, { backgroundColor: colors.accent, borderColor: colors.primary }]} accessible accessibilityLabel="Sinov obunasi faol">
            <Feather name="check-circle" size={22} color={colors.primary} />
            <Text style={[styles.h, { color: colors.accentForeground }]}>Sinov obunasi faol</Text>
          </View>
        )}
        {sub.message && (
          <Text style={[styles.p, { color: colors.text }]} accessibilityLiveRegion="polite" testID="subscription-message">{sub.message}</Text>
        )}
        {cancelled && <Text style={[styles.p, { color: colors.mutedForeground }]}>Xarid tasdiqlanmadi, hech narsa yuborilmadi.</Text>}
        {sub.loading ? (
          <View style={{ gap: 10 }} accessibilityLabel="Paketlar yuklanmoqda">
            {[0, 1].map((i) => <View key={i} style={[styles.skel, { backgroundColor: colors.muted }]} />)}
          </View>
        ) : sub.error ? (
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.destructive }]}>
            <Text style={[styles.h, { color: colors.destructive }]}>Xatolik</Text>
            <Text style={[styles.p, { color: colors.text }]}>{sub.error}</Text>
          </View>
        ) : sub.packages.length === 0 ? (
          <Text style={[styles.p, { color: colors.mutedForeground }]}>Hozircha sinov paketlari yo‘q.</Text>
        ) : (
          !sub.active && sub.packages.map((pkg) => (
            <View key={pkg.identifier} style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.h, { color: colors.text }]}>{pkg.product.title}</Text>
              {!!pkg.product.description && <Text style={[styles.p, { color: colors.mutedForeground }]}>{pkg.product.description}</Text>}
              <Text style={[styles.price, { color: colors.primary }]}>{pkg.product.priceString}</Text>
              <TouchableOpacity
                testID="subscription-purchase"
                style={[btn(colors.primary), sub.busy && { opacity: 0.5 }]}
                disabled={sub.busy}
                onPress={() => setSelected(pkg)}
                accessibilityRole="button"
                accessibilityLabel={`${pkg.product.title} sinov obunasini sotib olish`}
              >
                {sub.busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Sinab ko‘rish</Text>}
              </TouchableOpacity>
            </View>
          ))
        )}
        <View style={styles.row}>
          <TouchableOpacity testID="subscription-refresh" style={[styles.btn2, { borderColor: colors.border, opacity: sub.busy ? 0.5 : 1 }]} disabled={sub.busy} onPress={() => { void sub.refresh(); }} accessibilityRole="button" accessibilityLabel="Holatni yangilash">
            <Feather name="refresh-cw" size={16} color={colors.primary} />
            <Text style={[styles.btn2Text, { color: colors.text }]}>Yangilash</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="subscription-restore" style={[styles.btn2, { borderColor: colors.border, opacity: sub.busy ? 0.5 : 1 }]} disabled={sub.busy} onPress={() => { void sub.restore(); }} accessibilityRole="button" accessibilityLabel="Xaridlarni tiklash">
            <Feather name="rotate-ccw" size={16} color={colors.primary} />
            <Text style={[styles.btn2Text, { color: colors.text }]}>Tiklash</Text>
          </TouchableOpacity>
        </View>
      </>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]} testID="subscription-page">
      <View style={[styles.header, { paddingTop: top + 12, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Orqaga">
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Ustalar obunasi (sinov)</Text>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 60 }}>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.statusPending }]} accessible>
          <View style={styles.row}>
            <Feather name="alert-triangle" size={18} color={colors.statusPending} />
            <Text style={[styles.h, { color: colors.text, fontSize: 15 }]}>Faqat sinov rejimi</Text>
          </View>
          <Text style={[styles.p, { color: colors.text }]}>Haqiqiy pul yechilmaydi. Ekrandagi narx faqat sinov namunasi; rejalashtirilgan 30 minglik haqiqiy tarif emas. Jonli obuna va bepul sinov muddati yoqilmagan.</Text>
          <Text style={[styles.p, { color: colors.mutedForeground }]}>Bu faqat uy xizmatlari ko‘rsatuvchi ustalar uchun. Har bir sotuvchi yoki xaridorga taalluqli emas.</Text>
        </View>
        {body}
      </ScrollView>
      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => { setSelected(null); setCancelled(true); }}>
        <View style={styles.backdrop}>
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border, width: '100%', maxWidth: 420 }]} accessibilityViewIsModal>
            <Text style={[styles.h, { color: colors.text }]}>Sinov xaridini tasdiqlaysizmi?</Text>
            <Text style={[styles.p, { color: colors.text }]}>{selected?.product.title} — {selected?.product.priceString}</Text>
            <Text style={[styles.p, { color: colors.mutedForeground }]}>Test rejimi: haqiqiy pul yechilmaydi.</Text>
            <TouchableOpacity testID="subscription-confirm" style={btn(colors.primary)} onPress={confirm} accessibilityRole="button" accessibilityLabel="Tasdiqlash">
              <Text style={styles.btnText}>Tasdiqlash</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="subscription-cancel" style={[styles.btn2, { borderColor: colors.border }]} onPress={() => { setSelected(null); setCancelled(true); }} accessibilityRole="button" accessibilityLabel="Bekor qilish">
              <Text style={[styles.btn2Text, { color: colors.text }]}>Bekor qilish</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function SubscriptionScreen() {
  const { user } = useAuth();
  return (
    <SubscriptionProvider key={user?.id ?? 'signed-out'}>
      <Content />
    </SubscriptionProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  title: { fontSize: 20, fontFamily: 'Inter_700Bold', flex: 1 },
  card: { padding: 16, borderRadius: 16, borderWidth: 1, gap: 8 },
  h: { fontSize: 17, fontFamily: 'Inter_700Bold' },
  p: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 20 },
  price: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  row: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  btn: { minHeight: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 16 },
  btnText: { color: '#fff', fontSize: 15, fontFamily: 'Inter_600SemiBold' },
  btn2: { flex: 1, minHeight: 48, borderRadius: 12, borderWidth: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
  btn2Text: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  skel: { height: 120, borderRadius: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(17,24,39,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 },
});
