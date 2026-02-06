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
            color={isSelected ? COLORS.primary : COLORS.textSecondary}
          />
        </TouchableOpacity>
      );
    },
    [selectedIds, onToggle],
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
            <Ionicons name="close" size={24} color={COLORS.text} />
          </TouchableOpacity>
        </View>

        {labels.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="pricetags-outline" size={48} color={COLORS.textSecondary} />
            <Text style={styles.emptyText}>Нет меток</Text>
            <Text style={styles.emptyHint}>
              Создайте метки в разделе "Метки"
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
  const selectedLabels = labels.filter((l) => selectedIds.includes(l.id));

  return (
    <TouchableOpacity style={styles.inlineContainer} onPress={onPress}>
      <View style={styles.inlineLeft}>
        <Ionicons name="pricetags-outline" size={20} color={COLORS.textSecondary} />
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
  labelItem: {
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
  labelName: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
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
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyHint: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: 'center',
  },
  footer: {
    padding: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  doneButton: {
    backgroundColor: COLORS.primary,
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
    color: COLORS.textSecondary,
  },
  inlinePlaceholder: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
});
