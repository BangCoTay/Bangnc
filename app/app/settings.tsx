import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ScrollView, Alert, ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../src/theme';
import { useAuthStore } from '../src/stores/authStore';
import { api } from '../src/services/api';

export default function SettingsScreen() {
  const { user, setUser, logout } = useAuthStore();
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/user/profile', {
        display_name: displayName.trim(),
        bio: bio.trim() || null,
      });
      if (response.data.success) {
        setUser(response.data.data);
        Alert.alert('Success', 'Profile updated!');
      }
    } catch {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <TouchableOpacity onPress={handleSave} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.primary} size="small" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Edit Profile Section */}
        <Text style={styles.sectionTitle}>Profile</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Display Name</Text>
          <TextInput
            style={styles.input}
            value={displayName}
            onChangeText={setDisplayName}
            placeholderTextColor={colors.textMuted}
            placeholder="Your display name"
            maxLength={50}
          />

          <Text style={[styles.label, { marginTop: spacing.lg }]}>Bio</Text>
          <TextInput
            style={[styles.input, styles.bioInput]}
            value={bio}
            onChangeText={setBio}
            placeholderTextColor={colors.textMuted}
            placeholder="Tell us about yourself..."
            multiline
            maxLength={500}
          />
        </View>

        {/* Account Info */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Email</Text>
            <Text style={styles.infoValue}>••••@••••</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Username</Text>
            <Text style={styles.infoValue}>@{user?.username}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Tier</Text>
            <Text style={[styles.infoValue, { color: colors.primary }]}>
              {(user?.subscription_tier || 'free').toUpperCase()}
            </Text>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={styles.signOutButton}
          onPress={() => {
            Alert.alert('Sign Out', 'Are you sure?', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign Out', style: 'destructive', onPress: async () => { await logout(); router.replace('/auth/login'); } },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AI Companions v1.0.0</Text>
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
  saveText: { fontSize: typography.size.base, fontWeight: '600', color: colors.primary },
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  sectionTitle: {
    fontSize: typography.size.sm, fontWeight: '600', color: colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1, marginBottom: spacing.sm, marginTop: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    padding: spacing.base, borderWidth: 1, borderColor: colors.cardBorder,
  },
  label: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xs },
  input: {
    backgroundColor: colors.inputBg, borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.base, paddingVertical: spacing.md,
    fontSize: typography.size.base, color: colors.textPrimary,
    borderWidth: 1, borderColor: colors.inputBorder,
  },
  bioInput: { height: 100, textAlignVertical: 'top' },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  infoLabel: { fontSize: typography.size.base, color: colors.textSecondary },
  infoValue: { fontSize: typography.size.base, color: colors.textPrimary, fontWeight: '500' },
  signOutButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: spacing.sm, marginTop: spacing['2xl'], paddingVertical: spacing.md,
    backgroundColor: colors.surface, borderRadius: borderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(239, 68, 68, 0.2)',
  },
  signOutText: { fontSize: typography.size.base, fontWeight: '600', color: colors.error },
  version: {
    textAlign: 'center', fontSize: typography.size.xs, color: colors.textMuted,
    marginTop: spacing.xl,
  },
});
