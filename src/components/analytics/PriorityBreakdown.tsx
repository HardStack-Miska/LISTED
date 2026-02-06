import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { useTheme } from "@/contexts";
import type { PriorityStats } from "@/types/analytics";

interface PriorityBreakdownProps {
  data: PriorityStats[];
}

export const PriorityBreakdown: React.FC<PriorityBreakdownProps> = ({ data }) => {
  const { colors } = useTheme();

  const total = data.reduce((sum, item) => sum + item.total, 0);

  if (total === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          По приоритетам
        </Text>
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Нет задач
          </Text>
        </View>
      </View>
    );
  }

  const pieData = data
    .filter((item) => item.total > 0)
    .map((item) => ({
      value: item.total,
      color: item.color,
      text: `${Math.round((item.total / total) * 100)}%`,
    }));

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        По приоритетам
      </Text>
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.chartRow}>
          <PieChart
            data={pieData}
            donut
            radius={70}
            innerRadius={45}
            centerLabelComponent={() => (
              <View style={styles.centerLabel}>
                <Text style={[styles.centerValue, { color: colors.text }]}>
                  {total}
                </Text>
                <Text style={[styles.centerText, { color: colors.textSecondary }]}>
                  задач
                </Text>
              </View>
            )}
          />
          <View style={styles.legend}>
            {data.map((item) => (
              <View key={item.priority} style={styles.legendItem}>
                <View
                  style={[styles.legendDot, { backgroundColor: item.color }]}
                />
                <Text style={[styles.legendLabel, { color: colors.text }]}>
                  П{item.priority}
                </Text>
                <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
                  {item.total} ({item.completed} выполн.)
                </Text>
              </View>
            ))}
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
  chartContainer: {
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
  },
  chartRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  centerLabel: {
    alignItems: "center",
  },
  centerValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  centerText: {
    fontSize: 12,
  },
  legend: {
    gap: 8,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendLabel: {
    fontSize: 14,
    fontWeight: "600",
    width: 24,
  },
  legendValue: {
    fontSize: 13,
  },
  emptyContainer: {
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
  },
});
