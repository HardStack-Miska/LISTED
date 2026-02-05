import React from "react";
import { View, Text, StyleSheet, Pressable, ScrollView } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES } from "@/constants";
import { useProjects, useLabels } from "@/hooks";

interface SettingsItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  rightElement?: React.ReactNode;
  color?: string;
}

const SettingsItem: React.FC<SettingsItemProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  rightElement,
  color,
}) => (
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
        <Ionicons name={icon} size={22} color={color ?? COLORS.primary} />
      </View>
      <View style={styles.settingsItemText}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
    </View>
    {rightElement || (
      <Ionicons name="chevron-forward" size={20} color={COLORS.textSecondary} />
    )}
  </Pressable>
);

export default function SettingsScreen() {
  const router = useRouter();
  const { projects } = useProjects();
  const { labels } = useLabels();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ещё</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Организация</Text>
        <SettingsItem
          icon="folder-outline"
          title="Проекты"
          subtitle={`${projects.length} проектов`}
          onPress={() => router.push("/projects")}
        />
        <SettingsItem
          icon="pricetags-outline"
          title="Метки"
          subtitle={`${labels.length} меток`}
          onPress={() => router.push("/labels")}
        />
        <SettingsItem
          icon="calendar-outline"
          title="Календарь"
          onPress={() => router.push("/calendar")}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Внешний вид</Text>
        <SettingsItem
          icon="color-palette-outline"
          title="Тема"
          subtitle="Светлая"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Уведомления</Text>
        <SettingsItem
          icon="notifications-outline"
          title="Напоминания"
          subtitle="Включены"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Данные</Text>
        <SettingsItem
          icon="cloud-upload-outline"
          title="Резервное копирование"
          onPress={() => {}}
        />
        <SettingsItem
          icon="download-outline"
          title="Экспорт данных"
          onPress={() => {}}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О приложении</Text>
        <SettingsItem
          icon="information-circle-outline"
          title="LISTED"
          subtitle="Версия 1.0.0"
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  section: {
    marginTop: SPACING.lg,
    paddingHorizontal: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: SPACING.sm,
    marginLeft: SPACING.sm,
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.surface,
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
    backgroundColor: COLORS.background,
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
    color: COLORS.text,
  },
  settingsItemSubtitle: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
});
