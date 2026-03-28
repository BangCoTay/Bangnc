import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { api } from '../../src/services/api';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import type { Profile } from '@ai-companions/shared';

export default function AdminUsersScreen() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/users');
      if (res.data.success) {
        setUsers(res.data.data);
      }
    } catch (err) {
      console.warn('Failed to fetch users', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBanUser = (user: Profile) => {
    Alert.alert(
      'Ban User',
      `Are you sure you want to ban ${user.username || 'this user'}? This will delete their account permanently.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Ban', 
          style: 'destructive',
          onPress: async () => {
            try {
              const res = await api.delete(`/admin/users/${user.id}`);
              if (res.data.success) {
                setUsers(prev => prev.filter(u => u.id !== user.id));
              }
            } catch (err: any) {
              Alert.alert('Error', err.response?.data?.error || 'Failed to ban user');
            }
          }
        }
      ]
    );
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const renderItem = ({ item }: { item: Profile }) => (
    <View style={styles.userCard}>
      <Image 
        source={{ uri: item.avatar_url || 'https://via.placeholder.com/150' }}
        style={styles.avatar} 
      />
      <View style={styles.userInfo}>
        <Text style={styles.username}>{item.username || 'Unnamed User'}</Text>
        <Text style={styles.details} numberOfLines={1}>
          {item.display_name || item.username} • {item.subscription_tier}
        </Text>
        <View style={styles.statsRow}>
          <Ionicons name="cash-outline" size={14} color={colors.primary} />
          <Text style={styles.statText}>{item.coin_balance} coins</Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.statTextJoined}>Joined {new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </View>
      <TouchableOpacity 
        style={styles.banButton} 
        onPress={() => handleBanUser(item)}
      >
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.header}>Users ({users.length})</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchUsers} tintColor={colors.primary}/>}
        ListEmptyComponent={
          !loading ? <Text style={styles.emptyText}>No users found.</Text> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { fontSize: typography.size.xl, fontWeight: '700', color: colors.textPrimary, padding: spacing.lg, paddingBottom: spacing.sm },
  listContent: { padding: spacing.lg, gap: spacing.md },
  userCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.surfaceBorder,
  },
  avatar: { width: 50, height: 50, borderRadius: 25, marginRight: spacing.md, backgroundColor: colors.surfaceBorder },
  userInfo: { flex: 1 },
  username: { fontSize: typography.size.md, fontWeight: '600', color: colors.textPrimary, marginBottom: 2 },
  details: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: 4 },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statText: { fontSize: typography.size.xs, color: colors.textPrimary, marginLeft: 4 },
  dot: { color: colors.textMuted, marginHorizontal: 6 },
  statTextJoined: { fontSize: typography.size.xs, color: colors.textMuted },
  banButton: { padding: spacing.sm },
  emptyText: { textAlign: 'center', color: colors.textSecondary, marginTop: spacing.xl },
});
