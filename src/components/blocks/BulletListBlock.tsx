import React, { useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { TextBlock } from './TextBlock';
import { COLORS, SPACING } from '@/constants';
import type { BlockComponentProps } from '@/types/editor';

export const BulletListBlock: React.FC<BlockComponentProps> = ({
  block,
  isFocused,
  onFocus,
  onBlur,
  onChange,
  onEnterPress,
  onBackspaceEmpty,
}) => {
  const indent = block.data.indent ?? 0;

  const handleChangeText = useCallback(
    (text: string) => {
      onChange({ ...block.data, text });
    },
    [block.data, onChange]
  );

  return (
    <View style={[styles.container, { paddingLeft: indent * SPACING.lg }]}>
      <View style={styles.bullet} />
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
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.text,
    marginRight: SPACING.sm,
    marginTop: 9,
  },
  textContainer: {
    flex: 1,
  },
});
