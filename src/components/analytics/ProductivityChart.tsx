import React from "react";
import { View, Text, StyleSheet, Dimensions, Platform } from "react-native";
import { useTheme } from "@/contexts";
import type { TrendDataPoint, AnalyticsPeriod } from "@/types/analytics";

// Only import BarChart on native platforms
let BarChart: React.ComponentType<{
  data: Array<{ value: number; label: string; frontColor: string }>;
  width: number;
  height: number;
  barWidth: number;
  spacing: number;
  barBorderRadius: number;
  noOfSections: number;
  maxValue: number;
  yAxisThickness: number;
  xAxisThickness: number;
  yAxisTextStyle: { color: string; fontSize: number };
  xAxisLabelTextStyle: { color: string; fontSize: number };
  hideRules: boolean;
  isAnimated: boolean;
  animationDuration: number;
}> | null = null;

if (Platform.OS !== "web") {
  BarChart = require("react-native-gifted-charts").BarChart;
}

interface ProductivityChartProps {
  data: TrendDataPoint[];
  period: AnalyticsPeriod;
}

// Simple web-compatible bar chart
const WebBarChart: React.FC<{
  data: TrendDataPoint[];
  colors: { textSecondary: string };
}> = ({ data, colors }) => {
  const maxValue = Math.max(...data.map((d) => d.completed), 1);

  return (
    <View style={webStyles.chartContainer}>
      <View style={webStyles.barsContainer}>
        {data.map((item, index) => (
          <View key={index} style={webStyles.barWrapper}>
            <View style={webStyles.barBackground}>
              <View
                style={[
                  webStyles.bar,
                  {
                    height: `${(item.completed / maxValue) * 100}%`,
                    backgroundColor: "#6366F1",
                  },
                ]}
              />
            </View>
            <Text style={[webStyles.label, { color: colors.textSecondary }]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

export const ProductivityChart: React.FC<ProductivityChartProps> = ({
  data,
  period,
}) => {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get("window").width;

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Продуктивность
        </Text>
        <View
          style={[styles.emptyContainer, { backgroundColor: colors.surface }]}
        >
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Нет данных за выбранный период
          </Text>
        </View>
      </View>
    );
  }

  // Use web chart on web platform
  if (Platform.OS === "web" || !BarChart) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Продуктивность
        </Text>
        <View
          style={[styles.chartContainer, { backgroundColor: colors.surface }]}
        >
          <WebBarChart data={data} colors={colors} />
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
      <View
        style={[styles.chartContainer, { backgroundColor: colors.surface }]}
      >
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

const webStyles = StyleSheet.create({
  chartContainer: {
    width: "100%",
    height: 180,
  },
  barsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "flex-end",
    height: 160,
    paddingHorizontal: 8,
  },
  barWrapper: {
    alignItems: "center",
    flex: 1,
    maxWidth: 40,
  },
  barBackground: {
    width: 24,
    height: 140,
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    borderRadius: 4,
    justifyContent: "flex-end",
    overflow: "hidden",
  },
  bar: {
    width: "100%",
    borderRadius: 4,
  },
  label: {
    fontSize: 11,
    marginTop: 4,
  },
});
