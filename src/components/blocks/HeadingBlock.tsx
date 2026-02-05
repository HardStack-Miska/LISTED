import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, TextStyle } from 'react-native';
import { TextBlock } from './TextBlock';
import { COLORS, SPACING, FONT_SIZES, BLOCK_TYPES } from '@/constants';
import type { BlockComponentProps } from '@/types/editor';

export const HeadingBlock: React.FC<BlockComponentProps> = ({
  block,
  isFocused,
  onFocus,
  onBlur,
  onChange,
  onEnterPress,
  onBackspaceEmpty,
}) => {
  const handleChangeText = useCallback(
    (text: string) => {
      onChange({ ...block.data, text });
    },
    [block.data, onChange]
  );

  const headingStyle = useMemo((): TextStyle => {
    switch (block.type) {
      case BLOCK_TYPES.HEADING1:
        return styles.heading1;
      case BLOCK_TYPES.HEADING2:
        return styles.heading2;
      case BLOCK_TYPES.HEADING3:
        return styles.heading3;
      default:
        return styles.heading1;
    }
  }, [block.type]);

  const placeholder = useMemo(() => {
    switch (block.type) {
      case BLOCK_TYPES.HEADING1:
        return 'Заголовок 1';
      case BLOCK_TYPES.HEADING2:
        return 'Заголовок 2';
      case BLOCK_TYPES.HEADING3:
        return 'Заголовок 3';
      default:
        return 'Заголовок';
    }
  }, [block.type]);

  return (
    <View style={styles.container}>
      <TextBlock
        value={block.data.text ?? ''}
        placeholder={placeholder}
        style={headingStyle}
        autoFocus={isFocused && !block.data.text}
        onChangeText={handleChangeText}
        onEnterPress={onEnterPress}
        onBackspaceEmpty={onBackspaceEmpty}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: SPACING.xs,
  },
  heading1: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 40,
  },
  heading2: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 32,
  },
  heading3: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
    color: COLORS.text,
    lineHeight: 28,
  },
});
