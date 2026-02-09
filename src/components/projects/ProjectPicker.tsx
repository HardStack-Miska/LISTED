import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  SafeAreaView,
  TextInput,
  Alert,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, PRESET_COLORS } from '@/constants';
import { useTheme } from '@/contexts';
import { useProjects } from '@/hooks';
import type { Colors } from '@/contexts';
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { createProject, refresh: refreshProjects } = useProjects();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const handleSelect = useCallback(
    (projectId: string | undefined) => {
      onSelect(projectId);
      onClose();
    },
    [onSelect, onClose],
  );

  const handleCreateProject = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      const result = await createProject({ name: newName.trim(), color: newColor });
      await refreshProjects();
      setIsCreating(false);
      setNewName('');
      onSelect(result.id);
      onClose();
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать проект');
    }
  }, [newName, newColor, createProject, refreshProjects, onSelect, onClose]);

  const renderProject = useCallback(
    ({ item }: { item: Project }) => (
      <TouchableOpacity
        style={styles.projectItem}
        onPress={() => handleSelect(item.id)}
      >
        <View style={[styles.colorDot, { backgroundColor: item.color }]} />
        <Text style={styles.projectName}>{item.name}</Text>
        {selectedId === item.id && (
          <Ionicons name="checkmark" size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    ),
    [selectedId, handleSelect, styles, colors],
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
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Inline create */}
        {isCreating ? (
          <View style={styles.createForm}>
            <TextInput
              style={styles.createInput}
              placeholder="Название проекта"
              placeholderTextColor={colors.textSecondary}
              value={newName}
              onChangeText={setNewName}
              autoFocus
              maxLength={100}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="always" style={styles.colorRow}>
              {PRESET_COLORS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    newColor === color && styles.colorOptionSelected,
                  ]}
                  onPress={() => setNewColor(color)}
                />
              ))}
            </ScrollView>
            <View style={styles.createActions}>
              <TouchableOpacity style={styles.createCancelBtn} onPress={() => { setIsCreating(false); setNewName(''); }}>
                <Text style={styles.createCancelText}>Отмена</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.createConfirmBtn, !newName.trim() && styles.createConfirmDisabled]}
                onPress={handleCreateProject}
                disabled={!newName.trim()}
              >
                <Text style={styles.createConfirmText}>Создать</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addNewButton} onPress={() => setIsCreating(true)}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addNewText}>Новый проект</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.projectItem}
          onPress={() => handleSelect(undefined)}
        >
          <View style={[styles.colorDot, { backgroundColor: colors.border }]} />
          <Text style={styles.projectName}>Без проекта</Text>
          {!selectedId && (
            <Ionicons name="checkmark" size={20} color={colors.primary} />
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
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const selectedProject = projects.find((p) => p.id === selectedId);

  return (
    <TouchableOpacity style={styles.inlineContainer} onPress={onPress}>
      <View style={styles.inlineLeft}>
        <Ionicons name="folder-outline" size={20} color={colors.textSecondary} />
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
        <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
      </View>
    </TouchableOpacity>
  );
};

const createStyles = (colors: Colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.text,
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
    borderBottomColor: colors.border,
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
    color: colors.text,
  },
  addNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  addNewText: {
    fontSize: FONT_SIZES.md,
    color: colors.primary,
    fontWeight: '500',
  },
  createForm: {
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: SPACING.sm,
  },
  createInput: {
    fontSize: FONT_SIZES.md,
    color: colors.text,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  colorRow: {
    flexDirection: 'row',
  },
  colorOption: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: SPACING.sm,
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  createActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  createCancelBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createCancelText: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
  },
  createConfirmBtn: {
    flex: 1,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  createConfirmDisabled: {
    backgroundColor: colors.border,
  },
  createConfirmText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  inlineContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
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
    color: colors.text,
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
    color: colors.text,
  },
  inlinePlaceholder: {
    fontSize: FONT_SIZES.md,
    color: colors.textSecondary,
  },
});
