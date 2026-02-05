import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type {
  CustomFilter,
  FilterCondition,
  FilterConditionType,
  FilterComparator,
  FilterOperator,
} from "@/types";
import { useTheme } from "@/contexts/ThemeContext";

interface FilterBuilderProps {
  visible: boolean;
  onClose: () => void;
  onSave: (filter: CustomFilter) => void;
  initialFilter?: CustomFilter;
}

const CONDITION_TYPES: { value: FilterConditionType; label: string }[] = [
  { value: "priority", label: "Приоритет" },
  { value: "dueDate", label: "Дата" },
  { value: "completed", label: "Статус" },
  { value: "hasReminder", label: "Напоминание" },
  { value: "isRecurring", label: "Повторение" },
  { value: "hasDuration", label: "Длительность" },
];

const DATE_COMPARATORS: { value: FilterComparator; label: string }[] = [
  { value: "today", label: "Сегодня" },
  { value: "thisWeek", label: "На этой неделе" },
  { value: "overdue", label: "Просрочено" },
  { value: "noDate", label: "Без даты" },
];

const PRIORITY_VALUES = [
  { value: 1, label: "Приоритет 1" },
  { value: 2, label: "Приоритет 2" },
  { value: 3, label: "Приоритет 3" },
  { value: 4, label: "Приоритет 4" },
];

const FILTER_COLORS = [
  "#d1453b",
  "#eb8909",
  "#ffc107",
  "#4caf50",
  "#2196f3",
  "#9c27b0",
  "#e91e63",
  "#607d8b",
];

