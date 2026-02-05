import { useState, useCallback } from 'react';
import type { EditorSelection } from '@/types/editor';

interface UseEditorStateResult {
  focusedBlockId: string | null;
  isEditing: boolean;
  selection: EditorSelection | null;
  setFocus: (blockId: string | null) => void;
  setEditing: (editing: boolean) => void;
  setSelection: (selection: EditorSelection | null) => void;
}

export const useEditorState = (): UseEditorStateResult => {
  const [focusedBlockId, setFocusedBlockId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [selection, setSelectionState] = useState<EditorSelection | null>(null);

  const setFocus = useCallback((blockId: string | null) => {
    setFocusedBlockId(blockId);
    setIsEditing(blockId !== null);
  }, []);

  const setEditing = useCallback((editing: boolean) => {
    setIsEditing(editing);
    if (!editing) {
      setFocusedBlockId(null);
    }
  }, []);

  const setSelection = useCallback((sel: EditorSelection | null) => {
    setSelectionState(sel);
  }, []);

  return {
    focusedBlockId,
    isEditing,
    selection,
    setFocus,
    setEditing,
    setSelection,
  };
};
