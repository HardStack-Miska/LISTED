import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { useTheme } from "@/contexts";
import type { TrendDataPoint, AnalyticsPeriod } from "@/types/analytics";

interface ProductivityChartProps {
  data: TrendDataPoint[];
  period: AnalyticsPeriod;
}

export const ProductivityChart: React.FC<ProductivityChartProps> = ({
  data,
  period,
}) => {
  const { colors, isDark } = useTheme();
  const screenWidth = Dimensions.get("window").width;

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Продуктивность
        </Text>
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Нет данных за выбранный период
          </Text>
        </View>
      </View>
    );
  }

  const chartData = data.map((item) => ({
    value: item.completed,
    label: item.label,
    frontColor: "#6366F1",
  }));

  const maxValue = Math.max(...data.map((d) => d.completed), 1);

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Продуктивность
      </Text>
      <View style={[styles.chartContainer, { backgroundColor: colors.surface }]}>
        <BarChart
          data={chartData}
          width={screenWidth - 80}
          height={180}
          barWidth={period === "week" ? 28 : 16}
          spacing={period === "week" ? 16 : 8}
          barBorderRadius={4}
          noOfSections={4}
          maxValue={Math.ceil(maxValue * 1.2)}
          yAxisThickness={0}
          xAxisThickness={0}
          yAxisTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
          xAxisLabelTextStyle={{ color: colors.textSecondary, fontSize: 11 }}
          hideRules
          isAnimated
          animationDuration={500}
        />
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
    alignItems: "center",
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