export const FilterBuilder: React.FC<FilterBuilderProps> = ({
  visible,
  onClose,
  onSave,
  initialFilter,
}) => {
  const { colors } = useTheme();
  const [name, setName] = useState(initialFilter?.name ?? "");
  const [color, setColor] = useState(
    initialFilter?.color ?? FILTER_COLORS[0] ?? "#d1453b",
  );
  const [operator, setOperator] = useState<FilterOperator>(
    initialFilter?.operator ?? "and",
  );
  const [conditions, setConditions] = useState<FilterCondition[]>(
    initialFilter?.conditions ?? [],
  );
  const [showConditionPicker, setShowConditionPicker] = useState(false);

  const generateId = () => Math.random().toString(36).substring(7);

  const addCondition = (type: FilterConditionType) => {
    const newCondition: FilterCondition = {
      id: generateId(),
      type,
      comparator: getDefaultComparator(type),
      value: getDefaultValue(type),
    };
    setConditions([...conditions, newCondition]);
    setShowConditionPicker(false);
  };

  const getDefaultComparator = (
    type: FilterConditionType,
  ): FilterComparator => {
    switch (type) {
      case "dueDate":
        return "today";
      case "priority":
        return "equals";
      default:
        return "equals";
    }
  };

  const getDefaultValue = (
    type: FilterConditionType,
  ): string | number | boolean | undefined => {
    switch (type) {
      case "priority":
        return 1;
      case "completed":
      case "hasReminder":
      case "isRecurring":
      case "hasDuration":
        return true;
      default:
        return undefined;
    }
  };

  const updateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setConditions(
      conditions.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    );
  };

  const removeCondition = (id: string) => {
    setConditions(conditions.filter((c) => c.id !== id));
  };

  const handleSave = () => {
    if (!name.trim() || conditions.length === 0) return;

    const filter: CustomFilter = {
      id: initialFilter?.id ?? generateId(),
      name: name.trim(),
      color,
      conditions,
      operator,
      isFavorite: initialFilter?.isFavorite ?? false,
      order: initialFilter?.order ?? 0,
      createdAt: initialFilter?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };

    onSave(filter);
    onClose();
  };

  const renderCondition = (condition: FilterCondition) => {
    return (
      <View
        key={condition.id}
        style={[styles.conditionCard, { backgroundColor: colors.surface }]}
      >
        <View style={styles.conditionHeader}>
          <Text style={[styles.conditionType, { color: colors.text }]}>
            {CONDITION_TYPES.find((t) => t.value === condition.type)?.label}
          </Text>
          <TouchableOpacity
            onPress={() => removeCondition(condition.id)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>

        {condition.type === "dueDate" && (
          <View style={styles.optionsRow}>
            {DATE_COMPARATORS.map((comp) => (
              <TouchableOpacity
                key={comp.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      condition.comparator === comp.value
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() =>
                  updateCondition(condition.id, { comparator: comp.value })
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        condition.comparator === comp.value
                          ? "#fff"
                          : colors.text,
                    },
                  ]}
                >
                  {comp.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {condition.type === "priority" && (
          <View style={styles.optionsRow}>
            {PRIORITY_VALUES.map((prio) => (
              <TouchableOpacity
                key={prio.value}
                style={[
                  styles.optionButton,
                  {
                    backgroundColor:
                      condition.value === prio.value
                        ? colors.primary
                        : colors.border,
                  },
                ]}
                onPress={() =>
                  updateCondition(condition.id, { value: prio.value })
                }
              >
                <Text
                  style={[
                    styles.optionText,
                    {
                      color:
                        condition.value === prio.value ? "#fff" : colors.text,
                    },
                  ]}
                >
                  {prio.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {(condition.type === "completed" ||
          condition.type === "hasReminder" ||
          condition.type === "isRecurring" ||
          condition.type === "hasDuration") && (
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    condition.value === true ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateCondition(condition.id, { value: true })}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: condition.value === true ? "#fff" : colors.text },
                ]}
              >
                Да
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                {
                  backgroundColor:
                    condition.value === false ? colors.primary : colors.border,
                },
              ]}
              onPress={() => updateCondition(condition.id, { value: false })}
            >
              <Text
                style={[
                  styles.optionText,
                  { color: condition.value === false ? "#fff" : colors.text },
                ]}
              >
                Нет
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity onPress={onClose}>
            <Text
              style={[styles.cancelButton, { color: colors.textSecondary }]}
            >
              Отмена
            </Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>
            {initialFilter ? "Редактировать фильтр" : "Новый фильтр"}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={!name.trim() || conditions.length === 0}
          >
            <Text
              style={[
                styles.saveButton,
                {
                  color:
                    name.trim() && conditions.length > 0
                      ? colors.primary
                      : colors.textSecondary,
                },
              ]}
            >
              Сохранить
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Название
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.surface,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={name}
              onChangeText={setName}
              placeholder="Название фильтра"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Цвет
            </Text>
            <View style={styles.colorRow}>
              {FILTER_COLORS.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.colorOption,
                    { backgroundColor: c },
                    color === c && styles.colorSelected,
                  ]}
                  onPress={() => setColor(c)}
                >
                  {color === c && (
                    <Ionicons name="checkmark" size={16} color="#fff" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Логика
            </Text>
            <View style={styles.operatorRow}>
              <TouchableOpacity
                style={[
                  styles.operatorButton,
                  {
                    backgroundColor:
                      operator === "and" ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setOperator("and")}
              >
                <Text
                  style={[
                    styles.operatorText,
                    { color: operator === "and" ? "#fff" : colors.text },
                  ]}
                >
                  Все условия (И)
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.operatorButton,
                  {
                    backgroundColor:
                      operator === "or" ? colors.primary : colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                onPress={() => setOperator("or")}
              >
                <Text
                  style={[
                    styles.operatorText,
                    { color: operator === "or" ? "#fff" : colors.text },
                  ]}
                >
                  Любое условие (ИЛИ)
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Условия
            </Text>

            {conditions.map(renderCondition)}

            <TouchableOpacity
              style={[
                styles.addConditionButton,
                { borderColor: colors.primary },
              ]}
              onPress={() => setShowConditionPicker(true)}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text
                style={[styles.addConditionText, { color: colors.primary }]}
              >
                Добавить условие
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        <Modal
          visible={showConditionPicker}
          animationType="fade"
          transparent
          onRequestClose={() => setShowConditionPicker(false)}
        >
          <TouchableOpacity
            style={styles.pickerOverlay}
            activeOpacity={1}
            onPress={() => setShowConditionPicker(false)}
          >
            <View
              style={[
                styles.pickerContent,
                { backgroundColor: colors.surface },
              ]}
            >
              <Text style={[styles.pickerTitle, { color: colors.text }]}>
                Выберите тип условия
              </Text>
              {CONDITION_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.value}
                  style={[
                    styles.pickerItem,
                    { borderBottomColor: colors.border },
                  ]}
                  onPress={() => addCondition(type.value)}
                >
                  <Text style={[styles.pickerItemText, { color: colors.text }]}>
                    {type.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  cancelButton: {
    fontSize: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "600",
  },
  saveButton: {
    fontSize: 16,
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  colorRow: {
    flexDirection: "row",
    gap: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  colorSelected: {
    borderWidth: 2,
    borderColor: "#fff",
  },
  operatorRow: {
    flexDirection: "row",
    gap: 8,
  },
  operatorButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
    borderWidth: 1,
  },
  operatorText: {
    fontSize: 14,
    fontWeight: "500",
  },
  conditionCard: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  conditionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  conditionType: {
    fontSize: 14,
    fontWeight: "600",
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  optionText: {
    fontSize: 13,
  },
  addConditionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: "dashed",
    gap: 8,
  },
  addConditionText: {
    fontSize: 14,
    fontWeight: "500",
  },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  pickerContent: {
    width: "100%",
    borderRadius: 12,
    paddingVertical: 8,
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  pickerItemText: {
    fontSize: 16,
  },
});
