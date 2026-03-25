import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../src/theme';
import { premiumService } from '../src/services/premium.service';
import type { CoinTransaction } from '@ai-companions/shared';

export default function CoinsScreen() {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<CoinTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [claiming, setClaiming] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [bal, txData] = await Promise.all([
        premiumService.getBalance(),
        premiumService.getTransactions(),
      ]);
      setBalance(bal);
      setTransactions(txData.transactions || []);
    } catch {} finally {
      setLoading(false);
    }
  };

  const handleClaimBonus = async () => {
    setClaiming(true);
    try {
      const tx = await premiumService.claimDailyBonus();
      setBalance((b) => b + 50);
      setTransactions((prev) => [tx, ...prev]);
      Alert.alert('🎉 Bonus Claimed!', 'You received 50 coins!');
    } catch (err: any) {
      Alert.alert('Already Claimed', err.response?.data?.error || 'Try again tomorrow');
    } finally {
      setClaiming(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'daily_bonus': return 'gift-outline';
      case 'purchase': return 'cart-outline';
      case 'spend': return 'flash-outline';
      case 'reward': return 'star-outline';
      case 'refund': return 'refresh-outline';
      default: return 'swap-horizontal-outline';
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
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Coins</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Balance Card */}
      <LinearGradient
        colors={['#F59E0B', '#D97706', '#B45309']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <View style={styles.balanceRow}>
          <Ionicons name="sparkles" size={32} color="#fff" />
          <Text style={styles.balanceValue}>{balance.toLocaleString()}</Text>
        </View>
        <Text style={styles.balanceSub}>Use coins for image generation & voice</Text>
      </LinearGradient>

      {/* Daily Bonus CTA */}
      <TouchableOpacity onPress={handleClaimBonus} disabled={claiming} activeOpacity={0.8}>
        <LinearGradient
          colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
          style={styles.bonusBtn}
        >
          {claiming ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="gift" size={22} color="#fff" />
              <Text style={styles.bonusBtnText}>Claim Daily Bonus (+50 coins)</Text>
            </>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {/* Transaction History */}
      <Text style={styles.sectionTitle}>Transaction History</Text>
      <FlatList
        data={transactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.txRow}>
            <View style={styles.txIconContainer}>
              <Ionicons name={getTransactionIcon(item.type) as any} size={20} color={colors.primary} />
            </View>
            <View style={styles.txInfo}>
              <Text style={styles.txDescription}>{item.description || item.type}</Text>
              <Text style={styles.txDate}>
                {new Date(item.created_at).toLocaleDateString()}
              </Text>
            </View>
            <Text style={[styles.txAmount, item.amount > 0 ? styles.txPositive : styles.txNegative]}>
              {item.amount > 0 ? '+' : ''}{item.amount}
            </Text>
          </View>
        )}
        contentContainerStyle={styles.txList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No transactions yet</Text>
        }
      />
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
  headerTitle: { fontSize: typography.size.lg, fontWeight: '600', color: colors.textPrimary },

  balanceCard: {
    marginHorizontal: spacing.base, borderRadius: borderRadius.xl,
    padding: spacing.xl, marginBottom: spacing.lg,
  },
  balanceLabel: { fontSize: typography.size.sm, color: 'rgba(255,255,255,0.8)', marginBottom: spacing.sm },
  balanceRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  balanceValue: { fontSize: 42, fontWeight: '800', color: '#fff' },
  balanceSub: { fontSize: typography.size.xs, color: 'rgba(255,255,255,0.6)', marginTop: spacing.md },

  bonusBtn: {
    marginHorizontal: spacing.base, borderRadius: borderRadius.xl, paddingVertical: spacing.md,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
    marginBottom: spacing['2xl'],
  },
  bonusBtnText: { fontSize: typography.size.md, fontWeight: '600', color: '#fff' },

  sectionTitle: {
    fontSize: typography.size.lg, fontWeight: '700', color: colors.textPrimary,
    paddingHorizontal: spacing.base, marginBottom: spacing.md,
  },
  txList: { paddingHorizontal: spacing.base, paddingBottom: 100 },
  txRow: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.md,
    borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  txIconContainer: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryMuted,
    justifyContent: 'center', alignItems: 'center', marginRight: spacing.md,
  },
  txInfo: { flex: 1 },
  txDescription: { fontSize: typography.size.sm, color: colors.textPrimary, fontWeight: '500' },
  txDate: { fontSize: typography.size.xs, color: colors.textMuted, marginTop: 2 },
  txAmount: { fontSize: typography.size.md, fontWeight: '700' },
  txPositive: { color: colors.success },
  txNegative: { color: colors.error },
  emptyText: { fontSize: typography.size.sm, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
});
