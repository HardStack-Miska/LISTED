import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextBlock } from './TextBlock';
import { SPACING } from '@/constants';
import type { BlockComponentProps } from '@/types/editor';

export const ParagraphBlock: React.FC<BlockComponentProps> = ({
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
        placeholder="Введите текст..."
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
});
