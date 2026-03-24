import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import { useCharacterStore } from '../../src/stores/characterStore';
import { useChatStore } from '../../src/stores/chatStore';
import type { Character } from "@ai-companions/shared";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function CharacterDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { selectedCharacter, fetchCharacterById, toggleFavorite } =
    useCharacterStore();
  const { startConversation } = useChatStore();
  const [loading, setLoading] = useState(true);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (id) {
      fetchCharacterById(id).finally(() => setLoading(false));
    }
  }, [id]);

  const character = selectedCharacter;

  const handleStartChat = async () => {
    if (!character) return;
    setStartingChat(true);
    try {
      const conversation = await startConversation(character.id);
      router.push(`/chat/${conversation.id}`);
    } catch {
      setStartingChat(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!character) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Character not found</Text>
      </View>
    );
  }

  const personality = character.personality || {};

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Banner / Hero */}
        <View style={styles.hero}>
          {character.avatar_url || character.banner_url ? (
            <Image
              source={{ uri: character.banner_url || character.avatar_url }}
              style={styles.heroImage}
            />
          ) : (
            <LinearGradient
              colors={[colors.primary, colors.accent]}
              style={styles.heroImage}
            >
              <Text style={styles.heroInitial}>{character.name[0]}</Text>
            </LinearGradient>
          )}
          <LinearGradient
            colors={["transparent", colors.background]}
            style={styles.heroOverlay}
          />

          {/* Back button */}
          <SafeAreaView edges={["top"]} style={styles.backButtonContainer}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#fff" />
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => toggleFavorite(character.id)}
              >
                <Ionicons
                  name={character.is_favorited ? "heart" : "heart-outline"}
                  size={22}
                  color={character.is_favorited ? colors.error : "#fff"}
                />
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton}>
                <Ionicons name="share-outline" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>

        {/* Character Info */}
        <View style={styles.infoSection}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{character.name}</Text>
            {character.is_official && (
              <View style={styles.officialBadge}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={colors.primary}
                />
                <Text style={styles.officialText}>Official</Text>
              </View>
            )}
          </View>

          <Text style={styles.tagline}>{character.tagline}</Text>

          {/* Stats row */}
          <View style={styles.statsRow}>
            <View style={styles.statChip}>
              <Ionicons name="chatbubble" size={14} color={colors.primary} />
              <Text style={styles.statText}>{character.chat_count} chats</Text>
            </View>
            <View style={styles.statChip}>
              <Ionicons name="heart" size={14} color={colors.accentPink} />
              <Text style={styles.statText}>
                {character.favorite_count} likes
              </Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statText}>{character.style}</Text>
            </View>
            <View style={styles.statChip}>
              <Text style={styles.statText}>{character.gender}</Text>
            </View>
          </View>

          {/* Categories */}
          {character.categories && character.categories.length > 0 && (
            <View style={styles.categories}>
              {character.categories.map((cat) => (
                <View key={cat} style={styles.categoryBadge}>
                  <Text style={styles.categoryBadgeText}>{cat}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Description */}
          {character.description && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>About</Text>
              <Text style={styles.description}>{character.description}</Text>
            </View>
          )}

          {/* Personality traits */}
          {personality.traits && personality.traits.length > 0 && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Personality</Text>
              <View style={styles.traitContainer}>
                {personality.traits.map((trait) => (
                  <View key={trait} style={styles.traitChip}>
                    <Text style={styles.traitText}>{trait}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Interests */}
          {personality.interests && personality.interests.length > 0 && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>Interests</Text>
              <View style={styles.traitContainer}>
                {personality.interests.map((interest) => (
                  <View
                    key={interest}
                    style={[
                      styles.traitChip,
                      { borderColor: colors.accentCyan },
                    ]}
                  >
                    <Text
                      style={[styles.traitText, { color: colors.accentCyan }]}
                    >
                      {interest}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Greeting preview */}
          {character.greeting_message && (
            <View style={styles.descSection}>
              <Text style={styles.sectionTitle}>First Message</Text>
              <View style={styles.greetingCard}>
                <Text style={styles.greetingText}>
                  {character.greeting_message}
                </Text>
              </View>
            </View>
          )}
        </View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom CTA */}
      <View style={styles.bottomCTA}>
        <TouchableOpacity
          onPress={handleStartChat}
          disabled={startingChat}
          activeOpacity={0.85}
          style={{ flex: 1 }}
        >
          <LinearGradient
            colors={[colors.ctaGradientStart, colors.ctaGradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.chatButton}
          >
            {startingChat ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="chatbubble" size={20} color="#fff" />
                <Text style={styles.chatButtonText}>Start Chatting</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: { fontSize: typography.size.lg, color: colors.textSecondary },

  // Hero
  hero: { height: 340, position: "relative" },
  heroImage: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  heroInitial: { fontSize: 80, fontWeight: "700", color: "#fff" },
  heroOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
  },
  backButtonContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.base,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: { flexDirection: "row", gap: spacing.sm },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },

  // Info
  infoSection: { paddingHorizontal: spacing.base },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: typography.size["2xl"],
    fontWeight: "700",
    color: colors.textPrimary,
  },
  officialBadge: { flexDirection: "row", alignItems: "center", gap: 4 },
  officialText: {
    fontSize: typography.size.xs,
    color: colors.primary,
    fontWeight: "500",
  },
  tagline: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
    lineHeight: typography.lineHeight.base,
  },

  statsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  statText: { fontSize: typography.size.xs, color: colors.textSecondary },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  categoryBadge: {
    backgroundColor: colors.primaryMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  categoryBadgeText: {
    fontSize: typography.size.xs,
    color: colors.primaryLight,
    fontWeight: "500",
  },

  descSection: { marginBottom: spacing.xl },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: "600",
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  description: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.base,
  },

  traitContainer: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  traitChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  traitText: { fontSize: typography.size.xs, color: colors.primaryLight },

  greetingCard: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.base,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  greetingText: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    lineHeight: typography.lineHeight.sm,
    fontStyle: "italic",
  },

  // Bottom CTA
  bottomCTA: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.base,
    paddingBottom: spacing["2xl"],
    paddingTop: spacing.md,
    backgroundColor: colors.background,
  },
  chatButton: {
    height: 56,
    borderRadius: borderRadius.xl,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.sm,
  },
  chatButtonText: {
    fontSize: typography.size.md,
    fontWeight: "600",
    color: "#fff",
  },
});
