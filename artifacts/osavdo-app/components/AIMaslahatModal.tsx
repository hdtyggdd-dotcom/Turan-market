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
import { APP_GUIDE, APP_GUIDE_QUICK_QUESTIONS, getAppGuideReply } from '@/constants/app-guide';
import { useI18n } from '@/context/I18nContext';
import { LocalizedText } from '@/components/LocalizedPrimitives';

interface Message {
  role: 'user' | 'assistant';
  text: string;
  kind?: 'guide';
}

interface AIMaslahatModalProps {
  visible: boolean;
  onClose: () => void;
}

const QUICK_QUESTIONS = [
  ...APP_GUIDE_QUICK_QUESTIONS,
  "Sigir narxim to'g'rimi?",
  "E'lonimni yaxshilang",
  "Tez sotish uchun nima qilish kerak?",
  "Qaysi kategoriyani tanlashim kerak?",
];

export function AIMaslahatModal({ visible, onClose }: AIMaslahatModalProps) {
  const colors = useColors();
  const { lang, ui } = useI18n();
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

  const sendMessage = useCallback(async (text: string, quick = false) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const visibleText = quick ? ui(trimmed) : trimmed;

    setInput('');
    // Public product information is a labelled guide, not a paid AI fallback.
    const guideReply = getAppGuideReply(trimmed);
    if (guideReply !== null) {
      setMessages(prev => [...prev, { role: 'user', text: visibleText },
        { role: 'assistant', kind: 'guide', text: guideReply }]);
      return;
    }
    setMessages((prev) => [...prev, { role: 'user', text: visibleText }]);
    setLoading(true);

    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const data = await requestAiAdvice({ message: trimmed, language: lang });
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
  }, [loading, lang, ui]);

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

          <TouchableOpacity
            style={[styles.guideShortcut, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
            onPress={() => scrollRef.current?.scrollTo({ y: 0, animated: true })}
            accessibilityRole="button"
            accessibilityLabel="Ilovaning barcha imkoniyatlari qo‘llanmasini ochish"
            testID="open-app-guide"
          >
            <Feather name="book-open" size={16} color={colors.primary} />
            <Text style={[styles.guideShortcutText, { color: colors.primary }]}>
              Ilova qo‘llanmasi: barcha imkoniyatlar
            </Text>
          </TouchableOpacity>

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
                <LocalizedText localize={msg.role !== 'user'} style={[
                  styles.bubbleText,
                  { color: msg.role === 'user' ? colors.primaryForeground : colors.text },
                ]}>
                  {msg.text}
                </LocalizedText>
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
                  onPress={() => sendMessage(q, true)}
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
  guideShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  guideShortcutText: { fontSize: 12, fontFamily: 'Inter_500Medium' },
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
