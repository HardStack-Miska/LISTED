import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, FONT_SIZES, UI_SIZES } from '@/constants';
import { PriorityPicker } from './PriorityPicker';
import { DatePicker } from './DatePicker';
import type { Priority } from '@/types/task';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ANIMATION_DURATION = 300;

interface Project {
  id: string;
  name: string;
  color?: string;
}

interface QuickAddTaskProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (task: {
    title: string;
    priority: Priority;
    dueDate: Date | null;
    projectId: string | null;
  }) => void;
  projects?: Project[];
  defaultProjectId?: string | null;
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  visible,
  onClose,
  onSubmit,
  projects = [],
  defaultProjectId = null,
}) => {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>(4);
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    defaultProjectId
  );
  const [showProjectPicker, setShowProjectPicker] = useState(false);

  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 65,
          useNativeDriver: true,
        }),
      ]).start(() => {
        inputRef.current?.focus();
      });
    } else {
      Keyboard.dismiss();
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: ANIMATION_DURATION,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, fadeAnim, slideAnim]);

  const resetForm = useCallback(() => {
    setTitle('');
    setPriority(4);
    setDueDate(null);
    setSelectedProjectId(defaultProjectId);
  }, [defaultProjectId]);

  const handleClose = useCallback(() => {
    resetForm();
    onClose();
  }, [onClose, resetForm]);

  const handleSubmit = useCallback(() => {
    if (!title.trim()) {
      return;
    }

    onSubmit({
      title: title.trim(),
      priority,
      dueDate,
      projectId: selectedProjectId,
    });

    resetForm();
    onClose();
  }, [title, priority, dueDate, selectedProjectId, onSubmit, onClose, resetForm]);

  const handleProjectSelect = useCallback((projectId: string | null) => {
    setSelectedProjectId(projectId);
    setShowProjectPicker(false);
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  const renderProjectPicker = () => (
    <Modal
      visible={showProjectPicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowProjectPicker(false)}
    >
      <Pressable
        style={styles.projectPickerOverlay}
        onPress={() => setShowProjectPicker(false)}
      >
        <View style={styles.projectPickerContainer}>
          <Text style={styles.projectPickerTitle}>Выберите проект</Text>
          <ScrollView style={styles.projectList}>
            <Pressable
              style={({ pressed }) => [
                styles.projectItem,
                !selectedProjectId && styles.projectItemSelected,
                pressed && styles.pressed,
              ]}
              onPress={() => handleProjectSelect(null)}
            >
              <Ionicons
                name="folder-outline"
                size={20}
                color={COLORS.textSecondary}
              />
              <Text style={styles.projectItemText}>Входящие</Text>
              {!selectedProjectId && (
                <Ionicons
                  name="checkmark"
                  size={20}
                  color={COLORS.primary}
                  style={styles.checkIcon}
                />
              )}
            </Pressable>
            {projects.map((project) => (
              <Pressable
                key={project.id}
                style={({ pressed }) => [
                  styles.projectItem,
                  selectedProjectId === project.id && styles.projectItemSelected,
                  pressed && styles.pressed,
                ]}
                onPress={() => handleProjectSelect(project.id)}
              >
                <View
                  style={[
                    styles.projectColor,
                    { backgroundColor: project.color || COLORS.textSecondary },
                  ]}
                />
                <Text style={styles.projectItemText}>{project.name}</Text>
                {selectedProjectId === project.id && (
                  <Ionicons
                    name="checkmark"
                    size={20}
                    color={COLORS.primary}
                    style={styles.checkIcon}
                  />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
          <Pressable style={styles.overlayPressable} onPress={handleClose} />
        </Animated.View>

        <Animated.View
          style={[
            styles.container,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={styles.handle} />

          <View style={styles.header}>
            <Pressable onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={COLORS.textSecondary} />
            </Pressable>
            <Text style={styles.headerTitle}>Новая задача</Text>
            <View style={styles.placeholder} />
          </View>

          <ScrollView
            style={styles.content}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder="Название задачи"
                placeholderTextColor={COLORS.textSecondary}
                value={title}
                onChangeText={setTitle}
                multiline
                maxLength={500}
                returnKeyType="done"
                blurOnSubmit
              />
            </View>

            <DatePicker value={dueDate} onChange={setDueDate} />

            <PriorityPicker value={priority} onChange={setPriority} />

            <View style={styles.projectSection}>
              <Text style={styles.label}>Проект</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.projectButton,
                  pressed && styles.pressed,
                ]}
                onPress={() => setShowProjectPicker(true)}
              >
                {selectedProject ? (
                  <>
                    <View
                      style={[
                        styles.projectColor,
                        {
                          backgroundColor:
                            selectedProject.color || COLORS.textSecondary,
                        },
                      ]}
                    />
                    <Text style={styles.projectButtonText}>
                      {selectedProject.name}
                    </Text>
                  </>
                ) : (
                  <>
                    <Ionicons
                      name="folder-outline"
                      size={18}
                      color={COLORS.textSecondary}
                    />
                    <Text style={styles.projectButtonText}>Входящие</Text>
                  </>
                )}
                <Ionicons
                  name="chevron-down"
                  size={18}
                  color={COLORS.textSecondary}
                  style={styles.chevron}
                />
              </Pressable>
            </View>
          </ScrollView>

          <View style={styles.footer}>
            <Pressable
              style={({ pressed }) => [
                styles.submitButton,
                !title.trim() && styles.submitButtonDisabled,
                pressed && title.trim() && styles.submitButtonPressed,
              ]}
              onPress={handleSubmit}
              disabled={!title.trim()}
            >
              <Ionicons name="add" size={20} color={COLORS.white} />
              <Text style={styles.submitButtonText}>Добавить задачу</Text>
            </Pressable>
          </View>
        </Animated.View>

        {renderProjectPicker()}
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoid: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayPressable: {
    flex: 1,
  },
  container: {
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 20,
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
  },
  placeholder: {
    width: 32,
  },
  content: {
    padding: SPACING.md,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  input: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    padding: SPACING.sm,
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    minHeight: 48,
    maxHeight: 120,
  },
  label: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  projectSection: {
    marginBottom: SPACING.md,
  },
  projectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  projectColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  projectButtonText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  chevron: {
    marginLeft: 'auto',
  },
  pressed: {
    opacity: 0.7,
    backgroundColor: COLORS.surface,
  },
  footer: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    borderRadius: 8,
    gap: SPACING.xs,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.border,
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: COLORS.white,
  },
  projectPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectPickerContainer: {
    backgroundColor: COLORS.white,
    borderRadius: UI_SIZES.cardRadius,
    width: 280,
    maxHeight: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 16,
  },
  projectPickerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    padding: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  projectList: {
    maxHeight: 320,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    gap: SPACING.sm,
  },
  projectItemSelected: {
    backgroundColor: COLORS.surface,
  },
  projectItemText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});
