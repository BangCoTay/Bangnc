import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, typography, spacing, borderRadius } from '../src/theme';
import { useAuthStore } from '../src/stores/authStore';
import { premiumService } from '../src/services/premium.service';
import { PLANS } from '@ai-companions/shared';

type PlanKey = keyof typeof PLANS;

export default function SubscriptionScreen() {
  const user = useAuthStore((s) => s.user);
  const currentTier = (user?.subscription_tier || 'free') as string;

  const planColors: Record<string, string[]> = {
    free: [colors.surface, colors.surface],
    starter: ['#1a4040', '#0d3333'],
    pro: [colors.primaryDark, '#1a1040'],
    ultimate: ['#4a1942', '#1a0d33'],
  };

  const handleSubscribe = async (plan: 'starter' | 'pro' | 'ultimate') => {
    try {
      if (currentTier === plan) return;
      const sub = await premiumService.subscribe(plan);
      useAuthStore.getState().loadProfile(); // refresh user data
      Alert.alert('Subscription active!', 'Enjoy your new features.');
    } catch (err: any) {
      Alert.alert('Error', 'Error mocking purchase: ' + err.message);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Subscription</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Choose Your Plan</Text>
        <Text style={styles.subtitle}>Unlock more features and enhance your experience</Text>

        {(Object.entries(PLANS) as [string, typeof PLANS[PlanKey]][]).map(([key, plan]) => {
          const isCurrentPlan = currentTier === key;
          const gradientColors = planColors[key] || [colors.surface, colors.surface];

          return (
            <TouchableOpacity key={key} activeOpacity={0.85} style={styles.planCard}>
              <LinearGradient
                colors={gradientColors as [string, string]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.planGradient,
                  isCurrentPlan && styles.planGradientActive,
                ]}
              >
                <View style={styles.planHeader}>
                  <View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <Text style={styles.planPrice}>
                      {plan.price === 0 ? 'Free' : `$${plan.price}/mo`}
                    </Text>
                  </View>
                  {isCurrentPlan && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>

                <View style={styles.features}>
                  {plan.features.map((feature, i) => (
                    <View key={i} style={styles.featureRow}>
                      <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {!isCurrentPlan && key !== 'free' && (
                  <TouchableOpacity 
                    style={styles.selectButton} 
                    activeOpacity={0.8}
                    onPress={() => handleSubscribe(key as 'starter'|'pro'|'ultimate')}
                  >
                    <LinearGradient
                      colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.selectButtonGradient}
                    >
                      <Text style={styles.selectButtonText}>
                        {currentTier === 'free' ? 'Get Started' : 'Upgrade'}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        <Text style={styles.disclaimer}>
          Payment integration coming soon. Plans are for display purposes.
        </Text>
      </ScrollView>
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
  content: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  title: { fontSize: typography.size['2xl'], fontWeight: '700', color: colors.textPrimary, textAlign: 'center' },
  subtitle: { fontSize: typography.size.base, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl, marginTop: spacing.xs },

  planCard: { marginBottom: spacing.md },
  planGradient: {
    borderRadius: borderRadius.xl, padding: spacing.lg,
    borderWidth: 1, borderColor: colors.cardBorder,
  },
  planGradientActive: { borderColor: colors.primary, borderWidth: 2 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  planName: { fontSize: typography.size.xl, fontWeight: '700', color: colors.textPrimary },
  planPrice: { fontSize: typography.size.lg, fontWeight: '600', color: colors.primaryLight, marginTop: 4 },
  currentBadge: {
    backgroundColor: colors.primaryMuted, paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs, borderRadius: borderRadius.full,
  },
  currentBadgeText: { fontSize: typography.size.xs, color: colors.primaryLight, fontWeight: '600' },

  features: { gap: spacing.sm },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  featureText: { fontSize: typography.size.sm, color: colors.textSecondary, flex: 1 },

  selectButton: { marginTop: spacing.lg },
  selectButtonGradient: {
    height: 46, borderRadius: borderRadius.lg,
    justifyContent: 'center', alignItems: 'center',
  },
  selectButtonText: { fontSize: typography.size.base, fontWeight: '600', color: '#fff' },

  disclaimer: {
    fontSize: typography.size.xs, color: colors.textMuted,
    textAlign: 'center', marginTop: spacing.xl, fontStyle: 'italic',
  },
});
