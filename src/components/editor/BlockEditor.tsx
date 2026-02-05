import React, { useState, useCallback, useEffect, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { BlockRenderer } from "@/components/blocks";
import { useEditorState } from "@/hooks/useEditorState";
import { useBlockOperations } from "@/hooks/useBlockOperations";
import { COLORS, SPACING, BLOCK_TYPES } from "@/constants";
import type { EditorBlock, ExtendedBlockData, BlockType } from "@/types/editor";

interface BlockEditorProps {
  pageId: string;
  initialBlocks?: EditorBlock[];
  onBlocksChange?: (blocks: EditorBlock[]) => void;
  readOnly?: boolean;
}

const generateBlockId = (): string => {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const createInitialBlock = (): EditorBlock => ({
  id: generateBlockId(),
  type: BLOCK_TYPES.PARAGRAPH as BlockType,
  data: { text: "" },
  order: 0,
});

export const BlockEditor: React.FC<BlockEditorProps> = ({
  pageId,
  initialBlocks,
  onBlocksChange,
  readOnly = false,
}) => {
  const [blocks, setBlocks] = useState<EditorBlock[]>(
    initialBlocks?.length ? initialBlocks : [createInitialBlock()],
  );

  const { focusedBlockId, setFocus } = useEditorState();

  const {
    createBlockAfter,
    deleteBlock,
    updateBlock,
    mergeWithPrevious,
    processMarkdownShortcut,
  } = useBlockOperations({ blocks, setBlocks, setFocus });

  useEffect(() => {
    onBlocksChange?.(blocks);
  }, [blocks, onBlocksChange]);

  const handleBlockChange = useCallback(
    (blockId: string, data: ExtendedBlockData) => {
      if (readOnly) return;

      const text = data.text ?? "";
      const processed = processMarkdownShortcut(blockId, text);

      if (!processed) {
        updateBlock(blockId, data);
      }
    },
    [readOnly, processMarkdownShortcut, updateBlock],
  );

  const handleEnterPress = useCallback(
    (blockId: string) => {
      if (readOnly) return;
      createBlockAfter(blockId);
    },
    [readOnly, createBlockAfter],
  );

  const handleBackspaceEmpty = useCallback(
    (blockId: string) => {
      if (readOnly) return;

      const index = blocks.findIndex((b) => b.id === blockId);
      if (index === -1) return;

      const block = blocks[index];
      if (!block) return;

      if (block.type !== BLOCK_TYPES.PARAGRAPH) {
        setBlocks((prev) =>
          prev.map((b) =>
            b.id === blockId
              ? { ...b, type: BLOCK_TYPES.PARAGRAPH as BlockType }
              : b,
          ),
        );
      } else if (index > 0) {
        mergeWithPrevious(blockId);
      }
    },
    [readOnly, blocks, setBlocks, mergeWithPrevious],
  );

  const handleBlockFocus = useCallback(
    (blockId: string) => {
      setFocus(blockId);
    },
    [setFocus],
  );

  const handleBlockBlur = useCallback(() => {
    // Не сбрасываем фокус сразу, чтобы избежать мерцания
  }, []);

  const handleDeleteBlock = useCallback(
    (blockId: string) => {
      if (readOnly) return;
      deleteBlock(blockId);
    },
    [readOnly, deleteBlock],
  );

  // Предвычисляем номера для нумерованных списков за один проход O(n)
  const listNumbers = useMemo(() => {
    const numbers: Record<string, number> = {};
    let currentNumber = 0;

    for (const block of blocks) {
      if (block.type === BLOCK_TYPES.NUMBERED_LIST) {
        currentNumber++;
        numbers[block.id] = currentNumber;
      } else {
        currentNumber = 0;
      }
    }

    return numbers;
  }, [blocks]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {blocks.map((block) => (
          <View key={block.id} style={styles.blockWrapper}>
            <BlockRenderer
              block={block}
              isFocused={focusedBlockId === block.id}
              listNumber={listNumbers[block.id] ?? 1}
              onFocus={() => handleBlockFocus(block.id)}
              onBlur={handleBlockBlur}
              onChange={(data) => handleBlockChange(block.id, data)}
              onDelete={() => handleDeleteBlock(block.id)}
              onEnterPress={() => handleEnterPress(block.id)}
              onBackspaceEmpty={() => handleBackspaceEmpty(block.id)}
            />
          </View>
        ))}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl * 2,
  },
  blockWrapper: {
    marginVertical: 2,
  },
});
