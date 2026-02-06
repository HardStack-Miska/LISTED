import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { useTheme } from "@/contexts";
import type { PriorityStats } from "@/types/analytics";

// Only import PieChart on native platforms
let PieChart: React.ComponentType<{
  data: Array<{ value: number; color: string; text: string }>;
  donut: boolean;
  radius: number;
  innerRadius: number;
  centerLabelComponent: () => React.ReactNode;
}> | null = null;

if (Platform.OS !== "web") {
  PieChart = require("react-native-gifted-charts").PieChart;
}

interface PriorityBreakdownProps {
  data: PriorityStats[];
}

// Simple web-compatible donut chart
const WebDonutChart: React.FC<{
  data: PriorityStats[];
  total: number;
  colors: { text: string; textSecondary: string };
}> = ({ data, total, colors }) => {
  const filteredData = data.filter((item) => item.total > 0);
  let currentAngle = 0;

  return (
    <View style={webStyles.donutContainer}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        {filteredData.map((item, index) => {
          const percentage = item.total / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          const x1 = 70 + 60 * Math.cos(((startAngle - 90) * Math.PI) / 180);
          const y1 = 70 + 60 * Math.sin(((startAngle - 90) * Math.PI) / 180);
          const x2 =
            70 + 60 * Math.cos(((startAngle + angle - 90) * Math.PI) / 180);
          const y2 =
            70 + 60 * Math.sin(((startAngle + angle - 90) * Math.PI) / 180);

          const largeArcFlag = angle > 180 ? 1 : 0;

          return (
            <path
              key={index}
              d={`M 70 70 L ${x1} ${y1} A 60 60 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
              fill={item.color}
            />
          );
        })}
        <circle cx="70" cy="70" r="40" fill="white" />
      </svg>
      <View style={webStyles.centerLabel}>
        <Text style={[webStyles.centerValue, { color: colors.text }]}>
          {total}
        </Text>
        <Text style={[webStyles.centerText, { color: colors.textSecondary }]}>
          задач
        </Text>
      </View>
    </View>
  );
};

export const PriorityBreakdown: React.FC<PriorityBreakdownProps> = ({
  data,
}) => {
  const { colors } = useTheme();

  const total = data.reduce((sum, item) => sum + item.total, 0);

  if (total === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          По приоритетам
        </Text>
        <View
          style={[styles.emptyContainer, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Нет задач
          </Text>
        </View>
      </View>
    );
  }

  const renderLegend = () => (
    <View style={styles.legend}>
      {data.map((item) => (
        <View key={item.priority} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.color }]} />
          <Text style={[styles.legendLabel, { color: colors.text }]}>
            П{item.priority}
          </Text>
          <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
            {item.total} ({item.completed} выполн.)
          </Text>
        </View>
      ))}
    </View>
  );

  // Use web chart on web platform
  if (Platform.OS === "web" || !PieChart) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          По приоритетам
        </Text>
        <View
          style={[styles.chartContainer, { backgroundColor: colors.surface }]}
        >
          <View style={styles.chartRow}>
            <WebDonutChart data={data} total={total} colors={colors} />
            {renderLegend()}
          </View>
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
      <View
        style={[styles.chartContainer, { backgroundColor: colors.surface }]}
      >
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
                <Text
                  style={[styles.centerText, { color: colors.textSecondary }]}
                >
                  задач
                </Text>
              </View>
            )}
          />
          {renderLegend()}
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

const webStyles = StyleSheet.create({
  donutContainer: {
    width: 140,
    height: 140,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  centerLabel: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  centerValue: {
    fontSize: 24,
    fontWeight: "700",
  },
  centerText: {
    fontSize: 12,
  },
});
