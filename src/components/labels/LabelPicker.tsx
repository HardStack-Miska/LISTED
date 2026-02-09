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
import { useLabels } from '@/hooks';
import type { Colors } from '@/contexts';
import type { Label } from '@/types';

interface LabelPickerProps {
  visible: boolean;
  labels: Label[];
  selectedIds: string[];
  onToggle: (labelId: string) => void;
  onClose: () => void;
}

export const LabelPicker: React.FC<LabelPickerProps> = ({
  visible,
  labels,
  selectedIds,
  onToggle,
  onClose,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { labels: hookLabels, createLabel, refresh: refreshLabels } = useLabels();
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');

  const handleCreateLabel = useCallback(async () => {
    if (!newName.trim()) return;
    try {
      const result = await createLabel(newName.trim(), newColor);
      await refreshLabels();
      setIsCreating(false);
      setNewName('');
      onToggle(result.id);
    } catch {
      Alert.alert('Ошибка', 'Не удалось создать метку');
    }
  }, [newName, newColor, createLabel, refreshLabels, onToggle]);

  const renderLabel = useCallback(
    ({ item }: { item: Label }) => {
      const isSelected = selectedIds.includes(item.id);
      return (
        <TouchableOpacity
          style={styles.labelItem}
          onPress={() => onToggle(item.id)}
        >
          <View style={[styles.colorDot, { backgroundColor: item.color }]} />
          <Text style={styles.labelName}>{item.name}</Text>
          <Ionicons
            name={isSelected ? 'checkbox' : 'square-outline'}
            size={22}
            color={isSelected ? colors.primary : colors.textSecondary}
          />
        </TouchableOpacity>
      );
    },
    [selectedIds, onToggle, styles, colors],
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
          <Text style={styles.title}>Выберите метки</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Inline create */}
        {isCreating ? (
          <View style={styles.createForm}>
            <TextInput
              style={styles.createInput}
              placeholder="Название метки"
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
                onPress={handleCreateLabel}
                disabled={!newName.trim()}
              >
                <Text style={styles.createConfirmText}>Создать</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={styles.addNewButton} onPress={() => setIsCreating(true)}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addNewText}>Новая метка</Text>
          </TouchableOpacity>
        )}

        {hookLabels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyText}>Нет меток</Text>
            <Text style={styles.emptyHint}>
              Создайте метки в разделе "Метки"
            </Text>
          </View>
        ) : (
          <FlatList
            data={hookLabels}
            renderItem={renderLabel}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
          />
        )}

        <View style={styles.footer}>
          <TouchableOpacity style={styles.doneButton} onPress={onClose}>
            <Text style={styles.doneText}>Готово</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

interface LabelPickerInlineProps {
  labels: Label[];
  selectedIds: string[];
  onPress: () => void;
}

export const LabelPickerInline: React.FC<LabelPickerInlineProps> = ({
  labels,
  selectedIds,
  onPress,
}) => {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const selectedLabels = labels.filter((l) => selectedIds.includes(l.id));

  return (
    <TouchableOpacity style={styles.inlineContainer} onPress={onPress}>
      <View style={styles.inlineLeft}>
        <Ionicons name="pricetags-outline" size={20} color={colors.textSecondary} />
        <Text style={styles.inlineLabel}>Метки</Text>
      </View>
      <View style={styles.inlineRight}>
        {selectedLabels.length > 0 ? (
          <View style={styles.labelsPreview}>
            {selectedLabels.slice(0, 3).map((label) => (
              <View
                key={label.id}
                style={[styles.labelChip, { backgroundColor: label.color }]}
              >
                <Text style={styles.labelChipText}>{label.name}</Text>
              </View>
            ))}
            {selectedLabels.length > 3 && (
              <Text style={styles.moreLabels}>+{selectedLabels.length - 3}</Text>
            )}
          </View>
        ) : (
          <Text style={styles.inlinePlaceholder}>Не выбраны</Text>
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
  labelItem: {
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
  labelName: {
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: colors.text,
    marginTop: SPACING.md,
  },
  emptyHint: {
    fontSize: FONT_SIZES.md,
    color: colors.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  doneButton: {
    backgroundColor: colors.primary,
    padding: SPACING.md,
    borderRadius: 12,
    alignItems: 'center',
  },
  doneText: {
    fontSize: FONT_SIZES.md,
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
    flex: 1,
    justifyContent: 'flex-end',
  },
  labelsPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
  },
  labelChip: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: 4,
  },
  labelChipText: {
    fontSize: FONT_SIZES.xs,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  moreLabels: {
    fontSize: FONT_SIZES.sm,
    color: colors.textSecondary,
  },
  inlinePlaceholder: {
    fontSize: FONT_SIZES.md,
    color: colors.textSecondary,
  },
});
