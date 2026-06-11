import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { useReaderStore, ChatMessage } from '../../store/useReaderStore';
import { api } from '../../utils/api';

export function AskLexiModal() {
  const theme = useTheme();
  const { isChatVisible, setChatVisible, chatMessages, addChatMessage, currentDocumentId } = useReaderStore();
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const handleSend = async () => {
    if (!inputText.trim() || !currentDocumentId) return;

    const userMsg = inputText.trim();
    setInputText('');
    addChatMessage({ role: 'user', text: userMsg });

    setIsTyping(true);

    try {
      // Prepare history for API (map role names if necessary)
      const history = chatMessages.map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        text: m.text
      }));

      const result = await api.ai.chat(currentDocumentId, userMsg, history);
      addChatMessage({ role: 'assistant', text: result.response });
    } catch (err: any) {
      addChatMessage({ 
        role: 'assistant', 
        text: "I'm sorry, I'm having trouble connecting to my AI brain right now. Please try again in a moment." 
      });
      console.warn('AI Chat Error:', err.message);
    } finally {
      setIsTyping(false);
    }
  };

  useEffect(() => {
    if (chatMessages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [chatMessages, isChatVisible]);

  return (
    <Modal
      visible={isChatVisible}
      transparent
      animationType="slide"
      onRequestClose={() => setChatVisible(false)}
    >
      <View style={[styles.overlay, { backgroundColor: theme.overlay }]}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.container}
        >
          <View style={[styles.modal, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={[styles.aiIcon, { backgroundColor: theme.primaryLight }]}>
                  <MaterialCommunityIcons name="robot" size={20} color={theme.primary} />
                </View>
                <View>
                  <Text style={[styles.title, { color: theme.text }]}>Ask Lexi</Text>
                  <Text style={[styles.subtitle, { color: theme.textMuted }]}>AI Reading Assistant</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setChatVisible(false)} style={styles.closeBtn}>
                <Ionicons name="close" size={24} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            {/* Chat Area */}
            <ScrollView
              ref={scrollRef}
              style={styles.chatArea}
              contentContainerStyle={styles.chatContent}
              showsVerticalScrollIndicator={false}
            >
              {chatMessages.length === 0 && (
                <View style={styles.emptyState}>
                  <MaterialCommunityIcons name="chat-question-outline" size={48} color={theme.border} />
                  <Text style={[styles.emptyText, { color: theme.textMuted }]}>
                    Ask me anything about this document!{"\n"}Try "Summarize this section"
                  </Text>
                </View>
              )}
              {chatMessages.map((msg) => (
                <MessageItem key={msg.id} message={msg} theme={theme} />
              ))}
              {isTyping && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator size="small" color={theme.primary} />
                  <Text style={[styles.typingText, { color: theme.textMuted }]}>Lexi is thinking...</Text>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={[styles.inputRow, { borderTopColor: theme.border }]}>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text, borderColor: theme.border }]}
                placeholder="Type your question..."
                placeholderTextColor={theme.textMuted}
                value={inputText}
                onChangeText={setInputText}
                multiline
              />
              <TouchableOpacity
                onPress={handleSend}
                disabled={!inputText.trim() || isTyping}
                style={[
                  styles.sendBtn,
                  { backgroundColor: inputText.trim() ? theme.primary : theme.border }
                ]}
              >
                <Ionicons name="send" size={20} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function MessageItem({ message, theme }: { message: ChatMessage; theme: any }) {
  const isUser = message.role === 'user';
  return (
    <View style={[styles.msgWrapper, isUser ? styles.msgUser : styles.msgAI]}>
      {!isUser && (
        <View style={[styles.msgAvatar, { backgroundColor: theme.primaryLight }]}>
          <MaterialCommunityIcons name="robot" size={14} color={theme.primary} />
        </View>
      )}
      <View
        style={[
          styles.msgBubble,
          {
            backgroundColor: isUser ? theme.primary : theme.surfaceElevated,
            borderBottomRightRadius: isUser ? 4 : 16,
            borderBottomLeftRadius: isUser ? 16 : 4,
          },
          !isUser && { borderWidth: 1, borderColor: theme.border }
        ]}
      >
        <Text style={[styles.msgText, { color: isUser ? '#FFF' : theme.text }]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  container: { width: '100%', height: '80%' },
  modal: { flex: 1, borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderBottomWidth: 0, paddingBottom: Platform.OS === 'ios' ? 40 : 20 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.05)' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  aiIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 18, fontWeight: '800' },
  subtitle: { fontSize: 12 },
  closeBtn: { padding: 4 },
  chatArea: { flex: 1 },
  chatContent: { padding: 20, gap: 16 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100, gap: 16 },
  emptyText: { textAlign: 'center', fontSize: 14, lineHeight: 20 },
  msgWrapper: { flexDirection: 'row', gap: 8, maxWidth: '85%' },
  msgUser: { alignSelf: 'flex-end', flexDirection: 'row-reverse' },
  msgAI: { alignSelf: 'flex-start' },
  msgAvatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  msgBubble: { paddingHorizontal: 16, paddingVertical: 12, borderRadius: 16 },
  msgText: { fontSize: 15, lineHeight: 22 },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 36 },
  typingText: { fontSize: 13, fontStyle: 'italic' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 20, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, maxHeight: 100, fontSize: 15 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
