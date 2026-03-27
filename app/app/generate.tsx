import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Alert, Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../src/theme';
import { premiumService } from '../src/services/premium.service';
import { IMAGE_GEN_COST } from '@ai-companions/shared';
import type { GenerationRequest } from '@ai-companions/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - spacing.base * 2 - spacing.sm) / 2;

const STYLE_OPTIONS = [
  { value: 'vivid', label: '✨ Vivid' },
  { value: 'natural', label: '🌿 Natural' },
  { value: 'anime', label: '🎨 Anime' },
  { value: 'fantasy', label: '🐉 Fantasy' },
  { value: 'cyberpunk', label: '🤖 Cyberpunk' },
];

export default function GenerateScreen() {
  const [prompt, setPrompt] = useState('');
  const [style, setStyle] = useState('vivid');
  const [generating, setGenerating] = useState(false);
  const [generations, setGenerations] = useState<GenerationRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const result = await premiumService.getGenerations();
      setGenerations(result.data || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() || generating) return;
    setGenerating(true);
    try {
      const result = await premiumService.generateImage(prompt, style);
      setGenerations((prev) => [result, ...prev]);
      setPrompt('');
      Alert.alert('🎨 Image Generated!', 'Your image has been created.');
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Image Studio</Text>
        <TouchableOpacity onPress={() => router.push('/coins' as any)}>
          <Ionicons name="sparkles" size={22} color="#F59E0B" />
        </TouchableOpacity>
      </View>

      <FlatList
        ListHeaderComponent={
          <View>
            {/* Prompt Input */}
            <View style={styles.promptCard}>
              <TextInput
                style={styles.promptInput}
                placeholder="Describe the image you want to create..."
                placeholderTextColor={colors.textMuted}
                value={prompt}
                onChangeText={setPrompt}
                multiline
                numberOfLines={3}
                maxLength={500}
              />

              {/* Style Picker */}
              <View style={styles.styleRow}>
                {STYLE_OPTIONS.map((s) => (
                  <TouchableOpacity
                    key={s.value}
                    style={[styles.styleChip, style === s.value && styles.styleChipActive]}
                    onPress={() => setStyle(s.value)}
                  >
                    <Text style={[styles.styleChipText, style === s.value && styles.styleChipTextActive]}>
                      {s.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Generate Button */}
              <TouchableOpacity
                onPress={handleGenerate}
                disabled={!prompt.trim() || generating}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
                  style={[styles.generateBtn, (!prompt.trim() || generating) && styles.generateBtnDisabled]}
                >
                  {generating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="sparkles" size={20} color="#fff" />
                      <Text style={styles.generateBtnText}>
                        Generate ({IMAGE_GEN_COST} coins)
                      </Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Gallery Title */}
            <Text style={styles.sectionTitle}>Your Gallery</Text>
          </View>
        }
        data={generations.filter((g) => g.status === 'completed' && g.result_url)}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.galleryRow}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.imageCard}>
            <Image
              source={{ uri: item.result_url! }}
              style={styles.galleryImage}
              contentFit="cover"
            />
            <Text style={styles.imagePrompt} numberOfLines={2}>
              {item.prompt}
            </Text>
          </View>
        )}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="image-outline" size={48} color={colors.textMuted} />
              <Text style={styles.emptyText}>No images yet. Create your first one!</Text>
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
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: typography.size.lg, fontWeight: '700', color: colors.textPrimary },

  scrollContent: { paddingBottom: 100 },
  promptCard: {
    marginHorizontal: spacing.base, marginBottom: spacing.xl,
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.base, borderWidth: 1, borderColor: colors.cardBorder,
  },
  promptInput: {
    fontSize: typography.size.base, color: colors.textPrimary,
    minHeight: 80, textAlignVertical: 'top',
  },
  styleRow: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    marginVertical: spacing.md,
  },
  styleChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surfaceLight,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  styleChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  styleChipText: { fontSize: typography.size.xs, color: colors.textSecondary },
  styleChipTextActive: { color: colors.primaryLight, fontWeight: '600' },

  generateBtn: {
    borderRadius: borderRadius.xl, paddingVertical: spacing.md,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
  },
  generateBtnDisabled: { opacity: 0.5 },
  generateBtnText: { fontSize: typography.size.md, fontWeight: '600', color: '#fff' },

  sectionTitle: {
    fontSize: typography.size.lg, fontWeight: '700', color: colors.textPrimary,
    paddingHorizontal: spacing.base, marginBottom: spacing.md,
  },
  galleryRow: { paddingHorizontal: spacing.base, gap: spacing.sm },
  imageCard: {
    width: IMAGE_SIZE, borderRadius: borderRadius.lg, overflow: 'hidden',
    backgroundColor: colors.surface, marginBottom: spacing.sm,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  galleryImage: { width: IMAGE_SIZE, height: IMAGE_SIZE },
  imagePrompt: {
    fontSize: typography.size.xs, color: colors.textSecondary,
    padding: spacing.sm,
  },

  emptyState: { alignItems: 'center', marginTop: spacing['2xl'] },
  emptyText: { fontSize: typography.size.sm, color: colors.textMuted, marginTop: spacing.md },
});
