import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ActivityLogEntry, ActivityType } from "@/types";
import { useTheme } from "@/contexts/ThemeContext";
import { activityService } from "@/services/activity";

interface ActivityHistoryProps {
  entries?: ActivityLogEntry[];
  showStats?: boolean;
  limit?: number;
  onEntryPress?: (entry: ActivityLogEntry) => void;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: string; color: string; label: string }
> = {
  task_created: {
    icon: "add-circle",
    color: "#4caf50",
    label: "Создана задача",
  },
  task_completed: {
    icon: "checkmark-circle",
    color: "#2196f3",
    label: "Завершена задача",
  },
  task_uncompleted: {
    icon: "arrow-undo-circle",
    color: "#ff9800",
    label: "Возобновлена задача",
  },
  task_updated: {
    icon: "create",
    color: "#9c27b0",
    label: "Изменена задача",
  },
  task_deleted: {
    icon: "trash",
    color: "#f44336",
    label: "Удалена задача",
  },
  task_moved: {
    icon: "swap-horizontal",
    color: "#607d8b",
    label: "Перемещена задача",
  },
  reminder_set: {
    icon: "alarm",
    color: "#00bcd4",
    label: "Установлено напоминание",
  },
  reminder_triggered: {
    icon: "notifications",
    color: "#ff5722",
    label: "Сработало напоминание",
  },
};

export const ActivityHistory: React.FC<ActivityHistoryProps> = ({
  entries,
  showStats = true,
  limit,
  onEntryPress,
}) => {
  const { colors } = useTheme();

  const allEntries = entries ?? activityService.getAll();
  const displayEntries = limit ? allEntries.slice(0, limit) : allEntries;
  const stats = useMemo(() => activityService.getStats(7), [allEntries]);

  const formatTime = (date: Date): string => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "только что";
    if (minutes < 60) return `${minutes} мин назад`;
    if (hours < 24) return `${hours} ч назад`;
    if (days < 7) return `${days} дн назад`;

    return date.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "short",
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("ru-RU", {
      weekday: "short",
      day: "numeric",
    });
  };

  const renderStats = () => (
    <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.statsTitle, { color: colors.text }]}>
        За последние 7 дней
      </Text>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>
            {stats.totalCompleted}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Завершено
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#4caf50" }]}>
            {stats.totalCreated}
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Создано
          </Text>
        </View>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: "#ff9800" }]}>
            {stats.completionRate.toFixed(0)}%
          </Text>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            Выполнено
          </Text>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chart}>
          {stats.dailyStats.map((day, index) => {
            const maxValue = Math.max(
              ...stats.dailyStats.map((d) => d.completed)
            );
            const height =
              maxValue > 0 ? (day.completed / maxValue) * 60 : 0;

            return (
              <View key={day.date} style={styles.chartBar}>
                <View
                  style={[
                    styles.bar,
                    {
                      height: Math.max(height, 4),
                      backgroundColor:
                        day.completed > 0 ? colors.primary : colors.border,
                    },
                  ]}
                />
                <Text
                  style={[styles.chartLabel, { color: colors.textSecondary }]}
                >
                  {formatDate(day.date)}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );

  const renderEntry = ({ item }: { item: ActivityLogEntry }) => {
    const config = ACTIVITY_CONFIG[item.type];

    return (
      <TouchableOpacity
        style={[styles.entryItem, { backgroundColor: colors.surface }]}
        onPress={() => onEntryPress?.(item)}
        disabled={!onEntryPress}
      >
        <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
          <Ionicons
            name={config.icon as keyof typeof Ionicons.glyphMap}
            size={16}
            color="#fff"
          />
        </View>

        <View style={styles.entryContent}>
          <Text style={[styles.entryLabel, { color: colors.textSecondary }]}>
            {config.label}
          </Text>
          {item.taskTitle && (
            <Text
              style={[styles.entryTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.taskTitle}
            </Text>
          )}
        </View>

        <Text style={[styles.entryTime, { color: colors.textSecondary }]}>
          {formatTime(item.timestamp)}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="time-outline"
        size={48}
        color={colors.textSecondary}
      />
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        История пока пуста
      </Text>
      <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
        Здесь будут отображаться все ваши действия с задачами
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {showStats && stats.totalCompleted > 0 && renderStats()}

      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          История активности
        </Text>
        {limit && allEntries.length > limit && (
          <Text style={[styles.headerCount, { color: colors.textSecondary }]}>
            Показано {limit} из {allEntries.length}
          </Text>
        )}
      </View>

      <FlatList
        data={displayEntries}
        renderItem={renderEntry}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          displayEntries.length === 0 ? styles.emptyList : undefined
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsCard: {
    margin: 16,
    padding: 16,
    borderRadius: 12,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 28,
    fontWeight: "700",
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  chartContainer: {
    paddingTop: 8,
  },
  chart: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    height: 80,
  },
  chartBar: {
    alignItems: "center",
    flex: 1,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    marginBottom: 4,
  },
  chartLabel: {
    fontSize: 10,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
  },
  headerCount: {
    fontSize: 13,
  },
  entryItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginVertical: 4,
    borderRadius: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  entryContent: {
    flex: 1,
  },
  entryLabel: {
    fontSize: 12,
  },
  entryTitle: {
    fontSize: 14,
    fontWeight: "500",
    marginTop: 2,
  },
  entryTime: {
    fontSize: 12,
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "500",
    marginTop: 16,
  },
  emptyHint: {
    fontSize: 13,
    marginTop: 8,
    textAlign: "center",
  },
});
