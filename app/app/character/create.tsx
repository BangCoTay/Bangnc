import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { characterService } from '../../src/services/character.service';
import { CATEGORIES, PERSONALITY_TRAITS, COMMUNICATION_STYLES, SPEAKING_TONES, CHARACTER_STYLES, CHARACTER_GENDERS } from '@ai-companions/shared';
import type { CreateCharacterRequest } from '@ai-companions/shared';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type NavStep = 1 | 2 | 3;

export default function CreateCharacterScreen() {
  const [step, setStep] = useState<NavStep>(1);
  const [loading, setLoading] = useState(false);

  // Form State
  const [form, setForm] = useState<Partial<CreateCharacterRequest>>({
    name: '',
    tagline: '',
    description: '',
    style: 'anime',
    gender: 'female',
    categories: [],
    is_nsfw: false,
    personality: {
      traits: [],
      interests: [],
      communication_style: COMMUNICATION_STYLES[0],
      speaking_tone: SPEAKING_TONES[0],
    },
    appearance: {
      hair_color: '',
      eye_color: '',
      body_type: '',
      outfit: '',
    },
    greeting_message: '',
  });

  const updateForm = (key: keyof CreateCharacterRequest, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const updateNested = (parent: 'personality' | 'appearance', key: string, value: any) => {
    setForm(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [key]: value,
      }
    }));
  };

  const toggleCategory = (cat: string) => {
    const current = form.categories || [];
    if (current.includes(cat)) {
      updateForm('categories', current.filter(c => c !== cat));
    } else {
      updateForm('categories', [...current, cat]);
    }
  };

  const toggleTrait = (trait: string) => {
    const current = form.personality?.traits || [];
    if (current.includes(trait)) {
      updateNested('personality', 'traits', current.filter(t => t !== trait));
    } else {
      updateNested('personality', 'traits', [...current, trait]);
    }
  };

  const validateStep = () => {
    if (step === 1) {
      if (!form.name?.trim()) return 'Name is required';
      if (!form.tagline?.trim()) return 'Tagline is required';
      if (!form.categories?.length) return 'Select at least one category';
    }
    return null;
  };

  const handleNext = () => {
    const error = validateStep();
    if (error) {
      Alert.alert('Incomplete', error);
      return;
    }
    setStep(prev => (prev + 1) as NavStep);
  };

  const handleCreate = async () => {
    setLoading(true);
    try {
      const char = await characterService.create(form as CreateCharacterRequest);
      Alert.alert('Success', 'Companion created successfully!', [
        { text: 'Great!', onPress: () => router.replace(`/(tabs)/discover`) }
      ]);
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to create companion');
    } finally {
      setLoading(false);
    }
  };

  const StepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepDotContainer}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]} />
          {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => step > 1 ? setStep((step - 1) as NavStep) : router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Companion</Text>
        <View style={{ width: 24 }} />
      </View>

      <StepIndicator />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Basic Info</Text>
            
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={t => updateForm('name', t)}
              placeholder="e.g. Luna Nightfall"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Tagline * (Short hook)</Text>
            <TextInput
              style={styles.input}
              value={form.tagline}
              onChangeText={t => updateForm('tagline', t)}
              placeholder="e.g. A mysterious vampire queen"
              placeholderTextColor={colors.textMuted}
              maxLength={100}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.description}
              onChangeText={t => updateForm('description', t)}
              placeholder="Describe their overall character..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Style & Gender</Text>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.subLabel}>Visual Style</Text>
                <View style={styles.pickerContainer}>
                  {CHARACTER_STYLES.map(s => (
                    <TouchableOpacity
                      key={s.value}
                      style={[styles.miniChip, form.style === s.value && styles.miniChipActive]}
                      onPress={() => updateForm('style', s.value)}
                    >
                      <Text style={[styles.miniChipText, form.style === s.value && styles.miniChipTextActive]}>{s.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={{ marginTop: spacing.lg }}>
              <Text style={styles.subLabel}>Gender</Text>
              <View style={styles.pickerContainer}>
                {CHARACTER_GENDERS.map(g => (
                  <TouchableOpacity
                    key={g.value}
                    style={[styles.miniChip, form.gender === g.value && styles.miniChipActive]}
                    onPress={() => updateForm('gender', g.value)}
                  >
                    <Text style={[styles.miniChipText, form.gender === g.value && styles.miniChipTextActive]}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <Text style={styles.label}>Categories * (Select up to 3)</Text>
            <View style={styles.chipGrid}>
              {CATEGORIES.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, form.categories?.includes(cat) && styles.chipActive]}
                  onPress={() => toggleCategory(cat)}
                >
                  <Text style={[styles.chipText, form.categories?.includes(cat) && styles.chipTextActive]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Personality & Voice</Text>

            <Text style={styles.label}>Traits (Select traits)</Text>
            <View style={styles.chipGrid}>
              {PERSONALITY_TRAITS.map(trait => (
                <TouchableOpacity
                  key={trait}
                  style={[styles.chip, form.personality?.traits?.includes(trait) && styles.chipActive]}
                  onPress={() => toggleTrait(trait)}
                >
                  <Text style={[styles.chipText, form.personality?.traits?.includes(trait) && styles.chipTextActive]}>{trait}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: spacing.xl }]}>Communication Style</Text>
            <View style={styles.pickerContainerVertical}>
              {COMMUNICATION_STYLES.map(style => (
                <TouchableOpacity
                  key={style}
                  style={[styles.fullChip, form.personality?.communication_style === style && styles.fullChipActive]}
                  onPress={() => updateNested('personality', 'communication_style', style)}
                >
                  <Text style={[styles.fullChipText, form.personality?.communication_style === style && styles.fullChipTextActive]}>{style}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.label, { marginTop: spacing.xl }]}>Speaking Tone</Text>
            <View style={styles.pickerContainerVertical}>
              {SPEAKING_TONES.map(tone => (
                <TouchableOpacity
                  key={tone}
                  style={[styles.fullChip, form.personality?.speaking_tone === tone && styles.fullChipActive]}
                  onPress={() => updateNested('personality', 'speaking_tone', tone)}
                >
                  <Text style={[styles.fullChipText, form.personality?.speaking_tone === tone && styles.fullChipTextActive]}>{tone}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={styles.sectionTitle}>Physical Appearance</Text>

            <Text style={styles.label}>Hair Color</Text>
            <TextInput
              style={styles.input}
              value={form.appearance?.hair_color}
              onChangeText={t => updateNested('appearance', 'hair_color', t)}
              placeholder="e.g. Jet black with crimson highlights"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Eye Color</Text>
            <TextInput
              style={styles.input}
              value={form.appearance?.eye_color}
              onChangeText={t => updateNested('appearance', 'eye_color', t)}
              placeholder="e.g. Deep red"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={styles.label}>Outfit Details</Text>
            <TextInput
              style={styles.input}
              value={form.appearance?.outfit}
              onChangeText={t => updateNested('appearance', 'outfit', t)}
              placeholder="e.g. Gothic silk gown"
              placeholderTextColor={colors.textMuted}
            />

            <Text style={[styles.sectionTitle, { marginTop: spacing['2xl'] }]}>Greeting Message</Text>
            <Text style={styles.subLabel}>This is the first message they say to you.</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={form.greeting_message}
              onChangeText={t => updateForm('greeting_message', t)}
              placeholder="*Luna smiles deviously as you enter the room* Welcome, mortal..."
              placeholderTextColor={colors.textMuted}
              multiline
              numberOfLines={3}
            />

            <TouchableOpacity style={styles.nsfwToggle} onPress={() => updateForm('is_nsfw', !form.is_nsfw)}>
              <Ionicons name={form.is_nsfw ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={form.is_nsfw ? colors.error : colors.textMuted} />
              <Text style={[styles.nsfwText, form.is_nsfw && { color: colors.error }]}>This character contains NSFW content</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelBtn} onPress={() => router.back()}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
        
        {step < 3 ? (
          <TouchableOpacity onPress={handleNext} activeOpacity={0.8} style={{ flex: 1 }}>
            <LinearGradient
              colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
              style={styles.nextBtn}
            >
              <Text style={styles.nextBtnText}>Next Step</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleCreate} disabled={loading} activeOpacity={0.8} style={{ flex: 1 }}>
            <LinearGradient
              colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
              style={styles.nextBtn}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Create Companion</Text>}
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
  },
  headerTitle: { fontSize: typography.size.lg, fontWeight: '600', color: colors.textPrimary },
  scrollContent: { paddingHorizontal: spacing.base, paddingBottom: 120 },
  
  stepIndicator: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    paddingVertical: spacing.md, gap: 4,
  },
  stepDotContainer: { flexDirection: 'row', alignItems: 'center' },
  stepDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surfaceLight },
  stepDotActive: { backgroundColor: colors.primary, width: 24 },
  stepLine: { width: 40, height: 2, backgroundColor: colors.surfaceLight, marginHorizontal: 4 },
  stepLineActive: { backgroundColor: colors.primary },

  stepContent: { paddingTop: spacing.md },
  sectionTitle: { fontSize: typography.size.xl, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  label: { fontSize: typography.size.base, fontWeight: '600', color: colors.textPrimary, marginTop: spacing.xl, marginBottom: spacing.md },
  subLabel: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  input: {
    backgroundColor: colors.inputBg, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: typography.size.base, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  textArea: { height: 100, textAlignVertical: 'top' },
  
  row: { flexDirection: 'row', gap: spacing.md },
  pickerContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  pickerContainerVertical: { gap: spacing.sm },
  
  miniChip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  miniChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  miniChipText: { fontSize: typography.size.sm, color: colors.textSecondary },
  miniChipTextActive: { color: '#fff', fontWeight: '500' },

  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  chipText: { fontSize: typography.size.xs, color: colors.textSecondary },
  chipTextActive: { color: colors.primaryLight, fontWeight: '600' },

  fullChip: {
    padding: spacing.md, borderRadius: borderRadius.lg,
    backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.cardBorder,
  },
  fullChipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
  fullChipText: { fontSize: typography.size.sm, color: colors.textSecondary },
  fullChipTextActive: { color: colors.primaryLight, fontWeight: '600' },

  nsfwToggle: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    marginTop: spacing['2xl'], padding: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
  },
  nsfwText: { fontSize: typography.size.sm, color: colors.textSecondary },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: colors.background, padding: spacing.base,
    paddingBottom: spacing['2xl'], flexDirection: 'row', gap: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  cancelBtn: { paddingHorizontal: spacing.xl, justifyContent: 'center' },
  cancelBtnText: { color: colors.textMuted, fontSize: typography.size.base },
  nextBtn: {
    flex: 1, height: 54, borderRadius: borderRadius.xl,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
  },
  nextBtnText: { color: '#fff', fontSize: typography.size.md, fontWeight: '600' },
});
