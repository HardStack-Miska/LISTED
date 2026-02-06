import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import type { Project } from '@/types';

interface ProjectPickerProps {
  visible: boolean;
  projects: Project[];
  selectedId?: string;
  onSelect: (projectId: string | undefined) => void;
  onClose: () => void;
}

export const ProjectPicker: React.FC<ProjectPickerProps> = ({
  visible,
  projects,
  selectedId,
  onSelect,
  onClose,
}) => {
  const handleSelect = useCallback(
    (projectId: string | undefined) => {
      onSelect(projectId);
      onClose();
    },
    [onSelect, onClose],
  );

  const renderProject = useCallback(
    ({ item }: { item: Project }) => (
      <TouchableOpacity
        style={styles.projectItem}
        onPress={() => handleSelect(item.id)}
      >
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <Text style={styles.projectName}>{item.name}</Text>
        {selectedId === item.id && (
          <Ionicons name="checkmark" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    ),
    [selectedId, handleSelect],
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Выберите проект</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.projectItem}
          onPress={() => handleSelect(undefined)}
        >
          <View style={[styles.colorDot, { backgroundColor: COLORS.border }]} />
          <Text style={styles.projectName}>Без проекта</Text>
          {!selectedId && (
            <Ionicons name="checkmark" size={20} color={COLORS.primary} />
          )}
        </TouchableOpacity>

        <FlatList
          data={projects}
          renderItem={renderProject}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
        />
      </SafeAreaView>
    </Modal>
  );
};

interface ProjectPickerInlineProps {
  projects: Project[];
  selectedId?: string;
  onPress: () => void;
}

export const ProjectPickerInline: React.FC<ProjectPickerInlineProps> = ({
  projects,
  selectedId,
  onPress,
}) => {
  const selectedProject = projects.find((p) => p.id === selectedId);

  return (
    <TouchableOpacity style={styles.inlineContainer} onPress={onPress}>
      <View style={styles.inlineLeft}>
        <Ionicons name="folder-outline" size={20} color={COLORS.textSecondary} />
        <Text style={styles.inlineLabel}>Проект</Text>
      </View>
      <View style={styles.inlineRight}>
        {selectedProject ? (
          <>
            <View
              style={[
                styles.colorDotSmall,
                { backgroundColor: selectedProject.color },
              ]}
            />
            <Text style={styles.inlineValue}>{selectedProject.name}</Text>
          </>
        ) : (
          <Text style={styles.inlinePlaceholder}>Не выбран</Text>
        )}
        <Ionicons name="chevron-forward" size={16} color={COLORS.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  list: {
    paddingTop: SPACING.sm,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.sm,
  },
  projectName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  inlineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    padding: SPACING.md,
    borderRadius: 12,
  },
  inlineLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  inlineLabel: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  inlineRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  colorDotSmall: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inlineValue: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  inlinePlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
