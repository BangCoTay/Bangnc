import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { Character } from '@ai-companions/shared';

export default function AdminCharactersScreen() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCharacters = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/characters');
      if (res.data.success) {
        setCharacters(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch characters', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCharacter = (char: Character) => {
    Alert.alert(
      'Delete Character',
      `Are you sure you want to delete ${char.name}? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/admin/characters/${char.id}`);
              if (res.data.success) {
                setCharacters(prev => prev.filter(c => c.id !== char.id));
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to delete character');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchCharacters();
  }, []);

  const renderItem = ({ item }: { item: Character }) => (
    <View style={styles.charCard}>
      <Image 
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/150' }}
        style={styles.avatar} 
        contentFit="cover"
      />
      <View style={styles.charInfo}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.tagline} numberOfLines={1}>{item.tagline || 'No tagline'}</Text>
        <View style={styles.metricsRow}>
          <View style={styles.metric}>
            <Ionicons name="chatbubbles-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metricText}>{item.chat_count}</Text>
          </View>
          <View style={styles.metric}>
            <Ionicons name="heart-outline" size={12} color={colors.textSecondary} />
            <Text style={styles.metricText}>{item.favorite_count}</Text>
          </View>
          <View style={[styles.badge, item.is_public ? styles.publicBadge : styles.privateBadge]}>
            <Text style={styles.badgeText}>{item.is_public ? 'Public' : 'Private'}</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => handleDeleteCharacter(item)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Characters ({characters.length})</Text>
      <FlatList
        data={characters}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchCharacters} tintColor={colors.primary}/>}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No characters found.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: typography.size.xl, fontWeight: '700', color: colors.textPrimary, padding: spacing.lg, paddingBottom: spacing.sm },
  listContent: { padding: spacing.lg, gap: spacing.md },
  charCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  avatar: { width: 60, height: 60, borderRadius: borderRadius.md, marginRight: spacing.md, backgroundColor: colors.surfaceBorder },
  charInfo: { flex: 1 },
  name: { fontSize: typography.size.lg, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  tagline: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  metricsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  metric: { flexDirection: 'row', alignItems: 'center', marginRight: spacing.sm },
  metricText: { fontSize: typography.size.xs, color: colors.textSecondary, marginLeft: 4 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: spacing.sm },
  publicBadge: { backgroundColor: colors.success + '20' },
  privateBadge: { backgroundColor: colors.warning + '20' },
  badgeText: { fontSize: 10, fontWeight: '600', color: colors.textPrimary },
  deleteButton: { padding: spacing.sm },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
});
