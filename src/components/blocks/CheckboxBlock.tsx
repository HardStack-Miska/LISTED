import React, { useCallback } from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { TextBlock } from './TextBlock';
import { COLORS, SPACING } from '@/constants';
import type { BlockComponentProps } from '@/types/editor';

export const CheckboxBlock: React.FC<BlockComponentProps> = ({
  block,
  isFocused,
  onFocus,
  onBlur,
  onChange,
  onEnterPress,
  onBackspaceEmpty,
}) => {
  const isChecked = block.data.checked ?? false;

  const handleToggle = useCallback(() => {
    onChange({ ...block.data, checked: !isChecked });
  }, [block.data, isChecked, onChange]);

  const handleChangeText = useCallback(
    (text: string) => {
      onChange({ ...block.data, text });
    },
    [block.data, onChange]
  );

  return (
    <View style={styles.container}>
      <Pressable
        style={[styles.checkbox, isChecked && styles.checkboxChecked]}
        onPress={handleToggle}
      >
        {isChecked && <View style={styles.checkmark} />}
      </Pressable>
      <View style={styles.textContainer}>
        <TextBlock
          value={block.data.text ?? ''}
          placeholder="Задача"
          style={isChecked ? styles.textChecked : undefined}
          autoFocus={isFocused && !block.data.text}
          onChangeText={handleChangeText}
          onEnterPress={onEnterPress}
          onBackspaceEmpty={onBackspaceEmpty}
          onFocus={onFocus}
          onBlur={onBlur}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: SPACING.xs,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginRight: SPACING.sm,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    width: 10,
    height: 6,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: COLORS.white,
    transform: [{ rotate: '-45deg' }, { translateY: -1 }],
  },
  textContainer: {
    flex: 1,
  },
  textChecked: {
    textDecorationLine: 'line-through',
    color: COLORS.textSecondary,
  },
});
