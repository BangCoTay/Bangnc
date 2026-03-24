import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Dimensions,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, typography, spacing, borderRadius } from "../../src/theme";
import { useCharacterStore } from "../../src/stores/characterStore";
import { CATEGORIES, CHARACTER_GENDERS, CHARACTER_STYLES } from "@ai-companions/shared";
import type { Character } from "@ai-companions/shared";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_GAP = 12;

const DISCOVER_TAGS = ["All", ...CATEGORIES];

type CardItem = Character;

export default function DiscoverScreen() {
  const {
    characters,
    isLoading,
    isLoadingMore,
    hasMore,
    total,
    fetchCharacters,
    fetchMore,
    setFilter,
    filters,
  } = useCharacterStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTag, setActiveTag] = useState<string>("All");
  const [refreshing, setRefreshing] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<"sort" | "gender" | "style" | null>(null);

  useEffect(() => {
    fetchCharacters(true);
  }, [filters.gender, filters.style, filters.category, filters.sort]);

  const handleSearch = useCallback(() => {
    setFilter("search", searchQuery.trim() || undefined);
    fetchCharacters(true);
  }, [searchQuery, setFilter, fetchCharacters]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCharacters(true);
    setRefreshing(false);
  };

  const handleTagPress = (tag: string) => {
    setActiveTag(tag);
    if (tag === "All") {
      setFilter("category", undefined);
    } else {
      setFilter("category", tag);
    }
  };

  const masonryData = characters;

  const renderCharacterCard = ({
    item,
    index,
  }: {
    item: CardItem;
    index: number;
  }) => {
    const cardHeight = 320;

    return (
      <TouchableOpacity
        key={item.id}
        style={[styles.card, { height: cardHeight }]}
        onPress={() => router.push(`/character/${item.id}`)}
        activeOpacity={0.85}
      >
        <View style={StyleSheet.absoluteFill}>
          {item.avatar_url ? (
            <Image
              source={{ uri: item.avatar_url }}
              style={styles.cardImage}
              contentFit="cover"
            />
          ) : (
            <LinearGradient
              colors={[colors.surface, "#1A1A2E"]}
              style={styles.cardImage}
            />
          )}
        </View>

        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.6)", "rgba(0,0,0,0.95)"]}
          locations={[0, 0.5, 1]}
          style={styles.gradientOverlay}
        />

        {item.is_nsfw && (
          <View style={styles.nsfwBadge}>
            <Text style={styles.nsfwText}>18+</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={styles.cardName} numberOfLines={1}>
            {item.name}
          </Text>

          <Text style={styles.cardTagline} numberOfLines={2}>
            {item.tagline || item.description || ""}
          </Text>

          {/* <View style={styles.cardStatsRow}>
            <View style={styles.statsGroup}>
              <Ionicons name="heart" size={12} color="#D92F74" />
              <Text style={styles.statText}>
                {item.like_count
                  ? (item.like_count / 1000).toFixed(1) + "k"
                  : "1.5k"}
              </Text>
            </View>
            <View style={styles.statsGroup}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={12}
                color="#A1A1AA"
              />
              <Text style={styles.statText}>
                {item.chat_count
                  ? (item.chat_count / 1000000).toFixed(1) + "M"
                  : "1.7M"}
              </Text>
            </View> */}
          {/* <Text style={styles.creatorText} numberOfLines={1}>
              @{item.creator_username || "bitmaster"}
            </Text> */}
          {/* </View> */}
        </View>
      </TouchableOpacity>
    );
  };


  const handleCycleSort = () => {
    setActiveDropdown("sort");
  };

  const handleCycleGender = () => {
    setActiveDropdown("gender");
  };

  const handleCycleStyle = () => {
    setActiveDropdown("style");
  };

  const renderDropdownModal = () => {
    if (!activeDropdown) return null;

    let options: { label: string; value: any }[] = [];
    let title = "";
    let currentValue: any;

    if (activeDropdown === "sort") {
      title = "Sort By";
      options = [
        { label: "Popular", value: "popular" },
        { label: "Newest", value: "newest" },
        { label: "Name", value: "name" },
      ];
      currentValue = filters.sort || "popular";
    } else if (activeDropdown === "gender") {
      title = "Filter Gender";
      options = [
        { label: "Any", value: undefined },
        ...CHARACTER_GENDERS.map(g => ({ label: g.label, value: g.value })),
      ];
      currentValue = filters.gender;
    } else if (activeDropdown === "style") {
      title = "Filter Style";
      options = [
        { label: "Any", value: undefined },
        ...CHARACTER_STYLES.map(s => ({ label: s.label, value: s.value })),
      ];
      currentValue = filters.style;
    }

    return (
      <Modal visible={true} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setActiveDropdown(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{title}</Text>
                  <TouchableOpacity onPress={() => setActiveDropdown(null)}>
                    <Ionicons name="close" size={24} color="#FFF" />
                  </TouchableOpacity>
                </View>
                {options.map((opt) => (
                  <TouchableOpacity
                    key={String(opt.value)}
                    style={[
                      styles.modalOption,
                      currentValue === opt.value && styles.modalOptionActive,
                    ]}
                    onPress={() => {
                      setFilter(activeDropdown, opt.value);
                      setActiveDropdown(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.modalOptionText,
                        currentValue === opt.value && styles.modalOptionTextActive,
                      ]}
                    >
                      {opt.label}
                    </Text>
                    {currentValue === opt.value && (
                      <Ionicons name="checkmark" size={20} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    );
  };

  const handleScroll = ({ nativeEvent }: any) => {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isCloseToBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 500;
    if (isCloseToBottom && hasMore && !isLoadingMore) {
      fetchMore();
    }
  };

  const ListHeader = () => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#666"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Try 'Busty blonde' or 'Petite asian'"
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        {searchQuery ? (
          <TouchableOpacity
            onPress={() => {
              setSearchQuery("");
              setFilter("search", undefined);
              fetchCharacters(true);
            }}
          >
            <Ionicons name="close-circle" size={18} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={handleCycleSort}
        >
          <Text style={styles.filterDropdownLabel}>Sort: </Text>
          <Text style={styles.filterDropdownValue}>
            {filters.sort
              ? filters.sort.charAt(0).toUpperCase() + filters.sort.slice(1)
              : "Popular"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={handleCycleGender}
        >
          <Text style={styles.filterDropdownLabel}>Gender: </Text>
          <Text style={styles.filterDropdownValue}>
            {filters.gender
              ? filters.gender.charAt(0).toUpperCase() + filters.gender.slice(1)
              : "Any"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color="#FFF"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.filterDropdown}
          onPress={handleCycleStyle}
        >
          <Text style={styles.filterDropdownLabel}>Style: </Text>
          <Text style={styles.filterDropdownValue}>
            {filters.style
              ? filters.style.charAt(0).toUpperCase() + filters.style.slice(1)
              : "Any"}
          </Text>
          <Ionicons
            name="chevron-down"
            size={14}
            color="#FFF"
            style={{ marginLeft: 4 }}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tagScrollView}
      >
        {DISCOVER_TAGS.map((tag) => (
          <TouchableOpacity
            key={tag}
            style={[
              styles.tagChip,
              activeTag === tag ? styles.tagChipActive : styles.tagChipInactive,
            ]}
            onPress={() => handleTagPress(tag)}
          >
            <Text
              style={[
                styles.tagText,
                activeTag === tag
                  ? styles.tagTextActive
                  : styles.tagTextInactive,
              ]}
            >
              {tag}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={{ flex: 1, paddingHorizontal: spacing.base }}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        <ListHeader />

        {!isLoading && masonryData.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="search" size={48} color="#666" />
            <Text style={styles.emptyText}>No companions found</Text>
          </View>
        ) : (
          <View style={styles.gridContainer}>
            {masonryData.map((item, idx) =>
              renderCharacterCard({ item, index: idx }),
            )}
          </View>
        )}

        {isLoadingMore ? (
          <ActivityIndicator
            color={colors.primary}
            style={{ paddingVertical: spacing.lg }}
          />
        ) : null}
      </ScrollView>
      {renderDropdownModal()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerContainer: { paddingBottom: spacing.sm },
  listContent: { paddingBottom: spacing["4xl"] },

  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.inputBg,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    marginTop: spacing.sm,
    height: 44,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#FFF",
  },

  filterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  filterDropdown: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceElevated,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  filterDropdownLabel: {
    color: "#A0A0A0",
    fontSize: 12,
  },
  filterDropdownValue: {
    color: "#FFF",
    fontSize: 12,
    fontWeight: "700",
  },

  tagScrollView: {
    marginTop: spacing.lg,
    paddingBottom: spacing.md,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  tagChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: borderRadius.full,
    marginRight: 6,
  },
  tagChipActive: {
    backgroundColor: colors.primary,
  },
  tagChipInactive: {
    backgroundColor: "transparent",
  },
  tagText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tagTextActive: {
    color: "#FFF",
  },
  tagTextInactive: {
    color: "#888",
  },

  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    borderRadius: borderRadius.lg,
    overflow: "hidden",
    backgroundColor: "#1A1A2E",
    marginBottom: COLUMN_GAP,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  gradientOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "60%",
  },
  nsfwBadge: {
    position: "absolute",
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: "rgba(217, 47, 116, 0.9)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nsfwText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },

  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
  },
  cardName: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "900",
    marginBottom: 2,
  },
  cardAge: {
    color: "#AAA",
    fontSize: 14,
    fontWeight: "600",
  },
  cardTagline: {
    color: "#DDD",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 8,
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cardStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  statsGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    color: "#FFF",
    fontSize: 11,
    fontWeight: "700",
  },
  creatorText: {
    color: "#888",
    fontSize: 10,
    marginLeft: "auto",
    flex: 1,
    textAlign: "right",
  },

  empty: {
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#888",
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.xl,
  },
  modalContent: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.lg,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  modalOptionActive: {
    backgroundColor: "rgba(124, 58, 237, 0.1)",
    borderRadius: borderRadius.md,
    marginHorizontal: -spacing.sm,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 0,
  },
  modalOptionText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  modalOptionTextActive: {
    color: colors.textPrimary,
    fontWeight: "700",
  },
});
