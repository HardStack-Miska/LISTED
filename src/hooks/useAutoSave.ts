import { useEffect, useRef, useState, useCallback } from 'react';

interface UseAutoSaveOptions {
  debounceMs?: number;
  enabled?: boolean;
}

interface UseAutoSaveResult {
  isSaving: boolean;
  error: Error | null;
  lastSavedAt: Date | null;
  forceSave: () => Promise<void>;
}

export const useAutoSave = <T>(
  data: T,
  onSave: (data: T) => Promise<void>,
  options: UseAutoSaveOptions = {}
): UseAutoSaveResult => {
  const { debounceMs = 500, enabled = true } = options;

  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const dataRef = useRef(data);
  const isFirstRender = useRef(true);

  // Обновляем ref при изменении данных
  dataRef.current = data;

  const save = useCallback(async () => {
    setIsSaving(true);
    setError(null);

    try {
      await onSave(dataRef.current);
      setLastSavedAt(new Date());
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Save failed'));
    } finally {
      setIsSaving(false);
    }
  }, [onSave]);

  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    await save();
  }, [save]);

  useEffect(() => {
    // Пропускаем первый рендер
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (!enabled) return;

    // Очищаем предыдущий таймер
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Запланировать сохранение
    timeoutRef.current = setTimeout(() => {
      save();
    }, debounceMs);

    // Cleanup
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, debounceMs, enabled, save]);

  // Cleanup при размонтировании
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isSaving,
    error,
    lastSavedAt,
    forceSave,
  };
};
