import React, { useMemo } from "react";
import { Text, StyleSheet, TextStyle } from "react-native";
import { COLORS, FONT_SIZES } from "@/constants";
import type { TextSpan, FormatType } from "@/types/editor";

interface FormattedTextDisplayProps {
  text: string;
  spans?: TextSpan[];
  style?: TextStyle;
}

interface TextSegment {
  start: number;
  end: number;
  formats: Set<FormatType>;
}

const getStyleForFormats = (formats: Set<FormatType>): TextStyle => {
  const style: TextStyle = {};

  if (formats.has("bold")) {
    style.fontWeight = "bold";
  }

  if (formats.has("italic")) {
    style.fontStyle = "italic";
  }

  if (formats.has("underline")) {
    style.textDecorationLine = "underline";
  }

  if (formats.has("code")) {
    style.fontFamily = "monospace";
    style.backgroundColor = COLORS.surface;
    style.fontSize = FONT_SIZES.sm;
  }

  return style;
};

const buildSegments = (text: string, spans: TextSpan[]): TextSegment[] => {
  if (spans.length === 0) {
    return [{ start: 0, end: text.length, formats: new Set() }];
  }

  const boundaries = new Set<number>([0, text.length]);
  spans.forEach((span) => {
    boundaries.add(Math.max(0, span.start));
    boundaries.add(Math.min(text.length, span.end));
  });

  const sortedBoundaries = Array.from(boundaries).sort((a, b) => a - b);
  const segments: TextSegment[] = [];

  for (let i = 0; i < sortedBoundaries.length - 1; i++) {
    const segStart = sortedBoundaries[i] as number;
    const segEnd = sortedBoundaries[i + 1] as number;

    if (segStart >= segEnd) continue;

    const formats = new Set<FormatType>();
    spans.forEach((span) => {
      if (segStart >= span.start && segEnd <= span.end) {
        formats.add(span.type);
      }
    });

    segments.push({ start: segStart, end: segEnd, formats });
  }

  return segments;
};

export const FormattedTextDisplay: React.FC<FormattedTextDisplayProps> = ({
  text,
  spans = [],
  style,
}) => {
  const segments = useMemo(() => buildSegments(text, spans), [text, spans]);

  if (segments.length === 0 || text.length === 0) {
    return <Text style={[styles.text, style]}>{text}</Text>;
  }

  return (
    <Text style={[styles.text, style]}>
      {segments.map((segment) => {
        const segmentText = text.slice(segment.start, segment.end);
        const formatStyle = getStyleForFormats(segment.formats);

        return (
          <Text key={`${segment.start}-${segment.end}`} style={formatStyle}>
            {segmentText}
          </Text>
        );
      })}
    </Text>
  );
};

const styles = StyleSheet.create({
  text: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
  },
});
