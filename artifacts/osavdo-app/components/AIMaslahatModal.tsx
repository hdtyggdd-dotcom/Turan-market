import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { requestAiAdvice, ApiError } from '@workspace/api-client-react';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  kind?: 'guide';
}

interface AIMaslahatModalProps {
  visible: boolean;
  onClose: () => void;
}

const APP_GUIDE_QUESTION = "Ilova nimalar qila oladi?";
const APP_GUIDE = `Turan Market ilovasiga xush kelibsiz!

• Mahsulot va xizmat e’lonlarini qidirish, kategoriya bo‘yicha ko‘rish mumkin.
• “Izlash” → “Rasm orqali qidirish”da mahsulotni suratga oling yoki galereyadan tanlang. AI katalogdagi mos e’lonlarni izlaydi. Mos faol tovar topilmasa, shu kategoriyadagi sotuvchilarga mahsulotga talab haqida xabar beriladi; mijozning rasmi ularga yuborilmaydi.
• Sotuvchi mahsulot e’lonini rasm, narx va tavsif bilan joylaydi, keyin o‘z e’lonlarini boshqaradi.
• Xaridor mahsulotni savatchaga qo‘shib, buyurtma beradi va buyurtmalarini kuzatadi.
• Yuk egasi yuk tashish buyurtmasini joylaydi va haydovchilarning takliflarini ko‘radi.
• Tasdiqlangan haydovchi yuk tashishga taklif beradi. Safar holati va ruxsat berilgan GPS joylashuvi kuzatiladi.
• AI narx, e’lon matni, sotish usullari va ilovadan foydalanish haqida maslahat beradi.

Boshlash uchun kerakli kategoriya yoki mahsulotni tanlang. Sotish uchun “E’lon joylash” tugmasidan, buyurtma berish uchun savatdan foydalaning.

Muhim: onlayn karta to‘lovi va avtomatik komissiya undirish hozir yoqilmagan. AI hisobingiz nomidan e’lon yoki buyurtma yaratmaydi; amallarni o‘zingiz tasdiqlaysiz.`;

const QUICK_QUESTIONS = [
  APP_GUIDE_QUESTION,
  "Sigir narxim to'g'rimi?",
  "E'lonimni yaxshilang",
  "Tez sotish uchun nima qilish kerak?",
  "Qaysi kategoriyani tanlashim kerak?",
];

export function AIMaslahatModal({ visible, onClose }: AIMaslahatModalProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);

  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      kind: 'guide',
      text: APP_GUIDE,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = useCallback(async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    setInput('');
    // Public product information is a labelled guide, not a paid AI fallback.
    if (trimmed === APP_GUIDE_QUESTION) {
      setMessages(prev => [...prev, { role: 'user', text: trimmed },
        { role: 'assistant', kind: 'guide', text: APP_GUIDE }]);
      return;
    }
    setMessages((prev) => [...prev, { role: 'user', text: trimmed }]);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const data = await requestAiAdvice({ message: trimmed });
      const reply = data.reply;
      setMessages((prev) => [...prev, { role: 'assistant', text: reply }]);
    } catch (error) {
      const detail = error instanceof ApiError ? error.data as { message?: string } | null : null;
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: (error instanceof ApiError && error.status === 401
          ? "AI maslahat olish uchun akkauntingizga kiring."
          : detail?.message ?? "Tarmoq yoki AI xatoligi. Birozdan keyin qayta urinib ko‘ring.") },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 150);
    }
  }, [loading]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.container, { backgroundColor: colors.background }]}>

          {/* Header */}
          <View style={[styles.header, {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            paddingTop: Platform.OS === 'ios' ? 16 : insets.top + 8,
          }]}>
            <View style={styles.headerLeft}>
              <View style={[styles.avatarCircle, { backgroundColor: colors.primary + '20' }]}>
                <Text style={styles.avatarEmoji}>🤖</Text>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: colors.text }]}>AI Maslahatchi</Text>
                <Text style={[styles.headerSub, { color: '#22c55e' }]}>● Faol</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={22} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>

          {/* Messages */}
          <ScrollView
            ref={scrollRef}
            style={{ flex: 1 }}
            contentContainerStyle={[styles.msgList, { paddingBottom: 12 }]}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => {
              if (messages.length > 1) scrollRef.current?.scrollToEnd({ animated: false });
            }}
          >
            {messages.map((msg, i) => (
              <View
                key={i}
                style={[
                  styles.bubble,
                  msg.role === 'user'
                    ? [styles.userBubble, { backgroundColor: colors.primary }]
                    : [styles.aiBubble, { backgroundColor: colors.card, borderColor: colors.border }],
                ]}
              >
                {msg.role === 'assistant' && (
                  <Text style={styles.aiLabel}>{msg.kind === 'guide' ? 'Ilova qo‘llanmasi' : '🤖 AI'}</Text>
                )}
                <Text style={[
                  styles.bubbleText,
                  { color: msg.role === 'user' ? colors.primaryForeground : colors.text },
                ]}>
                  {msg.text}
                </Text>
              </View>
            ))}

            {loading && (
              <View style={[styles.bubble, styles.aiBubble, {
                backgroundColor: colors.card,
                borderColor: colors.border,
              }]}>
                <Text style={styles.aiLabel}>🤖 AI</Text>
                <View style={styles.typingRow}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={[styles.typingText, { color: colors.mutedForeground }]}>
                    Javob tayyorlanmoqda...
                  </Text>
                </View>
              </View>
            )}
          </ScrollView>

          {/* Quick questions */}
          {messages.length <= 1 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.quickRow}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
            >
              {QUICK_QUESTIONS.map((q) => (
                <TouchableOpacity
                  key={q}
                  style={[styles.quickChip, { backgroundColor: colors.secondary, borderColor: colors.border }]}
                  onPress={() => sendMessage(q)}
                >
                  <Text style={[styles.quickText, { color: colors.text }]}>{q}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Input */}
          <View style={[styles.inputRow, {
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingBottom: insets.bottom + 8,
          }]}>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.secondary,
                color: colors.text,
                borderColor: colors.border,
              }]}
              placeholder="Savolingizni yozing..."
              placeholderTextColor={colors.mutedForeground}
                value={input}
                maxLength={4000}
              onChangeText={setInput}
              multiline
              returnKeyType="send"
              onSubmitEditing={() => sendMessage(input)}
            />
            <TouchableOpacity
              style={[styles.sendBtn, {
                backgroundColor: input.trim() && !loading ? colors.primary : colors.secondary,
              }]}
              onPress={() => sendMessage(input)}
              disabled={!input.trim() || loading}
            >
              <Feather
                name="send"
                size={18}
                color={input.trim() && !loading ? colors.primaryForeground : colors.mutedForeground}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 20 },
  headerTitle: { fontSize: 16, fontFamily: 'Inter_700Bold' },
  headerSub: { fontSize: 11, fontFamily: 'Inter_500Medium', marginTop: 1 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  msgList: { padding: 16, gap: 10 },
  bubble: {
    maxWidth: '85%',
    borderRadius: 16,
    padding: 12,
    gap: 4,
  },
  userBubble: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderBottomLeftRadius: 4,
  },
  aiLabel: { fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#6b7280', marginBottom: 2 },
  bubbleText: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 21 },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typingText: { fontSize: 13, fontFamily: 'Inter_400Regular' },
  quickRow: { paddingVertical: 10, maxHeight: 52 },
  quickChip: {
    borderRadius: 100,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  quickText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
