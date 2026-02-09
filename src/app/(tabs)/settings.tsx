import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useFocusEffect } from "expo-router";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { SPACING, FONT_SIZES } from "@/constants";
import { useProjects, useLabels } from "@/hooks";
import { useAuth, useTheme } from "@/contexts";
import { useSync } from "@/contexts/SyncContext";
import { notificationService } from "@/services/notifications";
import { databaseService } from "@/services/database";
import type { Colors } from "@/contexts";

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  color?: string;
  themeColors: Colors;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  color,
  themeColors,
}) => {
  const styles = useMemo(() => createStyles(themeColors), [themeColors]);

  return (
    <Pressable
      style={({ pressed }) => [
        styles.settingsItem,
        pressed && styles.settingsItemPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.settingsItemLeft}>
        <View
          style={[
            styles.iconContainer,
            color && { backgroundColor: color + "20" },
          ]}
        >
          <Ionicons
            name={icon}
            size={22}
            color={color ?? themeColors.primary}
          />
        </View>
        <View style={styles.settingsItemText}>
          <Text style={styles.settingsItemTitle}>{title}</Text>
          {subtitle && (
            <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement || (
        <Ionicons
          name="chevron-forward"
          size={20}
          color={themeColors.textSecondary}
        />
      )}
    </Pressable>
  );
};

export default function SettingsScreen() {
  const router = useRouter();
  const { projects, refresh: refreshProjects } = useProjects();
  const { labels, refresh: refreshLabels } = useLabels();

  useFocusEffect(
    useCallback(() => {
      refreshProjects();
      refreshLabels();
    }, [refreshProjects, refreshLabels])
  );
  const { user, isAuthenticated, signOut } = useAuth();
  const { mode, setMode, colors } = useTheme();
  const { status: syncStatus, lastSyncedAt, isExpoGo, isSyncEnabled, syncNow, error: syncError } = useSync();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);

  useEffect(() => {
    const checkPermissions = async () => {
      const hasPermission = await notificationService.requestPermissions();
      setNotificationsEnabled(hasPermission);
    };
    checkPermissions();
  }, []);

  const handleToggleNotifications = useCallback(async (value: boolean) => {
    if (value) {
      const granted = await notificationService.requestPermissions();
      if (!granted) {
        Alert.alert(
          "Разрешение не получено",
          "Включите уведомления в настройках устройства",
        );
        return;
      }
      setNotificationsEnabled(true);
    } else {
      setNotificationsEnabled(false);
    }
  }, []);

  const handleToggleDailySummary = useCallback(
    async (value: boolean) => {
      if (value && !notificationsEnabled) {
        Alert.alert("Уведомления выключены", "Сначала включите уведомления");
        return;
      }
      setDailySummaryEnabled(value);
      if (value) {
        await notificationService.scheduleDailySummary(9, 0);
      }
    },
    [notificationsEnabled],
  );

  const handleSignOut = async () => {
    await signOut();
  };

  const getThemeLabel = () => {
    switch (mode) {
      case "light":
        return "Светлая";
      case "dark":
        return "Тёмная";
      case "system":
        return "Системная";
    }
  };

  const cycleTheme = () => {
    const themes: Array<"light" | "dark" | "system"> = [
      "light",
      "dark",
      "system",
    ];
    const currentIndex = themes.indexOf(mode);
    const nextIndex = (currentIndex + 1) % themes.length;
    const nextTheme = themes[nextIndex];
    if (nextTheme) {
      setMode(nextTheme);
    }
  };

  const handleBackup = useCallback(() => {
    Alert.alert(
      "В разработке",
      "Функция резервного копирования будет доступна в следующей версии.",
    );
  }, []);

  const handleExportData = useCallback(async () => {
    try {
      const data = await databaseService.exportAllData();
      const json = JSON.stringify(data, null, 2);

      Alert.alert(
        "Экспорт данных",
        `Данные готовы к экспорту:\n\n` +
          `Задачи: ${data.tasks.length}\n` +
          `Проекты: ${data.projects.length}\n` +
          `Метки: ${data.labels.length}\n\n` +
          `Размер: ${(json.length / 1024).toFixed(2)} KB\n\n` +
          `Примечание: Для полного экспорта в файл необходимо установить пакеты expo-file-system и expo-sharing.`,
        [{ text: "OK" }],
      );
    } catch (err) {
      console.error("Export failed:", err);
      Alert.alert("Ошибка", "Не удалось экспортировать данные");
    }
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ещё</Text>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Аккаунт</Text>
          {isAuthenticated ? (
            <>
              <SettingsItem
                icon="person-circle-outline"
                title={user?.email || "Пользователь"}
                subtitle="Premium аккаунт"
                color="#10B981"
                themeColors={colors}
              />
              <SettingsItem
                icon="sync-outline"
                title="Синхронизация"
                subtitle={
                  isExpoGo
                    ? "Доступна в нативной сборке"
                    : syncStatus === "synced"
                      ? `Синхронизировано${lastSyncedAt ? ` в ${lastSyncedAt.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}` : ""}`
                      : syncStatus === "syncing"
                        ? "Синхронизация..."
                        : syncStatus === "error"
                          ? syncError ?? "Ошибка синхронизации"
                          : syncStatus === "offline"
                            ? "Нет подключения"
                            : "Отключена"
                }
                onPress={isSyncEnabled ? syncNow : undefined}
                color="#6366F1"
                themeColors={colors}
              />
              <SettingsItem
                icon="log-out-outline"
                title="Выйти"
                onPress={handleSignOut}
                color="#EF4444"
                themeColors={colors}
              />
            </>
          ) : (
            <SettingsItem
              icon="person-add-outline"
              title="Войти или создать аккаунт"
              subtitle="Для синхронизации и Premium функций"
              onPress={() => router.push("/(auth)/sign-in")}
              color="#6366F1"
              themeColors={colors}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Организация</Text>
          <SettingsItem
            icon="folder-outline"
            title="Проекты"
            subtitle={`${projects.length} проектов`}
            onPress={() => router.push("/projects")}
            themeColors={colors}
          />
          <SettingsItem
            icon="pricetags-outline"
            title="Метки"
            subtitle={`${labels.length} меток`}
            onPress={() => router.push("/labels")}
            themeColors={colors}
          />
          <SettingsItem
            icon="calendar-outline"
            title="Календарь"
            onPress={() => router.push("/calendar")}
            themeColors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Внешний вид</Text>
          <SettingsItem
            icon="color-palette-outline"
            title="Тема"
            subtitle={getThemeLabel()}
            onPress={cycleTheme}
            themeColors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Уведомления</Text>
          <SettingsItem
            icon="notifications-outline"
            title="Уведомления"
            subtitle={notificationsEnabled ? "Включены" : "Выключены"}
            color="#F59E0B"
            themeColors={colors}
            rightElement={
              <Switch
                value={notificationsEnabled}
                onValueChange={handleToggleNotifications}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={notificationsEnabled ? colors.primary : "#f4f3f4"}
              />
            }
          />
          <SettingsItem
            icon="time-outline"
            title="Ежедневная сводка"
            subtitle={dailySummaryEnabled ? "В 9:00" : "Выключена"}
            color="#8B5CF6"
            themeColors={colors}
            rightElement={
              <Switch
                value={dailySummaryEnabled}
                onValueChange={handleToggleDailySummary}
                trackColor={{
                  false: colors.border,
                  true: colors.primary + "80",
                }}
                thumbColor={dailySummaryEnabled ? colors.primary : "#f4f3f4"}
              />
            }
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Данные</Text>
          <SettingsItem
            icon="cloud-upload-outline"
            title="Резервное копирование"
            onPress={handleBackup}
            themeColors={colors}
          />
          <SettingsItem
            icon="download-outline"
            title="Экспорт данных"
            onPress={handleExportData}
            themeColors={colors}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О приложении</Text>
          <SettingsItem
            icon="information-circle-outline"
            title="LISTED"
            subtitle="Версия 1.0.0"
            themeColors={colors}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    scrollView: {
      flex: 1,
    },
    header: {
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.lg,
      paddingBottom: SPACING.sm,
    },
    headerTitle: {
      fontSize: FONT_SIZES.xl,
      fontWeight: "700",
      color: colors.text,
    },
    section: {
      marginTop: SPACING.lg,
      paddingHorizontal: SPACING.md,
    },
    sectionTitle: {
      fontSize: FONT_SIZES.sm,
      fontWeight: "600",
      color: colors.textSecondary,
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: SPACING.sm,
      marginLeft: SPACING.sm,
    },
    settingsItem: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surface,
      paddingVertical: SPACING.md,
      paddingHorizontal: SPACING.md,
      borderRadius: 12,
      marginBottom: SPACING.xs,
    },
    settingsItemPressed: {
      opacity: 0.7,
    },
    settingsItemLeft: {
      flexDirection: "row",
      alignItems: "center",
      flex: 1,
    },
    iconContainer: {
      width: 36,
      height: 36,
      borderRadius: 8,
      backgroundColor: colors.background,
      alignItems: "center",
      justifyContent: "center",
      marginRight: SPACING.md,
    },
    settingsItemText: {
      flex: 1,
    },
    settingsItemTitle: {
      fontSize: FONT_SIZES.md,
      fontWeight: "500",
      color: colors.text,
    },
    settingsItemSubtitle: {
      fontSize: FONT_SIZES.sm,
      color: colors.textSecondary,
      marginTop: 2,
    },
  });
