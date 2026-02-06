import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts";
import type { ProjectStats } from "@/types/analytics";

interface ProjectsBreakdownProps {
  data: ProjectStats[];
}

export const ProjectsBreakdown: React.FC<ProjectsBreakdownProps> = ({ data }) => {
  const { colors } = useTheme();

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          По проектам
        </Text>
        <View style={[styles.emptyContainer, { backgroundColor: colors.surface }]}>
          <Ionicons name="folder-outline" size={32} color={colors.textSecondary} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Нет проектов с задачами
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        По проектам
      </Text>
      <View style={[styles.listContainer, { backgroundColor: colors.surface }]}>
        {data.map((project, index) => (
          <View
            key={project.projectId}
            style={[
              styles.projectItem,
              index < data.length - 1 && {
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              },
            ]}
          >
            <View style={styles.projectHeader}>
              <View
                style={[
                  styles.projectDot,
                  { backgroundColor: project.projectColor },
                ]}
              />
              <Text
                style={[styles.projectName, { color: colors.text }]}
                numberOfLines={1}
              >
                {project.projectName}
              </Text>
              <Text style={[styles.projectStats, { color: colors.textSecondary }]}>
                {project.completedTasks}/{project.totalTasks}
              </Text>
            </View>
            <View style={[styles.progressBar, { backgroundColor: colors.border }]}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${project.completionRate}%`,
                    backgroundColor: project.projectColor,
                  },
                ]}
              />
            </View>
            <Text style={[styles.percentText, { color: colors.textSecondary }]}>
              {project.completionRate}% выполнено
            </Text>
          </View>
        ))}
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
  listContainer: {
    marginHorizontal: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  projectItem: {
    padding: 16,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  projectDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  projectName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  projectStats: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 6,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
  },
  percentText: {
    fontSize: 12,
  },
  emptyContainer: {
    marginHorizontal: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
  },
});
