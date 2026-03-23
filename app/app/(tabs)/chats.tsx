import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  RefreshControl, Alert, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useChatStore } from '../../src/stores/chatStore';
import type { Conversation } from '@ai-companions/shared';

export default function ChatsScreen() {
  const { conversations, fetchConversations, deleteConversation, isLoadingConversations } = useChatStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchConversations();
    setRefreshing(false);
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Conversation',
      `Delete your conversation with ${name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteConversation(id),
        },
      ]
    );
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return date.toLocaleDateString();
  };

  const renderItem = ({ item }: { item: Conversation }) => {
    const char = item.character as any;
    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => router.push(`/chat/${item.id}`)}
        onLongPress={() => handleDelete(item.id, char?.name || 'Unknown')}
        activeOpacity={0.7}
      >
        <View style={styles.avatarContainer}>
          {char?.avatar_url ? (
            <Image source={{ uri: char.avatar_url }} style={styles.avatar} />
          ) : (
            <LinearGradient colors={[colors.primary, colors.accent]} style={styles.avatar}>
              <Text style={styles.avatarText}>{(char?.name || '?')[0]}</Text>
            </LinearGradient>
          )}
          <View style={styles.onlineDot} />
        </View>

        <View style={styles.messageInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{char?.name || 'Unknown'}</Text>
            <Text style={styles.time}>{formatTime(item.last_message_at)}</Text>
          </View>
          <Text style={styles.preview} numberOfLines={1}>
            {item.last_message_preview || 'Start chatting...'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Chats</Text>
        <TouchableOpacity onPress={() => router.push('/(tabs)/discover')}>
          <Ionicons name="add-circle-outline" size={28} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          isLoadingConversations ? (
            <ActivityIndicator color={colors.primary} size="large" />
          ) : (
            <View style={styles.empty}>
              <Ionicons name="chatbubbles-outline" size={64} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>No conversations yet</Text>
              <Text style={styles.emptySubtitle}>Start chatting with an AI companion!</Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => router.push('/(tabs)/discover')}
              >
                <LinearGradient
                  colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
                  style={styles.emptyButtonGradient}
                >
                  <Text style={styles.emptyButtonText}>Browse Companions</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.lg,
  },
  headerTitle: { fontSize: typography.size['2xl'], fontWeight: '700', color: colors.textPrimary },

  conversationItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  avatarContainer: { position: 'relative', marginRight: spacing.md },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: typography.size.xl, fontWeight: '700', color: '#fff' },
  onlineDot: {
    position: 'absolute', bottom: 1, right: 1,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.online, borderWidth: 2, borderColor: colors.background,
  },
  messageInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  name: { fontSize: typography.size.base, fontWeight: '600', color: colors.textPrimary, flex: 1 },
  time: { fontSize: typography.size.xs, color: colors.textMuted, marginLeft: spacing.sm },
  preview: { fontSize: typography.size.sm, color: colors.textSecondary },

  emptyContainer: { flex: 1, justifyContent: 'center' },
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'], paddingHorizontal: spacing.xl },
  emptyTitle: { fontSize: typography.size.xl, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.lg },
  emptySubtitle: { fontSize: typography.size.base, color: colors.textSecondary, marginTop: spacing.sm, textAlign: 'center' },
  emptyButton: { marginTop: spacing.xl },
  emptyButtonGradient: {
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: { fontSize: typography.size.base, fontWeight: '600', color: '#fff' },
});
