import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TextBlock } from './TextBlock';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import type { BlockComponentProps } from '@/types/editor';

interface NumberedListBlockProps extends BlockComponentProps {
  listNumber?: number;
}

export const NumberedListBlock: React.FC<NumberedListBlockProps> = ({
  block,
  isFocused,
  onFocus,
  onBlur,
  onChange,
  onEnterPress,
  onBackspaceEmpty,
  listNumber = 1,
}) => {
  const indent = block.data.indent ?? 0;
  const displayNumber = block.data.listNumber ?? listNumber;

  const handleChangeText = useCallback(
    (text: string) => {
      onChange({ ...block.data, text });
    },
    [block.data, onChange]
  );

  return (
    <View style={[styles.container, { paddingLeft: indent * SPACING.lg }]}>
      <Text style={styles.number}>{displayNumber}.</Text>
      <View style={styles.textContainer}>
        <TextBlock
          value={block.data.text ?? ''}
          placeholder="Элемент списка"
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
  number: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    marginRight: SPACING.sm,
    minWidth: 20,
  },
  textContainer: {
    flex: 1,
  },
});
