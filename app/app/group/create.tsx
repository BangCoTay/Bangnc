import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { groupService } from '../../src/services/group.service';
import { api } from '../../src/services/api';
import type { Character } from '@ai-companions/shared';

export default function CreateGroupScreen() {
  const [characters, setCharacters] = useState<Character[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    try {
      const response = await api.get('/characters', { params: { limit: 50 } });
      setCharacters(response.data.data.characters || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const toggleCharacter = (id: string) => {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((i) => i !== id);
      if (prev.length >= 5) {
        Alert.alert('Limit', 'Maximum 5 characters per group');
        return prev;
      }
      return [...prev, id];
    });
  };

  const handleCreate = async () => {
    if (selected.length < 2) {
      Alert.alert('Select More', 'Choose at least 2 characters for a group');
      return;
    }
    setCreating(true);
    try {
      const conversation = await groupService.createGroup(selected);
      router.replace(`/chat/${conversation.id}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="close" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Group Chat</Text>
        <Text style={styles.counter}>{selected.length}/5</Text>
      </View>

      <Text style={styles.subtitle}>
        Select 2-5 characters to start a group conversation
      </Text>

      {/* Character Selection Grid */}
      <FlatList
        data={characters}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={styles.grid}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <TouchableOpacity
              style={[styles.charCard, isSelected && styles.charCardSelected]}
              onPress={() => toggleCharacter(item.id)}
              activeOpacity={0.7}
            >
              {item.avatar_url ? (
                <Image source={{ uri: item.avatar_url }} style={styles.charAvatar} />
              ) : (
                <LinearGradient
                  colors={[colors.primary, colors.accent]}
                  style={styles.charAvatar}
                >
                  <Text style={styles.charAvatarText}>{item.name[0]}</Text>
                </LinearGradient>
              )}
              <Text style={styles.charName} numberOfLines={1}>{item.name}</Text>
              {isSelected && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={14} color="#fff" />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Create Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          onPress={handleCreate}
          disabled={selected.length < 2 || creating}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
            style={[styles.createBtn, selected.length < 2 && styles.createBtnDisabled]}
          >
            {creating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="people" size={20} color="#fff" />
                <Text style={styles.createBtnText}>
                  Create Group ({selected.length} characters)
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: typography.size.lg, fontWeight: '700', color: colors.textPrimary },
  counter: { fontSize: typography.size.md, fontWeight: '600', color: colors.primary },
  subtitle: {
    fontSize: typography.size.sm, color: colors.textSecondary,
    paddingHorizontal: spacing.base, marginBottom: spacing.lg,
  },

  grid: { paddingHorizontal: spacing.base, paddingBottom: 120 },
  charCard: {
    flex: 1, alignItems: 'center', margin: spacing.xs,
    padding: spacing.md, borderRadius: borderRadius.lg,
    backgroundColor: colors.surface, borderWidth: 2, borderColor: 'transparent',
  },
  charCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryMuted },
  charAvatar: {
    width: 60, height: 60, borderRadius: 30,
    justifyContent: 'center', alignItems: 'center', marginBottom: spacing.sm,
  },
  charAvatarText: { fontSize: typography.size.xl, fontWeight: '700', color: '#fff' },
  charName: { fontSize: typography.size.xs, color: colors.textPrimary, fontWeight: '500', textAlign: 'center' },
  checkBadge: {
    position: 'absolute', top: spacing.sm, right: spacing.sm,
    width: 22, height: 22, borderRadius: 11, backgroundColor: colors.primary,
    justifyContent: 'center', alignItems: 'center',
  },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.base, paddingVertical: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  createBtn: {
    borderRadius: borderRadius.xl, paddingVertical: spacing.md,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
  },
  createBtnDisabled: { opacity: 0.4 },
  createBtnText: { fontSize: typography.size.md, fontWeight: '600', color: '#fff' },
});
