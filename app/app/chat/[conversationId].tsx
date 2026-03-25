import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, KeyboardAvoidingView, Platform, ActivityIndicator,
  Dimensions, Keyboard, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useChatStore } from '../../src/stores/chatStore';
import { voiceService } from '../../src/services/voice.service';
import type { Message, Character } from '@ai-companions/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Streaming AI bubble — shows live text with a blinking cursor
const StreamingBubble = ({ content, character }: { content: string; character?: Character }) => {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.messageRow}>
      <View style={styles.avatarSlot}>
        {character?.avatar_url ? (
          <Image source={{ uri: character.avatar_url }} style={styles.messageAvatar} />
        ) : (
          <LinearGradient colors={[colors.primary, colors.accent]} style={styles.messageAvatar}>
            <Text style={styles.messageAvatarText}>{(character?.name || '?')[0]}</Text>
          </LinearGradient>
        )}
      </View>
      <View style={[styles.bubble, styles.aiBubble]}>
        <Text style={[styles.messageText, styles.aiMessageText]}>
          {content}
          {showCursor && <Text style={styles.cursor}>▊</Text>}
        </Text>
      </View>
    </View>
  );
};

// Typing indicator — 3 animated dots
const TypingIndicator = () => (
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

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const {
    activeConversation, messages, isLoading, isSending, isStreaming, streamingContent,
    loadConversation, sendStreamingMessage, regenerateResponse, clearActiveChat,
  } = useChatStore();
  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  // Audio State
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [generatingVoiceId, setGeneratingVoiceId] = useState<string | null>(null);

  const isGroup = activeConversation?.is_group;
  const mainCharacter = activeConversation?.character as Character | undefined;

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
    return () => {
      clearActiveChat();
      if (sound) sound.unloadAsync();
    };
  }, [conversationId]);

  // Request audio permissions
  useEffect(() => {
    (async () => {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    })();
  }, []);

  // Auto-scroll when new messages arrive or while streaming
  useEffect(() => {
    if (messages.length > 0 || isStreaming) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length, streamingContent]);

  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text || isSending || isStreaming) return;
    setInputText('');
    Keyboard.dismiss();
    await sendStreamingMessage(text);
  };

  const startRecording = async () => {
    try {
      if (sound) await sound.unloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const { recording } = await Audio.Recording.createAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!recording) return;
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);
      if (uri) {
        // Upload audio for speech-to-text
        const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const textToInject = await voiceService.speechToText(base64);
        if (textToInject) setInputText(textToInject);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsRecording(false);
    }
  };

  const togglePlayAudio = async (message: Message, voiceId: string = 'nova') => {
    try {
      if (playingId === message.id) {
        // Stop currently playing
        await sound?.stopAsync();
        setPlayingId(null);
        return;
      }
      
      // Stop any existing sound
      if (sound) await sound.unloadAsync();
      
      let finalAudioUrl = message.audio_url;

      // If no audio_url, generate TTS on the fly
      if (!finalAudioUrl) {
        setGeneratingVoiceId(message.id);
        finalAudioUrl = await voiceService.textToSpeech(message.content, voiceId);
        // Note: In a real app we'd update the message in the backend here to cache it
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: finalAudioUrl! },
        { shouldPlay: true }
      );
      
      setSound(newSound);
      setPlayingId(message.id);
      setGeneratingVoiceId(null);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (err) {
      Alert.alert('Audio Error', 'Failed to play voice message.');
      setPlayingId(null);
      setGeneratingVoiceId(null);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isUser = item.sender_type === 'user';
    
    // For group chats, we use the specific character from the joined DB result
    // Otherwise fallback to main conversation character
    const msgChar = item.character || mainCharacter;
    
    // In groups, show avatar if the sender changes. In 1v1, same logic.
    const showAvatar = !isUser && (index === 0 || messages[index - 1]?.sender_type !== item.sender_type || messages[index - 1]?.character_id !== item.character_id);

    return (
      <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
        {!isUser && (
          <View style={styles.avatarSlot}>
            {showAvatar ? (
              msgChar?.avatar_url ? (
                <Image source={{ uri: msgChar.avatar_url }} style={styles.messageAvatar} />
              ) : (
                <LinearGradient colors={[colors.primary, colors.accent]} style={styles.messageAvatar}>
                  <Text style={styles.messageAvatarText}>
                    {(msgChar?.name || '?')[0]}
                  </Text>
                </LinearGradient>
              )
            ) : null}
          </View>
        )}

        <View style={isUser ? { alignItems: 'flex-end' } : { alignItems: 'flex-start' }}>
          {isGroup && !isUser && showAvatar && (
            <Text style={styles.groupSenderName}>{msgChar?.name}</Text>
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
              <View>
                <Text style={[styles.messageText, styles.aiMessageText]}>{item.content}</Text>
                
                {/* Voice Play Button for AI */}
                <TouchableOpacity 
                  style={styles.voicePlayBtn} 
                  onPress={() => togglePlayAudio(item, msgChar?.voice_id || 'nova')}
                >
                  {generatingVoiceId === item.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons 
                      name={playingId === item.id ? "stop-circle" : "play-circle"} 
                      size={24} 
                      color={colors.primary} 
                    />
                  )}
                  <Text style={styles.voicePlayText}>
                    {playingId === item.id ? "Stop" : "Play Voice"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <Text style={[styles.timestamp, isUser && styles.timestampUser]}>
              {formatTime(item.created_at)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Determine footer component: streaming bubble > typing dots > nothing
  const ListFooter = () => {
    if (isStreaming && streamingContent) {
      return <StreamingBubble content={streamingContent} character={mainCharacter} />;
    }
    if (isSending && !isStreaming) {
      return <TypingIndicator />;
    }
    return null;
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
          onPress={() => !isGroup && mainCharacter && router.push(`/character/${mainCharacter.id}`)}
          activeOpacity={isGroup ? 1 : 0.7}
        >
          {isGroup ? (
            <View style={[styles.headerAvatar, { backgroundColor: colors.surface }]}>
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
          ) : (
            mainCharacter?.avatar_url ? (
              <Image source={{ uri: mainCharacter.avatar_url }} style={styles.headerAvatar} />
            ) : (
              <LinearGradient colors={[colors.primary, colors.accent]} style={styles.headerAvatar}>
                <Text style={styles.headerAvatarText}>
                  {(mainCharacter?.name || '?')[0]}
                </Text>
              </LinearGradient>
            )
          )}
          <View>
            <Text style={styles.headerName}>
              {isGroup ? 'Group Chat' : mainCharacter?.name || 'Character'}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {isStreaming ? 'Typing...' : 'Online'}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
        <View style={styles.headerActions}>
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
          ListFooterComponent={<ListFooter />}
        />

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity 
            style={styles.inputAction}
            onPressIn={startRecording}
            onPressOut={stopRecording}
          >
            <Ionicons 
              name={isRecording ? "mic" : "mic-outline"} 
              size={26} 
              color={isRecording ? colors.error : colors.textMuted} 
            />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={isRecording ? "Recording..." : `Message ${isGroup ? 'Group' : mainCharacter?.name || 'AI'}...`}
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={5000}
            />
          </View>
          <TouchableOpacity
            style={[styles.sendButton, inputText.trim() ? styles.sendButtonActive : null]}
            onPress={handleSendText}
            disabled={!inputText.trim() || isSending || isStreaming}
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

  groupSenderName: {
    fontSize: typography.size.xs, color: colors.textSecondary,
    marginBottom: 4, marginLeft: 4, fontWeight: '500',
  },

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
  cursor: { color: colors.primary, fontSize: typography.size.base },
  timestamp: {
    fontSize: typography.size.xs, color: 'rgba(255,255,255,0.5)',
    marginTop: spacing.xs, alignSelf: 'flex-end',
  },
  timestampUser: { color: 'rgba(255,255,255,0.6)' },

  voicePlayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.1)',
  },
  voicePlayText: { fontSize: typography.size.xs, color: colors.primary, fontWeight: '600' },

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
