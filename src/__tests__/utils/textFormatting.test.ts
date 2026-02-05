import {
  mergeOverlappingSpans,
  applyFormat,
  removeFormat,
  getFormatsAtPosition,
  adjustSpansForTextChange,
} from "@/utils/textFormatting";
import type { TextSpan, FormatType } from "@/types/editor";

describe("textFormatting utilities", () => {
  describe("mergeOverlappingSpans", () => {
    it("should merge adjacent spans with same format", () => {
      const spans: TextSpan[] = [
        { type: "bold", start: 0, end: 5 },
        { type: "bold", start: 5, end: 10 },
      ];

      const result = mergeOverlappingSpans(spans);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "bold", start: 0, end: 10 });
    });

    it("should merge overlapping spans with same format", () => {
      const spans: TextSpan[] = [
        { type: "italic", start: 0, end: 7 },
        { type: "italic", start: 5, end: 12 },
      ];

      const result = mergeOverlappingSpans(spans);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "italic", start: 0, end: 12 });
    });

    it("should not merge spans with different formats", () => {
      const spans: TextSpan[] = [
        { type: "bold", start: 0, end: 5 },
        { type: "italic", start: 5, end: 10 },
      ];

      const result = mergeOverlappingSpans(spans);

      expect(result).toHaveLength(2);
    });

    it("should handle empty array", () => {
      const result = mergeOverlappingSpans([]);
      expect(result).toEqual([]);
    });

    it("should sort spans by start position", () => {
      const spans: TextSpan[] = [
        { type: "bold", start: 10, end: 15 },
        { type: "italic", start: 0, end: 5 },
      ];

      const result = mergeOverlappingSpans(spans);

      expect(result[0]!.start).toBeLessThan(result[1]!.start);
    });
  });

  describe("applyFormat", () => {
    it("should add new format to empty spans", () => {
      const result = applyFormat([], 0, 5, "bold");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "bold", start: 0, end: 5 });
    });

    it("should add format without affecting existing different formats", () => {
      const spans: TextSpan[] = [{ type: "italic", start: 0, end: 10 }];

      const result = applyFormat(spans, 2, 7, "bold");

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ type: "italic", start: 0, end: 10 });
      expect(result).toContainEqual({ type: "bold", start: 2, end: 7 });
    });

    it("should extend existing format if adjacent", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 5 }];

      const result = applyFormat(spans, 5, 10, "bold");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "bold", start: 0, end: 10 });
    });

    it("should not add span if start >= end", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 5 }];

      const result = applyFormat(spans, 10, 5, "italic");

      expect(result).toEqual(spans);
    });
  });

  describe("removeFormat", () => {
    it("should remove format completely if range covers entire span", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 2, end: 8 }];

      const result = removeFormat(spans, 0, 10, "bold");

      expect(result).toHaveLength(0);
    });

    it("should split span if removing format from middle", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 10 }];

      const result = removeFormat(spans, 3, 7, "bold");

      expect(result).toHaveLength(2);
      expect(result).toContainEqual({ type: "bold", start: 0, end: 3 });
      expect(result).toContainEqual({ type: "bold", start: 7, end: 10 });
    });

    it("should trim span from start", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 10 }];

      const result = removeFormat(spans, 0, 5, "bold");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "bold", start: 5, end: 10 });
    });

    it("should trim span from end", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 10 }];

      const result = removeFormat(spans, 5, 10, "bold");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "bold", start: 0, end: 5 });
    });

    it("should not affect other format types when type is specified", () => {
      const spans: TextSpan[] = [
        { type: "bold", start: 0, end: 10 },
        { type: "italic", start: 0, end: 10 },
      ];

      const result = removeFormat(spans, 0, 10, "bold");

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({ type: "italic", start: 0, end: 10 });
    });

    it("should keep spans outside the removal range", () => {
      const spans: TextSpan[] = [
        { type: "bold", start: 0, end: 5 },
        { type: "bold", start: 15, end: 20 },
      ];

      const result = removeFormat(spans, 7, 12, "bold");

      expect(result).toHaveLength(2);
    });
  });

  describe("getFormatsAtPosition", () => {
    it("should return all formats at cursor position", () => {
      const spans: TextSpan[] = [
        { type: "bold", start: 0, end: 10 },
        { type: "italic", start: 5, end: 15 },
      ];

      const result = getFormatsAtPosition(spans, 7);

      expect(result).toContain("bold");
      expect(result).toContain("italic");
    });

    it("should return empty array if no formats at position", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 10, end: 20 }];

      const result = getFormatsAtPosition(spans, 5);

      expect(result).toEqual([]);
    });

    it("should handle cursor at span boundary", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 5 }];

      // At end boundary - should not include (position < end)
      expect(getFormatsAtPosition(spans, 5)).not.toContain("bold");

      // At start boundary - should include (position >= start)
      expect(getFormatsAtPosition(spans, 0)).toContain("bold");
    });

    it("should return unique format types", () => {
      const spans: TextSpan[] = [
        { type: "bold", start: 0, end: 10 },
        { type: "bold", start: 5, end: 15 },
      ];

      const result = getFormatsAtPosition(spans, 7);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe("bold");
    });
  });

  describe("adjustSpansForTextChange", () => {
    it("should shift spans right when text is inserted before", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 5, end: 10 }];

      const result = adjustSpansForTextChange(spans, 0, 3, true);

      expect(result[0]).toEqual({ type: "bold", start: 8, end: 13 });
    });

    it("should expand span when text is inserted inside", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 10 }];

      const result = adjustSpansForTextChange(spans, 5, 3, true);

      expect(result[0]).toEqual({ type: "bold", start: 0, end: 13 });
    });

    it("should not change span when text is inserted after", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 5 }];

      const result = adjustSpansForTextChange(spans, 10, 3, true);

      expect(result[0]).toEqual({ type: "bold", start: 0, end: 5 });
    });

    it("should shift spans left when text is deleted before", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 10, end: 15 }];

      const result = adjustSpansForTextChange(spans, 0, 5, false);

      expect(result[0]).toEqual({ type: "bold", start: 5, end: 10 });
    });

    it("should remove span completely when deleted text covers it", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 5, end: 10 }];

      const result = adjustSpansForTextChange(spans, 0, 15, false);

      expect(result).toHaveLength(0);
    });

    it("should shrink span when text is deleted from inside", () => {
      const spans: TextSpan[] = [{ type: "bold", start: 0, end: 10 }];

      const result = adjustSpansForTextChange(spans, 3, 4, false);

      expect(result[0]).toEqual({ type: "bold", start: 0, end: 6 });
    });
  });
});
