import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  SafeAreaView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { COLORS, SPACING, FONT_SIZES, PRESET_COLORS } from "@/constants";
import { useProjects } from "@/hooks";
import { FloatingActionButton } from "@/components/ui/FloatingActionButton";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Project } from "@/types";

export default function ProjectsScreen() {
  const { projects, isLoading, createProject, updateProject, deleteProject } =
    useProjects();

  const [showEditor, setShowEditor] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [name, setName] = useState("");
  const [color, setColor] = useState<string>(PRESET_COLORS[0]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const handleCreate = useCallback(() => {
    setEditingProject(null);
    setName("");
    setColor(PRESET_COLORS[0]);
    setShowEditor(true);
  }, []);

  const handleEdit = useCallback((project: Project) => {
    setEditingProject(project);
    setName(project.name);
    setColor(project.color);
    setShowEditor(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;

    try {
      if (editingProject) {
        await updateProject(editingProject.id, {
          name: name.trim(),
          color,
        });
      } else {
        await createProject({
          name: name.trim(),
          color,
        });
      }
      setShowEditor(false);
    } catch (error) {
      console.error("Error saving project:", error);
    }
  }, [name, color, editingProject, createProject, updateProject]);

  const handleDeleteConfirm = useCallback((project: Project) => {
    setProjectToDelete(project);
    setShowDeleteConfirm(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!projectToDelete) return;

    try {
      await deleteProject(projectToDelete.id);
      setShowDeleteConfirm(false);
      setProjectToDelete(null);
    } catch (error) {
      console.error("Error deleting project:", error);
    }
  }, [projectToDelete, deleteProject]);

  const handleProjectPress = useCallback(
    (project: Project) => {
      // Open editor for the project
      handleEdit(project);
    },
    [handleEdit],
  );

  const renderProject = useCallback(
    ({ item }: { item: Project }) => (
      <TouchableOpacity
        style={styles.projectItem}
        onPress={() => handleProjectPress(item)}
        onLongPress={() => handleEdit(item)}
      >
        <View
          style={[styles.colorIndicator, { backgroundColor: item.color }]}
        />
        <View style={styles.projectInfo}>
          <Text style={styles.projectName}>{item.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={COLORS.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handleProjectPress, handleEdit],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Проекты</Text>
      </View>

      {projects.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="folder-outline"
            size={64}
            color={COLORS.textSecondary}
          />
          <Text style={styles.emptyTitle}>Нет проектов</Text>
          <Text style={styles.emptyText}>
            Создайте проект для организации задач
          </Text>
        </View>
      ) : (
        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      )}

      <FloatingActionButton onPress={handleCreate} />

      <Modal
        visible={showEditor}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowEditor(false)}
      >
        <SafeAreaView style={styles.editorContainer}>
          <View style={styles.editorHeader}>
            <TouchableOpacity onPress={() => setShowEditor(false)}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
            <Text style={styles.editorTitle}>
              {editingProject ? "Редактировать" : "Новый проект"}
            </Text>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!name.trim()}
              style={!name.trim() ? styles.disabledButton : undefined}
            >
              <Text
                style={[
                  styles.saveText,
                  !name.trim() && styles.saveTextDisabled,
                ]}
              >
                Сохранить
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.editorContent}>
            <Text style={styles.label}>Название</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Название проекта"
              placeholderTextColor={COLORS.textSecondary}
              autoFocus
            />

            <Text style={styles.label}>Цвет</Text>
            <View style={styles.colorGrid}>
              {PRESET_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorOptionSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {editingProject && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setShowEditor(false);
                  handleDeleteConfirm(editingProject);
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={COLORS.danger}
                />
                <Text style={styles.deleteText}>Удалить проект</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Удалить проект?"
        message={`Проект "${projectToDelete?.name}" будет удален. Задачи останутся, но будут без проекта.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setProjectToDelete(null);
        }}
        confirmStyle="destructive"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: "700",
    color: COLORS.text,
  },
  list: {
    padding: SPACING.md,
  },
  projectItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
    marginBottom: SPACING.sm,
  },
  colorIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: SPACING.md,
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: FONT_SIZES.md,
    fontWeight: "500",
    color: COLORS.text,
  },
  moreButton: {
    padding: SPACING.sm,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  emptyTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  editorContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  editorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  editorTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
  },
  cancelText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  saveText: {
    fontSize: FONT_SIZES.md,
    fontWeight: "600",
    color: COLORS.primary,
  },
  saveTextDisabled: {
    color: COLORS.textSecondary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  editorContent: {
    padding: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    marginTop: SPACING.md,
  },
  input: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: SPACING.md,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  colorOption: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: COLORS.text,
  },
  deleteButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: SPACING.xl,
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  deleteText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.danger,
  },
});
