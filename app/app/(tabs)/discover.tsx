import React, { useEffect, useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList,
  Dimensions, RefreshControl, ActivityIndicator, ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useCharacterStore } from '../../src/stores/characterStore';
import { CATEGORIES } from '@ai-companions/shared';
import type { Character } from '@ai-companions/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - spacing.base * 3) / 2;

const FILTER_CHIPS = ['All', 'Category', 'Personality', 'Use Case'] as const;

export default function DiscoverScreen() {
  const {
    characters, isLoading, isLoadingMore, hasMore, total,
    fetchCharacters, fetchMore, setFilter, filters, clearFilters,
  } = useCharacterStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeChip, setActiveChip] = useState<string>('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCharacters(true);
  }, [filters.gender, filters.style, filters.category, filters.sort]);

  const handleSearch = useCallback(() => {
    setFilter('search', searchQuery.trim() || undefined);
    fetchCharacters(true);
  }, [searchQuery]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCharacters(true);
    setRefreshing(false);
  };

  const handleCategoryPress = (category: string) => {
    if (filters.category === category) {
      setFilter('category', undefined);
    } else {
      setFilter('category', category);
    }
  };

  const renderCharacterCard = ({ item }: { item: Character }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/character/${item.id}`)}
      activeOpacity={0.75}
    >
      <View style={styles.cardImageContainer}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.cardImage} />
        ) : (
          <LinearGradient
            colors={[colors.primary, colors.accent]}
            style={styles.cardImage}
          >
            <Text style={styles.cardInitial}>{item.name[0]}</Text>
          </LinearGradient>
        )}
        {item.is_nsfw && (
          <View style={styles.nsfwBadge}>
            <Text style={styles.nsfwText}>18+</Text>
          </View>
        )}
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardTagline} numberOfLines={2}>{item.tagline || item.description}</Text>
        <View style={styles.cardStats}>
          <Ionicons name="chatbubble-outline" size={12} color={colors.textMuted} />
          <Text style={styles.cardStatText}>{item.chat_count || 0}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const ListHeader = () => (
    <View>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color={colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for AI companions..."
          placeholderTextColor={colors.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => { setSearchQuery(''); setFilter('search', undefined); fetchCharacters(true); }}>
            <Ionicons name="close-circle" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Filter Chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipContainer}
      >
        {FILTER_CHIPS.map((chip) => (
          <TouchableOpacity
            key={chip}
            style={[styles.chip, activeChip === chip && styles.chipActive]}
            onPress={() => setActiveChip(chip)}
          >
            <Text style={[styles.chipText, activeChip === chip && styles.chipTextActive]}>{chip}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Categories Grid */}
      <View style={styles.categoriesSection}>
        <Text style={styles.sectionTitle}>Categories</Text>
        <View style={styles.categoriesGrid}>
          {CATEGORIES.slice(0, 6).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryCard,
                filters.category === cat && styles.categoryCardActive,
              ]}
              onPress={() => handleCategoryPress(cat)}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={
                  filters.category === cat
                    ? [colors.primary, colors.accent]
                    : ['rgba(26,26,46,0.9)', 'rgba(22,33,62,0.9)']
                }
                style={styles.categoryGradient}
              >
                <Text style={styles.categoryText}>{cat}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Trending Section Header */}
      <View style={styles.trendingHeader}>
        <Text style={styles.sectionTitle}>Trending Now</Text>
        <Text style={styles.resultCount}>{total} companions</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        renderItem={renderCharacterCard}
        numColumns={2}
        columnWrapperStyle={styles.row}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={() => hasMore && fetchMore()}
        onEndReachedThreshold={0.3}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListFooterComponent={
          isLoadingMore ? (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing.lg }} />
          ) : null
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.empty}>
              <Ionicons name="search" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No companions found</Text>
              <Text style={styles.emptySubtext}>Try a different search or filter</Text>
            </View>
          ) : (
            <ActivityIndicator color={colors.primary} style={{ paddingVertical: spacing['3xl'] }} />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: spacing['3xl'] },
  row: { paddingHorizontal: spacing.base, gap: spacing.base },

  // Search
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.inputBg, borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.base, marginHorizontal: spacing.base,
    marginTop: spacing.base, marginBottom: spacing.lg,
    borderWidth: 1, borderColor: colors.inputBorder, height: 48,
  },
  searchInput: {
    flex: 1, fontSize: typography.size.base, color: colors.textPrimary,
    marginLeft: spacing.sm,
  },

  // Chips
  chipContainer: {
    paddingHorizontal: spacing.base, gap: spacing.sm,
    marginBottom: spacing.xl, flexDirection: 'row',
  },
  chip: {
    paddingHorizontal: spacing.base, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.cardBorder, marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: typography.size.sm, color: colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#fff' },

  // Categories
  categoriesSection: { paddingHorizontal: spacing.base, marginBottom: spacing.xl },
  sectionTitle: { fontSize: typography.size.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryCard: { width: (SCREEN_WIDTH - spacing.base * 2 - spacing.sm) / 2, height: 80, borderRadius: borderRadius.lg, overflow: 'hidden' },
  categoryCardActive: { borderWidth: 2, borderColor: colors.primary },
  categoryGradient: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    borderRadius: borderRadius.lg,
  },
  categoryText: { fontSize: typography.size.md, fontWeight: '600', color: colors.textPrimary },

  // Trending
  trendingHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, marginBottom: spacing.lg,
  },
  resultCount: { fontSize: typography.size.sm, color: colors.textMuted },

  // Cards
  card: {
    width: CARD_WIDTH, backgroundColor: colors.surface,
    borderRadius: borderRadius.xl, overflow: 'hidden',
    borderWidth: 1, borderColor: colors.cardBorder, marginBottom: spacing.base,
  },
  cardImageContainer: { width: '100%', height: CARD_WIDTH * 1.1, position: 'relative' },
  cardImage: { width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' },
  cardInitial: { fontSize: typography.size['4xl'], fontWeight: '700', color: '#fff' },
  nsfwBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(239, 68, 68, 0.8)', paddingHorizontal: spacing.sm,
    paddingVertical: 2, borderRadius: borderRadius.sm,
  },
  nsfwText: { fontSize: typography.size.xs, color: '#fff', fontWeight: '600' },
  cardInfo: { padding: spacing.md },
  cardName: { fontSize: typography.size.base, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  cardTagline: { fontSize: typography.size.xs, color: colors.textSecondary, lineHeight: typography.lineHeight.xs, marginBottom: spacing.sm },
  cardStats: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardStatText: { fontSize: typography.size.xs, color: colors.textMuted },

  // Empty
  empty: { alignItems: 'center', paddingVertical: spacing['3xl'] },
  emptyText: { fontSize: typography.size.lg, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.lg },
  emptySubtext: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.xs },
});
