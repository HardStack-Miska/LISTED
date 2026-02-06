import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts";
import type { OverviewStats } from "@/types/analytics";

interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number | string;
  color: string;
}

const StatCard: React.FC<StatCardProps> = ({ icon, label, value, color }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface }]}>
      <View style={[styles.iconContainer, { backgroundColor: color + "20" }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.value, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
};

interface StatsOverviewProps {
  stats: OverviewStats;
}

export const StatsOverview: React.FC<StatsOverviewProps> = ({ stats }) => {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Обзор</Text>
      <View style={styles.grid}>
        <StatCard
          icon="checkmark-circle"
          label="Сегодня"
          value={stats.completedToday}
          color="#10B981"
        />
        <StatCard
          icon="calendar"
          label="Неделя"
          value={stats.completedThisWeek}
          color="#6366F1"
        />
        <StatCard
          icon="trophy"
          label="Месяц"
          value={stats.completedThisMonth}
          color="#F59E0B"
        />
        <StatCard
          icon="flame"
          label="Серия дней"
          value={stats.currentStreak}
          color="#EF4444"
        />
      </View>

      <View style={styles.rateContainer}>
        <View style={[styles.rateCard, { backgroundColor: colors.surface }]}>
          <View style={styles.rateHeader}>
            <Ionicons name="time" size={20} color="#8B5CF6" />
            <Text style={[styles.rateLabel, { color: colors.textSecondary }]}>
              Выполнено вовремя
            </Text>
          </View>
          <Text style={[styles.rateValue, { color: colors.text }]}>
            {stats.completionRate}%
          </Text>
          <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.progressFill,
                { width: `${stats.completionRate}%`, backgroundColor: "#8B5CF6" },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 12,
    gap: 8,
  },
  card: {
    width: "48%",
    flexGrow: 1,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  value: {
    fontSize: 28,
    fontWeight: "700",
  },
  label: {
    fontSize: 13,
    marginTop: 4,
  },
  rateContainer: {
    paddingHorizontal: 16,
    marginTop: 8,
  },
  rateCard: {
    padding: 16,
    borderRadius: 12,
  },
  rateHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  rateLabel: {
    fontSize: 14,
  },
  rateValue: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
});
