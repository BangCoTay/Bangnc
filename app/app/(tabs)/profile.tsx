import React, { useEffect, useState, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  RefreshControl,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius } from "../../src/theme";
import { useAuthStore } from "../../src/stores/authStore";
import { useCharacterStore } from "../../src/stores/characterStore";

export default function ProfileScreen() {
  const { user, logout, loadProfile } = useAuthStore();
  const { myCharacters, favorites, fetchMyCharacters, fetchFavorites } =
    useCharacterStore();
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      fetchMyCharacters();
      fetchFavorites();
    }, []),
  );

  useEffect(() => {
    fetchMyCharacters();
    fetchFavorites();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchMyCharacters(), fetchFavorites()]);
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/auth/login");
        },
      },
    ]);
  };

  const StatCard = ({
    icon,
    value,
    label,
  }: {
    icon: string;
    value: number | string;
    label: string;
  }) => (
    <View style={styles.statCard}>
      <Ionicons name={icon as any} size={20} color={colors.primary} />
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const MenuItem = ({
    icon,
    label,
    onPress,
    danger,
  }: {
    icon: string;
    label: string;
    onPress: () => void;
    danger?: boolean;
  }) => (
    <TouchableOpacity
      style={styles.menuItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon as any}
        size={22}
        color={danger ? colors.error : colors.textSecondary}
      />
      <Text style={[styles.menuLabel, danger && { color: colors.error }]}>
        {label}
      </Text>
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarSection}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <LinearGradient
                colors={[colors.primary, colors.accent]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>
                  {(user?.display_name ||
                    user?.username ||
                    "U")[0].toUpperCase()}
                </Text>
              </LinearGradient>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.displayName}>
                {user?.display_name || user?.username}
              </Text>
              <Text style={styles.username}>@{user?.username}</Text>
              <View style={styles.tierBadge}>
                <Text style={styles.tierText}>
                  {(user?.subscription_tier || "free").toUpperCase()}
                </Text>
              </View>
            </View>
          </View>
          {user?.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <StatCard
            icon="create-outline"
            value={myCharacters.length}
            label="Created"
          />
          <StatCard
            icon="heart-outline"
            value={favorites.length}
            label="Favorites"
          />
          <StatCard
            icon="wallet-outline"
            value={user?.coin_balance || 0}
            label="Coins"
          />
        </View>

        {/* Subscription Banner */}
        {user?.subscription_tier === "free" && (
          <TouchableOpacity
            onPress={() => router.push("/subscription")}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.upgradeBanner}
            >
              <Ionicons name="diamond-outline" size={24} color="#fff" />
              <View style={{ flex: 1, marginLeft: spacing.md }}>
                <Text style={styles.upgradeBannerTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeBannerSubtitle}>
                  Unlimited messages & memory
                </Text>
              </View>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {/* Menu */}
        <View style={styles.menuSection}>
          <MenuItem
            icon="person-outline"
            label="Edit Profile"
            onPress={() => router.push("/settings")}
          />
          <MenuItem
            icon="create-outline"
            label="My Characters"
            onPress={() => router.push("/character/my-characters")}
          />
          <MenuItem
            icon="heart-outline"
            label="Favorites"
            onPress={() => router.push("/character/favorites")}
          />
          <MenuItem
            icon="card-outline"
            label="Subscription"
            onPress={() => router.push("/subscription")}
          />
          <View style={styles.menuDivider} />
          <MenuItem
            icon="log-out-outline"
            label="Sign Out"
            onPress={handleLogout}
            danger
          />
        </View>

        <View style={{ height: spacing["3xl"] }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  profileHeader: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  avatarSection: { flexDirection: "row", alignItems: "center" },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: typography.size["2xl"],
    fontWeight: "700",
    color: "#fff",
  },
  userInfo: { marginLeft: spacing.base, flex: 1 },
  displayName: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  username: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  tierBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    alignSelf: "flex-start",
    marginTop: spacing.xs,
  },
  tierText: {
    fontSize: typography.size.xs,
    color: colors.primaryLight,
    fontWeight: "600",
  },
  bio: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginTop: spacing.md,
    lineHeight: typography.lineHeight.sm,
  },

  statsRow: {
    flexDirection: "row",
    paddingHorizontal: spacing.base,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statValue: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.size.xs,
    color: colors.textMuted,
    marginTop: 2,
  },

  upgradeBanner: {
    marginHorizontal: spacing.base,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.base,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: spacing.xl,
  },
  upgradeBannerTitle: {
    fontSize: typography.size.base,
    fontWeight: "600",
    color: "#fff",
  },
  upgradeBannerSubtitle: {
    fontSize: typography.size.xs,
    color: "rgba(255,255,255,0.7)",
  },

  menuSection: {
    marginHorizontal: spacing.base,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    overflow: "hidden",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md + 2,
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.textPrimary,
    marginLeft: spacing.md,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.divider,
    marginHorizontal: spacing.base,
  },
});

