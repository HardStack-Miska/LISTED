import React, { useState, useCallback, useMemo } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SPACING, FONT_SIZES, PRESET_COLORS } from '@/constants';
import { useLabels } from '@/hooks';
import { useTheme } from '@/contexts';
import type { Colors } from '@/contexts';
import { FloatingActionButton } from '@/components/ui/FloatingActionButton';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import type { Label } from '@/types';

export default function LabelsScreen() {
  const { labels, isLoading, createLabel, updateLabel, deleteLabel } =
    useLabels();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [showEditor, setShowEditor] = useState(false);
  const [editingLabel, setEditingLabel] = useState<Label | null>(null);
  const [name, setName] = useState('');
  const [color, setColor] = useState<string>(PRESET_COLORS[0] ?? '#6366f1');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null);

  const handleCreate = useCallback(() => {
    setEditingLabel(null);
    setName('');
    setColor(PRESET_COLORS[0] ?? '#6366f1');
    setShowEditor(true);
  }, []);

  const handleEdit = useCallback((label: Label) => {
    setEditingLabel(label);
    setName(label.name);
    setColor(label.color);
    setShowEditor(true);
  }, []);

  const handleSave = useCallback(async () => {
    if (!name.trim()) return;

    try {
      if (editingLabel) {
        await updateLabel(editingLabel.id, {
          name: name.trim(),
          color,
        });
      } else {
        await createLabel(name.trim(), color);
      }
      setShowEditor(false);
    } catch (err) {
      console.error('Failed to save label:', err);
    }
  }, [name, color, editingLabel, createLabel, updateLabel]);

  const handleDeleteConfirm = useCallback((label: Label) => {
    setLabelToDelete(label);
    setShowDeleteConfirm(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!labelToDelete) return;

    try {
      await deleteLabel(labelToDelete.id);
      setShowDeleteConfirm(false);
      setLabelToDelete(null);
    } catch (err) {
      console.error('Failed to delete label:', err);
    }
  }, [labelToDelete, deleteLabel]);

  const renderLabel = useCallback(
    ({ item }: { item: Label }) => (
      <TouchableOpacity
        style={styles.labelItem}
        onPress={() => handleEdit(item)}
      >
        <View
          style={[styles.colorIndicator, { backgroundColor: item.color }]}
        />
        <View style={styles.labelInfo}>
          <Text style={styles.labelName}>{item.name}</Text>
        </View>
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => handleEdit(item)}
        >
          <Ionicons
            name="ellipsis-horizontal"
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    ),
    [handleEdit, styles, colors],
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Метки</Text>
      </View>

      {labels.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="pricetags-outline"
            size={64}
            color={colors.textSecondary}
          />
          <Text style={styles.emptyTitle}>Нет меток</Text>
          <Text style={styles.emptyText}>
            Создайте метки для категоризации задач
          </Text>
        </View>
      ) : (
        <FlatList
          data={labels}
          renderItem={renderLabel}
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
              {editingLabel ? 'Редактировать' : 'Новая метка'}
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
              placeholder="Название метки"
              placeholderTextColor={colors.textSecondary}
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

            <View style={styles.previewSection}>
              <Text style={styles.label}>Предпросмотр</Text>
              <View style={[styles.previewChip, { backgroundColor: color }]}>
                <Text style={styles.previewText}>
                  {name.trim() || 'Название метки'}
                </Text>
              </View>
            </View>

            {editingLabel && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setShowEditor(false);
                  handleDeleteConfirm(editingLabel);
                }}
              >
                <Ionicons
                  name="trash-outline"
                  size={20}
                  color={colors.danger}
                />
                <Text style={styles.deleteText}>Удалить метку</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </Modal>

      <ConfirmDialog
        visible={showDeleteConfirm}
        title="Удалить метку?"
        message={`Метка "${labelToDelete?.name}" будет удалена. Она будет снята со всех задач.`}
        confirmText="Удалить"
        cancelText="Отмена"
        onConfirm={handleDelete}
        onCancel={() => {
          setShowDeleteConfirm(false);
          setLabelToDelete(null);
        }}
        confirmStyle="destructive"
      />
    </View>
  );
}

const createStyles = (colors: Colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: colors.background,
    },
    header: {
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: {
      fontSize: FONT_SIZES.xl,
      fontWeight: '700',
      color: colors.text,
    },
    list: {
      padding: SPACING.md,
    },
    labelItem: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
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
    labelInfo: {
      flex: 1,
    },
    labelName: {
      fontSize: FONT_SIZES.md,
      fontWeight: '500',
      color: colors.text,
    },
    moreButton: {
      padding: SPACING.sm,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: SPACING.xl,
    },
    emptyTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
      color: colors.text,
      marginTop: SPACING.md,
    },
    emptyText: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
      marginTop: SPACING.sm,
      textAlign: 'center',
    },
    editorContainer: {
      flex: 1,
      backgroundColor: colors.background,
    },
    editorHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: SPACING.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    editorTitle: {
      fontSize: FONT_SIZES.lg,
      fontWeight: '600',
      color: colors.text,
    },
    cancelText: {
      fontSize: FONT_SIZES.md,
      color: colors.textSecondary,
    },
    saveText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '600',
      color: colors.primary,
    },
    saveTextDisabled: {
      color: colors.textSecondary,
    },
    disabledButton: {
      opacity: 0.5,
    },
    editorContent: {
      padding: SPACING.md,
    },
    label: {
      fontSize: FONT_SIZES.sm,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: SPACING.sm,
      marginTop: SPACING.md,
    },
    input: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: SPACING.md,
      fontSize: FONT_SIZES.md,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
    },
    colorGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: SPACING.sm,
    },
    colorOption: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: 'center',
      alignItems: 'center',
    },
    colorOptionSelected: {
      borderWidth: 3,
      borderColor: colors.text,
    },
    previewSection: {
      marginTop: SPACING.lg,
    },
    previewChip: {
      alignSelf: 'flex-start',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: 8,
    },
    previewText: {
      fontSize: FONT_SIZES.md,
      fontWeight: '500',
      color: '#FFFFFF',
    },
    deleteButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: SPACING.xl,
      padding: SPACING.md,
      gap: SPACING.sm,
    },
    deleteText: {
      fontSize: FONT_SIZES.md,
      color: colors.danger,
    },
  });
