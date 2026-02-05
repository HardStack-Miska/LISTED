import React, { useState, useCallback } from 'react';
import {
  View,
  TextInput,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';

interface PageHeaderProps {
  title: string;
  icon?: string;
  onTitleChange: (title: string) => void;
  onIconPress?: () => void;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  icon = '📝',
  onTitleChange,
  onIconPress,
}) => {
  const [localTitle, setLocalTitle] = useState(title);

  const handleTitleChange = useCallback(
    (text: string) => {
      setLocalTitle(text);
      onTitleChange(text);
    },
    [onTitleChange]
  );

  return (
    <View style={styles.container}>
      <Pressable style={styles.iconButton} onPress={onIconPress}>
        <Text style={styles.icon}>{icon}</Text>
      </Pressable>
      <TextInput
        style={styles.titleInput}
        value={localTitle}
        onChangeText={handleTitleChange}
        placeholder="Без названия"
        placeholderTextColor={COLORS.textSecondary}
        multiline={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  iconButton: {
    marginRight: SPACING.sm,
    padding: SPACING.xs,
  },
  icon: {
    fontSize: 32,
  },
  titleInput: {
    flex: 1,
    fontSize: FONT_SIZES.xl,
    fontWeight: '700',
    color: COLORS.text,
    padding: 0,
  },
});
