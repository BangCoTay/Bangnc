import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useCharacterStore } from '../../src/stores/characterStore';

export default function MyCharactersScreen() {
  const { myCharacters, fetchMyCharacters, isLoading } = useCharacterStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMyCharacters();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchMyCharacters();
    setRefreshing(false);
  };

  const renderCard = (item: any) => (
    <TouchableOpacity
      key={item.id}
      style={styles.card}
      onPress={() => router.push(`/character/${item.id}` as any)}
      activeOpacity={0.85}
    >
      <View style={StyleSheet.absoluteFill}>
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.cardImage} contentFit="cover" />
        ) : (
          <LinearGradient colors={[colors.surface, "#1A1A2E"]} style={styles.cardImage} />
        )}
      </View>
      <LinearGradient colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.95)"]} locations={[0, 0.5, 1]} style={styles.gradientOverlay} />
      {item.is_nsfw && (
        <View style={styles.nsfwBadge}>
          <Text style={styles.nsfwText}>18+</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardTagline} numberOfLines={2}>{item.tagline || item.description || ""}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Characters</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {!isLoading && myCharacters.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="create-outline" size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>You haven't created any characters yet.</Text>
            <TouchableOpacity style={styles.createButton} onPress={() => router.push('/character/create' as any)}>
              <Text style={styles.createButtonText}>Create Character</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {myCharacters.map((item) => renderCard(item))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  headerTitle: { fontSize: typography.size.lg, fontWeight: '600', color: colors.textPrimary },
  content: { padding: spacing.base, paddingBottom: spacing['4xl'] },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyText: { color: colors.textSecondary, marginTop: spacing.md, fontSize: typography.size.base },
  createButton: {
    marginTop: spacing.xl, backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl, paddingVertical: spacing.md, borderRadius: borderRadius.full,
  },
  createButtonText: { color: '#fff', fontSize: typography.size.base, fontWeight: '600' },

  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: {
    width: '48%', height: 300, borderRadius: borderRadius.lg,
    overflow: 'hidden', backgroundColor: '#1A1A2E', marginBottom: 12,
  },
  cardImage: { width: '100%', height: '100%' },
  gradientOverlay: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%' },
  nsfwBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    backgroundColor: 'rgba(217, 47, 116, 0.9)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4,
  },
  nsfwText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  cardInfo: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 12 },
  cardName: { color: '#FFF', fontSize: 16, fontWeight: '900', marginBottom: 2 },
  cardTagline: {
    color: '#DDD', fontSize: 12, lineHeight: 16, marginBottom: 8,
    textShadowColor: 'rgba(0,0,0,0.8)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3,
  },
});
