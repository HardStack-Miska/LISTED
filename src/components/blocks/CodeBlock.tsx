import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextBlock } from './TextBlock';
import { COLORS, SPACING, FONT_SIZES } from '@/constants';
import type { BlockComponentProps } from '@/types/editor';

export const CodeBlock: React.FC<BlockComponentProps> = ({
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

  return (
    <View style={styles.container}>
      <TextBlock
        value={block.data.text ?? ''}
        placeholder="Код"
        style={styles.codeText}
        multiline={true}
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
    backgroundColor: COLORS.surface,
    borderRadius: 8,
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: FONT_SIZES.sm,
    color: COLORS.text,
    lineHeight: 22,
  },
});
