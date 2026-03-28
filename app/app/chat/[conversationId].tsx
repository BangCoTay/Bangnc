import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Dimensions,
  Keyboard,
  Alert,
  Modal,
  ScrollView,
  Pressable,
  Animated as RNAnimated,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  useAudioRecorder,
  RecordingPresets,
  useAudioPlayer,
  useAudioPlayerStatus,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
} from "expo-audio";
import * as FileSystem from "expo-file-system/legacy";
import * as Clipboard from "expo-clipboard";
import { colors, typography, spacing, borderRadius } from "../../src/theme";
import { useAuthStore } from "../../src/stores/authStore";
import { useChatStore } from "../../src/stores/chatStore";
import { voiceService } from "../../src/services/voice.service";
import { GIFTS, RARITY_COLORS } from "@ai-companions/shared";
import type { Message, Character, GiftDefinition } from "@ai-companions/shared";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ─── Helper: parse gift info from media_url ───
const parseGift = (mediaUrl: string | null): GiftDefinition | null => {
  if (!mediaUrl?.startsWith("gift:")) return null;
  const giftId = mediaUrl.slice(5);
  return GIFTS.find((g) => g.id === giftId) || null;
};

// ─── Affinity Bar ───
const AffinityBar = ({ messageCount }: { messageCount: number }) => {
  const level = Math.floor(messageCount / 20) + 1;
  const progress = (messageCount % 20) / 20;
  const levelName =
    level <= 2
      ? "Stranger"
      : level <= 5
        ? "Friend"
        : level <= 10
          ? "Close Friend"
          : level <= 20
            ? "Soulmate"
            : "Eternal Bond";

  return (
    <View style={affinityStyles.container}>
      <View style={affinityStyles.row}>
        <Ionicons name="heart" size={12} color={colors.accentPink} />
        <Text style={affinityStyles.label}>
          Lv.{level} {levelName}
        </Text>
      </View>
      <View style={affinityStyles.barBg}>
        <LinearGradient
          colors={[colors.accentPink, colors.primary]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            affinityStyles.barFill,
            { width: `${Math.max(5, progress * 100)}%` },
          ]}
        />
      </View>
    </View>
  );
};

