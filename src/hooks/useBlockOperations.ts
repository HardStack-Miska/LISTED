import { useCallback } from "react";
import { BLOCK_TYPES } from "@/constants";
import { MARKDOWN_SHORTCUTS } from "@/constants/blockTypes";
import type { EditorBlock, ExtendedBlockData, BlockType } from "@/types/editor";

const generateId = (): string => {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

interface UseBlockOperationsProps {
  blocks: EditorBlock[];
  setBlocks: React.Dispatch<React.SetStateAction<EditorBlock[]>>;
  setFocus: (blockId: string | null) => void;
}

interface UseBlockOperationsResult {
  createBlockAfter: (blockId: string, type?: BlockType) => EditorBlock;
  createBlockBefore: (blockId: string, type?: BlockType) => EditorBlock;
  deleteBlock: (blockId: string) => void;
  updateBlock: (blockId: string, data: ExtendedBlockData) => void;
  mergeWithPrevious: (blockId: string) => void;
  splitBlock: (blockId: string, position: number) => EditorBlock | null;
  changeBlockType: (blockId: string, newType: BlockType) => void;
  moveBlock: (blockId: string, newIndex: number) => void;
  processMarkdownShortcut: (blockId: string, text: string) => boolean;
}

export const useBlockOperations = ({
  blocks,
  setBlocks,
  setFocus,
}: UseBlockOperationsProps): UseBlockOperationsResult => {
  const createBlockAfter = useCallback(
    (
      blockId: string,
      type: BlockType = BLOCK_TYPES.PARAGRAPH as BlockType,
    ): EditorBlock => {
      const newBlock: EditorBlock = {
        id: generateId(),
        type,
        data: { text: "" },
        order: 0,
      };

      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === blockId);
        if (index === -1) return prev;

        const newBlocks = [...prev];
        newBlocks.splice(index + 1, 0, newBlock);

        return newBlocks.map((b, i) => ({ ...b, order: i }));
      });

      setTimeout(() => setFocus(newBlock.id), 50);
      return newBlock;
    },
    [setBlocks, setFocus],
  );

  const createBlockBefore = useCallback(
    (
      blockId: string,
      type: BlockType = BLOCK_TYPES.PARAGRAPH as BlockType,
    ): EditorBlock => {
      const newBlock: EditorBlock = {
        id: generateId(),
        type,
        data: { text: "" },
        order: 0,
      };

      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === blockId);
        if (index === -1) return prev;

        const newBlocks = [...prev];
        newBlocks.splice(index, 0, newBlock);

        return newBlocks.map((b, i) => ({ ...b, order: i }));
      });

      setTimeout(() => setFocus(newBlock.id), 50);
      return newBlock;
    },
    [setBlocks, setFocus],
  );

  const deleteBlock = useCallback(
    (blockId: string) => {
      setBlocks((prev) => {
        if (prev.length <= 1) return prev;

        const index = prev.findIndex((b) => b.id === blockId);
        if (index === -1) return prev;

        const newBlocks = prev.filter((b) => b.id !== blockId);
        const focusIndex = Math.max(0, index - 1);

        setTimeout(() => setFocus(newBlocks[focusIndex]?.id ?? null), 50);

        return newBlocks.map((b, i) => ({ ...b, order: i }));
      });
    },
    [setBlocks, setFocus],
  );

  const updateBlock = useCallback(
    (blockId: string, data: ExtendedBlockData) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, data } : b)),
      );
    },
    [setBlocks],
  );

  const mergeWithPrevious = useCallback(
    (blockId: string) => {
      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === blockId);
        if (index <= 0) return prev;

        const currentBlock = prev[index];
        const previousBlock = prev[index - 1];

        if (!currentBlock || !previousBlock) return prev;

        const mergedData: ExtendedBlockData = {
          ...previousBlock.data,
          text:
            (previousBlock.data.text ?? "") + (currentBlock.data.text ?? ""),
        };

        const newBlocks = prev.filter((b) => b.id !== blockId);
        newBlocks[index - 1] = { ...previousBlock, data: mergedData };

        setTimeout(() => setFocus(previousBlock.id), 50);

        return newBlocks.map((b, i) => ({ ...b, order: i }));
      });
    },
    [setBlocks, setFocus],
  );

  const splitBlock = useCallback(
    (blockId: string, position: number): EditorBlock | null => {
      let newBlock: EditorBlock | null = null;

      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === blockId);
        if (index === -1) return prev;

        const currentBlock = prev[index];
        if (!currentBlock) return prev;

        const text = currentBlock.data.text ?? "";
        const beforeText = text.slice(0, position);
        const afterText = text.slice(position);

        newBlock = {
          id: generateId(),
          type: BLOCK_TYPES.PARAGRAPH as BlockType,
          data: { text: afterText },
          order: index + 1,
        };

        const updatedCurrent = {
          ...currentBlock,
          data: { ...currentBlock.data, text: beforeText },
        };

        const newBlocks = [...prev];
        newBlocks[index] = updatedCurrent;
        newBlocks.splice(index + 1, 0, newBlock);

        return newBlocks.map((b, i) => ({ ...b, order: i }));
      });

      if (newBlock) {
        setTimeout(() => setFocus(newBlock!.id), 50);
      }

      return newBlock;
    },
    [setBlocks, setFocus],
  );

  const changeBlockType = useCallback(
    (blockId: string, newType: BlockType) => {
      setBlocks((prev) =>
        prev.map((b) => (b.id === blockId ? { ...b, type: newType } : b)),
      );
    },
    [setBlocks],
  );

  const moveBlock = useCallback(
    (blockId: string, newIndex: number) => {
      setBlocks((prev) => {
        const index = prev.findIndex((b) => b.id === blockId);
        if (index === -1 || newIndex < 0 || newIndex >= prev.length)
          return prev;

        const newBlocks = [...prev];
        const [removed] = newBlocks.splice(index, 1);
        if (removed) {
          newBlocks.splice(newIndex, 0, removed);
        }

        return newBlocks.map((b, i) => ({ ...b, order: i }));
      });
    },
    [setBlocks],
  );

  const processMarkdownShortcut = useCallback(
    (blockId: string, text: string): boolean => {
      for (const [shortcut, blockType] of Object.entries(MARKDOWN_SHORTCUTS)) {
        if (text.startsWith(shortcut)) {
          const newText = text.slice(shortcut.length);
          changeBlockType(blockId, blockType);
          updateBlock(blockId, { text: newText });
          return true;
        }
      }
      return false;
    },
    [changeBlockType, updateBlock],
  );

  return {
    createBlockAfter,
    createBlockBefore,
    deleteBlock,
    updateBlock,
    mergeWithPrevious,
    splitBlock,
    changeBlockType,
    moveBlock,
    processMarkdownShortcut,
  };
};
