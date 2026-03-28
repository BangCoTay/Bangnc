import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api } from "../../src/services/api";
import { colors, typography, spacing, borderRadius } from "../../src/theme";
import { LinearGradient } from "expo-linear-gradient";

export default function AdminDashboardScreen() {
  const [stats, setStats] = useState({ users: 0, characters: 0 });
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await api.get("/admin/stats");
      if (res.data.success) {
        setStats(res.data.data);
      }
    } catch (err) {
      console.warn("Failed to load stats", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const StatCard = ({ title, value, icon, colors: gradientColors }: any) => (
    <LinearGradient
      colors={gradientColors}
      style={styles.card}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.cardContent}>
        <View>
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardValue}>{value}</Text>
        </View>
        <Ionicons name={icon} size={40} color="rgba(255,255,255,0.7)" />
      </View>
    </LinearGradient>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={fetchStats}
            tintColor={colors.primary}
          />
        }
      >
        <Text style={styles.header}>System Overview</Text>
        <View style={styles.grid}>
          <StatCard
            title="Total Users"
            value={stats.users}
            icon="people"
            colors={["#4facfe", "#00f2fe"]}
          />
          <StatCard
            title="Characters"
            value={stats.characters}
            icon="color-wand"
            colors={["#ff0844", "#ffb199"]}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg },
  header: {
    fontSize: typography.size.xl,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  grid: { gap: spacing.md },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: typography.size.sm,
    color: "rgba(255,255,255,0.9)",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: spacing.xs,
  },
  cardValue: {
    fontSize: typography.size["3xl"],
    fontWeight: "bold",
    color: "#ffffff",
  },
});