// ─── Gift Picker Modal ───
const GiftPickerModal = ({
  visible,
  onClose,
  onSend,
  isSending,
  balance,
}: {
  visible: boolean;
  onClose: () => void;
  onSend: (gift: GiftDefinition) => void;
  isSending: boolean;
  balance: number;
}) => {
  const [selectedGift, setSelectedGift] = useState<GiftDefinition | null>(null);
  const canAfford = selectedGift ? balance >= selectedGift.cost : true;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={giftStyles.overlay} onPress={onClose}>
        <Pressable style={giftStyles.sheet} onPress={() => {}}>
          <View style={giftStyles.handle} />
          <Text style={giftStyles.title}>Send a Gift</Text>
          <Text style={giftStyles.subtitle}>
            Show your appreciation with a virtual gift
          </Text>

          <View style={giftStyles.balancePill}>
            <Ionicons name="flash" size={14} color={colors.accentGold} />
            <Text style={giftStyles.balanceText}>{balance} Coins</Text>
          </View>

          <View style={giftStyles.gridContainer}>
            <ScrollView
              style={giftStyles.grid}
              showsVerticalScrollIndicator={false}
            >
              <View style={giftStyles.gridInner}>
                {GIFTS.map((gift) => {
                  const isSelected = selectedGift?.id === gift.id;
                  const rarityColor = RARITY_COLORS[gift.rarity];
                  return (
                    <TouchableOpacity
                      key={gift.id}
                      style={[
                        giftStyles.giftCard,
                        isSelected && {
                          borderColor: rarityColor,
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => setSelectedGift(gift)}
                      activeOpacity={0.7}
                    >
                      <View
                        style={[
                          giftStyles.iconCircle,
                          { borderColor: rarityColor },
                        ]}
                      >
                        <Ionicons
                          name={gift.icon as any}
                          size={28}
                          color={rarityColor}
                        />
                      </View>
                      <Text style={giftStyles.giftName} numberOfLines={1}>
                        {gift.name}
                      </Text>
                      <View style={giftStyles.costRow}>
                        <Ionicons
                          name="flash"
                          size={12}
                          color={colors.accentGold}
                        />
                        <Text style={giftStyles.costText}>{gift.cost}</Text>
                      </View>
                      <Text
                        style={[giftStyles.rarityBadge, { color: rarityColor }]}
                      >
                        {gift.rarity.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {selectedGift && (
            <View style={giftStyles.footer}>
              <View style={giftStyles.footerInfo}>
                <Ionicons
                  name={selectedGift.icon as any}
                  size={24}
                  color={RARITY_COLORS[selectedGift.rarity]}
                />
                <View style={{ marginLeft: spacing.sm, flex: 1 }}>
                  <Text style={giftStyles.footerName}>{selectedGift.name}</Text>
                  <Text style={giftStyles.footerAffinity}>
                    +{selectedGift.affinity} affinity
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => {
                  onSend(selectedGift);
                  setSelectedGift(null);
                }}
                disabled={isSending || !canAfford}
                style={[
                  giftStyles.sendBtn,
                  !canAfford && { backgroundColor: colors.textDisabled },
                ]}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons name="flash" size={16} color="#fff" />
                    <Text style={giftStyles.sendBtnText}>
                      {!canAfford ? "Insufficient" : `${selectedGift.cost} Send`}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

// ─── Gift Bubble (special rendering for gift messages) ───
const GiftBubble = ({
  gift,
  content,
  timestamp,
}: {
  gift: GiftDefinition;
  content: string;
  timestamp: string;
}) => {
  const rarityColor = RARITY_COLORS[gift.rarity];
  return (
    <View style={giftBubbleStyles.wrapper}>
      <LinearGradient
        colors={["rgba(124,58,237,0.15)", "rgba(236,72,153,0.15)"]}
        style={giftBubbleStyles.container}
      >
        <View
          style={[giftBubbleStyles.iconCircle, { borderColor: rarityColor }]}
        >
          <Ionicons name={gift.icon as any} size={32} color={rarityColor} />
        </View>
        <Text style={giftBubbleStyles.giftName}>{gift.name}</Text>
        <Text style={giftBubbleStyles.action}>{content}</Text>
        <Text style={[giftBubbleStyles.rarity, { color: rarityColor }]}>
          {gift.rarity.toUpperCase()} GIFT
        </Text>
        <Text style={giftBubbleStyles.timestamp}>{timestamp}</Text>
      </LinearGradient>
    </View>
  );
};

// ─── Message Action Sheet ───
const MessageActionSheet = ({
  visible,
  message,
  isLastAI,
  onClose,
  onCopy,
  onDelete,
  onRegenerate,
}: {
  visible: boolean;
  message: Message | null;
  isLastAI: boolean;
  onClose: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onRegenerate: () => void;
}) => {
  if (!message) return null;
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={actionStyles.overlay} onPress={onClose}>
        <View style={actionStyles.sheet}>
          <TouchableOpacity style={actionStyles.option} onPress={onCopy}>
            <Ionicons
              name="copy-outline"
              size={20}
              color={colors.textPrimary}
            />
            <Text style={actionStyles.optionText}>Copy Text</Text>
          </TouchableOpacity>
          {isLastAI && (
            <TouchableOpacity
              style={actionStyles.option}
              onPress={onRegenerate}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.primary}
              />
              <Text
                style={[actionStyles.optionText, { color: colors.primary }]}
              >
                Regenerate
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={actionStyles.option} onPress={onDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.error} />
            <Text style={[actionStyles.optionText, { color: colors.error }]}>
              Delete
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[actionStyles.option, actionStyles.cancel]}
            onPress={onClose}
          >
            <Text style={actionStyles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Modal>
  );
};

// ─── Streaming AI bubble ───
const StreamingBubble = ({
  content,
  character,
}: {
  content: string;
  character?: Character;
}) => {
  const [showCursor, setShowCursor] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setShowCursor((v) => !v), 500);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={styles.messageRow}>
      <View style={styles.avatarSlot}>
        {character?.avatar_url ? (
          <Image
            source={{ uri: character.avatar_url }}
            style={styles.messageAvatar}
          />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.messageAvatar}
          >
            <Text style={styles.messageAvatarText}>
              {(character?.name || "?")[0]}
            </Text>
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

// ─── Typing indicator ───
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

// ─── Individual Message Item (Memoized) ───
const MessageItem = React.memo(
  ({
    item,
    index,
    mainCharacter,
    messages,
    playingId,
    generatingVoiceId,
    onLongPress,
    onTogglePlay,
  }: {
    item: Message;
    index: number;
    mainCharacter?: Character;
    messages: Message[];
    playingId: string | null;
    generatingVoiceId: string | null;
    onLongPress: (m: Message) => void;
    onTogglePlay: (m: Message, voiceId?: string) => void;
  }) => {
    const isUser = item.sender_type === "user";
    const msgChar = item.character || mainCharacter;
    const showAvatar =
      !isUser &&
      (index === 0 ||
        messages[index - 1]?.sender_type !== item.sender_type ||
        messages[index - 1]?.character_id !== item.character_id);

    // Check if this is a gift message
    const gift = parseGift(item.media_url);
    if (gift && isUser) {
      const formatTime = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      };
      return (
        <GiftBubble
          gift={gift}
          content={item.content}
          timestamp={formatTime(item.created_at)}
        />
      );
    }

    return (
      <View style={[styles.messageRow, isUser ? styles.messageRowUser : null]}>
        {!isUser && (
          <View style={styles.avatarSlot}>
            {showAvatar &&
              (msgChar?.avatar_url ? (
                <Image
                  source={{ uri: msgChar.avatar_url }}
                  style={styles.messageAvatar}
                />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  style={styles.messageAvatar}
                >
                  <Text style={styles.messageAvatarText}>
                    {(msgChar?.name || "?")[0]}
                  </Text>
                </LinearGradient>
              ))}
          </View>
        )}

        <TouchableOpacity
          activeOpacity={0.9}
          onLongPress={() => onLongPress(item)}
          style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}
        >
          {isUser ? (
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.userBubbleGradient}
            >
              <Text style={styles.messageText}>{item.content}</Text>
              <Text style={[styles.timestamp, styles.timestampUser]}>
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </LinearGradient>
          ) : (
            <>
              {showAvatar &&
                messages[0]?.conversation_id?.includes("group") && (
                  <Text style={styles.groupSenderName}>{msgChar?.name}</Text>
                )}
              <Text style={[styles.messageText, styles.aiMessageText]}>
                {item.content}
              </Text>

              {/* Voice controls for AI messages */}
              {!isUser && (
                <TouchableOpacity
                  style={styles.voicePlayBtn}
                  onPress={() => onTogglePlay(item, msgChar?.voice_id)}
                  disabled={generatingVoiceId === item.id}
                >
                  {generatingVoiceId === item.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name={
                        playingId === item.id ? "pause-circle" : "play-circle"
                      }
                      size={20}
                      color={colors.primary}
                    />
                  )}
                  <Text style={styles.voicePlayText}>
                    {generatingVoiceId === item.id
                      ? "Generating..."
                      : playingId === item.id
                        ? "Stop"
                        : "Play Voice"}
                  </Text>
                </TouchableOpacity>
              )}

              <Text style={[styles.timestamp, { color: colors.textMuted }]}>
                {new Date(item.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  },
);

export default function ChatScreen() {
  const { conversationId } = useLocalSearchParams<{ conversationId: string }>();
  const {
    activeConversation,
    messages,
    isLoading,
    isSending,
    isStreaming,
    streamingContent,
    isSendingGift,
    loadConversation,
    sendStreamingMessage,
    regenerateResponse,
    clearActiveChat,
    sendGift,
    deleteMessage,
  } = useChatStore();
  const { user, loadProfile, updateBalance } = useAuthStore();
  const [inputText, setInputText] = useState("");
  const flatListRef = useRef<FlatList>(null);

  // Audio State (expo-audio)
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [playingUrl, setPlayingUrl] = useState<string | null>(null);
  const audioPlayer = useAudioPlayer(playingUrl ? { uri: playingUrl } : null);
  const playerStatus = useAudioPlayerStatus(audioPlayer);
  const [generatingVoiceId, setGeneratingVoiceId] = useState<string | null>(
    null,
  );

  // Gift & Action State
  const [showGiftPicker, setShowGiftPicker] = useState(false);
  const [actionMessage, setActionMessage] = useState<Message | null>(null);
  const [showActions, setShowActions] = useState(false);

  const isGroup = activeConversation?.is_group;
  const mainCharacter = activeConversation?.character as Character | undefined;

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
      loadProfile();
    }
    return () => {
      clearActiveChat();
    };
  }, [conversationId]);

  // Request audio permissions for recording
  useEffect(() => {
    requestRecordingPermissionsAsync();
    // Default to playback mode (speaker)
    setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
  }, []);

  // Auto-clear playing state when audio finishes
  useEffect(() => {
    if (playerStatus.didJustFinish) {
      setPlayingId(null);
      setPlayingUrl(null);
    }
  }, [playerStatus.didJustFinish]);

  // Handle auto-playback when target URL is set
  useEffect(() => {
    if (playingUrl && audioPlayer) {
      // Ensure volume is at maximum
      audioPlayer.volume = 1.0;
      
      // Small delay ensures the player has correctly loaded the new source
      const timer = setTimeout(() => {
        audioPlayer.play();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [playingUrl]);

  // Auto-scroll when new messages arrive or while streaming
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [messages.length, isStreaming]);

  // Handle auto-scroll only on actual stream text changes if needed, but not too aggressive
  useEffect(() => {
    if (
      isStreaming &&
      (streamingContent.length % 5 === 0 || streamingContent.length < 20)
    ) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [streamingContent.length, isStreaming]);

  const handleSendText = async () => {
    const text = inputText.trim();
    if (!text || isSending || isStreaming) return;
    setInputText("");
    Keyboard.dismiss();
    await sendStreamingMessage(text);
  };

  const handleSendGift = async (gift: GiftDefinition) => {
    try {
      const result = await sendGift(gift.id);
      setShowGiftPicker(false);
      if (result) {
        updateBalance(result.new_balance);
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.error || err?.message || "Failed to send gift";
      Alert.alert("Gift Error", msg);
    }
  };

  const handleMessageLongPress = useCallback((message: Message) => {
    setActionMessage(message);
    setShowActions(true);
  }, []);

  const handleCopyMessage = useCallback(async () => {
    if (actionMessage) {
      await Clipboard.setStringAsync(actionMessage.content);
      setShowActions(false);
      setActionMessage(null);
    }
  }, [actionMessage]);

  const handleDeleteMessage = useCallback(() => {
    if (!actionMessage) return;
    Alert.alert(
      "Delete Message",
      "Are you sure you want to delete this message?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            deleteMessage(actionMessage.id);
            setShowActions(false);
            setActionMessage(null);
          },
        },
      ],
    );
  }, [actionMessage]);

  const handleRegenerate = useCallback(() => {
    setShowActions(false);
    setActionMessage(null);
    regenerateResponse();
  }, []);

  const startRecording = async () => {
    try {
      // Stop any active playback first
      if (playingId) {
        audioPlayer.pause();
        setPlayingId(null);
        setPlayingUrl(null);
      }
      
      // Ensure recording is allowed before starting
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: true });
      
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
      setIsRecording(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    try {
      if (!isRecording) return;
      setIsRecording(false);
      await audioRecorder.stop();
      
      // Reset back to playback mode (speaker) after recording
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      
      const uri = audioRecorder.uri;
      if (uri) {
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        const textToInject = await voiceService.speechToText(
          base64,
          "audio/mp4",
        );
        if (textToInject) setInputText(textToInject);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
      setIsRecording(false);
      // Ensure we reset mode even on error
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
    }
  };

  const togglePlayAudio = async (
    message: Message,
    voiceId: string = "nova",
  ) => {
    try {
      // If already playing this message, stop it
      if (playingId === message.id) {
        audioPlayer.pause();
        setPlayingId(null);
        setPlayingUrl(null);
        return;
      }

      let finalAudioUrl = message.audio_url;

      if (!finalAudioUrl) {
        setGeneratingVoiceId(message.id);
        try {
          const result = await voiceService.textToSpeech(
            message.content,
            voiceId,
          );
          finalAudioUrl = result.audioUrl;
          if (result.newBalance !== undefined) {
            updateBalance(result.newBalance);
          }
        } finally {
          setGeneratingVoiceId(null);
        }
      }

      // Set the URL — the playback effect will handle starting the audio
      // Force output to speaker by disabling recording mode temporarily
      await setAudioModeAsync({ playsInSilentMode: true, allowsRecording: false });
      
      setPlayingUrl(finalAudioUrl!);
      setPlayingId(message.id);
    } catch (err) {
      Alert.alert("Audio Error", "Failed to play voice message.");
      setPlayingId(null);
      setPlayingUrl(null);
      setGeneratingVoiceId(null);
    }
  };
  const lastAIMessageId = [...messages]
    .reverse()
    .find((m) => m.sender_type === "character")?.id;

  const renderMessage = useCallback(
    ({ item, index }: { item: Message; index: number }) => (
      <MessageItem
        item={item}
        index={index}
        mainCharacter={mainCharacter}
        messages={messages}
        playingId={playingId}
        generatingVoiceId={generatingVoiceId}
        onLongPress={handleMessageLongPress}
        onTogglePlay={togglePlayAudio}
      />
    ),
    [
      messages,
      mainCharacter,
      playingId,
      generatingVoiceId,
      handleMessageLongPress,
      togglePlayAudio,
    ],
  );

  // Memoized footer — must NOT be defined as an inline component in JSX
  // otherwise FlatList remounts on every render causing messages to disappear
  const renderListFooter = useCallback(() => {
    if (isStreaming && streamingContent) {
      return (
        <StreamingBubble content={streamingContent} character={mainCharacter} />
      );
    }
    if ((isSending && !isStreaming) || isSendingGift) {
      return <TypingIndicator />;
    }
    return null;
  }, [isStreaming, streamingContent, isSending, isSendingGift, mainCharacter]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Chat Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerInfo}
          onPress={() =>
            !isGroup &&
            mainCharacter &&
            router.push(`/character/${mainCharacter.id}`)
          }
          activeOpacity={isGroup ? 1 : 0.7}
        >
          {isGroup ? (
            <View
              style={[styles.headerAvatar, { backgroundColor: colors.surface }]}
            >
              <Ionicons name="people" size={20} color={colors.primary} />
            </View>
          ) : mainCharacter?.avatar_url ? (
            <Image
              source={{ uri: mainCharacter.avatar_url }}
              style={styles.headerAvatar}
            />
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              style={styles.headerAvatar}
            >
              <Text style={styles.headerAvatarText}>
                {(mainCharacter?.name || "?")[0]}
              </Text>
            </LinearGradient>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName}>
              {isGroup ? "Group Chat" : mainCharacter?.name || "Character"}
            </Text>
            <View style={styles.onlineRow}>
              <View style={styles.onlineDot} />
              <Text style={styles.onlineText}>
                {isStreaming
                  ? "Typing..."
                  : isSendingGift
                    ? "Reacting..."
                    : "Online"}
              </Text>
            </View>
            {/* Affinity Bar */}
            {!isGroup && activeConversation && (
              <AffinityBar
                messageCount={activeConversation.message_count || 0}
              />
            )}
          </View>
        </TouchableOpacity>

        <View style={styles.headerActions}>
          <View style={styles.headerBalance}>
            <Ionicons name="flash" size={14} color={colors.accentGold} />
            <Text style={styles.headerBalanceText}>
              {user?.coin_balance || 0}
            </Text>
          </View>
          <TouchableOpacity style={styles.headerActionBtn}>
            <Ionicons
              name="ellipsis-horizontal"
              size={22}
              color={colors.textPrimary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          extraData={{ isStreaming, streamingContent, isSending }}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => {
            if (isStreaming || isSending) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          ListFooterComponent={renderListFooter}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          initialNumToRender={20}
          maxToRenderPerBatch={10}
          windowSize={10}
          keyboardShouldPersistTaps="handled"
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
              size={24}
              color={isRecording ? colors.error : colors.textMuted}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.inputAction}
            onPress={() => setShowGiftPicker(true)}
          >
            <Ionicons name="gift-outline" size={24} color={colors.accentPink} />
          </TouchableOpacity>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              placeholder={
                isRecording
                  ? "Recording..."
                  : `Message ${isGroup ? "Group" : mainCharacter?.name || "AI"}...`
              }
              placeholderTextColor={colors.textMuted}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={5000}
            />
          </View>
          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim() ? styles.sendButtonActive : null,
            ]}
            onPress={handleSendText}
            disabled={!inputText.trim() || isSending || isStreaming}
          >
            <Ionicons
              name="send"
              size={20}
              color={inputText.trim() ? "#fff" : colors.textMuted}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Gift Picker */}
      <GiftPickerModal
        visible={showGiftPicker}
        onClose={() => setShowGiftPicker(false)}
        onSend={handleSendGift}
        isSending={isSendingGift}
        balance={user?.coin_balance || 0}
      />

      {/* Message Actions */}
      <MessageActionSheet
        visible={showActions}
        message={actionMessage}
        isLastAI={actionMessage?.id === lastAIMessageId}
        onClose={() => {
          setShowActions(false);
          setActionMessage(null);
        }}
        onCopy={handleCopyMessage}
        onDelete={handleDeleteMessage}
        onRegenerate={handleRegenerate}
      />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  backBtn: { padding: spacing.sm },
  headerInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: spacing.xs,
  },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: spacing.sm,
  },
  headerAvatarText: {
    fontSize: typography.size.base,
    fontWeight: "700",
    color: "#fff",
  },
  headerName: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 1,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.online,
  },
  onlineText: { fontSize: typography.size.xs, color: colors.online },
  headerActions: { flexDirection: "row", alignItems: "center" },
  headerActionBtn: { padding: spacing.sm },
  headerBalance: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.lg,
    gap: 4,
    marginRight: spacing.xs,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  headerBalanceText: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.accentGold,
  },

  // Messages
  messageList: { paddingVertical: spacing.md, paddingHorizontal: spacing.sm },
  messageRow: {
    flexDirection: "row",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xs,
  },
  messageRowUser: { justifyContent: "flex-end" },
  avatarSlot: { width: 36, marginRight: spacing.sm },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  messageAvatarText: {
    fontSize: typography.size.sm,
    fontWeight: "600",
    color: "#fff",
  },

  groupSenderName: {
    fontSize: typography.size.xs,
    color: colors.textSecondary,
    marginBottom: 4,
    marginLeft: 4,
    fontWeight: "500",
  },

  bubble: { maxWidth: SCREEN_WIDTH * 0.75, borderRadius: borderRadius.xl },
  userBubble: { borderBottomRightRadius: borderRadius.sm },
  userBubbleGradient: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderBottomRightRadius: borderRadius.sm,
  },
  aiBubble: {
    backgroundColor: colors.aiBubble,
    borderBottomLeftRadius: borderRadius.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: colors.aiBubbleBorder,
  },
  messageText: {
    fontSize: typography.size.base,
    color: "#fff",
    lineHeight: typography.lineHeight.base,
  },
  aiMessageText: { color: colors.textPrimary },
  cursor: { color: colors.primary, fontSize: typography.size.base },
  timestamp: {
    fontSize: typography.size.xs,
    color: "rgba(255,255,255,0.5)",
    marginTop: spacing.xs,
    alignSelf: "flex-end",
  },
  timestampUser: { color: "rgba(255,255,255,0.6)" },

  mediaImage: {
    width: SCREEN_WIDTH * 0.6,
    height: SCREEN_WIDTH * 0.45,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },

  voicePlayBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  voicePlayText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: "600",
  },

  // Typing indicator
  typingContainer: { paddingHorizontal: spacing.sm, marginBottom: spacing.sm },
  typingBubble: {
    backgroundColor: colors.aiBubble,
    borderRadius: borderRadius.xl,
    borderBottomLeftRadius: borderRadius.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    alignSelf: "flex-start",
    marginLeft: 44,
    borderWidth: 1,
    borderColor: colors.aiBubbleBorder,
  },
  typingDots: { flexDirection: "row", gap: 4 },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textMuted,
  },

  // Input
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    paddingBottom: Platform.OS === "ios" ? spacing.sm : spacing.sm,
  },
  inputAction: { padding: spacing.xs, marginBottom: 4 },
  inputWrapper: {
    flex: 1,
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    maxHeight: 120,
    marginHorizontal: spacing.xs,
  },
  textInput: {
    fontSize: typography.size.base,
    color: colors.textPrimary,
    paddingVertical: Platform.OS === "ios" ? spacing.md : spacing.sm,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonActive: { backgroundColor: colors.primary },
});

// ─── Affinity Styles ───
const affinityStyles = StyleSheet.create({
  container: { marginTop: 4 },
  row: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 },
  label: { fontSize: 10, color: colors.accentPink, fontWeight: "600" },
  barBg: {
    height: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 2,
    overflow: "hidden",
    width: 100,
  },
  barFill: { height: "100%", borderRadius: 2 },
});

// ─── Gift Picker Styles ───
const giftStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingBottom: Platform.OS === "ios" ? spacing.xl : spacing.lg,
    height: SCREEN_WIDTH > 400 ? 550 : 480,
    maxHeight: "85%",
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.textMuted,
    alignSelf: "center",
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    textAlign: "center",
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: 4,
    marginBottom: spacing.md,
  },
  gridContainer: {
    flex: 1,
    marginTop: spacing.sm,
  },
  balancePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    alignSelf: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: 6,
    borderRadius: borderRadius.lg,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.2)",
  },
  balanceText: {
    fontSize: typography.size.sm,
    fontWeight: "700",
    color: colors.accentGold,
  },
  grid: {
    flex: 1,
  },
  gridInner: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  giftCard: {
    width: (SCREEN_WIDTH - spacing.base * 2 - spacing.sm * 3) / 4,
    backgroundColor: colors.background,
    borderRadius: borderRadius.lg,
    padding: spacing.sm,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.divider,
    marginBottom: spacing.xs,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(124,58,237,0.1)",
    borderWidth: 1,
    marginBottom: 6,
  },
  giftName: {
    fontSize: 10,
    color: colors.textPrimary,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 2,
  },
  costRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  costText: { fontSize: 10, color: colors.accentGold, fontWeight: "700" },
  rarityBadge: { fontSize: 8, fontWeight: "800", marginTop: 2 },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.divider,
    marginTop: spacing.sm,
  },
  footerInfo: { flexDirection: "row", alignItems: "center", flex: 1 },
  footerName: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  footerAffinity: { fontSize: typography.size.xs, color: colors.accentPink },
  sendBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.xl,
  },
  sendBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: typography.size.sm,
  },
});

// ─── Gift Bubble Styles ───
const giftBubbleStyles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    marginBottom: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  container: {
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(124,58,237,0.2)",
    width: SCREEN_WIDTH * 0.6,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 2,
    marginBottom: spacing.sm,
  },
  giftName: {
    fontSize: typography.size.lg,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: 2,
  },
  action: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    fontStyle: "italic",
  },
  rarity: { fontSize: 10, fontWeight: "800", marginTop: 6, letterSpacing: 1 },
  timestamp: {
    fontSize: typography.size.xs,
    color: "rgba(255,255,255,0.4)",
    marginTop: 4,
  },
});

// ─── Message Action Styles ───
const actionStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    width: "100%",
    maxWidth: 300,
    overflow: "hidden",
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionText: {
    fontSize: typography.size.base,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  cancel: {
    justifyContent: "center",
    borderBottomWidth: 0,
  },
  cancelText: {
    fontSize: typography.size.base,
    color: colors.textMuted,
    fontWeight: "500",
    textAlign: "center",
  },
});
