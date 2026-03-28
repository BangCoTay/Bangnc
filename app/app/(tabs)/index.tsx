import React, { useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions,
  FlatList, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useAuthStore } from '../../src/stores/authStore';
import { useCharacterStore } from '../../src/stores/characterStore';
import { useChatStore } from '../../src/stores/chatStore';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const user = useAuthStore((s) => s.user);
  const { featured, fetchFeatured } = useCharacterStore();
  const { conversations, fetchConversations, isLoadingConversations } = useChatStore();
  const [refreshing, setRefreshing] = React.useState(false);

  useEffect(() => {
    fetchFeatured();
    fetchConversations();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchFeatured(), fetchConversations()]);
    setRefreshing(false);
  };

  const recentChats = conversations.slice(0, 6);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.welcomeText}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.display_name || user?.username || 'User'}</Text>
          </View>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => router.push('/(tabs)/profile')}
          >
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient colors={['#3B82F6', '#2563EB']} style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(user?.display_name || user?.username || 'U')[0].toUpperCase()}
                </Text>
              </LinearGradient>
            )}
          </TouchableOpacity>
        </View>

        {/* Pro Banner */}
        <TouchableOpacity onPress={() => router.push('/subscription')} activeOpacity={0.85}>
          <LinearGradient
            colors={['#1a1040', '#2d1b69', '#1a1040']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.proBanner}
          >
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>✨ New Pro Tier</Text>
            </View>
            <Text style={styles.proBannerTitle}>Unlock Limitless Memory</Text>
            <Text style={styles.proBannerSubtitle}>Your companions will never forget a detail.</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Create CTA */}
        <TouchableOpacity activeOpacity={0.85} onPress={() => router.push('/character/create')}>
          <LinearGradient
            colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.createButton}
          >
            <Ionicons name="sparkles" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Create New Companion</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Jump Back In */}
        {recentChats.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Jump Back In</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/chats')}>
                <Text style={styles.viewAll}>View all</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              horizontal
              data={recentChats}
              keyExtractor={(item) => item.id}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingRight: spacing.base }}
              renderItem={({ item }) => {
                const char = item.character as any;
                return (
                  <TouchableOpacity
                    style={styles.recentChat}
                    onPress={() => router.push(`/chat/${item.id}`)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.recentAvatar}>
                      {char?.avatar_url ? (
                        <Image source={{ uri: char.avatar_url }} style={styles.recentAvatarImg} />
                      ) : (
                        <LinearGradient
                          colors={[colors.primary, colors.accent]}
                          style={styles.recentAvatarImg}
                        >
                          <Text style={styles.recentAvatarText}>
                            {(char?.name || '?')[0]}
                          </Text>
                        </LinearGradient>
                      )}
                      <View style={styles.onlineDot} />
                    </View>
                    <Text style={styles.recentName} numberOfLines={1}>
                      {char?.name || 'Unknown'}
                    </Text>
                    <Text style={styles.recentPreview} numberOfLines={1}>
                      {item.last_message_preview || 'Start chatting...'}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        )}

        {/* Featured Personalities */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured Personalities</Text>
          {featured.map((character) => (
            <TouchableOpacity
              key={character.id}
              style={styles.featuredCard}
              onPress={() => router.push(`/character/${character.id}`)}
              activeOpacity={0.8}
            >
              <View style={StyleSheet.absoluteFill}>
                {character.avatar_url ? (
                  <Image
                    source={{ uri: character.avatar_url }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <LinearGradient
                    colors={[colors.surface, "#1A1A2E"]}
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </View>
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                style={styles.featuredOverlay}
              >
                <View style={styles.featuredBadge}>
                  <Text style={styles.featuredBadgeText}>
                    {character.categories?.[0] || 'Popular'}
                  </Text>
                </View>
                <View style={styles.featuredInfo}>
                  <Text style={styles.featuredName}>{character.name}</Text>
                  <Text style={styles.featuredDesc} numberOfLines={2}>
                    {character.tagline || character.description}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.chatFab}
                  onPress={() => {
                    router.push(`/character/${character.id}`);
                  }}
                >
                  <Ionicons name="chatbubble" size={20} color="#fff" />
                </TouchableOpacity>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        <View style={{ height: spacing['3xl'] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingTop: spacing.base, marginBottom: spacing.lg,
  },
  welcomeText: { fontSize: typography.size.sm, color: colors.textSecondary },
  userName: { fontSize: typography.size['2xl'], fontWeight: '700', color: colors.textPrimary },
  avatarContainer: {},
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: typography.size.lg, fontWeight: '700', color: '#fff' },

  // Pro Banner
  proBanner: {
    marginHorizontal: spacing.base, borderRadius: borderRadius.xl,
    padding: spacing.lg, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: 'rgba(124, 58, 237, 0.3)',
  },
  proBadge: {
    backgroundColor: 'rgba(124, 58, 237, 0.3)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full, alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  proBadgeText: { fontSize: typography.size.xs, color: colors.primaryLight, fontWeight: '600' },
  proBannerTitle: { fontSize: typography.size.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.xs },
  proBannerSubtitle: { fontSize: typography.size.sm, color: colors.textSecondary },

  // Create CTA
  createButton: {
    marginHorizontal: spacing.base, height: 54, borderRadius: borderRadius.xl,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginBottom: spacing.xl,
  },
  createButtonText: { fontSize: typography.size.md, fontWeight: '600', color: '#fff' },

  // Sections
  section: { paddingLeft: spacing.base, marginBottom: spacing.xl },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: spacing.lg, paddingRight: spacing.base,
  },
  sectionTitle: { fontSize: typography.size.xl, fontWeight: '700', color: colors.textPrimary },
  viewAll: { fontSize: typography.size.sm, color: colors.primaryLight, fontWeight: '500' },

  // Recent Chats
  recentChat: { alignItems: 'center', marginRight: spacing.xl, width: 72 },
  recentAvatar: { position: 'relative', marginBottom: spacing.sm },
  recentAvatarImg: {
    width: 64, height: 64, borderRadius: 32,
    justifyContent: 'center', alignItems: 'center',
  },
  recentAvatarText: { fontSize: typography.size.xl, fontWeight: '700', color: '#fff' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    backgroundColor: colors.online, borderWidth: 2, borderColor: colors.background,
  },
  recentName: {
    fontSize: typography.size.sm, fontWeight: '600', color: colors.textPrimary,
    textAlign: 'center',
  },
  recentPreview: {
    fontSize: typography.size.xs, color: colors.textMuted,
    textAlign: 'center', marginTop: 2,
  },

  // Featured Cards
  featuredCard: {
    marginRight: spacing.base, marginBottom: spacing.md,
    borderRadius: borderRadius.xl, overflow: 'hidden',
    height: 220, backgroundColor: colors.surface,
  },
  featuredOverlay: {
    flex: 1, justifyContent: 'flex-end', padding: spacing.base,
  },
  featuredBadge: {
    position: 'absolute', top: spacing.md, left: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.6)', paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.sm,
  },
  featuredBadgeText: { fontSize: typography.size.xs, color: colors.textPrimary, fontWeight: '500' },
  featuredInfo: { flex: 1, justifyContent: 'flex-end' },
  featuredName: { fontSize: typography.size.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  featuredDesc: { fontSize: typography.size.sm, color: colors.textSecondary, lineHeight: typography.lineHeight.sm },
  chatFab: {
    position: 'absolute', bottom: spacing.base, right: spacing.base,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
});
