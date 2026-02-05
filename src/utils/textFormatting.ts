import type { TextSpan, FormatType } from '@/types/editor';

/**
 * Merge overlapping spans of the same type into single spans.
 */
export const mergeOverlappingSpans = (spans: TextSpan[]): TextSpan[] => {
  if (spans.length === 0) return [];

  const spansByType = new Map<FormatType, TextSpan[]>();

  spans.forEach((span) => {
    const existing = spansByType.get(span.type) ?? [];
    existing.push(span);
    spansByType.set(span.type, existing);
  });

  const result: TextSpan[] = [];

  spansByType.forEach((typeSpans) => {
    const sorted = [...typeSpans].sort((a, b) => a.start - b.start);
    const merged: TextSpan[] = [];

    sorted.forEach((span) => {
      const last = merged[merged.length - 1];
      if (last && span.start <= last.end) {
        last.end = Math.max(last.end, span.end);
      } else {
        merged.push({ ...span });
      }
    });

    result.push(...merged);
  });

  return result.sort((a, b) => a.start - b.start);
};

/**
 * Apply a format to a text range.
 */
export const applyFormat = (
  spans: TextSpan[],
  start: number,
  end: number,
  type: FormatType
): TextSpan[] => {
  if (start >= end) return spans;

  const newSpan: TextSpan = { start, end, type };
  const updatedSpans = [...spans, newSpan];

  return mergeOverlappingSpans(updatedSpans);
};

/**
 * Remove a format from a text range.
 */
export const removeFormat = (
  spans: TextSpan[],
  start: number,
  end: number,
  type?: FormatType
): TextSpan[] => {
  const result: TextSpan[] = [];

  spans.forEach((span) => {
    if (type && span.type !== type) {
      result.push(span);
      return;
    }

    if (span.end <= start || span.start >= end) {
      result.push(span);
      return;
    }

    if (span.start < start) {
      result.push({ ...span, end: start });
    }

    if (span.end > end) {
      result.push({ ...span, start: end });
    }
  });

  return result;
};

/**
 * Get all active format types at a specific cursor position.
 */
export const getFormatsAtPosition = (
  spans: TextSpan[],
  position: number
): FormatType[] => {
  const formats = new Set<FormatType>();

  spans.forEach((span) => {
    if (position >= span.start && position < span.end) {
      formats.add(span.type);
    }
  });

  return Array.from(formats);
};

/**
 * Adjust span positions when text is inserted or deleted.
 */
export const adjustSpansForTextChange = (
  spans: TextSpan[],
  changeStart: number,
  changeLength: number,
  isInsert: boolean
): TextSpan[] => {
  return spans
    .map((span) => {
      if (isInsert) {
        return adjustSpanForInsert(span, changeStart, changeLength);
      }
      return adjustSpanForDelete(span, changeStart, changeLength);
    })
    .filter((span): span is TextSpan => span !== null && span.start < span.end);
};

const adjustSpanForInsert = (
  span: TextSpan,
  insertPos: number,
  length: number
): TextSpan => {
  if (insertPos <= span.start) {
    return { ...span, start: span.start + length, end: span.end + length };
  }

  if (insertPos < span.end) {
    return { ...span, end: span.end + length };
  }

  return span;
};

const adjustSpanForDelete = (
  span: TextSpan,
  deleteStart: number,
  length: number
): TextSpan | null => {
  const deleteEnd = deleteStart + length;

  if (deleteEnd <= span.start) {
    return { ...span, start: span.start - length, end: span.end - length };
  }

  if (deleteStart >= span.end) {
    return span;
  }

  if (deleteStart <= span.start && deleteEnd >= span.end) {
    return null;
  }

  if (deleteStart <= span.start) {
    return {
      ...span,
      start: deleteStart,
      end: span.end - length,
    };
  }

  if (deleteEnd >= span.end) {
    return { ...span, end: deleteStart };
  }

  return { ...span, end: span.end - length };
};
