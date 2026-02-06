import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts";
import { useAnalytics } from "@/hooks/useAnalytics";
import {
  StatsOverview,
  ProductivityChart,
  PriorityBreakdown,
  ProjectsBreakdown,
} from "@/components/analytics";
import type { AnalyticsPeriod } from "@/types/analytics";

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "week", label: "Неделя" },
  { key: "month", label: "Месяц" },
  { key: "year", label: "Год" },
  { key: "all", label: "Всё время" },
];

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  const {
    overview,
    trend,
    projects,
    priorities,
    period,
    isLoading,
    error,
    setPeriod,
    refresh,
  } = useAnalytics();

  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  if (isLoading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Загрузка статистики...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={refresh}
          >
            <Text style={styles.retryButtonText}>Повторить</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Статистика
          </Text>
        </View>

        {/* Period Selector */}
        <View style={styles.periodSelector}>
          {PERIODS.map((p) => (
            <TouchableOpacity
              key={p.key}
              style={[
                styles.periodButton,
                {
                  backgroundColor:
                    period === p.key ? colors.primary : colors.surface,
                },
              ]}
              onPress={() => setPeriod(p.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  {
                    color: period === p.key ? "#FFFFFF" : colors.textSecondary,
                  },
                ]}
              >
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Stats Overview */}
        {overview && <StatsOverview stats={overview} />}

        {/* Productivity Chart */}
        <ProductivityChart data={trend} period={period} />

        {/* Priority Breakdown */}
        <PriorityBreakdown data={priorities} />

        {/* Projects Breakdown */}
        <ProjectsBreakdown data={projects} />

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
  },
  periodSelector: {
    flexDirection: "row",
    paddingHorizontal: 16,
    marginBottom: 20,
    gap: 8,
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    gap: 12,
  },
  errorText: {
    fontSize: 16,
    textAlign: "center",
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  retryButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomPadding: {
    height: 32,
  },
});
