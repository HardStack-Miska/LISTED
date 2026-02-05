import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { CustomFilter } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import { filterService } from "@/services/filters";

interface FilterListProps {
  filters: CustomFilter[];
  selectedFilterId?: string;
  onSelectFilter: (filter: CustomFilter) => void;
  onEditFilter?: (filter: CustomFilter) => void;
  onDeleteFilter?: (filterId: string) => void;
  onCreateFilter?: () => void;
  showPresets?: boolean;
}

export const FilterList: React.FC<FilterListProps> = ({
  filters,
  selectedFilterId,
  onSelectFilter,
  onEditFilter,
  onDeleteFilter,
  onCreateFilter,
  showPresets = true,
}) => {
  const { colors } = useTheme();

  const presetFilters = showPresets ? filterService.getPresetFilters() : [];
  const allFilters = [...presetFilters, ...filters];

  const renderFilterItem = ({ item }: { item: CustomFilter }) => {
    const isSelected = selectedFilterId === item.id;
    const isPreset = item.id.startsWith("preset-");

    return (
      <TouchableOpacity
        style={[
          styles.filterItem,
          {
            backgroundColor: isSelected ? colors.primaryLight : colors.surface,
            borderColor: isSelected ? colors.primary : colors.border,
          },
        ]}
        onPress={() => onSelectFilter(item)}
        onLongPress={() => !isPreset && onEditFilter?.(item)}
      >
        <View style={styles.filterLeft}>
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <View style={styles.filterInfo}>
            <Text
              style={[
                styles.filterName,
                { color: isSelected ? colors.primary : colors.text },
              ]}
            >
              {item.name}
            </Text>
            <Text
              style={[styles.filterDescription, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {filterService.getFilterDescription(item)}
            </Text>
          </View>
        </View>

        <View style={styles.filterActions}>
          {item.isFavorite && (
            <Ionicons
              name="star"
              size={16}
              color="#ffc107"
              style={styles.starIcon}
            />
          )}
          {!isPreset && onDeleteFilter && (
            <TouchableOpacity
              onPress={() => onDeleteFilter(item.id)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          )}
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={[styles.headerTitle, { color: colors.text }]}>Фильтры</Text>
      {onCreateFilter && (
        <TouchableOpacity onPress={onCreateFilter} style={styles.addButton}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderSectionHeader = (title: string) => (
    <Text style={[styles.sectionHeader, { color: colors.textSecondary }]}>
      {title}
    </Text>
  );

  return (
    <View style={styles.container}>
      {renderHeader()}

      {showPresets && presetFilters.length > 0 && (
        <>
          {renderSectionHeader("Быстрые фильтры")}
          {presetFilters.map((filter) => (
            <View key={filter.id}>{renderFilterItem({ item: filter })}</View>
          ))}
        </>
      )}

      {filters.length > 0 && (
        <>
          {renderSectionHeader("Мои фильтры")}
          <FlatList
            data={filters}
            renderItem={renderFilterItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </>
      )}

      {filters.length === 0 && onCreateFilter && (
        <TouchableOpacity
          style={[styles.emptyState, { borderColor: colors.border }]}
          onPress={onCreateFilter}
        >
          <Ionicons name="filter-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Создайте свой первый фильтр
          </Text>
          <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
            Фильтры помогают быстро находить нужные задачи
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
  },
  addButton: {
    padding: 4,
  },
  sectionHeader: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  filterItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  filterLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  filterInfo: {
    flex: 1,
  },
  filterName: {
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 2,
  },
  filterDescription: {
    fontSize: 12,
  },
  filterActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  starIcon: {
    marginRight: 4,
  },
  emptyState: {
    margin: 16,
    padding: 24,
    borderWidth: 1,
    borderStyle: "dashed",
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 12,
  },
  emptyHint: {
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
  },
});
