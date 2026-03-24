import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions, Keyboard,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useChatStore } from '../../src/stores/chatStore';
import type { Message, Character } from '@ai-companions/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Typing indicator component
const TypingIndicator = () => {
  return (
    <View style={styles.typingContainer}>
      <View style={styles.typingBubble}>
        <View style={styles.typingDots}>
          <View style={[styles.dot, { opacity: 0.4 }]} />
          <View style={[styles.dot, { opacity: 0.7 }]} />
          <View style={[styles.dot, { opacity: 1 }]} />
        </View>
      </View>
    </View>
  );
};

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const {
    activeConversation, messages, isLoading, isSending,
    loadConversation, sendMessage, regenerateResponse, clearActiveChat,
  } = useChatStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const character = activeConversation?.character as Character | undefined;

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
    return () => clearActiveChat();
  }, [conversationId]);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text || isSending) return;
    setInputText('');
    Keyboard.dismiss();
    await sendMessage(text);
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender_type === 'user';
    const showAvatar = !isUser && (index === 0 || messages[index - 1]?.sender_type === 'user');

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatarSlot}>
            {showAvatar ? (
              character?.avatar_url ? (
                <Image source={{ uri: character.avatar_url }} style={styles.messageAvatar} />
              ) : (
                <LinearGradient colors={[colors.primary, colors.accent]} style={styles.messageAvatar}>
                  <Text style={styles.messageAvatarText}>
                    {(character?.name || '?')[0]}
                  </Text>
                </LinearGradient>
              )
            ) : null}
          </View>
        )}

        <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
          {isUser ? (
            <LinearGradient
              colors={[colors.userBubbleGradientStart, colors.userBubbleGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userBubbleGradient}
            >
              <Text style={styles.messageText}>{item.content}</Text>
            </LinearGradient>
          ) : (
            <Text style={[styles.messageText, styles.aiMessageText]}>{item.content}</Text>
          )}
          <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
            {formatTime(item.created_at)}
          </Text>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() => character && router.push(`/character/${character.id}`)}
          activeOpacity={0.7}
        >
          {character?.avatar_url ? (
            <Image source={{ uri: character.avatar_url }} style={styles.headerAvatar} />
          ) : (
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>
                {(character?.name || '?')[0]}
              </Text>
            </LinearGradient>
          )}
          <View>
            <Text style={styles.headerName}>{character?.name || 'Character'}</Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>Online</Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="share-outline" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListFooterComponent={isSending ? <TypingIndicator /> : null}
        />

        {/* Quick Replies */}
        {messages.length <= 2 && character?.personality?.interests && (
          <View style={styles.quickReplies}>
            {['Tell me about yourself', 'What can we do together?', 'Let\'s roleplay!'].map((text) => (
              <TouchableOpacity
                key={text}
                style={styles.quickReplyChip}
                onPress={() => { setInputText(text); }}
              >
                <Text style={styles.quickReplyText}>{text}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.inputAction}>
            <Ionicons name="add-circle-outline" size={26} color={colors.textMuted} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={`Message ${character?.name || 'AI'}...`}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={5000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
            onPress={handleSend}
            disabled={!inputText.trim() || isSending}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? '#fff' : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  backBtn: { padding: spacing.sm },
  headerInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', marginLeft: spacing.xs },
  headerAvatar: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.sm,
  },
  headerAvatarText: { fontSize: typography.size.base, fontWeight: '700', color: '#fff' },
  headerName: { fontSize: typography.size.base, fontWeight: '600', color: colors.textPrimary },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 1 },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.online },
  onlineText: { fontSize: typography.size.xs, color: colors.online },
  headerActions: { flexDirection: 'row' },
  headerActionBtn: { padding: spacing.sm },

  // Messages
  messageList: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  messageRow: {
    flexDirection: 'row', marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  messageRowUser: { justifyContent: 'flex-end' },
  avatarSlot: { width: 36, marginRight: spacing.sm },
  messageAvatar: {
    width: 32, height: 32, borderRadius: 16,
    justifyContent: 'center', alignItems: 'center',
  },
  messageAvatarText: { fontSize: typography.size.sm, fontWeight: '600', color: '#fff' },

  bubble: { maxWidth: SCREEN_WIDTH * 0.75, borderRadius: borderRadius.xl },
  userBubble: { borderBottomRightRadius: borderRadius.sm },
  userBubbleGradient: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderRadius: borderRadius.xl, borderBottomRightRadius: borderRadius.sm,
  },
  aiBubble: {
    backgroundColor: colors.aiBubble, borderBottomLeftRadius: borderRadius.sm,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderWidth: 1, borderColor: colors.aiBubbleBorder,
  },
  messageText: { fontSize: typography.size.base, color: '#fff', lineHeight: typography.lineHeight.base },
  aiMessageText: { color: colors.textPrimary },
  timestamp: {
    fontSize: typography.size.xs, color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.xs, alignSelf: 'flex-end',
  },
  timestampUser: { color: 'rgba(255,255,255,0.6)' },

  // Typing indicator
  typingContainer: { paddingHorizontal: spacing.sm, marginBottom: spacing.sm },
  typingBubble: {
    backgroundColor: colors.aiBubble, borderRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.sm, paddingHorizontal: spacing.base,
    paddingVertical: spacing.md, alignSelf: 'flex-start', marginLeft: 44,
    borderWidth: 1, borderColor: colors.aiBubbleBorder,
  },
  typingDots: { flexDirection: 'row', gap: 4 },
  dot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: colors.textMuted,
  },

  // Quick Replies
  quickReplies: {
    flexDirection: 'row', paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm, gap: spacing.sm, flexWrap: 'wrap',
  },
  quickReplyChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, borderWidth: 1, borderColor: colors.primaryMuted,
    backgroundColor: colors.surface,
  },
  quickReplyText: { fontSize: typography.size.sm, color: colors.textSecondary },

  // Input
  inputContainer: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: spacing.sm, paddingVertical: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.divider,
    paddingBottom: Platform.OS === 'ios' ? spacing.sm : spacing.sm,
  },
  inputAction: { padding: spacing.sm },
  inputWrapper: {
    flex: 1, backgroundColor: colors.inputBg,
    borderRadius: borderRadius.xl, paddingHorizontal: spacing.base,
    borderWidth: 1, borderColor: colors.inputBorder,
    maxHeight: 120,
  },
  textInput: {
    fontSize: typography.size.base, color: colors.textPrimary,
    paddingVertical: Platform.OS === 'ios' ? spacing.md : spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40, height: 40, borderRadius: 20,
    justifyContent: 'center', alignItems: 'center',
    marginLeft: spacing.xs,
  },
  sendButtonActive: { backgroundColor: colors.primary },
});
